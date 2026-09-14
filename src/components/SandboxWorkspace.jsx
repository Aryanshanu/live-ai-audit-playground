'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Sparkles, RefreshCw, Save } from 'lucide-react';
import InteractiveRadarChart from './InteractiveRadarChart';

const AUDIT_LENSES = [
  { id: 'security', label: '🛡️ Security', sub: 'OWASP Top 10' },
  { id: 'quality', label: '📊 Quality', sub: 'MeitY Stack' },
  { id: 'rai', label: '🧠 RAI Ethics', sub: 'Green Compute' },
  { id: 'legal', label: '⚖️ Legal', sub: 'DPDP 2023' },
];

export default function SandboxWorkspace({
  architectureText,
  setArchitectureText,
  activeLayers,
  toggleLayer,
  isAnalyzing,
  justCheckpointed,
  report,
  templates,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Console (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4 p-6 rounded-xl border border-fb-border bg-fb-card shadow-fbCard">
        <div>
          <h2 className="text-xs text-fb-textSecondary uppercase tracking-widest flex items-center gap-2 font-bold">
            <Terminal size={14} className="text-fb-blue" /> Technical Architecture Console
          </h2>
          <p className="text-[11px] text-fb-textSecondary mt-1">
            Inject pipeline specifications, prompt templates, or data retention parameters.
          </p>
        </div>

        {/* Presets Bar */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-fb-textSecondary uppercase tracking-wider block font-bold">
            Pre-Formatted Archetypes:
          </span>
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setArchitectureText(templates.ragBot)}
              title="Demonstrates: unsanitized prompt injection + indefinite log retention"
              className="px-3 py-1.5 bg-fb-bg border border-fb-border hover:border-fb-blue rounded-lg text-xs text-fb-text transition-all cursor-pointer"
            >
              E-Com RAG Bot
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setArchitectureText(templates.raiViolation)}
              title="Demonstrates: no carbon tracking + no content moderation on outputs"
              className="px-3 py-1.5 bg-fb-bg border border-fb-border hover:border-fb-red rounded-lg text-xs text-fb-red transition-all cursor-pointer"
            >
              RAI Ethical Violation Case
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setArchitectureText(templates.dataIntegrityGaps)}
              title="Demonstrates: unreviewed continuous retraining, English-only data, unclear provenance, train/test leakage, unaudited labels"
              className="px-3 py-1.5 bg-fb-bg border border-orange-200 hover:border-orange-400 rounded-lg text-xs text-orange-600 transition-all cursor-pointer"
            >
              Data Pipeline Integrity Gaps
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setArchitectureText(templates.compliantSovereign)}
              title="Demonstrates: all mitigations in place — should score clean"
              className="px-3 py-1.5 bg-green-50 border border-green-200 text-fb-green rounded-lg text-xs transition-all hover:bg-green-100 cursor-pointer"
            >
              Sovereign Compliant Stack
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setArchitectureText(templates.paraphraseStressTest)}
              title="Describes 4 real violations in plain language, deliberately avoiding the scanner's keyword list — shows where keyword-matching breaks down."
              className="px-3 py-1.5 bg-amber-50 border border-dashed border-amber-300 text-amber-700 rounded-lg text-xs transition-all hover:bg-amber-100 cursor-pointer"
            >
              ⚠ Paraphrase Stress-Test
            </motion.button>
          </div>
        </div>

        {/* Active Evaluation Layers */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-fb-textSecondary uppercase tracking-wider block font-bold">
            Active Audit Lenses
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AUDIT_LENSES.map((l) => (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                className={`px-3 py-2 rounded-xl text-left border transition-all cursor-pointer ${
                  activeLayers.includes(l.id)
                    ? 'bg-fb-blueLight border-fb-blue text-fb-blue'
                    : 'bg-fb-bg border-fb-border text-fb-textSecondary'
                }`}
              >
                <span className="text-xs font-bold block">{l.label}</span>
                <span className="text-[9px] opacity-80 block">{l.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <div className="relative flex-1 min-h-[300px] flex flex-col">
          <textarea
            value={architectureText}
            onChange={(e) => setArchitectureText(e.target.value)}
            placeholder="Paste custom architectural data system logs or pipeline descriptions here..."
            className="w-full flex-1 p-4 bg-fb-bg border border-fb-border rounded-xl font-mono text-xs leading-relaxed text-fb-text focus:outline-none focus:border-fb-blue focus:bg-fb-card resize-none placeholder:text-gray-400 transition-all"
          />
          {isAnalyzing && (
            <div className="absolute bottom-4 right-4 text-[10px] text-fb-blue bg-fb-card border border-fb-border px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-fbCard">
              <RefreshCw size={10} className="animate-spin text-fb-blue" /> Computing Matrices...
            </div>
          )}
          <AnimatePresence>
            {justCheckpointed && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-4 right-4 text-[10px] text-fb-textSecondary bg-fb-card border border-green-200 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-fbCard"
              >
                <Save size={10} className="text-fb-green" /> Checkpoint saved to history
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Radar & Compliance Overview (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4 p-6 rounded-xl border border-fb-border bg-fb-card shadow-fbCard justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-fb-text uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} className="text-fb-blue" /> Dynamic 5-Axis Radar
            </h3>
            <span className="text-[10px] text-fb-textSecondary">Live Geometry</span>
          </div>
          <p className="text-[11px] text-fb-textSecondary">
            Calibrated across Model Safety, Data Quality, Responsible AI, Privacy, &amp; Transparency.
          </p>
        </div>

        {/* Radar Chart Component with Ghost Overlay */}
        <div className="w-full h-64 flex items-center justify-center my-auto">
          <InteractiveRadarChart report={report} auditType="heuristic_sandbox" subjectId="Custom Pipeline Manifest" />
        </div>

        {/* Score Metric Bar */}
        <div className="p-3.5 bg-fb-bg border border-fb-border rounded-xl flex items-center justify-between">
          <div>
            <span className="text-[10px] text-fb-textSecondary uppercase block font-bold">Health Index</span>
            <span className="text-2xl font-black text-fb-text">
              {report ? `${report.score}%` : '--'}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              !report
                ? 'bg-fb-card border-fb-border text-fb-textSecondary'
                : report.score > 75
                ? 'bg-green-50 border-green-200 text-fb-green'
                : report.score > 45
                ? 'bg-amber-50 border-amber-200 text-amber-700'
                : 'bg-red-50 border-red-200 text-fb-red'
            }`}
          >
            {!report
              ? 'Awaiting Context'
              : report.score > 75
              ? '🟢 COMPLIANT'
              : report.score > 45
              ? '🟡 ELEVATED RISK'
              : '🔴 CRITICAL ACTION'}
          </span>
        </div>
      </div>
    </div>
  );
}
