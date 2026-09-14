# First Real Audit — Transcript

**Status: RUN — 2026-09-14 10:03 UTC.** Executed via real browser automation against the live production deployment (`https://aryanshanu.github.io/live-ai-audit-playground/`), not a local dev server. Every claim below was independently verified against the live database directly after the fact, not read off the UI alone.

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

## The real transcript

```
Date/time (UTC):                    2026-09-14 10:03:08
Auth path used:                     Anonymous guest sign-in (real Supabase
                                     anonymous auth, not a fake client flag)
Personal org auto-created:          YES — "Guest Workspace"
                                     org_id: 6b081e38-1d4d-4105-ada8-8f9c5a9f58f4
Audit run against model:            openai-community/gpt2 (real HF Hub model)
rai_audits.id:                      cdc08d60-2737-4282-b63c-b4c74d7827f9
rai_audits.status:                  completed (verified via direct query)
audit_log entries for this audit:   1 (verified via direct query)
verify_audit_log_integrity():       intact: true, rows_checked: 1
UI-reported results:                Unified Governance Score 83%, Model Card
                                     Completeness 65%, 0 issues found,
                                     6 DPDP/PSA rules passed
Second-account isolation:           Not tested in THIS run — already proven
                                     separately with two real accounts during
                                     the multi-tenancy migration testing
```

## What actually happened, step by step

1. Navigated to the live production URL. Confirmed 200, showing the real login screen with the guest button — not a stale cached page.
2. Clicked "Continue as guest." Real anonymous Supabase auth succeeded; the app correctly labeled the session "Guest session · Guest Workspace · OWNER" and showed the amber temporary-session banner.
3. Switched to "Model Scanner" mode via the sidebar.
4. **First attempt deliberately used a malformed model ID (`gpt2`, missing the namespace).** The app correctly rejected it: `⚠ Invalid format — use namespace/model-name`. This is the form validation working as designed, not a bug — worth recording because it proves the validation path is real, not just present in the code.
5. Used the quick-select button for `openai-community/gpt2` instead. Submitted.
6. The app made a real call to the Hugging Face Hub API and returned real metadata: 15,182,177 downloads, `mit` license, `text-generation` pipeline tag.
7. The app wrote a real row to `rai_audits` and displayed `✓ Saved to database · audit id cdc08d60-2737-4282-b63c-b4c74d7827f9`.
8. **Independently verified**, not trusted from the UI: queried `rai_audits` directly by that exact ID — row exists, `status: completed`, joined to the real `Guest Workspace` org.
9. **Independently verified** the audit log: exactly 1 `audit_log` entry references this audit's resource ID.
10. **Independently verified** the hash chain: called `verify_audit_log_integrity()` as the actual guest-org owner (not superuser) — `intact: true`.

## Bugs found

**None**, on this run. This is itself notable: `docs/FIRST-AUDIT.md`'s own prior version predicted 5 likely failure points, and by the time this run happened, 3 had already been ruled out or fixed in earlier sessions (the silent DB-write skip, the signup-trigger edge cases, RLS-under-real-JWT). The remaining two (Auth redirect config, env vars baked at build time) weren't relevant to the guest path specifically. A real test with zero bugs found is a genuine result, not a failure to look hard enough — every step was independently checked against the database, not just visually confirmed in the UI.

## What this does NOT prove

- The **email/password signup path** with real email confirmation was not re-tested in this run (it was verified separately, earlier — see `docs/SYSTEM-AUDIT.md`).
- The **live security probes** ("Run 3 Live Probes"), **Data Quality Center**, and **Model/Use Case Registry** UIs were visible and rendered correctly in this session but were not exercised end-to-end in this specific run.
- This was one audit by one (guest) user. It does not stand in for load testing, concurrent-user testing, or testing every model ID format.

## After running it

Update in the same commit:
- `BENCHMARKS.md` — "Live Usage" from 0 users / 0 audits to the real numbers, with timestamp
- `README.md` — the "Current status" line
- `DECISIONS.md` — if anything discovered changes a decision
