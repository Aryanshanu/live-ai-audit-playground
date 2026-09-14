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

## Likely failure points — three of five now ruled out or fixed

Before running this, use the **System Check** panel in the app (Sandbox mode, top of the page). It runs every dependency of this path and names the exact failure instead of failing silently.

| # | Failure point | Status |
|---|---|---|
| 1 | **Supabase Auth email confirmation redirect** — the Site URL and Redirect URLs in Supabase Dashboard → Authentication → URL Configuration must include the app's full path, including the `/live-ai-audit-playground` base path | ⚠️ **STILL THE TOP SUSPECT.** This is a dashboard setting, not code — it cannot be fixed or inspected from the repo. System Check will identify it via the "Email confirmed" row. |
| 2 | `activeOrgId` null on first render → DB write skipped | ✅ **FIXED.** It was worse than a race: the write was skipped with only a `console.warn`, so an audit that persisted *nothing* looked identical to one that succeeded. Every branch now reports its real outcome in the UI. |
| 3 | Signup trigger failing silently | ✅ **RULED OUT by direct testing.** 3 synthetic signups verified: profile created, personal org created, user is `owner`. Also tested two edge cases — two users with *identical* email local-parts get distinct slugs (a collision would have made the second signup fail outright, since `slug` is `UNIQUE`), and special characters are stripped correctly. |
| 4 | `NEXT_PUBLIC_*` baked at build time | ⚠️ Still true by design — static export. Env changes need a rebuild, not a restart. Only relevant once the Python service is deployed. |
| 5 | RLS passing as service role but failing under a real JWT | ✅ **Largely ruled out.** All RLS testing was done under real `authenticated` JWT context, not service role. The app sends a real token, which is one step further — but the policies themselves are proven. |

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
