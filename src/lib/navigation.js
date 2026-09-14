/**
 * GOV.AX navigation structure.
 *
 * The information architecture is informed by docs/ARCHITECTURE-REFERENCE.md
 * — a worked answer to "how do you make unified governance navigable,"
 * which is genuinely hard to get right from first principles. Adopted
 * ideas rather than copied ones: RAI decomposed into named dimensions
 * instead of one lump, intake separated from audit, and continuous
 * validation separated from point-in-time audit.
 *
 * CRITICAL CONVENTION: every destination declares a real `status`, and
 * the UI renders that status visibly. A nav item that looks identical
 * whether it's fully built or an empty stub is a lie told by layout —
 * exactly the kind of "looks more capable than it is" problem this
 * project exists to avoid. 31 impressive-looking menu items leading to
 * 25 empty pages would be worse than 6 honest ones.
 *
 *   live      — implemented and usable
 *   partial   — real but incomplete; the limitation is named
 *   schema    — database exists, no UI yet
 *   planned   — not built; roadmap item
 */

export const NAV_STATUS = {
  live: { label: 'Live', className: 'bg-green-50 text-fb-green border-green-200' },
  partial: { label: 'Partial', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  schema: { label: 'Schema only', className: 'bg-purple-50 text-purple-700 border-purple-200' },
  planned: { label: 'Planned', className: 'bg-gray-100 text-fb-textSecondary border-gray-300' },
};

export const NAV_SECTIONS = [
  {
    section: null, // top-level
    items: [
      { id: 'command-center', label: 'Command Center', status: 'partial', note: 'Unified score + system check exist; not yet a full aggregated landing view.' },
    ],
  },
  {
    section: 'AUDIT',
    items: [
      { id: 'sandbox', label: 'Architecture Sandbox', status: 'live', note: 'Free-text heuristic audit across 4 pillars.' },
      { id: 'model-scanner', label: 'HF Model Scanner', status: 'live', note: 'Real Hugging Face metadata audit + live probes.' },
      { id: 'audit-history', label: 'Audit History', status: 'partial', note: 'Persists to the database; no dedicated browsing UI yet.' },
    ],
  },
  {
    section: 'RESPONSIBLE AI',
    items: [
      { id: 'fairness', label: 'Fairness', status: 'partial', note: 'Real four-fifths rule in-browser; full Fairlearn suite built but the service is not deployed.' },
      { id: 'transparency', label: 'Transparency', status: 'partial', note: 'Model card completeness scoring is live; SHAP explainability built but not deployed.' },
      { id: 'safety', label: 'Safety', status: 'live', note: 'Live content-moderation and jailbreak probes.' },
      { id: 'privacy', label: 'Privacy', status: 'live', note: 'PII scanning on both uploaded datasets and live model output.' },
      { id: 'fidelity', label: 'Fidelity', status: 'planned', note: 'Accuracy/drift over time — needs the analysis service and real traffic.' },
    ],
  },
  {
    section: 'SECURITY',
    items: [
      { id: 'security-dashboard', label: 'Security Dashboard', status: 'partial', note: 'Findings render per-audit; no aggregate dashboard yet.' },
      { id: 'jailbreak-lab', label: 'Jailbreak Lab', status: 'live', note: '4 live adversarial probes with a real containment rate.' },
      { id: 'attack-library', label: 'Attack Library', status: 'schema', note: 'Probes are now data rather than constants; the runtime still reads hardcoded values.' },
      { id: 'supply-chain', label: 'Supply Chain Scan', status: 'schema', note: 'ModelScan integration built and tested; service not deployed.' },
    ],
  },
  {
    section: 'DATA',
    items: [
      { id: 'data-quality', label: 'Data Quality', status: 'live', note: 'Real CSV analysis: nulls, duplicates, imbalance, PII, disparate impact.' },
      { id: 'data-inventory', label: 'Data Inventory', status: 'planned', note: 'No dataset registry yet.' },
    ],
  },
  {
    section: 'REGISTRIES',
    items: [
      { id: 'model-registry', label: 'Model Registry', status: 'schema', note: 'Models, versions, EU AI Act risk tiers exist in the database; no UI yet.' },
      { id: 'use-case-registry', label: 'Use Case Registry', status: 'schema', note: 'Use cases and model links exist; no UI yet.' },
    ],
  },
  {
    section: 'GOVERN',
    items: [
      { id: 'compliance', label: 'Compliance Hub', status: 'partial', note: 'Findings cite clauses as static text, not a versioned policy engine.' },
      { id: 'escalation', label: 'Escalation & Review', status: 'live', note: 'Files real GitHub Issues for CRITICAL findings.' },
      { id: 'intake', label: 'Intake & Approvals', status: 'planned', note: 'Stage-gate approvals — Wave 4.' },
      { id: 'policy', label: 'Policy & Guardrails', status: 'planned', note: 'Regulation-as-code — deferred pending a committed reviewer (DECISIONS.md D5).' },
    ],
  },
  {
    section: 'MONITOR',
    items: [
      { id: 'observability', label: 'Observability Hub', status: 'planned', note: 'Requires production traffic — Wave 4.' },
      { id: 'ongoing-validation', label: 'Ongoing Validation', status: 'planned', note: 'Scheduled re-audits — Wave 4.' },
    ],
  },
  {
    section: 'ADMIN',
    items: [
      { id: 'system-check', label: 'System Check', status: 'live', note: 'Self-diagnostic for the signup → audit → database path.' },
      { id: 'audit-integrity', label: 'Audit Log Integrity', status: 'live', note: 'Hash-chained, tamper-evident, verifiable by org admins.' },
      { id: 'user-management', label: 'User Management', status: 'schema', note: 'Org members and per-org roles exist; no management UI yet.' },
    ],
  },
];

/** Real counts, for honest display rather than an impressive-looking menu. */
export function navStatusCounts() {
  const counts = { live: 0, partial: 0, schema: 0, planned: 0 };
  NAV_SECTIONS.forEach((s) => s.items.forEach((i) => { counts[i.status] += 1; }));
  return counts;
}
