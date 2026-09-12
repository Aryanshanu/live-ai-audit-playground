'use client';

import { motion } from 'framer-motion';
import { Terminal, Sparkles, RefreshCw } from 'lucide-react';
import InteractiveRadarChart from './InteractiveRadarChart';

const AUDIT_LENSES = [
  { id: 'security', label: '🛡️ Security', sub: 'OWASP Top 10' },
  { id: 'quality', label: '📊 Quality', sub: 'MeitY Stack' },
  { id: 'rai', label: '🧠 RAI Ethics', sub: 'Green Compute' },
  { id: 'legal', label: '⚖️ Legal', sub: 'DPDP 2023' },
];

/**
 * Upper bento pair for the sandbox mode: the free-text architecture input
 * console (left) plus the live 5-axis radar + score readout (right).
 * Extracted from page.jsx — was previously ~140 inline lines contributing
 * to a 500+ line monolith with no other reason to exist together beyond
 * "they're rendered side by side."
 */
export default function SandboxWorkspace({
  architectureText,
  setArchitectureText,
  activeLayers,
  toggleLayer,
  isAnalyzing,
  report,
  templates,
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Console (7 Cols) */}
      <div className="lg:col-span-7 flex flex-col gap-4 p-6 rounded-2xl border border-slate-800 bg-[#090D18]/80 backdrop-blur-md shadow-xl">
        <div>
          <h2 className="text-xs font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2 font-bold">
            <Terminal size={14} className="text-emerald-400" /> Technical Architecture Console
          </h2>
          <p className="text-[11px] text-slate-500 mt-1">
            Inject pipeline specifications, prompt templates, or data retention parameters.
          </p>
        </div>

        {/* Presets Bar */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Pre-Formatted Archetypes:
          </span>
          <div className="flex flex-wrap gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setArchitectureText(templates.ragBot)}
              className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-slate-300 transition-all cursor-pointer"
            >
              E-Com RAG Bot
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setArchitectureText(templates.raiViolation)}
              className="px-3 py-1.5 bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-lg text-xs font-mono text-rose-400 transition-all cursor-pointer"
            >
              RAI Ethical Violation Case
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setArchitectureText(templates.compliantSovereign)}
              className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-xs font-mono transition-all hover:bg-emerald-500/20 cursor-pointer"
            >
              Sovereign Compliant Stack
            </motion.button>
          </div>
        </div>

        {/* Active Evaluation Layers */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
            Active Audit Lenses
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {AUDIT_LENSES.map((l) => (
              <button
                key={l.id}
                onClick={() => toggleLayer(l.id)}
                className={`px-3 py-2 rounded-xl text-left font-mono border transition-all cursor-pointer ${
                  activeLayers.includes(l.id)
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300 shadow-md shadow-emerald-950/20'
                    : 'bg-slate-900/40 border-slate-800/80 text-slate-500'
                }`}
              >
                <span className="text-xs font-bold block">{l.label}</span>
                <span className="text-[9px] text-slate-500 block">{l.sub}</span>
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
            className="w-full flex-1 p-4 bg-[#04060C] border border-slate-800 rounded-xl font-mono text-xs leading-relaxed text-slate-300 focus:outline-none focus:border-emerald-500/40 resize-none placeholder:text-slate-700 transition-all"
          />
          {isAnalyzing && (
            <div className="absolute bottom-4 right-4 text-[10px] font-mono text-emerald-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-xl backdrop-blur">
              <RefreshCw size={10} className="animate-spin text-cyan-400" /> Computing Matrices...
            </div>
          )}
        </div>
      </div>

      {/* Right Radar & Compliance Overview (5 Cols) */}
      <div className="lg:col-span-5 flex flex-col gap-4 p-6 rounded-2xl border border-slate-800 bg-[#090D18]/80 backdrop-blur-md shadow-xl justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-widest flex items-center gap-1.5">
              <Sparkles size={12} className="text-emerald-400" /> Dynamic 5-Axis Radar
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Live Geometry</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">
            Calibrated across Model Safety, Data Quality, Responsible AI, Privacy, &amp; Transparency.
          </p>
        </div>

        {/* Radar Chart Component with Ghost Overlay */}
        <div className="w-full h-64 flex items-center justify-center my-auto">
          <InteractiveRadarChart report={report} />
        </div>

        {/* Score Metric Bar */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between font-mono">
          <div>
            <span className="text-[10px] text-slate-500 uppercase block">Health Index</span>
            <span className="text-2xl font-black text-slate-100">
              {report ? `${report.score}%` : '--'}
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
              !report
                ? 'bg-slate-900 border-slate-800 text-slate-500'
                : report.score > 75
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : report.score > 45
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
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
