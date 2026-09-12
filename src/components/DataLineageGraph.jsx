'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, ShieldCheck, Cpu, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DataLineageGraph({ report, text }) {
  const [selectedStage, setSelectedStage] = useState(null);

  if (!report) return null;

  const normalizedText = (text || '').toLowerCase();

  // Heuristic stage evaluations based on detected text and triggered issues
  const stages = [
    {
      id: 'ingestion',
      name: '1. Ingestion / Source',
      icon: Database,
      hasViolation: report.issues.some((i) => i.ruleId.includes('FTC') || i.ruleId.includes('LINEAGE')),
      mitigations: ['dvc', 'mlflow', 'clean provenance', 'licensed data'].filter((m) => normalizedText.includes(m)),
      violations: report.issues.filter((i) => i.ruleId.includes('FTC') || i.ruleId.includes('LINEAGE')),
      summary: 'Data origin tracking & provenance audit trail.',
      defaultMitigation: 'DVC Cryptographic Ledger',
    },
    {
      id: 'tokenization',
      name: '2. Tokenization & Scrubbing',
      icon: ShieldCheck,
      hasViolation: report.issues.some((i) => i.ruleId.includes('VERNACULAR') || i.ruleId.includes('INDIC')),
      mitigations: ['bhashini', 'ai4bharat', '22 scheduled languages', 'pii masking', 'presidio'].filter((m) => normalizedText.includes(m)),
      violations: report.issues.filter((i) => i.ruleId.includes('VERNACULAR') || i.ruleId.includes('INDIC')),
      summary: 'Indic language coverage and PII redaction layer.',
      defaultMitigation: 'Bhashini Vernacular Tokenizer',
    },
    {
      id: 'training',
      name: '3. Training & Weights',
      icon: Cpu,
      hasViolation: report.issues.some((i) => i.ruleId.includes('LLM03') || i.ruleId.includes('POISONING')),
      mitigations: ['quarantine', 'anomaly detection', 'human-in-the-loop', 'codecarbon'].filter((m) => normalizedText.includes(m)),
      violations: report.issues.filter((i) => i.ruleId.includes('LLM03') || i.ruleId.includes('POISONING')),
      summary: 'Weight integrity, anti-poisoning, and carbon metrics.',
      defaultMitigation: 'Evidently AI Quarantine Filter',
    },
    {
      id: 'inference',
      name: '4. Deployment & Vault',
      icon: Lock,
      hasViolation: report.issues.some((i) => i.ruleId.includes('LLM01') || i.ruleId.includes('DPDP') || i.ruleId.includes('GUARDRAIL')),
      mitigations: ['ttl', '30-day cron purge', 'guardrails', 'llama-guard', 'sovereign cloud'].filter((m) => normalizedText.includes(m)),
      violations: report.issues.filter((i) => i.ruleId.includes('LLM01') || i.ruleId.includes('DPDP') || i.ruleId.includes('GUARDRAIL')),
      summary: 'NeMo Guardrail barriers and DPDP decoupled 30-day TTL vault.',
      defaultMitigation: '30-Day Decoupled Data Vault',
    },
  ];

  return (
    <div className="border border-slate-800/80 bg-[#090D18]/70 backdrop-blur-md rounded-2xl p-5 shadow-xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            Data Lineage &amp; Architectural Pipeline Graph
          </h4>
          <p className="text-[11px] text-slate-500 font-mono mt-0.5">
            Directional pipeline flow: Source ➔ Ingestion ➔ Model Weights ➔ Sovereign Vault
          </p>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded border border-slate-800 text-slate-400 bg-slate-950">
          Interactive Node Map
        </span>
      </div>

      {/* ━━ Flow Nodes + Directional Edges ━━
          A real lineage graph, not just a card grid: stages sit in a single
          row on lg+ screens with an animated connector between each pair,
          so data literally flows left-to-right through the pipeline. */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-3 relative items-stretch">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          const isAtRisk = stage.hasViolation;
          const isLast = idx === stages.length - 1;
          // An edge is "breached" if either endpoint it connects has a
          // violation — the flow itself is compromised at that junction.
          const nextStage = stages[idx + 1];
          const edgeIsBreached = isAtRisk || (nextStage && nextStage.hasViolation);

          return (
            <React.Fragment key={stage.id}>
              <motion.div
                onClick={() => setSelectedStage(isSelected ? null : stage.id)}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.15 }}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[140px] ${
                  isAtRisk
                    ? 'border-rose-900/60 bg-rose-950/10 hover:border-rose-500/50'
                    : 'border-emerald-900/60 bg-emerald-950/10 hover:border-emerald-500/50'
                } ${isSelected ? 'ring-2 ring-cyan-400' : ''}`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          isAtRisk
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                            : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-200">
                        {stage.name}
                      </span>
                    </div>
                    {isAtRisk ? (
                      <AlertCircle size={14} className="text-rose-400 animate-pulse shrink-0" />
                    ) : (
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans mb-3">
                    {stage.summary}
                  </p>
                </div>

                {/* Status Tags / Mitigations */}
                <div className="space-y-1 pt-2 border-t border-slate-800/80 text-[10px] font-mono">
                  {isAtRisk ? (
                    <div className="flex items-center gap-1 text-rose-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      <span>{stage.violations.length} Breach Detected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span className="truncate">
                        {stage.mitigations.length > 0 ? stage.mitigations.join(', ') : stage.defaultMitigation}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Connector — only rendered between stages, and only takes
                  its own grid column on lg+ (hidden on mobile where stages
                  stack vertically and a horizontal arrow reads as clutter). */}
              {!isLast && (
                <div className="hidden lg:flex items-center justify-center px-0.5">
                  <motion.div
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08, duration: 0.3 }}
                    className="flex items-center"
                  >
                    <ArrowRight
                      size={16}
                      className={edgeIsBreached ? 'text-rose-500/70' : 'text-emerald-600/50'}
                    />
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile fallback: stages stack vertically via the grid's sm/base
          columns above, so a horizontal arrow would be meaningless there —
          a plain "flow direction" caption substitutes for the connectors. */}
      <p className="lg:hidden mt-2 text-[10px] font-mono text-slate-600 flex items-center gap-1">
        <ArrowRight size={11} className="rotate-90" /> Flow reads top to bottom
      </p>

      {/* ━━ Expanded Stage Details Drawer ━━ */}
      <AnimatePresence>
        {selectedStage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-3 border-t border-slate-800/80 font-mono text-xs overflow-hidden"
          >
            {(() => {
              const current = stages.find((s) => s.id === selectedStage);
              if (!current) return null;

              return (
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-cyan-400 font-bold text-xs uppercase">
                      Stage Inspection: {current.name}
                    </span>
                    <button
                      onClick={() => setSelectedStage(null)}
                      className="text-slate-500 hover:text-slate-300 text-[11px]"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {current.hasViolation ? (
                    <div className="space-y-1.5">
                      <p className="text-rose-400 text-[11px]">
                        🚨 Flagged Violations:
                      </p>
                      {current.violations.map((v, i) => (
                        <div key={i} className="p-2 bg-rose-950/20 border border-rose-900/40 rounded text-[11px] text-slate-300">
                          <span className="font-bold text-rose-300">{v.ruleId}</span>: {v.message}
                          <p className="text-emerald-400 mt-1 font-bold">Fix: {v.remediation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 bg-emerald-950/20 border border-emerald-900/40 rounded text-[11px] text-emerald-300 flex items-center gap-2">
                      <CheckCircle2 size={14} /> Stage passes all integrity checkpoints. Mitigations active.
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
