'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, Bot, ChevronRight, Database, AlertOctagon } from 'lucide-react';
import { runLiveSecuritySuite } from '../lib/livePromptProbe';
import { runRemediationAgent } from '../lib/remediationAgent';
import { getEvidenceTier } from '../lib/evidenceTiers';
import { publishToRegistry } from '../lib/githubRegistry';
import { fileEthicsBoardIssue } from '../lib/githubEscalation';

const PROBE_STATUS_STYLE = {
  pass: 'bg-green-50 border-green-200 text-fb-green',
  fail: 'bg-red-50 border-red-200 text-fb-red',
  error: 'bg-amber-50 border-amber-200 text-amber-700',
};

/**
 * Dynamic Security + Remediation Agent panel.
 *
 * Two real capabilities live here, both opt-in and both clearly the
 * strongest evidence tier in the app (live_dynamic_test):
 *  1. A 3-probe live security suite (was a single probe) — now
 *     load-bearing enough to show its own dynamic score, not just a
 *     side note under the static metadata score.
 *  2. The Remediation Agent — the first genuinely agentic (multi-step,
 *     chained, autonomous-between-steps) thing in this codebase.
 *     Deliberately draft-only: see remediationAgent.js for why that
 *     scope is a real safety decision, not a shortcut.
 */
export default function DynamicSecurityPanel({ modelId, hfToken, issues, onSuiteResult }) {
  const [suiteState, setSuiteState] = useState(null); // null | 'running:<label>' | {score, probes}
  const [thorough, setThorough] = useState(false);
  const [agentState, setAgentState] = useState(null); // null | 'running:<step>' | {steps, finalRemediation}
  const [agentError, setAgentError] = useState(null);
  const [githubConfig, setGithubConfig] = useState({ owner: '', repo: '', token: '' });
  const [registryState, setRegistryState] = useState(null); // null | 'running' | {result} | {error}
  const [escalationState, setEscalationState] = useState(null);

  const runSuite = useCallback(async () => {
    setSuiteState('running:Starting…');
    const result = await runLiveSecuritySuite(modelId, hfToken, (label) => setSuiteState(`running:${label}`), thorough);
    setSuiteState(result);
    onSuiteResult?.(result);
  }, [modelId, hfToken, thorough, onSuiteResult]);

  const handlePublishToRegistry = useCallback(async () => {
    setRegistryState('running');
    try {
      const result = await publishToRegistry({
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        githubToken: githubConfig.token,
        record: { modelOrTitle: modelId, issues, auditType: 'verified_hf_api' },
      });
      setRegistryState({ result });
    } catch (err) {
      setRegistryState({ error: err.message });
    }
  }, [githubConfig, modelId, issues]);

  const handleEscalate = useCallback(async () => {
    setEscalationState('running');
    try {
      const result = await fileEthicsBoardIssue({
        owner: githubConfig.owner,
        repo: githubConfig.repo,
        githubToken: githubConfig.token,
        findings: issues,
        subjectLabel: modelId,
      });
      setEscalationState({ result });
    } catch (err) {
      setEscalationState({ error: err.message });
    }
  }, [githubConfig, issues, modelId]);

  const runAgent = useCallback(async () => {
    setAgentError(null);
    setAgentState('running:Starting…');
    try {
      const result = await runRemediationAgent(issues, modelId, hfToken, (step) => setAgentState(`running:${step}`));
      setAgentState(result);
    } catch (err) {
      setAgentError(err.message);
      setAgentState(null);
    }
  }, [issues, modelId, hfToken]);

  const isSuiteRunning = typeof suiteState === 'string';
  const isAgentRunning = typeof agentState === 'string';
  const tier = getEvidenceTier('live_dynamic_test');

  return (
    <div className="space-y-4">
      {/* ── Live Security Suite ── */}
      <div className="p-4 bg-fb-card border border-fb-border rounded-lg">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-fb-blue" /> Dynamic Security Suite
            <span className={`ml-1 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${tier.badgeClass}`}>
              {tier.shortLabel}
            </span>
          </h3>
          <button
            onClick={runSuite}
            disabled={isSuiteRunning}
            className="px-3 py-1 text-[11px] bg-fb-blueLight hover:bg-blue-100 text-fb-blue border border-fb-blue/30 rounded-lg cursor-pointer disabled:opacity-50 font-medium"
          >
            {isSuiteRunning ? suiteState.replace('running:', '') + '…' : 'Run 3 Live Probes'}
          </button>
        </div>
        <p className="text-[10px] text-fb-textSecondary mb-2">
          {thorough ? '3 injection phrasing variants + 3 other probes (6 total calls)' : '3 real adversarial calls'} to the live model via your free HF inference credits — injection, system-prompt extraction, role-override, and content-moderation resistance. {thorough ? 'Thorough mode gives a real containment-rate percentage with disclosed sample size, at ~2x the credit cost.' : 'Not a full security clearance; one snapshot from each test.'}
        </p>
        <label className="flex items-center gap-1.5 mb-2 text-[10px] text-fb-textSecondary cursor-pointer">
          <input type="checkbox" checked={thorough} onChange={(e) => setThorough(e.target.checked)} className="cursor-pointer" />
          Thorough scan (3 injection variants for a real containment rate — uses more HF credits)
        </label>

        {suiteState && !isSuiteRunning && suiteState.score !== null && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-black text-fb-text">{suiteState.score}%</span>
            <span className="text-[10px] text-fb-textSecondary">dynamic pass rate across {suiteState.probes.filter(p => p.status !== 'error').length} runnable probes</span>
          </div>
        )}
        {suiteState && !isSuiteRunning && suiteState.error && (
          <p className="text-[11px] text-fb-red">{suiteState.error}</p>
        )}

        {suiteState && !isSuiteRunning && suiteState.outputPiiFlags?.length > 0 && (
          <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-lg text-[10px] text-fb-red">
            ⚠ {suiteState.outputPiiFlags.length} probe response(s) contained PII-shaped content ({suiteState.outputPiiFlags.map(f => f.outputPiiDetected.join(', ')).join('; ')}) — scanned from the model's actual live output, not training data.
          </div>
        )}

        <AnimatePresence>
          {suiteState && !isSuiteRunning && suiteState.probes && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-1.5">
              {suiteState.probes.map((p) => (
                <div key={p.id} className={`p-2 rounded-lg border text-[10px] ${PROBE_STATUS_STYLE[p.status]}`}>
                  <div className="flex justify-between font-bold">
                    <span>{p.label}</span>
                    <span className="uppercase">{p.status}</span>
                  </div>
                  <p className="mt-0.5 opacity-90">{p.detail}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Remediation Agent ── */}
      <div className="p-4 bg-fb-card border border-fb-border rounded-lg">
        <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
          <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5">
            <Bot size={14} className="text-fb-blue" /> Remediation Agent
            <span className="ml-1 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border bg-fb-blueLight text-fb-blue border-fb-blue/30">
              Draft-Only, No Tool Access
            </span>
          </h3>
          <button
            onClick={runAgent}
            disabled={isAgentRunning || !issues?.length}
            className="px-3 py-1 text-[11px] bg-fb-blueLight hover:bg-blue-100 text-fb-blue border border-fb-blue/30 rounded-lg cursor-pointer disabled:opacity-50 font-medium"
          >
            {isAgentRunning ? agentState.replace('running:', '') + '…' : 'Run Agent (3 Steps)'}
          </button>
        </div>
        <p className="text-[10px] text-fb-textSecondary mb-2">
          A real 3-step autonomous loop (Plan → Draft → Self-Critique) — each step's actual output feeds the next. It can only draft text for you to review; it has no access to execute code, call APIs, or modify anything.
        </p>

        {agentError && <p className="text-[11px] text-fb-red mb-2">⚠ {agentError}</p>}
        {!issues?.length && <p className="text-[11px] text-fb-textSecondary">Run an audit with at least one finding first.</p>}

        <AnimatePresence>
          {agentState && !isAgentRunning && agentState.steps && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {agentState.steps.map((s, idx) => (
                <div key={idx} className="p-2.5 bg-fb-bg border border-fb-border rounded-lg text-[11px]">
                  <div className="flex items-center gap-1 font-bold text-fb-blue mb-1">
                    <ChevronRight size={12} /> Step {idx + 1}: {s.name}
                  </div>
                  <p className="text-fb-text whitespace-pre-wrap">{s.output}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Model Registry + Ethics Board Escalation (GitHub-backed) ── */}
      <div className="p-4 bg-fb-card border border-fb-border rounded-lg">
        <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5 mb-2">
          <Database size={14} className="text-fb-blue" /> Model Registry &amp; Escalation
          <span className="ml-1 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border bg-fb-blueLight text-fb-blue border-fb-blue/30">
            GitHub-Backed
          </span>
        </h3>
        <p className="text-[10px] text-fb-textSecondary mb-2">
          Real centralized storage — this app has no database of its own. Publishing writes an actual commit to a GitHub repo you control; escalating files an actual GitHub Issue for human review. Needs a repo with a token that has Contents + Issues write access.
        </p>

        <div className="grid grid-cols-3 gap-1.5 mb-2">
          <input
            placeholder="owner"
            value={githubConfig.owner}
            onChange={(e) => setGithubConfig((c) => ({ ...c, owner: e.target.value }))}
            className="px-2 py-1 text-[11px] bg-fb-bg border border-fb-border rounded"
          />
          <input
            placeholder="repo"
            value={githubConfig.repo}
            onChange={(e) => setGithubConfig((c) => ({ ...c, repo: e.target.value }))}
            className="px-2 py-1 text-[11px] bg-fb-bg border border-fb-border rounded"
          />
          <input
            placeholder="github token"
            type="password"
            value={githubConfig.token}
            onChange={(e) => setGithubConfig((c) => ({ ...c, token: e.target.value }))}
            className="px-2 py-1 text-[11px] bg-fb-bg border border-fb-border rounded"
          />
        </div>

        <div className="flex gap-2 mb-2">
          <button
            onClick={handlePublishToRegistry}
            disabled={registryState === 'running' || !issues?.length}
            className="flex-1 px-3 py-1.5 text-[11px] bg-fb-blueLight hover:bg-blue-100 text-fb-blue border border-fb-blue/30 rounded-lg cursor-pointer disabled:opacity-50 font-medium"
          >
            {registryState === 'running' ? 'Publishing…' : 'Publish Audit to Registry'}
          </button>
          <button
            onClick={handleEscalate}
            disabled={escalationState === 'running' || !issues?.some((i) => i.severity === 'CRITICAL' || i.severity === 'HIGH')}
            className="flex-1 px-3 py-1.5 text-[11px] bg-red-50 hover:bg-red-100 text-fb-red border border-red-200 rounded-lg cursor-pointer disabled:opacity-50 font-medium flex items-center justify-center gap-1"
          >
            <AlertOctagon size={12} /> {escalationState === 'running' ? 'Filing…' : 'Escalate to Ethics Board'}
          </button>
        </div>

        {registryState?.error && <p className="text-[11px] text-fb-red">⚠ {registryState.error}</p>}
        {registryState?.result && (
          <a href={registryState.result.commitUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-fb-blue underline block">
            ✓ Published — view commit
          </a>
        )}
        {escalationState?.error && <p className="text-[11px] text-fb-red">⚠ {escalationState.error}</p>}
        {escalationState?.result && (
          <a href={escalationState.result.issueUrl} target="_blank" rel="noopener noreferrer" className="text-[11px] text-fb-red underline block">
            ✓ Escalation issue #{escalationState.result.issueNumber} filed — view issue
          </a>
        )}
      </div>
    </div>
  );
}
