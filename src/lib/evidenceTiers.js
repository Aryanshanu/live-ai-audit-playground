/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CORE.GOV — Evidence Tier Taxonomy
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * The single mechanism that makes this a UNIFIED framework rather than
 * four unrelated checkers: every finding, from every engine, in every
 * pillar (RAI, Data Quality, Security, and now Agentic), is tagged with
 * how strong its evidence actually is. The UI renders this consistently
 * everywhere findings appear, so a person can tell at a glance whether a
 * claim is "someone wrote a matching sentence" or "we actually tested it."
 *
 * Ordered weakest to strongest evidence:
 *   heuristic_text    — keyword/substring match against free-text prose.
 *                        Cheapest, weakest. Proves nothing about the real
 *                        system, only about what someone wrote down.
 *   verified_data     — computed from real structured data: HF Hub API
 *                        metadata, or actual statistics run against an
 *                        uploaded dataset sample. Stronger — it's real —
 *                        but still not behavioral; a model can have a
 *                        clean license tag and still misbehave.
 *   live_dynamic_test — an actual live probe was executed against a real
 *                        running model/system and its real response was
 *                        checked. Strongest evidence this framework can
 *                        produce, and still only as good as the specific
 *                        probe run — one passing test is not a guarantee.
 */

export const EVIDENCE_TIERS = {
  heuristic_text: {
    label: 'Text Pattern Match',
    shortLabel: 'Heuristic',
    description: 'Detected by matching keywords in free-text prose. Does not verify real system behavior.',
    weight: 1,
    badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  verified_data: {
    label: 'Verified Data',
    shortLabel: 'Verified',
    description: 'Computed from real structured data (API metadata or an actual dataset sample), not behavior.',
    weight: 2,
    badgeClass: 'bg-blue-50 text-fb-blue border-blue-200',
  },
  live_dynamic_test: {
    label: 'Live Dynamic Test',
    shortLabel: 'Live Test',
    description: 'An actual probe was executed against a live system and its real response was evaluated.',
    weight: 3,
    badgeClass: 'bg-green-50 text-fb-green border-green-200',
  },
};

export function getEvidenceTier(evidenceType) {
  return EVIDENCE_TIERS[evidenceType] || EVIDENCE_TIERS.heuristic_text;
}
