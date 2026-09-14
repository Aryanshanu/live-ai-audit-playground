'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Workflow, Cpu, Scale, Eye, ShieldCheck, Lock, Activity,
  Database, Boxes, FileCheck, Users, Sun, Moon, PanelLeftClose, PanelLeft,
  History, Crosshair, Settings as SettingsIcon, BookOpen,
} from 'lucide-react';
import { useSession, useOrgMembership, signOut, isGuestSession } from '../lib/supabase/auth';
import { NAV_STATUS } from '../lib/navigation';

/**
 * Application shell.
 *
 * Layout follows the format captured in docs/ARCHITECTURE-REFERENCE.md:
 * a persistent collapsible sidebar with uppercase-grouped sections, a page
 * banner carrying an h1 title + subtitle + contextual actions, the content
 * region, and a version footer. That shape is a good answer to navigating a
 * platform with many destinations, which a top pill-switcher cannot scale to.
 *
 * Branding, colour, copy and status semantics are GOV.AX's own.
 *
 * The status dot on each nav item is deliberate: it shows whether a
 * destination is actually built. A sidebar where a working page and an
 * empty stub look identical overstates the product by layout alone.
 */

const ShellContext = createContext(null);
export const useShell = () => useContext(ShellContext);

export const VIEWS = [
  { section: null, items: [
    { id: 'command_center', label: 'Command Center', icon: LayoutDashboard, status: 'live',
      title: 'Command Center', subtitle: 'Live platform status, audit trail, and governance inventory' },
  ]},
  { section: 'AUDIT', items: [
    { id: 'sandbox', label: 'Architecture Sandbox', icon: Workflow, status: 'live',
      title: 'Architecture Sandbox', subtitle: 'Free-text governance audit across RAI, Security, Data Quality, and Legal' },
    { id: 'hf_model', label: 'Model Scanner', icon: Cpu, status: 'live',
      title: 'Hugging Face Model Scanner', subtitle: 'Verified metadata audit and live adversarial probing against a real model' },
    { id: 'audit_center', label: 'Audit Center', icon: History, status: 'live',
      title: 'Audit Center', subtitle: 'Every persisted audit, database-backed and organization-scoped' },
  ]},
  { section: 'RESPONSIBLE AI', items: [
    { id: 'fairness', label: 'Fairness', icon: Scale, status: 'live',
      title: 'Fairness', subtitle: 'Disparate impact and the four-fifths rule, computed on real uploaded data' },
    { id: 'transparency', label: 'Transparency', icon: Eye, status: 'partial',
      title: 'Transparency', subtitle: 'Model card completeness against the Model Cards standard' },
    { id: 'safety', label: 'Safety', icon: ShieldCheck, status: 'live',
      title: 'Safety', subtitle: 'Jailbreak resistance and content-moderation integrity, tested live' },
    { id: 'privacy', label: 'Privacy', icon: Lock, status: 'live',
      title: 'Privacy', subtitle: 'PII detection across uploaded datasets and live model output' },
  ]},
  { section: 'SECURITY', items: [
    { id: 'threat_modeling', label: 'Threat Modeling', icon: Crosshair, status: 'live',
      title: 'Threat Modeling', subtitle: 'Attack narrative chained from your most recent Sandbox findings' },
    { id: 'pentesting', label: 'AI Pentesting', icon: ShieldCheck, status: 'live',
      title: 'AI Pentesting', subtitle: 'Prompt injection, system-prompt extraction, and role override against a live model' },
    { id: 'attack_library', label: 'Attack Library', icon: Boxes, status: 'schema',
      title: 'Attack Library', subtitle: 'Adversarial probes stored as extensible data rather than hardcoded constants. AI Pentesting still reads the hardcoded set — this table is not wired into the runtime yet.' },
  ]},
  { section: 'DATA', items: [
    { id: 'data_quality', label: 'Data Quality', icon: Database, status: 'live',
      title: 'Data Quality Center', subtitle: 'Analyze real datasets, define org-wide rules, and browse persisted history' },
  ]},
  { section: 'REGISTRIES', items: [
    { id: 'model_registry', label: 'Model Registry', icon: Boxes, status: 'live',
      title: 'Model Registry', subtitle: 'Register models; risk-tier changes require an org owner or admin' },
    { id: 'use_case_registry', label: 'Use Case Registry', icon: FileCheck, status: 'live',
      title: 'Use Case Registry', subtitle: 'A model is governed by what it is used for, not only by what it is' },
  ]},
  { section: 'ADMIN', items: [
    { id: 'system_check', label: 'System Check', icon: Activity, status: 'live',
      title: 'System Check', subtitle: 'Diagnoses every dependency of the signup → audit → database path' },
    { id: 'user_management', label: 'User Management', icon: Users, status: 'schema',
      title: 'User Management', subtitle: 'Organization members and per-organization roles' },
    { id: 'settings', label: 'Settings', icon: SettingsIcon, status: 'live',
      title: 'Settings', subtitle: 'Account, organization, and inference credentials' },
    { id: 'documentation', label: 'Documentation', icon: BookOpen, status: 'live',
      title: 'Documentation', subtitle: 'The evidence-tier spec and every project document' },
  ]},
];

export function findView(id) {
  for (const s of VIEWS) {
    const hit = s.items.find((i) => i.id === id);
    if (hit) return hit;
  }
  return VIEWS[0].items[0];
}

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('govax_theme');
    const prefers = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    const isDark = stored ? stored === 'dark' : Boolean(prefers);
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    try { window.localStorage.setItem('govax_theme', next ? 'dark' : 'light'); } catch { /* private mode */ }
  };

  return (
    <button
      onClick={toggle}
      title="Toggle theme"
      className="p-1.5 rounded-lg border border-fb-border hover:bg-fb-bg text-fb-textSecondary hover:text-fb-text cursor-pointer"
    >
      {dark ? <Sun size={14} /> : <Moon size={14} />}
    </button>
  );
}

export default function AppShell({ activeView, onNavigate, headerActions, children }) {
  const [collapsed, setCollapsed] = useState(false);
  const { session, user } = useSession();
  const { activeOrg, loading: orgLoading } = useOrgMembership(user?.id);
  const guest = isGuestSession(session);
  const view = findView(activeView);

  return (
    <ShellContext.Provider value={{ activeView, onNavigate }}>
      <div className="min-h-screen bg-fb-bg text-fb-text font-sans flex">
        {/* ── Sidebar ── */}
        <aside
          className={`${collapsed ? 'w-[64px]' : 'w-[248px]'} shrink-0 bg-fb-card border-r border-fb-border flex flex-col transition-[width] duration-200 sticky top-0 h-screen`}
        >
          <div className="px-3 py-3.5 border-b border-fb-border flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-fb-blue text-white grid place-items-center font-black text-sm shrink-0">
              G
            </div>
            {!collapsed && (
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-fb-text leading-tight truncate">GOV.AX</p>
                <p className="text-[9px] text-fb-textSecondary truncate">
                  {guest ? 'Guest' : orgLoading ? '…' : (activeOrg?.organizations?.name ?? 'Workspace')}
                </p>
              </div>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
            {VIEWS.map((sec, si) => (
              <div key={si}>
                {sec.section && !collapsed && (
                  <p className="text-[9px] font-bold text-fb-textSecondary uppercase tracking-widest px-2 mt-3 mb-1">
                    {sec.section}
                  </p>
                )}
                {sec.section && collapsed && <div className="h-px bg-fb-border my-2 mx-1" />}
                {sec.items.map((item) => {
                  const active = item.id === activeView;
                  const st = NAV_STATUS[item.status];
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      title={collapsed ? item.label : undefined}
                      className={`w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left cursor-pointer relative ${
                        active ? 'bg-fb-blueLight text-fb-blue font-semibold' : 'text-fb-text hover:bg-fb-bg'
                      }`}
                    >
                      <item.icon size={15} className="shrink-0" />
                      {!collapsed && (
                        <>
                          <span className="text-[12px] truncate flex-1">{item.label}</span>
                          {item.status !== 'live' && (
                            <span
                              title={st.label}
                              className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                item.status === 'partial' ? 'bg-fb-amber' : item.status === 'schema' ? 'bg-purple-500' : 'bg-gray-400'
                              }`}
                            />
                          )}
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </nav>

          <button
            onClick={() => setCollapsed((c) => !c)}
            className="border-t border-fb-border px-3 py-2 flex items-center gap-2 text-[11px] text-fb-textSecondary hover:text-fb-text cursor-pointer"
          >
            {collapsed ? <PanelLeft size={14} /> : <><PanelLeftClose size={14} /> Collapse</>}
          </button>
        </aside>

        {/* ── Main column ── */}
        <div className="flex-1 min-w-0 flex flex-col">
          {guest && (
            <div className="bg-fb-amber/15 border-b border-fb-amber/40 px-5 py-1.5 text-[11px] text-fb-text text-center">
              Exploring as a guest — a real isolated workspace, but temporary. Sign up to keep your audits.
            </div>
          )}

          <header className="bg-fb-card border-b border-fb-border px-5 py-3 flex items-start justify-between gap-4 sticky top-0 z-40">
            <div className="min-w-0">
              <h1 className="text-base font-bold text-fb-text leading-tight">{view.title}</h1>
              <p className="text-[11px] text-fb-textSecondary mt-0.5">{view.subtitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {headerActions}
              <ThemeToggle />
              {session && (
                <button
                  onClick={() => signOut()}
                  className="px-2.5 py-1.5 text-[11px] rounded-lg border border-fb-border hover:bg-fb-bg text-fb-text cursor-pointer max-w-[180px] truncate"
                  title={user?.email ?? 'Guest'}
                >
                  {guest ? 'Guest · Sign out' : `${user?.email?.split('@')[0]} · Sign out`}
                </button>
              )}
            </div>
          </header>

          <motion.main
            key={activeView}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
            className="flex-1 p-5 max-w-[1500px] w-full"
          >
            {children}
          </motion.main>

          <footer className="border-t border-fb-border px-5 py-2.5 flex items-center gap-2 text-[10px] text-fb-textSecondary">
            <div className="w-4 h-4 rounded bg-fb-blue text-white grid place-items-center font-black text-[8px]">G</div>
            <span>GOV.AX — Open-Source AI Governance Platform</span>
            <span>·</span>
            <span>Evidence-tiered</span>
          </footer>
        </div>
      </div>
    </ShellContext.Provider>
  );
}
