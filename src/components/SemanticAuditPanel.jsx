'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { runSemanticAudit } from '../lib/semanticAuditEngine';
import { getEvidenceTier } from '../lib/evidenceTiers';
import { useHfConfig } from '../lib/useHfConfig';

const PRESET_MODELS = [
  'meta-llama/Llama-3-8B-Instruct',
  'Qwen/Qwen2.5-7B-Instruct',
  'mistralai/Mistral-7B-Instruct-v0.3',
];

const SEVERITY_STYLE = {
  CRITICAL: 'bg-red-50 border-red-200 text-fb-red',
  HIGH: 'bg-red-50 border-red-200 text-fb-red',
  MEDIUM: 'bg-amber-50 border-amber-200 text-amber-700',
};

/**
 * The real fix for the keyword engine's blind spots: sends the actual
 * architecture text to a live model and asks it to reason about
 * governance failures, instead of scanning for pre-written phrases.
 * Runs independently of the keyword engine — both results are shown,
 * clearly separated by evidence tier, so the difference is visible.
 */
export default function SemanticAuditPanel({ description }) {
  const { hfToken, setHfToken, modelId, setModelId } = useHfConfig();
  const [state, setState] = useState(null); // null | 'running' | {findings, rawResponse} | {error}
  const tier = getEvidenceTier('live_dynamic_test');

  const handleRun = async () => {
    setState('running');
    try {
      const result = await runSemanticAudit(description, modelId, hfToken);
      setState(result);
    } catch (err) {
      setState({ error: err.message });
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="p-2.5 bg-fb-blueLight border border-fb-blue/30 rounded-lg text-[10px] text-fb-text leading-relaxed">
        <span className="font-bold">Why this exists:</span> the 9-rule keyword engine can only catch phrasing it was built for. This sends your actual description to a live model to reason about it semantically — it will catch things like "no human oversight" or "ZIP code as a bias proxy" that no keyword list anticipated.
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[9px] text-fb-textSecondary font-bold uppercase block mb-1">Auditor Model</label>
          <select
            value={modelId}
            onChange={(e) => setModelId(e.target.value)}
            className="w-full px-2 py-1.5 text-[11px] bg-fb-card border border-fb-border rounded-lg text-fb-text focus:outline-none focus:border-fb-blue"
          >
            {PRESET_MODELS.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-[9px] text-fb-textSecondary font-bold uppercase block mb-1">HF Token</label>
          <input
            type="password"
            value={hfToken}
            onChange={(e) => setHfToken(e.target.value)}
            placeholder="hf_xxxxxxxxxxxx"
            className="w-full px-2 py-1.5 text-[11px] bg-fb-card border border-fb-border rounded-lg text-fb-text placeholder-gray-400 focus:outline-none focus:border-fb-blue"
          />
        </div>
      </div>

      <button
        onClick={handleRun}
        disabled={state === 'running' || !hfToken}
        className="w-full py-1.5 text-[11px] bg-fb-blue hover:bg-fb-blueHover text-white rounded-lg cursor-pointer disabled:opacity-50 font-medium flex items-center justify-center gap-1.5"
      >
        <Sparkles size={12} />
        {state === 'running' ? 'Auditing live…' : 'Run Real Semantic Audit'}
      </button>

      {state?.error && (
        <p className="text-[11px] text-fb-red">⚠ {state.error}</p>
      )}

      <AnimatePresence>
        {state && typeof state === 'object' && state.findings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
            <div className="flex items-center justify-between text-[10px]">
              <span className="text-fb-textSecondary">{state.findings.length} finding(s) — none of these came from keyword matching</span>
              <span className={`px-1.5 py-0.5 rounded-full font-bold uppercase border ${tier.badgeClass}`}>{tier.shortLabel}</span>
            </div>
            {state.findings.length === 0 ? (
              <p className="text-center text-fb-green py-3 text-[11px]">The model found no concerning issues in this description.</p>
            ) : (
              state.findings.map((f, idx) => (
                <div key={idx} className={`p-2.5 rounded-lg border text-[11px] ${SEVERITY_STYLE[f.severity]}`}>
                  <div className="flex justify-between font-bold text-[9px] uppercase mb-1">
                    <span>{f.layer}</span>
                    <span>{f.severity}</span>
                  </div>
                  <p>{f.message}</p>
                  <p className="mt-1 opacity-80">→ {f.remediation}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
