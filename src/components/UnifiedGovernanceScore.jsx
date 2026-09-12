'use client';

import { motion } from 'framer-motion';
import { getEvidenceTier } from '../lib/evidenceTiers';

/**
 * The one piece that makes "unified" visible instead of just structurally
 * true in the code. Takes whatever signals are actually available (a
 * heuristic report, a real CSV analysis, a live security suite result —
 * any subset, since not everything is always run) and computes a single
 * composite score weighted by evidence strength, then shows its own math:
 * how much of that number is backed by real evidence vs. text-matching.
 *
 * This is the honest version of a "unified score" — most tools that show
 * one number hide how thin the evidence behind it is. This one doesn't.
 *
 * @param {Array<{label: string, score: number, evidenceType: string}>} signals
 */
export default function UnifiedGovernanceScore({ signals }) {
  const active = signals.filter((s) => s.score !== null && s.score !== undefined);

  if (active.length === 0) {
    return null;
  }

  const totalWeight = active.reduce((sum, s) => sum + getEvidenceTier(s.evidenceType).weight, 0);
  const weightedScore = active.reduce(
    (sum, s) => sum + s.score * getEvidenceTier(s.evidenceType).weight,
    0
  ) / totalWeight;

  const heuristicWeight = active
    .filter((s) => s.evidenceType === 'heuristic_text')
    .reduce((sum, s) => sum + getEvidenceTier(s.evidenceType).weight, 0);
  const strongEvidencePct = Math.round(((totalWeight - heuristicWeight) / totalWeight) * 100);

  const scoreColor = weightedScore > 75 ? 'text-fb-green' : weightedScore > 45 ? 'text-amber-600' : 'text-fb-red';

  return (
    <div className="p-5 rounded-xl border-2 border-fb-blue bg-gradient-to-br from-fb-blueLight to-white shadow-fbCardHover">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-[10px] font-bold text-fb-blue uppercase tracking-widest">Unified Governance Score</p>
          <div className="flex items-baseline gap-2">
            <motion.span
              key={weightedScore.toFixed(0)}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className={`text-4xl font-black ${scoreColor}`}
            >
              {weightedScore.toFixed(0)}%
            </motion.span>
            <span className="text-xs text-fb-textSecondary">
              across {active.length} signal{active.length > 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* The honest part: how much of this is backed by real evidence */}
        <div className="text-right">
          <p className="text-[10px] text-fb-textSecondary mb-1">
            Backed by real/live evidence, not just text-matching:
          </p>
          <div className="flex items-center gap-2 justify-end">
            <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${strongEvidencePct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full bg-fb-blue rounded-full"
              />
            </div>
            <span className="text-sm font-bold text-fb-blue">{strongEvidencePct}%</span>
          </div>
        </div>
      </div>

      {/* Per-signal breakdown */}
      <div className="mt-3 pt-3 border-t border-fb-blue/20 flex flex-wrap gap-2">
        {active.map((s, idx) => {
          const tier = getEvidenceTier(s.evidenceType);
          return (
            <div
              key={idx}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] border ${tier.badgeClass}`}
              title={tier.description}
            >
              <span className="font-bold">{s.label}</span>
              <span>{s.score}%</span>
              <span className="opacity-70">· {tier.shortLabel}</span>
            </div>
          );
        })}
      </div>

      {strongEvidencePct < 40 && (
        <p className="mt-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
          ⚠ Most of this score is still text-pattern matching. Run the live security suite or upload a real dataset sample to strengthen it.
        </p>
      )}
    </div>
  );
}
