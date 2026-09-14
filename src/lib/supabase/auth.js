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

/**
 * Guest / anonymous sign-in.
 *
 * Uses Supabase's NATIVE anonymous sign-in, which creates a real auth
 * user with a real JWT — so RLS applies in full and a guest is isolated
 * in their own org exactly like any other user. This is deliberately NOT
 * a fake client-side "pretend we're logged in" flag, which would bypass
 * the security model entirely and be genuinely dangerous to leave in.
 *
 * REQUIRES: Supabase Dashboard → Authentication → Sign In / Providers →
 * "Allow anonymous sign-ins" must be enabled. It is OFF by default.
 *
 * TEMPORARY — see docs/GUEST-ACCESS.md for the one-step removal.
 * Anonymous users accumulate in auth.users and each gets an org, so this
 * should not be left enabled indefinitely on a public deployment.
 */
export async function signInAsGuest() {
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    if (error.message?.toLowerCase().includes('disabled') || error.status === 422) {
      throw new Error('Anonymous sign-ins are disabled. Enable them in Supabase Dashboard → Authentication → Sign In / Providers → "Allow anonymous sign-ins".');
    }
    throw error;
  }
  return data;
}

/**
 * Google OAuth sign-in.
 *
 * REQUIRES two configuration steps that cannot be done from this repo:
 *  1. Google Cloud Console → create OAuth 2.0 credentials, and add
 *     https://ceppqcqgwietagzixrhr.supabase.co/auth/v1/callback
 *     as an Authorized redirect URI.
 *  2. Supabase Dashboard → Authentication → Sign In / Providers → Google
 *     → enable, paste the Client ID and Client Secret.
 *
 * redirectTo must point back at this app INCLUDING its base path, since
 * this is a static export served under /live-ai-audit-playground.
 */
export async function signInWithGoogle() {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: typeof window !== 'undefined' ? window.location.origin + window.location.pathname : undefined },
  });
  if (error) throw error;
  return data;
}

/** True if the current session is an anonymous/guest session. */
export function isGuestSession(session) {
  return Boolean(session?.user?.is_anonymous);
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
