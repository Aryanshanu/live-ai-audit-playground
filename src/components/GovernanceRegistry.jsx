'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Plus, Boxes, FileCheck, Lock, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase/client';
import { useSession, useOrgMembership } from '../lib/supabase/auth';
import { timeAgo } from '../lib/timeFormat';

/**
 * Model Registry + Use Case Registry.
 *
 * The core of "AI Governance" per the reference platform, previously
 * schema-only — a `models` table with an RLS-isolation test and zero
 * lines of UI. This is real now.
 *
 * The customer/admin split is enforced at the database, not the
 * component: registering a model or use case is open to any org member
 * (an engineer submitting something for review shouldn't need admin
 * rights), but changing risk_tier or lifecycle_stage — the decisions
 * that actually gate deployment — is blocked for non-admins by a
 * trigger on the table itself (enforce_model_governance_fields /
 * enforce_use_case_governance_fields), verified by test: a real viewer-
 * role user could register a model but was rejected changing its
 * risk_tier, while an owner-role user succeeded on the same row.
 * The disabled dropdown below is a courtesy explaining why a click
 * would fail, not the actual access control.
 */

const RISK_TIERS = ['minimal', 'limited', 'high', 'unacceptable'];
const RISK_STYLE = {
  minimal: 'bg-green-50 text-fb-green border-green-200',
  limited: 'bg-fb-blueLight text-fb-blue border-fb-blue/30',
  high: 'bg-amber-50 text-amber-700 border-amber-200',
  unacceptable: 'bg-red-50 text-fb-red border-red-200',
};

export function ModelRegistry() {
  const { user } = useSession();
  const { activeOrgId, isAdmin } = useOrgMembership(user?.id);
  const [models, setModels] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', provider: 'huggingface', external_ref: '', description: '' });
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!activeOrgId) return;
    supabase.from('models').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      setModels(error ? [] : data);
      if (error) setError(error.message);
    });
  }, [activeOrgId]);

  useEffect(() => { load(); }, [load]);

  const register = async () => {
    if (!form.name) return;
    setError(null);
    const { error } = await supabase.from('models').insert({
      org_id: activeOrgId,
      name: form.name,
      provider: form.provider,
      external_ref: form.external_ref || null,
      description: form.description || null,
      created_by: user.id,
      owner_id: user.id,
    });
    if (error) setError(error.message);
    else { setForm({ name: '', provider: 'huggingface', external_ref: '', description: '' }); setShowForm(false); load(); }
  };

  const changeRiskTier = async (modelId, newTier) => {
    setError(null);
    const { error } = await supabase.from('models').update({ risk_tier: newTier }).eq('id', modelId);
    if (error) setError(`Blocked: ${error.message}`);
    else load();
  };

  return (
    <div className="max-w-4xl space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-fb-textSecondary">Any org member can register a model. Only owners/admins can change its risk tier — enforced by the database.</p>
        <button onClick={() => setShowForm((s) => !s)} className="px-3 py-1.5 text-[11px] bg-fb-blue text-white rounded-lg font-medium cursor-pointer flex items-center gap-1">
          <Plus size={12} /> Register Model
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-fb-card border border-fb-border rounded-xl space-y-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Model name (e.g. org/model-name)" className="w-full px-2.5 py-1.5 text-[11px] bg-fb-bg border border-fb-border rounded-lg text-fb-text" />
          <div className="grid grid-cols-2 gap-2">
            <select value={form.provider} onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value }))} className="px-2.5 py-1.5 text-[11px] bg-fb-bg border border-fb-border rounded-lg text-fb-text">
              {['huggingface', 'openai', 'anthropic', 'internal', 'other'].map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <input value={form.external_ref} onChange={(e) => setForm((f) => ({ ...f, external_ref: e.target.value }))} placeholder="External ref (e.g. HF repo id)" className="px-2.5 py-1.5 text-[11px] bg-fb-bg border border-fb-border rounded-lg text-fb-text" />
          </div>
          <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full px-2.5 py-1.5 text-[11px] bg-fb-bg border border-fb-border rounded-lg text-fb-text resize-none" />
          <button onClick={register} className="px-3 py-1.5 text-[11px] bg-fb-blue text-white rounded-lg font-medium cursor-pointer">Register</button>
        </motion.div>
      )}

      {error && <p className="text-[11px] text-fb-red">⚠ {error}</p>}

      {models === null ? (
        <p className="text-[11px] text-fb-textSecondary py-4 text-center">Loading…</p>
      ) : models.length === 0 ? (
        <div className="py-10 text-center">
          <Boxes size={22} className="mx-auto text-fb-textSecondary mb-1.5" />
          <p className="text-[12px] text-fb-text font-medium">No models registered</p>
          <p className="text-[10px] text-fb-textSecondary mt-1">Showing 0 of 0 models.</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          <p className="text-[10px] text-fb-textSecondary">Showing {models.length} of {models.length} models</p>
          {models.map((m) => (
            <div key={m.id} className="p-3 bg-fb-card border border-fb-border rounded-lg">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[12px] font-bold text-fb-text truncate">{m.name}</p>
                  {m.description && <p className="text-[10px] text-fb-textSecondary mt-0.5">{m.description}</p>}
                  <p className="text-[9px] text-fb-textSecondary mt-1">{m.provider} · {m.lifecycle_stage} · Updated {timeAgo(new Date(m.created_at).getTime())}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1.5">
                  {isAdmin ? (
                    <div className="relative">
                      <select
                        value={m.risk_tier}
                        onChange={(e) => changeRiskTier(m.id, e.target.value)}
                        className={`text-[9px] font-bold uppercase pl-2 pr-5 py-1 rounded-full border cursor-pointer appearance-none ${RISK_STYLE[m.risk_tier] ?? RISK_STYLE.minimal}`}
                      >
                        {RISK_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                      <ChevronDown size={9} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>
                  ) : (
                    <span title="Only owners/admins can change this — enforced by the database" className={`text-[9px] font-bold uppercase px-2 py-1 rounded-full border flex items-center gap-1 ${RISK_STYLE[m.risk_tier] ?? RISK_STYLE.minimal}`}>
                      <Lock size={8} /> {m.risk_tier}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function UseCaseRegistry() {
  const { user } = useSession();
  const { activeOrgId, isAdmin } = useOrgMembership(user?.id);
  const [useCases, setUseCases] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', affects_individuals: false });
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    if (!activeOrgId) return;
    supabase.from('use_cases').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      setUseCases(error ? [] : data);
      if (error) setError(error.message);
    });
  }, [activeOrgId]);

  useEffect(() => { load(); }, [load]);

  const register = async () => {
    if (!form.name) return;
    setError(null);
    const { error } = await supabase.from('use_cases').insert({
      org_id: activeOrgId,
      name: form.name,
      domain: form.domain || null,
      affects_individuals: form.affects_individuals,
      created_by: user.id,
    });
    if (error) setError(error.message);
    else { setForm({ name: '', domain: '', affects_individuals: false }); setShowForm(false); load(); }
  };

  const changeRiskTier = async (id, newTier) => {
    setError(null);
    const { error } = await supabase.from('use_cases').update({ risk_tier: newTier }).eq('id', id);
    if (error) setError(`Blocked: ${error.message}`);
    else load();
  };

  return (
    <div className="max-w-4xl space-y-3">
      <div className="p-3 bg-fb-blueLight border border-fb-blue/30 rounded-lg">
        <p className="text-[11px] text-fb-text">
          A model is governed by <strong>what it is used for</strong>, not only by what it is — the same model can be
          minimal-risk in one use case and high-risk in another, which is how the EU AI Act actually reasons about risk.
        </p>
      </div>

      <div className="flex justify-end">
        <button onClick={() => setShowForm((s) => !s)} className="px-3 py-1.5 text-[11px] bg-fb-blue text-white rounded-lg font-medium cursor-pointer flex items-center gap-1">
          <Plus size={12} /> Register Use Case
        </button>
      </div>

      {showForm && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 bg-fb-card border border-fb-border rounded-xl space-y-2">
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Use case name (e.g. Resume Screening)" className="w-full px-2.5 py-1.5 text-[11px] bg-fb-bg border border-fb-border rounded-lg text-fb-text" />
          <input value={form.domain} onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))} placeholder="Domain (e.g. hiring, lending, healthcare)" className="w-full px-2.5 py-1.5 text-[11px] bg-fb-bg border border-fb-border rounded-lg text-fb-text" />
          <label className="flex items-center gap-2 text-[11px] text-fb-textSecondary cursor-pointer">
            <input type="checkbox" checked={form.affects_individuals} onChange={(e) => setForm((f) => ({ ...f, affects_individuals: e.target.checked }))} className="cursor-pointer" />
            Directly affects decisions about individuals
          </label>
          <button onClick={register} className="px-3 py-1.5 text-[11px] bg-fb-blue text-white rounded-lg font-medium cursor-pointer">Register</button>
        </motion.div>
      )}

      {error && <p className="text-[11px] text-fb-red">⚠ {error}</p>}

      {useCases === null ? (
        <p className="text-[11px] text-fb-textSecondary py-4 text-center">Loading…</p>
      ) : useCases.length === 0 ? (
        <div className="py-10 text-center">
          <FileCheck size={22} className="mx-auto text-fb-textSecondary mb-1.5" />
          <p className="text-[12px] text-fb-text font-medium">No use cases registered</p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {useCases.map((u) => (
            <div key={u.id} className="p-3 bg-fb-card border border-fb-border rounded-lg flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12px] font-bold text-fb-text">{u.name}</p>
                <p className="text-[9px] text-fb-textSecondary mt-0.5">
                  {u.domain ?? 'no domain set'} {u.affects_individuals && '· affects individuals'}
                </p>
              </div>
              {isAdmin ? (
                <select value={u.risk_tier} onChange={(e) => changeRiskTier(u.id, e.target.value)} className={`shrink-0 text-[9px] font-bold uppercase px-2 py-1 rounded-full border cursor-pointer ${RISK_STYLE[u.risk_tier] ?? RISK_STYLE.minimal}`}>
                  {RISK_TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <span className={`shrink-0 text-[9px] font-bold uppercase px-2 py-1 rounded-full border flex items-center gap-1 ${RISK_STYLE[u.risk_tier] ?? RISK_STYLE.minimal}`}>
                  <Lock size={8} /> {u.risk_tier}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
