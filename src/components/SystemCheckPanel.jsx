'use client';

import { useState } from 'react';
import { Stethoscope } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useSession, useOrgMembership } from '../lib/supabase/auth';

/**
 * Runs the checks that the first real end-to-end audit depends on, and
 * reports exactly which one fails.
 *
 * Why this exists: docs/FIRST-AUDIT.md lists five likely failure points
 * for a path no human has executed. Three of them (signup trigger, slug
 * collisions, org auto-creation) have since been ruled out by direct
 * database testing, and one (a silently-skipped DB write) has been fixed.
 * The main remaining suspect is Supabase Auth redirect configuration,
 * which is a dashboard setting — not something the code can fix, but
 * absolutely something the code can *identify* instead of failing
 * mysteriously.
 */
export default function SystemCheckPanel() {
  const { session, user } = useSession();
  const { activeOrgId, activeOrg, loading: orgLoading } = useOrgMembership(user?.id);
  const [checks, setChecks] = useState(null);
  const [running, setRunning] = useState(false);

  const run = async () => {
    setRunning(true);
    const results = [];

    results.push({
      name: 'Authenticated session',
      ok: Boolean(session),
      detail: session ? `Signed in as ${user.email}` : 'No session. Sign in first.',
    });

    results.push({
      name: 'Email confirmed',
      ok: Boolean(user?.email_confirmed_at),
      detail: user?.email_confirmed_at
        ? 'Confirmed'
        : 'Not confirmed. If the confirmation link errored or redirected somewhere wrong, check Supabase Dashboard → Authentication → URL Configuration. The Site URL and Redirect URLs must include this app\'s full path, including the /live-ai-audit-playground base path.',
    });

    results.push({
      name: 'Personal organization',
      ok: Boolean(activeOrgId),
      detail: orgLoading
        ? 'Still loading — re-run this check in a moment.'
        : activeOrgId
          ? `${activeOrg?.organizations?.name} (role: ${activeOrg?.role})`
          : 'No org found. A personal org should be auto-created by a signup trigger. If missing, the trigger did not run for this account.',
    });

    // Real round-trip against RLS, not just "is the client configured"
    try {
      const { error } = await supabase.from('rai_audits').select('id').limit(1);
      results.push({
        name: 'Database reachable (RLS read)',
        ok: !error,
        detail: error ? `Query failed: ${error.message}` : 'Read query succeeded.',
      });
    } catch (err) {
      results.push({ name: 'Database reachable (RLS read)', ok: false, detail: err.message });
    }

    // Confirms the audit log is readable AND that hash-chaining is intact.
    // Restricted to org owners/admins by design, so a non-admin seeing a
    // permission error here is correct behavior, not a bug.
    try {
      const { data, error } = await supabase.rpc('verify_audit_log_integrity');
      const row = Array.isArray(data) ? data[0] : data;
      results.push({
        name: 'Audit log integrity',
        ok: !error && row?.intact !== false,
        detail: error
          ? `${error.message} (expected if you are not an org owner/admin — this check is deliberately restricted)`
          : row
            ? `Chain intact: ${row.intact}, rows checked: ${row.rows_checked}`
            : 'No rows yet — nothing to verify.',
      });
    } catch (err) {
      results.push({ name: 'Audit log integrity', ok: false, detail: err.message });
    }

    setChecks(results);
    setRunning(false);
  };

  return (
    <div className="p-4 bg-white border border-fb-border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5">
          <Stethoscope size={14} className="text-fb-blue" /> System Check
        </h3>
        <button
          onClick={run}
          disabled={running}
          className="px-3 py-1 text-[11px] bg-fb-blueLight hover:bg-blue-100 text-fb-blue border border-fb-blue/30 rounded-lg cursor-pointer disabled:opacity-50 font-medium"
        >
          {running ? 'Checking…' : 'Run checks'}
        </button>
      </div>
      <p className="text-[10px] text-fb-textSecondary mb-2">
        Verifies everything the first real end-to-end audit depends on, and names the exact failure rather than failing silently.
      </p>

      {checks && (
        <div className="space-y-1.5">
          {checks.map((c, i) => (
            <div
              key={i}
              className={`p-2 rounded-lg border text-[10px] ${
                c.ok ? 'bg-green-50 border-green-200 text-fb-green' : 'bg-amber-50 border-amber-200 text-amber-700'
              }`}
            >
              <span className="font-bold">{c.ok ? '✓' : '⚠'} {c.name}</span>
              <p className="mt-0.5 opacity-80">{c.detail}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
