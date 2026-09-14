'use client';

import { Construction, Database, ArrowRight } from 'lucide-react';
import { NAV_STATUS } from '../lib/navigation';

/**
 * Shown for destinations that exist in the navigation but have no UI yet.
 *
 * The alternative — rendering nothing — would make a fully-working page and
 * an unbuilt one look identical apart from emptiness, which reads as a bug
 * rather than an honest state. This says exactly what exists, what doesn't,
 * and what is needed to finish it.
 *
 * Removing a view's entry from VIEWS in AppShell is also a valid choice.
 * These are listed because their database layer genuinely exists and is
 * tested — the gap is only the interface.
 */
export default function PlaceholderView({ view }) {
  const st = NAV_STATUS[view.status] ?? NAV_STATUS.planned;
  const isSchema = view.status === 'schema';

  return (
    <div className="max-w-2xl">
      <div className="p-6 bg-fb-card border border-fb-border rounded-xl">
        <div className="flex items-center gap-2.5 mb-3">
          {isSchema ? <Database size={18} className="text-purple-500" /> : <Construction size={18} className="text-fb-textSecondary" />}
          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${st.className}`}>
            {st.label}
          </span>
        </div>

        <h3 className="text-sm font-bold text-fb-text mb-1.5">
          {isSchema ? 'Database layer exists — interface does not' : 'Not built yet'}
        </h3>

        <p className="text-[12px] text-fb-textSecondary leading-relaxed">
          {isSchema ? (
            <>
              The tables, row-level security policies, and cross-tenant isolation for <strong>{view.label}</strong> are
              live and have been verified by test. What is missing is the screen to read and write them — so this page is
              honestly empty rather than showing invented data.
            </>
          ) : (
            <>
              <strong>{view.label}</strong> is on the roadmap and has no implementation. It appears in the navigation so
              the intended scope of the platform is visible, not to imply it works.
            </>
          )}
        </p>

        <div className="mt-4 pt-3 border-t border-fb-border">
          <p className="text-[10px] text-fb-textSecondary mb-2">Available now instead:</p>
          <div className="flex flex-wrap gap-1.5">
            {['Command Center', 'Architecture Sandbox', 'Model Scanner', 'Data Quality', 'Jailbreak Lab'].map((l) => (
              <span key={l} className="text-[10px] px-2 py-1 rounded-lg bg-fb-bg border border-fb-border text-fb-text">
                {l}
              </span>
            ))}
          </div>
        </div>

        <p className="mt-4 text-[10px] text-fb-textSecondary flex items-center gap-1">
          <ArrowRight size={11} /> Tracked in ROADMAP.md and BENCHMARKS.md
        </p>
      </div>
    </div>
  );
}
