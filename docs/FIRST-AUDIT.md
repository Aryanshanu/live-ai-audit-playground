# First Real Audit — Transcript

**Status: NOT YET RUN.** This file is a template, deliberately committed empty rather than pre-filled, so that the gap it represents stays visible.

## Why this file matters more than a feature

`BENCHMARKS.md` reports **0 users, 0 audits** — the single most damaging fact in the competitive comparison. Not because the code is weak, but because a governance platform nobody has ever run is an untested claim.

The database layer *has* now been exercised directly via SQL: immutability proven, tamper-detection proven, cross-tenant isolation proven with two real users. **But the app path has never been executed by a human in a real browser.** Those are different claims, and only the second one closes this gap.

## The path to test

```
AuthGate → AuthForm → signup → email confirmation → session created
        → personal org auto-created by trigger (verify it exists!)
        → HF Model Scanner → run an audit
        → persistAuditToDb → rai_audits row (with org_id)
        → audit_log row (hash-chained)
        → sign out, sign up a SECOND account, confirm it cannot see the first's audit
```

## Likely failure points

Paths never executed by a human usually break at least once. Most probable, in rough order:

1. **Supabase Auth email confirmation redirect** — the redirect URL must be configured in the Supabase dashboard to match the GitHub Pages base path (`/live-ai-audit-playground`). This is the single most likely failure.
2. **`activeOrgId` is null on first render** — `useOrgMembership` fetches asynchronously; if an audit is submitted before it resolves, `persistAuditToDb` throws its "no organization" error. May need a loading guard.
3. **The signup trigger failing silently** — if `private.handle_new_user()` errors, signup may appear to succeed while no profile/org exists.
4. **`NEXT_PUBLIC_*` vars baked at build time** — this is a static export; env changes require a rebuild, not just a restart.
5. **RLS passing in the SQL editor but failing under a real JWT** — already mitigated by testing under real `authenticated` context, but the app sends a real token, which is different again.

## Fill this in when you run it

```
Date/time (IST):
Signup email used:
Email confirmation received:        yes / no
Personal org auto-created:          yes / no    org_id:
Audit run against model:
rai_audits.id:
audit_log.id:
verify_audit_log_integrity():       intact / broken
Second account could see first's audit?   (expected: NO)

Bugs found:
1.
2.

Fixes applied (commit SHAs):
```

## After running it

Update in the same commit:
- `BENCHMARKS.md` — "Live Usage" from 0 users / 0 audits to the real numbers, with timestamp
- `README.md` — the "Current status" line
- `DECISIONS.md` — if anything discovered changes a decision
