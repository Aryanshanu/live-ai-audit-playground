'use client';

import { useState } from 'react';
import GovernanceInputPanel from './GovernanceInputPanel';
import ComplianceReportPanel from './ComplianceReportPanel';
import { fetchModelMetadata } from '../lib/huggingface';
import { evaluateCompliance } from '../lib/rules';
import { saveAuditToHistory, computeLayerScores } from '../lib/historyStore';
import { useSession, useOrgMembership } from '../lib/supabase/auth';
import { persistAuditToDb } from '../lib/supabase/auditPersistence';

/**
 * Top-level orchestrator component.
 * Manages shared volatile state (React State only — zero persistence).
 * Renders split-screen layout: inputs (left) ↔ report (right).
 */
export default function AuditPlayground() {
  const { user } = useSession();
  const { activeOrgId, loading: orgLoading } = useOrgMembership(user?.id);
  // Surfaced in the UI, not just console.warn — a silently-skipped
  // database write makes an audit LOOK successful while nothing persists,
  // which is worse than a visible failure.
  const [dbStatus, setDbStatus] = useState(null); // null | 'saved' | {error}
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(null);
  const [results, setResults] = useState(null);
  const [modelMeta, setModelMeta] = useState(null);
  const [hfToken, setHfToken] = useState(null);

  const handleAudit = async (input) => {
    // Reset state for fresh audit
    setLoading(true);
    setError(null);
    setDbStatus(null);
    setScore(null);
    setResults(null);
    setModelMeta(null);
    setHfToken(input.hfToken || null);

    try {
      // Phase 1: Fetch model metadata from Hugging Face Hub
      const meta = await fetchModelMetadata(input.modelId, input.hfToken);
      setModelMeta(meta);

      // Phase 2: Run deterministic rule evaluation (synchronous, <1ms)
      const evaluation = evaluateCompliance(input, meta);
      setScore(evaluation.score);
      setResults(evaluation.results);

      // Phase 3: Persist to audit history — clearly tagged 'verified_hf_api'
      // so it's distinguishable from the sandbox's 'heuristic_sandbox' runs.
      const failedIssues = evaluation.results
        .filter((r) => r.status === 'fail')
        .map((r) => ({
          ruleId: r.id,
          layer: r.layer,
          severity: r.severity,
          message: r.message,
          remediation: r.remediation,
        }));

      saveAuditToHistory({
        score: evaluation.score,
        issues: failedIssues,
        layerScores: computeLayerScores(failedIssues),
        auditType: 'verified_hf_api',
        modelOrTitle: meta.id,
      });

      // Real database persistence, in addition to the localStorage write
      // above (a deliberate dual-write during migration — every other
      // feature still reads from historyStore.js, and ripping that out
      // blind would be reckless).
      //
      // org_id is NOT NULL and RLS-enforced since the multi-tenancy
      // migration. A personal org is auto-created by a signup trigger, so
      // activeOrgId SHOULD always resolve for a real user — but
      // useOrgMembership fetches asynchronously, so an audit submitted
      // before it resolves would previously skip the DB write entirely
      // with only a console.warn. That made a failed persist look like a
      // successful audit, which is the worst possible failure mode for a
      // tool whose entire point is honest evidence. Every branch now
      // reports its real outcome to the UI.
      if (!user) {
        setDbStatus({ error: 'Not signed in — saved locally only.' });
      } else if (orgLoading) {
        setDbStatus({ error: 'Your organization was still loading, so this audit was saved locally only. Re-run it to persist to the database.' });
      } else if (!activeOrgId) {
        setDbStatus({ error: 'No organization found for your account. A personal org should be created automatically at signup — if you see this, that trigger did not run. Saved locally only.' });
      } else {
        try {
          const { auditId } = await persistAuditToDb({ userId: user.id, orgId: activeOrgId, modelId: meta.id, issues: failedIssues });
          setDbStatus({ saved: true, auditId });
        } catch (dbErr) {
          setDbStatus({ error: `Database write failed: ${dbErr.message}` });
        }
      }
    } catch (err) {
      setError(err.message || 'UNKNOWN_ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      {/* ── Left Panel: Governance Inputs ── */}
      <div className="p-6 lg:p-8 bg-fb-card border border-fb-border rounded-xl shadow-fbCard">
        <GovernanceInputPanel onSubmit={handleAudit} loading={loading} />
      </div>

      {/* ── Right Panel: Live Compliance Report ── */}
      <div className="p-6 lg:p-8 bg-fb-card border border-fb-border rounded-xl shadow-fbCard min-h-[600px]">
        {/* Database persistence status. Deliberately visible: a skipped or
            failed DB write previously produced only a console.warn, so an
            audit that persisted nothing looked identical to one that
            persisted correctly. */}
        {dbStatus?.saved && (
          <div className="mb-4 p-2.5 bg-green-50 border border-green-200 rounded-lg text-[11px] text-fb-green">
            ✓ Saved to database · audit id <span className="font-mono">{dbStatus.auditId}</span>
          </div>
        )}
        {dbStatus?.error && (
          <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-700">
            ⚠ Not persisted to database. {dbStatus.error}
          </div>
        )}
        <ComplianceReportPanel
          score={score}
          results={results}
          modelMeta={modelMeta}
          loading={loading}
          error={error}
          hfToken={hfToken}
        />
      </div>
    </div>
  );
}
