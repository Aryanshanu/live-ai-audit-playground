'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap } from 'lucide-react';
import { classifyGovernanceRisk } from '../lib/browserClassifier';
import { getEvidenceTier } from '../lib/evidenceTiers';

const SEVERITY_STYLE = {
  HIGH: 'bg-red-50 border-red-200 text-fb-red',
  MEDIUM: 'bg-amber-50 border-amber-200 text-amber-700',
};

/**
 * The one feature in this app that needs NEITHER a token NOR a network
 * call per-use — a real open-source model running entirely on-device.
 * First use downloads and caches the model (~67MB, shown as real
 * progress below); every use after that is instant and fully offline.
 */
export default function BrowserClassifierPanel({ text }) {
  const [state, setState] = useState(null); // null | {loading: true, progress} | {findings} | {error}

  const handleRun = async () => {
    setState({ loading: true, progress: 0, status: 'Initializing…' });
    try {
      const findings = await classifyGovernanceRisk(text, (event) => {
        if (event.status === 'progress' && event.progress != null) {
          setState({ loading: true, progress: event.progress, status: `Downloading model: ${event.file || ''}` });
        } else if (event.status) {
          setState((prev) => ({ ...prev, loading: true, status: event.status }));
        }
      });
      setState({ findings });
    } catch (err) {
      setState({ error: err.message || 'Classification failed — this needs a real browser to run (WebAssembly), not this preview environment.' });
    }
  };

  const tier = getEvidenceTier('local_inference');

  return (
    <div className="p-4 bg-fb-card border border-fb-border rounded-lg">
      <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
        <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5">
          <Cpu size={14} className="text-purple-600" /> On-Device Risk Classifier
          <span className={`ml-1 text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border ${tier.badgeClass}`}>
            {tier.shortLabel}
          </span>
        </h3>
        <button
          onClick={handleRun}
          disabled={state?.loading}
          className="px-3 py-1 text-[11px] bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg cursor-pointer disabled:opacity-50 font-medium flex items-center gap-1"
        >
          <Zap size={11} /> {state?.loading ? 'Running…' : 'Classify (No Token Needed)'}
        </button>
      </div>
      <p className="text-[10px] text-fb-textSecondary mb-2">
        Runs a real open-source model (Xenova/distilbert-base-uncased-mnli) entirely in your browser via WebAssembly. First run downloads ~67MB and caches it — no HF token, no per-use network call after that.
      </p>

      {state?.loading && (
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-fb-border rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500"
              animate={{ width: `${state.progress || 5}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
          <p className="text-[9px] text-fb-textSecondary">{state.status}</p>
        </div>
      )}

      {state?.error && <p className="text-[11px] text-fb-red">⚠ {state.error}</p>}

      <AnimatePresence>
        {state?.findings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 mt-2">
            {state.findings.length === 0 ? (
              <p className="text-center text-fb-green text-[11px] py-2">No high-confidence risk categories detected.</p>
            ) : (
              state.findings.map((f, idx) => (
                <div key={idx} className={`p-2 rounded-lg border text-[10px] ${SEVERITY_STYLE[f.severity]}`}>
                  {f.message}
                  <p className="mt-0.5 opacity-70">{f.remediation}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
