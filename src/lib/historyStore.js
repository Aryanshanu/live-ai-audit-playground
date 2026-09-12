/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CORE.GOV — Audit History & Temporal Drift Store
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Persists historical audit snapshots to client-side localStorage.
 * Enables:
 *   1. Ghosted previous-audit polygon overlay on the 5-axis radar chart
 *   2. Temporal score drift tracking
 *   3. Session-based delta metrics (e.g. +12% improvement)
 */

const STORAGE_KEY = 'core_gov_audit_history_v1';
const MAX_HISTORY = 10;

// Must match InteractiveRadarChart's per-axis formula exactly, so a stored
// snapshot's layerScores reflect what the chart would actually draw for it.
const RADAR_LAYERS = ['security', 'quality', 'rai', 'legal', 'transparency'];

/**
 * Computes a per-axis (radar-chart) score breakdown from a flat issues list.
 * Shared by both audit engines so `layerScores` is always populated with
 * real values rather than left at its all-100 default.
 */
export function computeLayerScores(issues = []) {
  const scores = {};
  RADAR_LAYERS.forEach((layer) => {
    const count = issues.filter(
      (i) =>
        i.layer === layer ||
        (layer === 'transparency' &&
          i.ruleId &&
          (i.ruleId.includes('VERNACULAR') || i.ruleId.includes('FTC') || i.ruleId.includes('LINEAGE')))
    ).length;
    scores[layer] = Math.max(20, 100 - count * 25);
  });
  return scores;
}

/**
 * Saves an audit run to local history.
 */
export function saveAuditToHistory(auditSnapshot) {
  if (typeof window === 'undefined') return [];
  try {
    const existing = getAuditHistory();
    const entry = {
      id: `audit_${Date.now()}`,
      timestamp: Date.now(),
      score: auditSnapshot.score,
      issuesCount: auditSnapshot.issues ? auditSnapshot.issues.length : 0,
      issues: auditSnapshot.issues || [],
      layerScores: auditSnapshot.layerScores || computeLayerScores(auditSnapshot.issues || []),
      auditType: auditSnapshot.auditType || 'heuristic_sandbox', // 'heuristic_sandbox' | 'verified_hf_api'
      modelOrTitle: auditSnapshot.modelOrTitle || 'Custom System Pipeline',
    };

    const updated = [entry, ...existing].slice(0, MAX_HISTORY);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new Event('govax-history-updated'));
    return updated;
  } catch (err) {
    console.warn('[CORE.GOV] Failed to save audit history:', err);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('govax-history-save-failed', { detail: { message: err.message } }));
    }
    return [];
  }
}

/**
 * Retrieves the full audit history list.
 */
export function getAuditHistory() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

/**
 * Retrieves the most recent PRIOR audit for drift/ghost comparison —
 * scoped to the same auditType (and, when provided, the same subject via
 * modelOrTitle) so the radar chart never compares two unrelated audits
 * (e.g. an HF model scan vs. an unrelated sandbox pipeline description).
 * Previously this returned history[1] unconditionally, which could ghost
 * against a completely different audit.
 */
export function getPreviousAudit(auditType, modelOrTitle) {
  const history = getAuditHistory();
  // Skip index 0 — that's the run currently on screen, already saved.
  return (
    history.slice(1).find((entry) => {
      if (auditType && entry.auditType !== auditType) return false;
      if (modelOrTitle && entry.modelOrTitle !== modelOrTitle) return false;
      return true;
    }) || null
  );
}

/**
 * Clears stored audit history.
 */
export function clearAuditHistory() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('govax-history-updated'));
  } catch (err) {}
}
