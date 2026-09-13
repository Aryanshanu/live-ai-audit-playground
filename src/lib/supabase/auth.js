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
export function useRoles(userId) {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setRoles([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .then(({ data, error }) => {
        if (cancelled) return;
        setRoles(error || !data?.length ? ['viewer'] : data.map((r) => r.role));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { roles, loading, isAdmin: roles.includes('admin'), isAuditor: roles.includes('auditor') };
}
