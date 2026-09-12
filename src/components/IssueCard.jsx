'use client';

import { motion } from 'framer-motion';

const STATUS_ICONS = {
  CRITICAL: '🚫',
  HIGH: '⚠️',
  MEDIUM: '⚡',
  pass: '✅',
};

const SEVERITY_STYLES = {
  CRITICAL: {
    border: 'border-red-500/30',
    bg: 'bg-red-500/5',
    badge: 'bg-red-500/20 text-red-400',
    spring: { stiffness: 450, damping: 25 },
  },
  HIGH: {
    border: 'border-amber-500/30',
    bg: 'bg-amber-500/5',
    badge: 'bg-amber-500/20 text-amber-400',
    spring: { stiffness: 350, damping: 25 },
  },
  MEDIUM: {
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/5',
    badge: 'bg-yellow-500/20 text-yellow-400',
    spring: { stiffness: 250, damping: 28 },
  },
  pass: {
    border: 'border-emerald-500/20',
    bg: 'bg-emerald-500/5',
    spring: { stiffness: 200, damping: 30 },
  },
};

/**
 * Single compliance-result card — pass or fail, any severity.
 * Extracted from ComplianceReportPanel's inline .map() so the panel
 * component stops growing every time an issue-card detail changes.
 */
export default function IssueCard({ result }) {
  const isFail = result.status === 'fail';
  const styleConfig = isFail
    ? SEVERITY_STYLES[result.severity] || SEVERITY_STYLES.HIGH
    : SEVERITY_STYLES.pass;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{
        type: 'spring',
        stiffness: styleConfig.spring.stiffness,
        damping: styleConfig.spring.damping,
      }}
      className={`p-4 rounded-lg border ${styleConfig.border} ${styleConfig.bg}`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span>{isFail ? STATUS_ICONS[result.severity] : STATUS_ICONS.pass}</span>
          <span className="font-mono text-xs text-gray-400 font-bold">{result.id}</span>
          {isFail && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase font-mono ${styleConfig.badge}`}>
              {result.severity}
            </span>
          )}
        </div>
        <span className="text-[10px] text-gray-500 font-mono">{result.pillar}</span>
      </div>

      <p className="text-sm text-gray-300 leading-relaxed font-sans">{result.message}</p>
      <p className="text-[11px] text-gray-500 mt-1 font-mono">{result.regulation}</p>

      {result.remediation && (
        <div className="mt-2.5 p-2.5 bg-[#0B0F19] rounded-md border border-[#1E293B] text-xs text-emerald-400">
          <span className="font-bold font-mono">💡 Remediation:</span> {result.remediation}
        </div>
      )}
    </motion.div>
  );
}
