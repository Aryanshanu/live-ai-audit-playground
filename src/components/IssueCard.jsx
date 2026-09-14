'use client';

import { motion } from 'framer-motion';
import { getEvidenceTier } from '../lib/evidenceTiers';

const STATUS_ICONS = {
  CRITICAL: '🚫',
  HIGH: '⚠️',
  MEDIUM: '⚡',
  pass: '✅',
};

const SEVERITY_STYLES = {
  CRITICAL: {
    border: 'border-red-200',
    bg: 'bg-red-50',
    badge: 'bg-red-100 text-fb-red',
    spring: { stiffness: 450, damping: 25 },
  },
  HIGH: {
    border: 'border-amber-200',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
    spring: { stiffness: 350, damping: 25 },
  },
  MEDIUM: {
    border: 'border-yellow-200',
    bg: 'bg-yellow-50',
    badge: 'bg-yellow-100 text-yellow-700',
    spring: { stiffness: 250, damping: 28 },
  },
  pass: {
    border: 'border-green-200',
    bg: 'bg-green-50',
    spring: { stiffness: 200, damping: 30 },
  },
};

/**
 * Single compliance-result card — pass or fail, any severity.
 */
export default function IssueCard({ result }) {
  const isFail = result.status === 'fail';
  const styleConfig = isFail
    ? SEVERITY_STYLES[result.severity] || SEVERITY_STYLES.HIGH
    : SEVERITY_STYLES.pass;
  const tier = getEvidenceTier(result.evidenceType);

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
          <span className="font-mono text-xs text-fb-textSecondary font-bold">{result.id}</span>
          {isFail && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${styleConfig.badge}`}>
              {result.severity}
            </span>
          )}
        </div>
        <span className="text-[10px] text-fb-textSecondary flex items-center gap-1.5">
          <span
            className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase border ${tier.badgeClass}`}
            title={tier.description}
          >
            {tier.shortLabel}
          </span>
          {result.pillar}
        </span>
      </div>

      <p className="text-sm text-fb-text leading-relaxed">{result.message}</p>
      <p className="text-[11px] text-fb-textSecondary mt-1">{result.regulation}</p>

      {result.remediation && (
        <div className="mt-2.5 p-2.5 bg-fb-card rounded-md border border-fb-border text-xs text-fb-blue">
          <span className="font-bold">💡 Remediation:</span> {result.remediation}
        </div>
      )}
    </motion.div>
  );
}
