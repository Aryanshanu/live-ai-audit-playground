'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, ShieldCheck, Cpu, Lock, AlertCircle, CheckCircle2, ArrowRight } from 'lucide-react';

export default function DataLineageGraph({ report, text }) {
  const [selectedStage, setSelectedStage] = useState(null);

  if (!report) return null;

  const normalizedText = (text || '').toLowerCase();

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
    <div className="border border-fb-border bg-fb-card rounded-xl p-5 shadow-fbCard">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h4 className="text-xs font-bold text-fb-text uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-fb-blue animate-pulse" />
            Data Lineage &amp; Architectural Pipeline Graph
          </h4>
          <p className="text-[11px] text-fb-textSecondary mt-0.5">
            Directional pipeline flow: Source ➔ Ingestion ➔ Model Weights ➔ Sovereign Vault
          </p>
        </div>
        <span className="text-[10px] px-2 py-0.5 rounded border border-fb-border text-fb-textSecondary bg-fb-bg font-medium">
          Interactive Node Map
        </span>
      </div>

      {/* ━━ Flow Nodes + Directional Edges ━━ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_auto_1fr_auto_1fr_auto_1fr] gap-3 relative items-stretch">
        {stages.map((stage, idx) => {
          const Icon = stage.icon;
          const isSelected = selectedStage === stage.id;
          const isAtRisk = stage.hasViolation;
          const isLast = idx === stages.length - 1;
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
                    ? 'border-red-200 bg-red-50 hover:border-fb-red/60'
                    : 'border-green-200 bg-green-50 hover:border-fb-green/60'
                } ${isSelected ? 'ring-2 ring-fb-blue' : ''}`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`p-1.5 rounded-lg border ${
                          isAtRisk
                            ? 'bg-red-100 border-red-200 text-fb-red'
                            : 'bg-green-100 border-green-200 text-fb-green'
                        }`}
                      >
                        <Icon size={14} />
                      </div>
                      <span className="text-[11px] font-bold text-fb-text">
                        {stage.name}
                      </span>
                    </div>
                    {isAtRisk ? (
                      <AlertCircle size={14} className="text-fb-red animate-pulse shrink-0" />
                    ) : (
                      <CheckCircle2 size={14} className="text-fb-green shrink-0" />
                    )}
                  </div>

                  <p className="text-[10px] text-fb-textSecondary leading-relaxed mb-3">
                    {stage.summary}
                  </p>
                </div>

                {/* Status Tags / Mitigations */}
                <div className="space-y-1 pt-2 border-t border-fb-border text-[10px]">
                  {isAtRisk ? (
                    <div className="flex items-center gap-1 text-fb-red font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-fb-red animate-ping" />
                      <span>{stage.violations.length} Breach Detected</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-fb-green font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-fb-green" />
                      <span className="truncate">
                        {stage.mitigations.length > 0 ? stage.mitigations.join(', ') : stage.defaultMitigation}
                      </span>
                    </div>
                  )}
                </div>
              </motion.div>

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
                      className={edgeIsBreached ? 'text-fb-red/60' : 'text-fb-green/60'}
                    />
                  </motion.div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      <p className="lg:hidden mt-2 text-[10px] text-fb-textSecondary flex items-center gap-1">
        <ArrowRight size={11} className="rotate-90" /> Flow reads top to bottom
      </p>

      {/* ━━ Expanded Stage Details Drawer ━━ */}
      <AnimatePresence>
        {selectedStage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-3 border-t border-fb-border text-xs overflow-hidden"
          >
            {(() => {
              const current = stages.find((s) => s.id === selectedStage);
              if (!current) return null;

              return (
                <div className="p-3 bg-fb-bg border border-fb-border rounded-xl space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-fb-blue font-bold text-xs uppercase">
                      Stage Inspection: {current.name}
                    </span>
                    <button
                      onClick={() => setSelectedStage(null)}
                      className="text-fb-textSecondary hover:text-fb-text text-[11px] cursor-pointer"
                    >
                      ✕ Close
                    </button>
                  </div>

                  {current.hasViolation ? (
                    <div className="space-y-1.5">
                      <p className="text-fb-red text-[11px] font-medium">
                        🚨 Flagged Violations:
                      </p>
                      {current.violations.map((v, i) => (
                        <div key={i} className="p-2 bg-red-50 border border-red-200 rounded text-[11px] text-fb-text">
                          <span className="font-bold text-fb-red">{v.ruleId}</span>: {v.message}
                          <p className="text-fb-blue mt-1 font-bold">Fix: {v.remediation}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-2 bg-green-50 border border-green-200 rounded text-[11px] text-fb-green flex items-center gap-2">
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
