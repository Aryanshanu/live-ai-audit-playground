# Security

## The Supabase anon key is public by design

The anon/publishable key is committed as a fallback in `src/lib/supabase/client.js`. This is intentional and safe: Supabase documents the anon key as publicly exposable, and it ships in the client bundle of every Supabase app that exists.

**The security boundary is Row Level Security, not key secrecy.** Any change to an RLS policy is therefore a security-critical change and should be reviewed as one.

## What must never be public

The **`service_role` key** bypasses RLS entirely. It belongs only in the deployment secrets of `services/rai-agent/` (server-side), never in frontend code, any committed file, or any `NEXT_PUBLIC_*` variable.

## Verified security properties

Each of these was tested, not inferred from reading policy definitions:

| Property | How it was verified |
|---|---|
| Audit log is append-only | Real authenticated user created; INSERT succeeded, UPDATE and DELETE both affected 0 rows |
| Tampering is detectable | A middle row was altered **as superuser** (simulating a stolen service-role key or rogue DBA, which RLS cannot stop); `verify_audit_log_integrity()` returned `intact: false` with `first_broken_id` exactly matching the altered row |
| Cross-tenant isolation | Two real users in separate orgs; neither could read or write the other's audits or audit-log rows, while each retained access to their own |

## Platform admins — a deliberate weakening of tenant isolation

A `platform_admins` table grants named emails **read-only** access across every organization. This directly weakens the cross-tenant isolation proven above, and that tradeoff is stated rather than hidden:

- For a **self-hosted, single-operator** deployment (the primary intended use) this is correct — it's your database, and you'd have `psql` access regardless.
- For a **shared multi-tenant** instance it means the operator can read every tenant's data. Under DPDP/GDPR that is a disclosable fact, not an implementation detail.

Mitigations actually applied, not just intended:

| Mitigation | Verified |
|---|---|
| Read-only — no cross-org INSERT/UPDATE/DELETE policies exist | ✅ Tested: admin write into another org was rejected |
| Auto-elevation is recorded in the immutable audit log | ✅ `platform_admin.auto_elevated` written at signup |
| Keyed by email in a table, not hardcoded in policies | ✅ Revocable with one `DELETE` |
| Guests and normal users are never elevated | ✅ Tested for both |

Revoke with:
```sql
delete from public.platform_admins where email = 'someone@example.com';
```

## Why the security advisor now shows many "anonymous access" warnings

Enabling guest sign-in (see GUEST-ACCESS.md) makes the advisor flag most org-scoped tables as reachable by `anon`. This is the expected shape of that feature, not a new hole: Supabase's anonymous sign-in issues a real `authenticated`-role JWT for a real, isolated `auth.users` row with its own personal org — a guest is just another org member under RLS, not an unauthenticated bypass. Verified by test (see the multi-tenancy isolation checks) that a guest/any org member is still fully isolated from every other org's data. Revisit this list if guest access is ever removed per GUEST-ACCESS.md's own removal steps.

## Known limitations, stated plainly

- **Hash-chaining detects tampering; it does not prevent it.** Someone with full database access can rewrite the entire chain consistently. Prevention requires anchoring periodic Merkle roots outside the operator's control — not built, not claimed.
- **The audit-log hash chain is global across tenants by design.** Each row chains to the immediately preceding row regardless of org, which is what stops an org admin from rewriting their own history in isolation. The cost is that integrity verification inherently walks all tenants' rows, so `verify_audit_log_integrity()` is restricted to org owners/admins.
- **Leaked-password protection is currently disabled.** Supabase can check passwords against HaveIBeenPwned; enable it in Dashboard → Authentication → Password settings. Flagged by the security advisor 2026-09-14.
- **The client-side `AuthGate` is UX, not security.** This is a static export with no middleware. RLS is what actually enforces access control.

## Reporting

Open a GitHub issue. This is not a commercially supported product and there is no security SLA — see [BENCHMARKS.md](BENCHMARKS.md) for an honest comparison against vendors that do offer one.
