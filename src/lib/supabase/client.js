'use client';

import { createClient } from '@supabase/supabase-js';

/**
 * The Supabase anon/publishable key is DESIGNED to be public — it ships
 * in every client bundle of every Supabase app that exists. The actual
 * security boundary is Postgres RLS (verified with zero advisor findings
 * on this project), not keeping this key secret. Falls back to env vars
 * if set, so this can still be overridden per-environment without a
 * code change.
 *
 * NOTE: this project has no TypeScript toolchain (no tsconfig.json, no
 * `typescript` dependency) — database.types.ts in this same folder is
 * kept as a reference artifact for whoever adds TS later, but isn't
 * imported here to avoid introducing a new build requirement for one file.
 */
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ceppqcqgwietagzixrhr.supabase.co';
const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'sb_publishable__5IxXALo3IOiF5q3AB5GGQ_g7FIuktu';

// Singleton — avoids creating a new client (and duplicate auth listeners)
// on every import across the app.
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
