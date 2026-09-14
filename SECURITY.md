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

## Known limitations, stated plainly

- **Hash-chaining detects tampering; it does not prevent it.** Someone with full database access can rewrite the entire chain consistently. Prevention requires anchoring periodic Merkle roots outside the operator's control — not built, not claimed.
- **The audit-log hash chain is global across tenants by design.** Each row chains to the immediately preceding row regardless of org, which is what stops an org admin from rewriting their own history in isolation. The cost is that integrity verification inherently walks all tenants' rows, so `verify_audit_log_integrity()` is restricted to org owners/admins.
- **The client-side `AuthGate` is UX, not security.** This is a static export with no middleware. RLS is what actually enforces access control.

## Reporting

Open a GitHub issue. This is not a commercially supported product and there is no security SLA — see [BENCHMARKS.md](BENCHMARKS.md) for an honest comparison against vendors that do offer one.
