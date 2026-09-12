'use client';

import { useState, useEffect, useCallback } from 'react';
import { Database, Trash2 } from 'lucide-react';
import { getAuditHistory, clearAuditHistory } from '../lib/historyStore';

/**
 * Small navbar control showing how many audit snapshots are stored in
 * this browser's localStorage, with a one-click way to clear them.
 *
 * This exists because saveAuditToHistory() persists data with no
 * user-facing visibility or control otherwise — notable given this app's
 * entire premise is auditing *other* systems for storage-limitation and
 * data-governance compliance (DPDP Sec. 7, TTL policies, etc).
 *
 * Listens for the 'govax-history-updated' event (dispatched by
 * historyStore.js on every save/clear) rather than requiring the two
 * separate audit engines to lift state up to a shared parent.
 */
export default function HistoryIndicator() {
  const [count, setCount] = useState(0);
  const [confirmingClear, setConfirmingClear] = useState(false);

  const refreshCount = useCallback(() => {
    setCount(getAuditHistory().length);
  }, []);

  useEffect(() => {
    refreshCount();
    window.addEventListener('govax-history-updated', refreshCount);
    return () => window.removeEventListener('govax-history-updated', refreshCount);
  }, [refreshCount]);

  const handleClear = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      // Auto-cancel the confirm state after a few seconds so a stray click
      // later doesn't accidentally wipe history.
      setTimeout(() => setConfirmingClear(false), 3000);
      return;
    }
    clearAuditHistory();
    setConfirmingClear(false);
  };

  return (
    <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500">
      <Database size={11} />
      <span>{count} saved locally</span>
      {count > 0 && (
        <button
          onClick={handleClear}
          title="Clear all locally stored audit history"
          className={`flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
            confirmingClear
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'text-slate-600 hover:text-rose-400'
          }`}
        >
          <Trash2 size={10} />
          {confirmingClear ? 'Confirm?' : 'Clear'}
        </button>
      )}
    </div>
  );
}
