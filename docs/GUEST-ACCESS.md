# Guest Access — Temporary, and How to Remove It

Guest access exists so the product can be explored end-to-end without creating an account. It is **intended to be removed**.

## How it works

It uses Supabase's **native anonymous sign-in**, not a client-side bypass. A guest gets a real `auth.users` row, a real JWT, and their own isolated personal org — RLS applies to them in full, exactly as it does to any signed-up user.

This distinction matters. A fake "pretend we're logged in" client flag would bypass the security model entirely and would be genuinely dangerous to leave in a repo. This isn't that.

Guests are labelled: `is_anonymous` is true on the session, their org is named "Guest Workspace", and a persistent amber banner shows in the app.

## ⚠️ Required before the button works

**Supabase Dashboard → Authentication → Sign In / Providers → "Allow anonymous sign-ins" → ON.**

Direct link: `https://supabase.com/dashboard/project/ceppqcqgwietagzixrhr/auth/providers`

This is OFF by default. Until it's enabled, the button shows in-app setup instructions rather than a raw API error.

## Prerequisite

**Supabase Dashboard → Authentication → Sign In / Providers → "Allow anonymous sign-ins"** must be enabled. It is off by default. Until it's on, the guest button returns a clear error telling you exactly this.

## Why you should remove it

- Every guest session creates a permanent `auth.users` row plus an org. On a public deployment these accumulate indefinitely.
- Anonymous users are a known abuse vector for rate-limit and quota exhaustion.
- It weakens the "every audit is attributable to a real accountable user" property that a governance tool ideally wants.

## Removal — 4 steps

1. **Supabase Dashboard** → Authentication → Sign In / Providers → turn **off** "Allow anonymous sign-ins". This alone disables it immediately, regardless of the frontend code.
2. Delete the guest button block in `src/components/auth/AuthForm.jsx` (marked `TEMPORARY`).
3. Delete `signInAsGuest` and `isGuestSession` from `src/lib/supabase/auth.js`, and the guest banner block in `src/components/auth/AuthGate.jsx` (also marked `TEMPORARY`).
4. Clean up accumulated guest data:

```sql
-- Review first
select count(*) from auth.users where is_anonymous = true;

-- Then delete. org_members/organizations/profiles cascade from auth.users.
delete from auth.users where is_anonymous = true;
```

Note that `audit_log` rows are **append-only and will not cascade** — that is deliberate, and correct. Guest activity remains in the immutable log with its `actor_id`, which is the whole point of an immutable log.
