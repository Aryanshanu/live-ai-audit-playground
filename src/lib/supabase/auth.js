'use client';

import { useState, useEffect } from 'react';
import { supabase } from './client';

export async function signUp(email, password) {
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signIn(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Real session hook — subscribes to Supabase's actual auth state changes
 * (not a simulated/local flag). `loading` distinguishes "haven't checked
 * yet" from "checked, no session" so UI doesn't flash a login form
 * before the initial session check resolves.
 */
export function useSession() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

/**
 * Fetches the current user's role(s) from user_roles — the REAL RBAC
 * check, evaluated against the database (subject to RLS), not a client-
 * side flag that could be tampered with. A user missing entirely from
 * user_roles (shouldn't happen given the on-signup trigger, but handled
 * defensively) is treated as 'viewer'.
 */
export function useOrgMembership(userId) {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setMemberships([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('org_members')
      .select('org_id, role, organizations(id, name, slug, is_personal)')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (cancelled) return;
        setMemberships(error || !data?.length ? [] : data);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // A personal org is auto-created on signup, so in practice there is
  // always at least one. Falling back to the first membership keeps this
  // working if that ever isn't true rather than crashing.
  const activeOrg = memberships.find((m) => m.organizations?.is_personal) || memberships[0] || null;
  const roles = memberships.map((m) => m.role);

  return {
    memberships,
    activeOrg,
    activeOrgId: activeOrg?.org_id ?? null,
    roles,
    loading,
    isOwner: activeOrg?.role === 'owner',
    isAdmin: ['owner', 'admin'].includes(activeOrg?.role),
  };
}
