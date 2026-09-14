'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Trash2, ChevronDown, AlertTriangle } from 'lucide-react';
import { getAuditHistory, clearAuditHistory } from '../lib/historyStore';
import { timeAgo } from '../lib/timeFormat';

const TYPE_LABEL = {
  heuristic_sandbox: { text: 'Sandbox', color: 'text-amber-600' },
  verified_hf_api: { text: 'HF Model', color: 'text-fb-blue' },
};

export default function HistoryIndicator() {
  const [history, setHistory] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [confirmingClear, setConfirmingClear] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const containerRef = useRef(null);

  const refresh = useCallback(() => {
    setHistory(getAuditHistory());
  }, []);

  useEffect(() => {
    refresh();
    const onUpdate = () => refresh();
    const onFail = (e) => {
      setSaveError(e.detail?.message || 'Unknown error');
      setTimeout(() => setSaveError(null), 5000);
    };
    window.addEventListener('govax-history-updated', onUpdate);
    window.addEventListener('govax-history-save-failed', onFail);
    return () => {
      window.removeEventListener('govax-history-updated', onUpdate);
      window.removeEventListener('govax-history-save-failed', onFail);
    };
  }, [refresh]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleClear = () => {
    if (!confirmingClear) {
      setConfirmingClear(true);
      setTimeout(() => setConfirmingClear(false), 3000);
      return;
    }
    clearAuditHistory();
    setConfirmingClear(false);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="flex items-center gap-1.5 text-[10px] text-fb-textSecondary hover:text-fb-blue transition-colors cursor-pointer"
      >
        <Database size={11} />
        <span>{history.length} saved locally</span>
        <ChevronDown size={10} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {saveError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute top-6 left-0 z-50 w-64 p-2.5 bg-fb-card border border-red-200 rounded-lg text-[10px] text-fb-red flex items-start gap-1.5 shadow-fbCardHover"
          >
            <AlertTriangle size={12} className="shrink-0 mt-0.5" />
            <span>Couldn't save to local history: {saveError}. Your browser storage may be full or in private mode.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-6 right-0 z-50 w-72 bg-fb-card border border-fb-border rounded-xl shadow-fbCardHover overflow-hidden"
          >
            <div className="px-3 py-2 border-b border-fb-border flex items-center justify-between">
              <span className="text-[10px] text-fb-textSecondary uppercase tracking-wider font-bold">Local Audit History</span>
              {history.length > 0 && (
                <button
                  onClick={handleClear}
                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer font-medium ${
                    confirmingClear
                      ? 'bg-red-50 text-fb-red border border-red-200'
                      : 'text-fb-textSecondary hover:text-fb-red'
                  }`}
                >
                  <Trash2 size={10} />
                  {confirmingClear ? 'Confirm?' : 'Clear all'}
                </button>
              )}
            </div>

            <div className="max-h-64 overflow-y-auto">
              {history.length === 0 ? (
                <p className="text-center text-[11px] text-fb-textSecondary py-6">Nothing saved yet.</p>
              ) : (
                history.map((entry) => {
                  const typeInfo = TYPE_LABEL[entry.auditType] || { text: entry.auditType, color: 'text-fb-textSecondary' };
                  return (
                    <div key={entry.id} className="px-3 py-2 border-b border-fb-border last:border-0 flex items-center justify-between text-[11px]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[9px] font-bold uppercase ${typeInfo.color}`}>{typeInfo.text}</span>
                          <span className="text-fb-textSecondary text-[9px]">{timeAgo(entry.timestamp)}</span>
                        </div>
                        <p className="text-fb-text truncate max-w-[160px]">{entry.modelOrTitle}</p>
                      </div>
                      <span
                        className={`font-bold shrink-0 ml-2 ${
                          entry.score > 75 ? 'text-fb-green' : entry.score > 45 ? 'text-amber-600' : 'text-fb-red'
                        }`}
                      >
                        {entry.score}%
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            <p className="px-3 py-1.5 text-[9px] text-fb-textSecondary border-t border-fb-border">
              Stored in this browser only (localStorage) — never transmitted.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
