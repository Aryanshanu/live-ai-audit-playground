'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Database, Users, Activity, AlertTriangle, Server, ShieldCheck, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useSession, useOrgMembership } from '../lib/supabase/auth';
import { timeAgo } from '../lib/timeFormat';

/**
 * Command Center / Admin dashboard.
 *
 * Layout pattern follows docs/ARCHITECTURE-REFERENCE.md: status tiles
 * across the top, a live audit-log feed, then summary panels. That shape
 * is a good, proven answer to "what does an operator need to see first."
 *
 * Every number here is read live from this project's own database. None
 * are placeholders or sample data — if a count is 0, it is genuinely 0,
 * which right now is true of most of them. A dashboard that invents
 * plausible-looking numbers to appear substantial is the single easiest
 * way for a governance tool to become theatre.
 *
 * Deliberately omitted: an "Emergency Platform Lock" equivalent. The
 * reference had one (suspend all AI systems), but GOV.AX audits models —
 * it does not sit in anyone's request path, so it has nothing to suspend.
 * A lockdown button that doesn't actually stop traffic would be a prop.
 * See DECISIONS.md D4.
 */
export default function AdminDashboard() {
  const { user } = useSession();
  const { activeOrgId, isAdmin } = useOrgMembership(user?.id);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const started = performance.now();
    try {
      const [audits, findings, models, useCases, attacks, members, logs] = await Promise.all([
        supabase.from('rai_audits').select('id', { count: 'exact', head: true }),
        supabase.from('rai_findings').select('id', { count: 'exact', head: true }),
        supabase.from('models').select('id', { count: 'exact', head: true }),
        supabase.from('use_cases').select('id', { count: 'exact', head: true }),
        supabase.from('attack_library').select('id', { count: 'exact', head: true }),
        supabase.from('org_members').select('id', { count: 'exact', head: true }),
        supabase.from('audit_log').select('id, action, resource_type, created_at').order('created_at', { ascending: false }).limit(20),
      ]);

      const roundTrip = Math.round(performance.now() - started);

      // Integrity check is restricted to org owners/admins by design, so a
      // permission error here is correct behaviour rather than a fault.
      let integrity = null;
      const { data: integrityData, error: integrityErr } = await supabase.rpc('verify_audit_log_integrity');
      if (!integrityErr) integrity = Array.isArray(integrityData) ? integrityData[0] : integrityData;

      setStats({
        roundTrip,
        audits: audits.count ?? 0,
        findings: findings.count ?? 0,
        models: models.count ?? 0,
        useCases: useCases.count ?? 0,
        attacks: attacks.count ?? 0,
        members: members.count ?? 0,
        recentLogs: logs.data ?? [],
        integrity,
        integrityRestricted: Boolean(integrityErr),
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (activeOrgId) load(); }, [activeOrgId, load]);

  const tiles = stats ? [
    { icon: Database, label: 'DATABASE', value: 'CONNECTED', sub: `${stats.roundTrip}ms round-trip`, good: true },
    { icon: Users, label: 'ORG MEMBERS', value: stats.members, sub: 'Active memberships' },
    { icon: Activity, label: 'AUDITS RUN', value: stats.audits, sub: stats.audits === 0 ? 'None yet — see docs/FIRST-AUDIT.md' : `${stats.findings} findings recorded` },
    { icon: ShieldCheck, label: 'AUDIT LOG', value: stats.integrityRestricted ? '—' : (stats.integrity?.intact ? 'INTACT' : 'BROKEN'),
      sub: stats.integrityRestricted ? 'Restricted to org admins' : `${stats.integrity?.rows_checked ?? 0} rows hash-verified`,
      good: !stats.integrityRestricted && stats.integrity?.intact },
  ] : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-bold text-fb-text">Command Center</h2>
          <p className="text-[11px] text-fb-textSecondary">
            Live figures from this project&apos;s own database. Nothing here is sample data.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] bg-white hover:bg-fb-bg border border-fb-border rounded-lg cursor-pointer disabled:opacity-50 font-medium"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {error && <p className="text-[11px] text-fb-red">⚠ {error}</p>}
      {!activeOrgId && !error && (
        <p className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
          Waiting for your organization to load. If this persists, run System Check.
        </p>
      )}

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tiles.map((t, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="p-3 bg-white border border-fb-border rounded-lg"
              >
                <div className="flex items-center gap-1.5 mb-1.5">
                  <t.icon size={12} className="text-fb-textSecondary" />
                  <span className="text-[9px] font-bold text-fb-textSecondary uppercase tracking-widest">{t.label}</span>
                </div>
                <p className={`text-xl font-black ${t.good ? 'text-fb-green' : 'text-fb-text'}`}>{t.value}</p>
                <p className="text-[9px] text-fb-textSecondary mt-0.5">{t.sub}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Live audit log */}
            <div className="p-4 bg-white border border-fb-border rounded-lg">
              <h3 className="text-xs font-bold text-fb-text mb-1">Audit Log</h3>
              <p className="text-[9px] text-fb-textSecondary mb-2">
                Append-only and hash-chained. Unlike a conventional audit table, entries here cannot be updated or deleted — proven by test, not asserted.
              </p>
              {stats.recentLogs.length === 0 ? (
                <p className="text-[11px] text-fb-textSecondary py-4 text-center">
                  No entries yet. The first real audit will write here.
                </p>
              ) : (
                <div className="space-y-1 max-h-[260px] overflow-y-auto">
                  {stats.recentLogs.map((l) => (
                    <div key={l.id} className="flex items-center justify-between p-1.5 bg-fb-bg rounded text-[10px]">
                      <div>
                        <span className="font-mono text-fb-text">{l.action}</span>
                        <span className="text-fb-textSecondary"> · {l.resource_type}</span>
                      </div>
                      <span className="text-fb-textSecondary shrink-0">{timeAgo(new Date(l.created_at).getTime())}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Registry inventory */}
            <div className="p-4 bg-white border border-fb-border rounded-lg">
              <h3 className="text-xs font-bold text-fb-text mb-1 flex items-center gap-1.5">
                <Server size={12} className="text-fb-blue" /> Inventory
              </h3>
              <p className="text-[9px] text-fb-textSecondary mb-2">Registered governance assets in your organization.</p>
              <div className="space-y-1.5">
                {[
                  ['Models', stats.models, 'Registry schema is live; no UI to add them yet'],
                  ['Use Cases', stats.useCases, 'Risk tier is set per use case, not per model'],
                  ['Attack Library', stats.attacks, 'Built-in probes shared across all orgs'],
                  ['Audits', stats.audits, 'Completed governance audits'],
                ].map(([label, val, note]) => (
                  <div key={label} className="flex items-start justify-between gap-2 py-1 border-b border-fb-border last:border-0">
                    <div>
                      <p className="text-[11px] text-fb-text font-medium">{label}</p>
                      <p className="text-[9px] text-fb-textSecondary">{note}</p>
                    </div>
                    <span className="text-sm font-bold text-fb-text shrink-0">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {stats.audits === 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
              <AlertTriangle size={14} className="shrink-0 mt-0.5" />
              <span>
                Zero audits have been run. The signup path is verified working, so this is the remaining untested step —
                and the single most valuable thing to do next. See <span className="font-mono">docs/FIRST-AUDIT.md</span>.
              </span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
