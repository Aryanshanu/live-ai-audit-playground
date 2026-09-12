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
      layerScores: auditSnapshot.layerScores || {
        security: 100,
        quality: 100,
        rai: 100,
        legal: 100,
        transparency: 100,
      },
      auditType: auditSnapshot.auditType || 'heuristic_sandbox', // 'heuristic_sandbox' | 'verified_hf_api'
      modelOrTitle: auditSnapshot.modelOrTitle || 'Custom System Pipeline',
    };

    const updated = [entry, ...existing].slice(0, MAX_HISTORY);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.warn('[CORE.GOV] Failed to save audit history:', err);
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
 * Retrieves the immediately preceding audit to compute deltas and ghost overlays.
 */
export function getPreviousAudit() {
  const history = getAuditHistory();
  return history.length > 1 ? history[1] : null;
}

/**
 * Clears stored audit history.
 */
export function clearAuditHistory() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (err) {}
}
