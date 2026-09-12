'use client';

import { useState } from 'react';
import GovernanceInputPanel from './GovernanceInputPanel';
import ComplianceReportPanel from './ComplianceReportPanel';
import { fetchModelMetadata } from '../lib/huggingface';
import { evaluateCompliance } from '../lib/rules';
import { saveAuditToHistory, computeLayerScores } from '../lib/historyStore';

/**
 * Top-level orchestrator component.
 * Manages shared volatile state (React State only — zero persistence).
 * Renders split-screen layout: inputs (left) ↔ report (right).
 */
export default function AuditPlayground() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [score, setScore] = useState(null);
  const [results, setResults] = useState(null);
  const [modelMeta, setModelMeta] = useState(null);

  const handleAudit = async (input) => {
    // Reset state for fresh audit
    setLoading(true);
    setError(null);
    setScore(null);
    setResults(null);
    setModelMeta(null);

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
    } catch (err) {
      setError(err.message || 'UNKNOWN_ERROR');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      {/* ── Left Panel: Governance Inputs ── */}
      <div className="p-6 lg:p-8 bg-[#111827] border border-[#1E293B] rounded-2xl">
        <GovernanceInputPanel onSubmit={handleAudit} loading={loading} />
      </div>

      {/* ── Right Panel: Live Compliance Report ── */}
      <div className="p-6 lg:p-8 bg-[#111827] border border-[#1E293B] rounded-2xl min-h-[600px]">
        <ComplianceReportPanel
          score={score}
          results={results}
          modelMeta={modelMeta}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}
