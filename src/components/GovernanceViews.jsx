'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  History, Scale, Crosshair, Settings as SettingsIcon, BookOpen,
  ExternalLink, Trash2, ShieldAlert,
} from 'lucide-react';
import { RULE_REGISTRY, generateThreatNarrative } from '../lib/auditEngine';
import { GOVERNANCE_RULES } from '../lib/rules';
import { getAuditHistory, clearAuditHistory } from '../lib/historyStore';
import { supabase } from '../lib/supabase/client';
import { useSession, useOrgMembership } from '../lib/supabase/auth';
import { useHfConfig } from '../lib/useHfConfig';
import { getEvidenceTier } from '../lib/evidenceTiers';
import { timeAgo } from '../lib/timeFormat';

/**
 * Views added after an end-to-end comparison against the reference
 * platform (see docs/ARCHITECTURE-REFERENCE.md).
 *
 * Selection criterion: only destinations GOV.AX can genuinely back with
 * something it already computes. The reference has 31 destinations; adding
 * all of them would produce mostly empty screens, which is capability
 * inflation by navigation. Everything here reads real rules, real audit
 * records, or real configuration.
 */

/* ══════════════ AUDIT CENTER ══════════════ */
export function AuditCenter() {
  const { user } = useSession();
  const { activeOrgId } = useOrgMembership(user?.id);
  const [local, setLocal] = useState([]);
  const [remote, setRemote] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLocal(getAuditHistory());
    if (!activeOrgId) { setLoading(false); return; }
    supabase
      .from('rai_audits')
      .select('id, model_id, status, created_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data, error }) => {
        setRemote(error ? { error: error.message } : data);
        setLoading(false);
      });
  }, [activeOrgId]);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="p-4 bg-fb-card border border-fb-border rounded-xl">
        <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5 mb-1">
          <History size={13} className="text-fb-blue" /> Persisted audits
        </h3>
        <p className="text-[10px] text-fb-textSecondary mb-3">
          Stored in the database, scoped to your organization and enforced by row-level security.
        </p>

        {loading ? (
          <p className="text-[11px] text-fb-textSecondary py-4 text-center">Loading…</p>
        ) : remote?.error ? (
          <p className="text-[11px] text-fb-red">⚠ {remote.error}</p>
        ) : !remote?.length ? (
          <div className="py-6 text-center">
            <p className="text-[12px] text-fb-text font-medium">No audits persisted yet</p>
            <p className="text-[10px] text-fb-textSecondary mt-1 max-w-sm mx-auto">
              Running a Model Scanner audit while signed in writes a record here. This count is genuinely zero, not a
              loading state.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {remote.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-2 bg-fb-bg rounded-lg text-[11px]">
                <div className="min-w-0">
                  <p className="font-mono text-fb-text truncate">{a.model_id ?? 'untitled'}</p>
                  <p className="text-[9px] text-fb-textSecondary">{a.status}</p>
                </div>
                <span className="text-[9px] text-fb-textSecondary shrink-0">
                  {timeAgo(new Date(a.created_at).getTime())}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="p-4 bg-fb-card border border-fb-border rounded-xl">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xs font-bold text-fb-text">Local session history</h3>
          {local.length > 0 && (
            <button
              onClick={() => { clearAuditHistory(); setLocal([]); }}
              className="text-[10px] text-fb-red hover:underline cursor-pointer flex items-center gap-1"
            >
              <Trash2 size={10} /> Clear
            </button>
          )}
        </div>
        <p className="text-[10px] text-fb-textSecondary mb-3">
          Browser-only, capped at 10 entries. Kept separate from the database records above because they are a
          genuinely weaker record — they never left this device and nobody else can verify them.
        </p>
        {local.length === 0 ? (
          <p className="text-[11px] text-fb-textSecondary py-3 text-center">No local history.</p>
        ) : (
          <div className="space-y-1.5">
            {local.map((h, i) => (
              <div key={i} className="flex items-center justify-between p-2 bg-fb-bg rounded-lg text-[11px]">
                <span className="truncate text-fb-text">{h.modelOrTitle ?? 'Untitled'}</span>
                <span className="font-bold text-fb-text shrink-0 ml-2">{h.score}%</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ══════════════ COMPLIANCE HUB ══════════════ */
export function ComplianceHub() {
  // Built from the real clause strings attached to each rule, so it can
  // never drift from what the engines actually check.
  const frameworks = useMemo(() => {
    const map = {};
    const add = (clause, ruleName, layer, source) => {
      if (!clause) return;
      clause.split('/').map((c) => c.trim()).forEach((c) => {
        const family =
          c.startsWith('DPDP') || c.includes('India DPDP') ? 'India DPDP Act 2023' :
          c.startsWith('EU AI Act') ? 'EU AI Act' :
          c.startsWith('ISO') ? 'ISO/IEC Standards' :
          c.startsWith('OWASP') ? 'OWASP Top 10 for LLMs' :
          c.startsWith('NIST') ? 'NIST AI RMF' :
          c.startsWith('US FTC') ? 'US FTC Act' :
          c.startsWith('MeitY') ? 'MeitY IndiaAI Stack' :
          c.startsWith('UNESCO') ? 'UNESCO AI Ethics' : 'Other';
        map[family] = map[family] || [];
        map[family].push({ clause: c, ruleName, layer, source });
      });
    };
    RULE_REGISTRY.forEach((r) => add(r.clause, `${r.id} — ${r.message}`, r.layer, 'Sandbox engine'));
    (GOVERNANCE_RULES ?? []).forEach((r) => add(r.regulation, `${r.id} — ${r.pillar}`, r.layer, 'HF metadata engine'));
    return map;
  }, []);

  const total = Object.values(frameworks).reduce((n, a) => n + a.length, 0);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="p-3 bg-fb-blueLight border border-fb-blue/30 rounded-lg">
        <p className="text-[11px] text-fb-text">
          <strong>{total} rule-to-clause mappings</strong> across {Object.keys(frameworks).length} frameworks, derived
          directly from the rules the engines run — so this page cannot claim coverage the engines do not actually have.
        </p>
        <p className="text-[10px] text-fb-textSecondary mt-1.5">
          These are citations attached to checks, not a maintained regulatory compliance engine. Mapping a finding to a
          clause is not the same as legal assurance that you comply with it.
        </p>
      </div>

      {Object.entries(frameworks).sort((a, b) => b[1].length - a[1].length).map(([family, items]) => (
        <div key={family} className="p-4 bg-fb-card border border-fb-border rounded-xl">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5">
              <Scale size={13} className="text-fb-blue" /> {family}
            </h3>
            <span className="text-[10px] text-fb-textSecondary">{items.length} mapping(s)</span>
          </div>
          <div className="space-y-1.5">
            {items.map((it, i) => (
              <div key={i} className="p-2 bg-fb-bg rounded-lg">
                <p className="text-[10px] font-mono text-fb-blue">{it.clause}</p>
                <p className="text-[11px] text-fb-text mt-0.5">{it.ruleName}</p>
                <p className="text-[9px] text-fb-textSecondary mt-0.5">{it.layer} · {it.source}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ══════════════ THREAT MODELING ══════════════ */
export function ThreatModeling({ report, architectureText }) {
  const narrative = useMemo(() => {
    if (!report?.issues?.length) return null;
    try { return generateThreatNarrative(report.issues); }
    catch { return null; }
  }, [report, architectureText]);

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="p-3 bg-fb-card border border-fb-border rounded-lg">
        <p className="text-[11px] text-fb-text">
          Builds an attack narrative by chaining findings from the most recent Architecture Sandbox audit — how separate
          weaknesses combine into a plausible path, rather than listing them independently.
        </p>
      </div>

      {!narrative ? (
        <div className="p-10 bg-fb-card border border-fb-border rounded-xl text-center">
          <Crosshair size={26} className="mx-auto text-fb-textSecondary mb-2" />
          <h3 className="text-sm font-bold text-fb-text">No audit to model</h3>
          <p className="text-[11px] text-fb-textSecondary mt-1 max-w-md mx-auto">
            Run an Architecture Sandbox audit that produces at least one finding, then return here.
          </p>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-fb-card border border-fb-border rounded-xl">
          <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5 mb-2">
            <ShieldAlert size={13} className="text-fb-red" /> Attack narrative
          </h3>
          <pre className="text-[11px] text-fb-text whitespace-pre-wrap font-sans leading-relaxed">{narrative}</pre>
          <p className="mt-3 text-[9px] text-fb-textSecondary">
            Generated from heuristic findings — {getEvidenceTier('heuristic_text').description}
          </p>
        </motion.div>
      )}
    </div>
  );
}

/* ══════════════ SETTINGS ══════════════ */
export function SettingsView() {
  const { user } = useSession();
  const { activeOrg, roles } = useOrgMembership(user?.id);
  const { hfToken, setHfToken, modelId, setModelId } = useHfConfig();

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="p-4 bg-fb-card border border-fb-border rounded-xl">
        <h3 className="text-xs font-bold text-fb-text mb-2">Account</h3>
        <dl className="space-y-1.5 text-[11px]">
          {[
            ['Email', user?.email ?? 'Guest session'],
            ['Organization', activeOrg?.organizations?.name ?? '—'],
            ['Role', roles.join(', ') || '—'],
          ].map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3">
              <dt className="text-fb-textSecondary">{k}</dt>
              <dd className="text-fb-text font-medium truncate">{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="p-4 bg-fb-card border border-fb-border rounded-xl">
        <h3 className="text-xs font-bold text-fb-text mb-1">Inference credentials</h3>
        <p className="text-[10px] text-fb-textSecondary mb-3">
          Stored in this browser only and sent directly to Hugging Face. No GOV.AX server receives it — there isn&apos;t one.
        </p>
        <label className="text-[10px] font-bold text-fb-textSecondary uppercase block mb-1">Default model</label>
        <input
          value={modelId}
          onChange={(e) => setModelId(e.target.value)}
          className="w-full mb-3 px-3 py-2 text-[12px] bg-fb-bg border border-fb-border rounded-lg text-fb-text focus:outline-none focus:border-fb-blue"
        />
        <label className="text-[10px] font-bold text-fb-textSecondary uppercase block mb-1">Hugging Face token</label>
        <input
          type="password"
          value={hfToken}
          onChange={(e) => setHfToken(e.target.value)}
          placeholder="hf_…"
          className="w-full px-3 py-2 text-[12px] bg-fb-bg border border-fb-border rounded-lg text-fb-text focus:outline-none focus:border-fb-blue"
        />
      </div>
    </div>
  );
}

/* ══════════════ DOCUMENTATION ══════════════ */
const DOCS = [
  ['README.md', 'What GOV.AX is, current status, and what it deliberately does not do'],
  ['docs/ACCESS-ARCHITECTURE.md', 'The formal customer / org-admin / platform-admin boundary, with DB-verified enforcement for every row'],
  ['ROADMAP.md', 'Wave-structured plan with decision gates'],
  ['BENCHMARKS.md', 'Line-by-line comparison against Credo AI, IBM watsonx, Fiddler, Cisco AI Defense, Palo Alto Prisma AIRS'],
  ['EVIDENCE-TIERS.md', 'The evidence-tier specification — the core idea of this project'],
  ['SECURITY.md', 'RLS as the security boundary, verified properties, and known limitations'],
  ['DECISIONS.md', 'Architecture decisions D1–D8 with dates and rationale'],
  ['docs/ARCHITECTURE-REFERENCE.md', 'Capability map of the unified governance reference platform'],
  ['docs/FIRST-AUDIT.md', 'Transcript template for the first real end-to-end audit'],
  ['docs/GUEST-ACCESS.md', 'How guest access works and how to remove it'],
];

const REPO = 'https://github.com/Aryanshanu/live-ai-audit-playground/blob/main/';

export function DocumentationView() {
  const tiers = ['heuristic_text', 'verified_data', 'local_inference', 'live_dynamic_test'];
  return (
    <div className="space-y-4 max-w-3xl">
      <div className="p-4 bg-fb-card border border-fb-border rounded-xl">
        <h3 className="text-xs font-bold text-fb-text flex items-center gap-1.5 mb-2">
          <BookOpen size={13} className="text-fb-blue" /> Evidence tiers
        </h3>
        <p className="text-[10px] text-fb-textSecondary mb-2.5">
          Every finding in GOV.AX carries one of these, shown wherever the finding appears.
        </p>
        <div className="space-y-1.5">
          {tiers.map((t) => {
            const tier = getEvidenceTier(t);
            return (
              <div key={t} className="flex items-start gap-2 p-2 bg-fb-bg rounded-lg">
                <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full border shrink-0 ${tier.badgeClass}`}>
                  {tier.shortLabel}
                </span>
                <p className="text-[10px] text-fb-textSecondary">{tier.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-fb-card border border-fb-border rounded-xl">
        <h3 className="text-xs font-bold text-fb-text mb-2">Project documentation</h3>
        <div className="space-y-1">
          {DOCS.map(([file, desc]) => (
            <a
              key={file}
              href={REPO + file}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start justify-between gap-3 p-2 rounded-lg hover:bg-fb-bg group"
            >
              <div className="min-w-0">
                <p className="text-[11px] font-mono text-fb-blue group-hover:underline">{file}</p>
                <p className="text-[10px] text-fb-textSecondary">{desc}</p>
              </div>
              <ExternalLink size={11} className="text-fb-textSecondary shrink-0 mt-0.5" />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
