'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, ListChecks, History, Plus, Trash2, Lock } from 'lucide-react';
import { analyzeCsvQuality } from '../lib/dataQualityAnalyzer';
import { getEvidenceTier } from '../lib/evidenceTiers';
import { supabase } from '../lib/supabase/client';
import { useSession, useOrgMembership } from '../lib/supabase/auth';
import { timeAgo } from '../lib/timeFormat';

/**
 * Data Quality Center.
 *
 * Closes the biggest gap flagged in review: the previous DataQualityUpload
 * made zero Supabase calls, so every real analysis this app ever computed
 * was lost on refresh. Every run here persists to `dq_runs`, org-scoped.
 *
 * Encodes the customer/admin split for real, not cosmetically:
 * - ANALYZE: any org member. Running an analysis is investigative work,
 *   not a policy decision — an analyst should be able to test data freely.
 * - RULES: only org owner/admin. This is enforced by `dq_rules`' RLS
 *   policies, not by hiding the tab — a non-admin who found the insert
 *   endpoint directly would still be rejected by the database. Verified
 *   by test before this UI was written (two real users, one owner, one
 *   viewer; the viewer's rule-creation attempt was rejected at the DB).
 * - HISTORY: any org member reads; nobody can edit or delete a past run
 *   (no UPDATE/DELETE policy exists on dq_runs at all) — a data quality
 *   record should not be quietly rewritten after the fact any more than
 *   the audit log should.
 */

const RULE_TYPES = [
  { value: 'max_null_rate', label: 'Max null rate (%)' },
  { value: 'min_row_count', label: 'Min row count' },
  { value: 'max_duplicate_rate', label: 'Max duplicate rate (%)' },
];

export default function DataQualityCenter() {
  const [tab, setTab] = useState('analyze');
  const { user } = useSession();
  const { activeOrgId, isAdmin } = useOrgMembership(user?.id);

  return (
    <div className="max-w-4xl space-y-4">
      <div className="flex items-center gap-1 border-b border-fb-border">
        {[
          ['analyze', 'Analyze', UploadCloud],
          ['rules', 'Rules', ListChecks],
          ['history', 'History', History],
        ].map(([id, label, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-[12px] font-medium flex items-center gap-1.5 border-b-2 -mb-px cursor-pointer ${
              tab === id ? 'border-fb-blue text-fb-blue' : 'border-transparent text-fb-textSecondary hover:text-fb-text'
            }`}
          >
            <Icon size={13} /> {label}
            {id === 'rules' && !isAdmin && <Lock size={10} className="text-fb-textSecondary" />}
          </button>
        ))}
      </div>

      {tab === 'analyze' && <AnalyzeTab orgId={activeOrgId} userId={user?.id} />}
      {tab === 'rules' && <RulesTab orgId={activeOrgId} isAdmin={isAdmin} />}
      {tab === 'history' && <HistoryTab orgId={activeOrgId} />}
    </div>
  );
}

function AnalyzeTab({ orgId, userId }) {
  const [datasetName, setDatasetName] = useState('');
  const [result, setResult] = useState(null);
  const [saveStatus, setSaveStatus] = useState(null);
  const fileRef = useRef(null);
  const tier = getEvidenceTier('verified_data');

  const handleFile = useCallback(
    (file) => {
      if (!file) return;
      if (!datasetName) setDatasetName(file.name.replace(/\.(csv|txt)$/i, ''));
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const analysis = analyzeCsvQuality(e.target.result);
          setResult(analysis);
          setSaveStatus(null);
          if (orgId && userId) {
            const { error } = await supabase.from('dq_runs').insert({
              org_id: orgId,
              dataset_name: datasetName || file.name,
              row_count: analysis.stats.rowCount,
              score: analysis.score,
              issues: analysis.issues,
              created_by: userId,
            });
            setSaveStatus(error ? { error: error.message } : { saved: true });
          } else {
            setSaveStatus({ error: 'Not signed in to an organization — this result was not persisted.' });
          }
        } catch (err) {
          setResult({ error: err.message });
        }
      };
      reader.readAsText(file);
    },
    [datasetName, orgId, userId]
  );

  return (
    <div className="space-y-3">
      <input
        value={datasetName}
        onChange={(e) => setDatasetName(e.target.value)}
        placeholder="Dataset name (optional — defaults to the filename)"
        className="w-full px-3 py-2 text-[12px] bg-fb-card border border-fb-border rounded-lg text-fb-text focus:outline-none focus:border-fb-blue"
      />

      <div
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFile(e.dataTransfer.files?.[0]); }}
        className="p-8 bg-fb-card border-2 border-dashed border-fb-border rounded-xl text-center cursor-pointer hover:border-fb-blue"
      >
        <UploadCloud size={22} className="mx-auto text-fb-textSecondary mb-1.5" />
        <p className="text-[12px] text-fb-text font-medium">Drop a CSV here or click to browse</p>
        <p className="text-[10px] text-fb-textSecondary mt-0.5">Analyzed entirely in your browser — the file never leaves this device.</p>
        <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
      </div>

      {result && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-fb-card border border-fb-border rounded-xl">
          {result.error ? (
            <p className="text-[11px] text-fb-red">⚠ {result.error}</p>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-baseline gap-2">
                  <span className={`text-3xl font-black ${result.score >= 75 ? 'text-fb-green' : result.score >= 50 ? 'text-amber-500' : 'text-fb-red'}`}>
                    {result.score}%
                  </span>
                  <span className="text-[10px] text-fb-textSecondary">
                    {result.stats.rowCount} rows · {result.stats.colCount} columns
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${tier.badgeClass}`}>{tier.shortLabel}</span>
              </div>
              {result.issues.length === 0 ? (
                <p className="text-[11px] text-fb-green">No issues found in this sample.</p>
              ) : (
                <div className="space-y-1.5">
                  {result.issues.map((iss, i) => (
                    <div key={i} className="p-2 bg-fb-bg rounded-lg text-[11px]">
                      <span className="font-bold text-fb-red">{iss.severity}</span> — {iss.message}
                    </div>
                  ))}
                </div>
              )}
              {saveStatus?.saved && <p className="mt-2 text-[10px] text-fb-green">✓ Saved to organization history</p>}
              {saveStatus?.error && <p className="mt-2 text-[10px] text-amber-600">⚠ {saveStatus.error}</p>}
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}

function RulesTab({ orgId, isAdmin }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ column_name: '', rule_type: 'max_null_rate', threshold: '' });
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!orgId) return;
    supabase.from('dq_rules').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (error) setError(error.message);
      else setRules(data);
      setLoading(false);
    });
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!form.column_name || !form.threshold) return;
    setError(null);
    const { error } = await supabase.from('dq_rules').insert({
      org_id: orgId,
      column_name: form.column_name,
      rule_type: form.rule_type,
      threshold: Number(form.threshold),
      created_by: (await supabase.auth.getUser()).data.user.id,
    });
    if (error) {
      // A non-admin reaching this form somehow would land here — the real
      // rejection is the RLS policy, this message is just surfacing it.
      setError(error.message);
    } else {
      setForm({ column_name: '', rule_type: 'max_null_rate', threshold: '' });
      load();
    }
  };

  const remove = async (id) => {
    const { error } = await supabase.from('dq_rules').delete().eq('id', id);
    if (error) setError(error.message);
    else load();
  };

  return (
    <div className="space-y-3">
      {!isAdmin && (
        <p className="text-[11px] text-fb-textSecondary p-2.5 bg-fb-bg border border-fb-border rounded-lg flex items-center gap-1.5">
          <Lock size={12} /> Viewing only — creating or changing rules requires an owner or admin role in your organization.
          This is enforced by the database, not just this screen.
        </p>
      )}

      {isAdmin && (
        <div className="p-3 bg-fb-card border border-fb-border rounded-xl grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            value={form.column_name}
            onChange={(e) => setForm((f) => ({ ...f, column_name: e.target.value }))}
            placeholder="Column name"
            className="px-2.5 py-1.5 text-[11px] bg-fb-bg border border-fb-border rounded-lg text-fb-text"
          />
          <select
            value={form.rule_type}
            onChange={(e) => setForm((f) => ({ ...f, rule_type: e.target.value }))}
            className="px-2.5 py-1.5 text-[11px] bg-fb-bg border border-fb-border rounded-lg text-fb-text"
          >
            {RULE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <input
            value={form.threshold}
            onChange={(e) => setForm((f) => ({ ...f, threshold: e.target.value }))}
            placeholder="Threshold"
            type="number"
            className="px-2.5 py-1.5 text-[11px] bg-fb-bg border border-fb-border rounded-lg text-fb-text"
          />
          <button onClick={create} className="px-2.5 py-1.5 text-[11px] bg-fb-blue text-white rounded-lg font-medium cursor-pointer flex items-center justify-center gap-1">
            <Plus size={12} /> Add rule
          </button>
        </div>
      )}

      {error && <p className="text-[11px] text-fb-red">⚠ {error}</p>}

      {loading ? (
        <p className="text-[11px] text-fb-textSecondary py-4 text-center">Loading…</p>
      ) : rules.length === 0 ? (
        <p className="text-[11px] text-fb-textSecondary py-6 text-center">No rules defined for this organization yet.</p>
      ) : (
        <div className="space-y-1.5">
          {rules.map((r) => (
            <div key={r.id} className="flex items-center justify-between p-2.5 bg-fb-card border border-fb-border rounded-lg text-[11px]">
              <span>
                <span className="font-mono text-fb-blue">{r.column_name}</span> — {RULE_TYPES.find((t) => t.value === r.rule_type)?.label ?? r.rule_type}: <strong>{r.threshold}</strong>
              </span>
              {isAdmin && (
                <button onClick={() => remove(r.id)} className="text-fb-textSecondary hover:text-fb-red cursor-pointer">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function HistoryTab({ orgId }) {
  const [runs, setRuns] = useState(null);

  useEffect(() => {
    if (!orgId) return;
    supabase.from('dq_runs').select('*').order('created_at', { ascending: false }).limit(30).then(({ data }) => setRuns(data ?? []));
  }, [orgId]);

  if (runs === null) return <p className="text-[11px] text-fb-textSecondary py-4 text-center">Loading…</p>;
  if (runs.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-[12px] text-fb-text font-medium">No runs recorded yet</p>
        <p className="text-[10px] text-fb-textSecondary mt-1">Analyses run in the Analyze tab appear here, organization-wide.</p>
      </div>
    );
  }
  return (
    <div className="space-y-1.5">
      {runs.map((r) => (
        <div key={r.id} className="flex items-center justify-between p-2.5 bg-fb-card border border-fb-border rounded-lg text-[11px]">
          <div>
            <p className="font-medium text-fb-text">{r.dataset_name}</p>
            <p className="text-[9px] text-fb-textSecondary">{r.row_count} rows · {r.issues?.length ?? 0} issue(s)</p>
          </div>
          <div className="text-right shrink-0">
            <span className={`font-bold ${r.score >= 75 ? 'text-fb-green' : r.score >= 50 ? 'text-amber-500' : 'text-fb-red'}`}>{r.score}%</span>
            <p className="text-[9px] text-fb-textSecondary">{timeAgo(new Date(r.created_at).getTime())}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
