'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { NAV_SECTIONS, NAV_STATUS, navStatusCounts } from '../lib/navigation';

/**
 * Governance navigation map.
 *
 * Deliberately renders each destination's REAL status. A menu where a
 * fully-working page and an empty stub look identical is a lie told by
 * layout — and "31 impressive menu items, 25 of them empty" is exactly
 * the kind of capability inflation this project exists to avoid.
 */
export default function GovernanceNav() {
  const [open, setOpen] = useState(false);
  const counts = navStatusCounts();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-fb-card hover:bg-fb-bg border border-fb-border rounded-lg cursor-pointer font-medium text-fb-text"
      >
        <Menu size={13} /> Governance Map
      </button>

      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 bg-black/30 z-[60]"
            />
            <motion.aside
              initial={{ x: -320 }} animate={{ x: 0 }} exit={{ x: -320 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="fixed left-0 top-0 bottom-0 w-[320px] bg-fb-card border-r border-fb-border z-[61] overflow-y-auto"
            >
              <div className="sticky top-0 bg-fb-card border-b border-fb-border px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-fb-text">Governance Map</p>
                  <p className="text-[9px] text-fb-textSecondary mt-0.5">
                    {counts.live} live · {counts.partial} partial · {counts.schema} schema · {counts.planned} planned
                  </p>
                </div>
                <button onClick={() => setOpen(false)} className="text-fb-textSecondary hover:text-fb-text cursor-pointer">
                  <X size={16} />
                </button>
              </div>

              <div className="p-3 space-y-3">
                <p className="text-[9px] text-fb-textSecondary leading-relaxed bg-fb-blueLight border border-fb-blue/20 rounded-lg p-2">
                  Every entry shows its real state. Nothing here is listed as available unless it actually is.
                </p>

                {NAV_SECTIONS.map((sec, si) => (
                  <div key={si}>
                    {sec.section && (
                      <p className="text-[9px] font-bold text-fb-textSecondary uppercase tracking-widest mb-1.5 mt-3">
                        {sec.section}
                      </p>
                    )}
                    <div className="space-y-1">
                      {sec.items.map((item) => {
                        const st = NAV_STATUS[item.status];
                        return (
                          <div key={item.id} className="p-2 rounded-lg border border-fb-border hover:bg-fb-bg">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-medium text-fb-text">{item.label}</span>
                              <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full border shrink-0 ${st.className}`}>
                                {st.label}
                              </span>
                            </div>
                            {item.note && (
                              <p className="text-[9px] text-fb-textSecondary mt-1 leading-snug">{item.note}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
