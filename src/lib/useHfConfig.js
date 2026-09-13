'use client';

import { useState, useEffect, useCallback } from 'react';

const STORAGE_KEY = 'govax_hf_config_v1';

/**
 * Shared, persisted HF token + preferred model, used by every live-call
 * feature (Semantic Audit, and available for future ones) instead of
 * each component keeping its own local useState.
 *
 * WHY THIS EXISTS: SemanticAuditPanel lived inside a conditionally-
 * rendered tab ({activeTab === 'semantic' && <SemanticAuditPanel/>}),
 * so React unmounted it completely on every tab switch — its local
 * useState('') token field reset to empty every single time. This hook
 * fixes that by persisting to localStorage instead of component state,
 * so the token survives tab switches, component remounts, and page
 * reloads within the same browser.
 *
 * Token still never leaves the browser except in the actual HF API
 * calls the user explicitly triggers — this is client-side storage,
 * not a new server or third-party destination for it.
 */
export function useHfConfig() {
  const [hfToken, setHfTokenState] = useState('');
  const [modelId, setModelIdState] = useState('meta-llama/Llama-3-8B-Instruct');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.hfToken) setHfTokenState(parsed.hfToken);
        if (parsed.modelId) setModelIdState(parsed.modelId);
      }
    } catch (err) {
      // Corrupt or inaccessible storage — fall back to defaults silently,
      // this is a convenience feature, not critical path.
    }
    setLoaded(true);
  }, []);

  const persist = useCallback((next) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      // Storage full or unavailable (private mode) — the in-memory state
      // still works for this session, it just won't survive a reload.
    }
  }, []);

  const setHfToken = useCallback((value) => {
    setHfTokenState(value);
    persist({ hfToken: value, modelId });
  }, [modelId, persist]);

  const setModelId = useCallback((value) => {
    setModelIdState(value);
    persist({ hfToken, modelId: value });
  }, [hfToken, persist]);

  return { hfToken, setHfToken, modelId, setModelId, loaded };
}
