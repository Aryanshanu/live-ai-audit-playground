# Access Architecture Specification

**Status:** Normative. Every row in the matrix below has a corresponding, tested RLS policy or database trigger — this document describes what the schema already enforces, not aspirational design.

## The governing principle

**A frontend distinction is a convenience. A backend distinction is the access control.** Every boundary in this document that matters for security is enforced by Postgres Row Level Security or a trigger, independent of what the UI shows. A button hidden from a non-admin's screen is not access control if the underlying table would still accept their write — that is the specific failure mode this specification exists to prevent, and every claim below was verified by creating a real second user and attempting the disallowed action before being documented.

## The three tiers

| Tier | Who | Granted by | Scope |
|---|---|---|---|
| **Customer** | Any authenticated member of an organization (`owner`, `admin`, `auditor`, `viewer`, `external_auditor` in `org_members`) | Signup (auto-owner of a personal org) or an invite from an org admin | Their own organization's data only |
| **Org Admin** | `owner` or `admin` role within a specific organization | Assigned via `org_members.role`, changeable only by an existing owner/admin of that org | Same org as Customer, plus governance-relevant fields within it |
| **Platform Admin** | An email pre-seeded in `platform_admins` | Manually, by whoever controls the database — not self-service, and not grantable by an org admin | **Read-only** across every organization |

Platform Admin is deliberately the narrowest-privilege tier in write terms, not the broadest: it can see everything, change nothing outside its own org. See [SECURITY.md](../SECURITY.md) for why, and the honest tradeoff this represents in a shared multi-tenant deployment.

## Capability matrix

Every real capability in the system, its tier, and where the boundary actually lives.

| Capability | Customer | Org Admin | Platform Admin | Enforcement |
|---|---|---|---|---|
| Run a Sandbox / Model Scanner audit | ✅ | ✅ | 👁️ read-only | Frontend-only (no write, nothing to restrict) |
| Persist an audit to `rai_audits` | ✅ (own org) | ✅ | 👁️ read-only | RLS: `org_id in user_org_ids()` |
| Run a live security probe (Fairness/Safety/Privacy/Pentesting) | ✅ | ✅ | 👁️ | Frontend-only — calls HF directly with the user's own token, never touches GOV.AX's database as a write |
| Analyze a CSV in Data Quality Center | ✅ | ✅ | 👁️ | Frontend-only computation |
| Persist a `dq_runs` record | ✅ (own org) | ✅ | 👁️ | RLS: insert requires `org_id` membership |
| **Define a `dq_rules` threshold** | ❌ | ✅ | ❌ (no cross-org write) | **RLS: insert/update/delete require `owner`/`admin` role** — verified: a `viewer`-role user's rule-creation attempt was rejected by the database |
| Register a model or use case | ✅ | ✅ | ❌ (no cross-org write) | RLS: insert requires org membership only — this is deliberately open, registration is investigative/submission work |
| **Change a model's `risk_tier` or `lifecycle_stage`** | ❌ | ✅ | ❌ | **Trigger** (`enforce_model_governance_fields`) blocks the specific columns for non-admins while still allowing them to edit `description` — column-level, not row-level, restriction |
| **Change a use case's `risk_tier`** | ❌ | ✅ | ❌ | Trigger (`enforce_use_case_governance_fields`), same pattern |
| View compliance mappings | ✅ | ✅ | 👁️ (all orgs) | Frontend-only — derived from static rule exports, not a table |
| View/append the audit log | ✅ view+append own org | ✅ | 👁️ (all orgs) | RLS. No UPDATE/DELETE policy exists for **anyone**, including platform admin |
| Verify audit-log hash-chain integrity | ❌ | ✅ | ❌ (not currently granted cross-org) | RPC restricted to `authenticated` users who hold `owner`/`admin` in some org — see the function body |
| Invite / change roles of org members | ❌ | ✅ (own org) | ❌ | RLS: insert/update/delete on `org_members` require `owner`/`admin` |
| Read another organization's data | ❌ | ❌ | ✅ **read-only** | RLS: explicit `is_platform_admin()` SELECT-only policies per table — no matching INSERT/UPDATE/DELETE policy exists on any of them |
| Grant/revoke Platform Admin status | ❌ | ❌ | ❌ (not self-service) | `platform_admins` is a plain table with no INSERT/UPDATE/DELETE RLS policy for anyone — changed only via direct database access |

## What lives in the frontend vs the backend, and why

**Frontend-only, by design — no database write to secure:**
- All heuristic keyword matching (`auditEngine.js`) — pure client-side text analysis
- All live HF probes (fairness/safety/privacy/pentesting) — the browser calls `router.huggingface.co` directly with the user's own token; GOV.AX's server (there isn't one) never sees the traffic
- The in-browser zero-shot classifier — WASM inference, no network call after the model caches
- CSV parsing and the disparate-impact computation itself — the file never leaves the browser; only the *result* is persisted

**Backend-enforced — because the customer/admin distinction is meaningless without a boundary that survives someone inspecting network requests and calling the API directly:**
- Every RLS policy and trigger in the matrix above
- The immutable audit log (no policy path to UPDATE/DELETE exists — not "hidden," structurally absent)
- Governance-field changes on `models`/`use_cases` (the trigger inspects which columns changed, not just who's asking)

**The test this document is held to:** for every ❌ in the matrix, a real second user was created and the disallowed action was attempted through the actual RLS-constrained connection — not asserted from reading policy text. See the migration commit for the specific test transcripts.

## What is explicitly out of scope for this specification

- **The Python analysis service** (`services/rai-agent/`) has its own, simpler model: it holds a Supabase *service-role* key that bypasses RLS entirely, because it is the one component trusted to write results on a user's behalf. It is not deployed, so this is documented for when it is, not describing live behavior.
- **Rate limiting and abuse prevention** are not implemented at any tier. A customer-tier user can call any customer-tier capability as many times as their own HF/GitHub credentials allow.
