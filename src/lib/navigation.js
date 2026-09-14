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
  planned: { label: 'Planned', className: 'bg-fb-bg text-fb-textSecondary border-gray-300' },
};

// NAV_SECTIONS and navStatusCounts removed — they backed GovernanceNav.jsx,
// which was dead code (superseded by AppShell.jsx's sidebar, never imported
// anywhere, caught by the System Audit in docs/SYSTEM-AUDIT.md Section 10).
// AppShell.jsx's own VIEWS array is now the single source of truth for
// nav structure and status; NAV_STATUS below is kept because it still
// backs real badge styling in AppShell.jsx and PlaceholderView.jsx.

