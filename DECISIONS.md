# Decisions Log

Decisions that shape architecture, with dates and rationale. Superseded decisions stay visible rather than being deleted.

| ID | Decision | Status | Date |
|---|---|---|---|
| D1 | Python service hosting | ⚠️ **Pending owner commitment** | — |
| D2 | What this project is for | ⚠️ **Pending owner decision** | — |
| D3 | Multi-tenancy before first real user | ✅ **Done** | 2026-09-14 |
| D4 | Inline firewall deferred | ✅ Decided | 2026-09-14 |
| D5 | Regulation-as-code deferred | ✅ Decided | 2026-09-14 |
| D6 | MLflow dropped | ✅ Decided | 2026-09-14 |
| D7 | Hosting region must be Mumbai | ✅ Decided (twice) | 2026-09-13 |
| D8 | Roadmap vocabulary: Waves, not Phases | ✅ Decided | 2026-09-14 |

---

### D1 — Python service hosting ⚠️ PENDING
**Rule agreed:** if a host can be provisioned this week, deploy the 3 existing endpoints and continue building. If not, **freeze `services/rai-agent/` at 3 endpoints**, mark them unreachable in README/BENCHMARKS, and redirect effort elsewhere.

**Not yet committed.** Three tested endpoints (ModelScan, Fairlearn, SHAP) remain unreachable. Standing rule until resolved: **do not build endpoint #4 until endpoint #1 is reachable from a public URL.** An unreachable endpoint inflates apparent capability without adding usable capability.

### D2 — What this project is for ⚠️ PENDING
Options: portfolio piece · real open-source product · startup foundation.

**Recommended** (by strategic review, *not yet confirmed by the owner*): real open-source product with a portfolio-grade public surface, not a startup foundation yet. The rationale: a real product with 1 real user and honest benchmarks is credible; a startup foundation with 0 users and 15 speculative features is not.

This is deliberately **not** written into the README as a purpose statement until the owner states it directly. Claiming someone's intent on their behalf is exactly the kind of unverified assertion this project exists to avoid.

### D3 — Multi-tenancy before the first real user ✅ DONE 2026-09-14
Executed at 0 users / 0 rows (verified immediately before migrating). Added `organizations` + `org_members`, `org_id` on `rai_audits` and `audit_log`, rewrote every RLS policy from `created_by = auth.uid()` to org-scoped, moved roles from a global `user_roles` table to per-org `org_members` (dropped the old table — two sources of truth for authorization is worse than one), and auto-create a personal org on signup.

**Proven, not assumed:** two real users created, each with a personal org; confirmed Bob cannot read Alice's audits (0 visible), cannot read her audit-log rows, cannot write into her org, while Alice still sees her own. All six isolation checks passed under real `authenticated` JWT context, not service role.

Rationale for doing it now: clean migration at 0 rows; with 50 users it is a live migration of every RLS policy with no ability to pause the product.

### D4 — Inline firewall deferred ✅
GOV.AX audits models; it does not sit in anyone's request path. A firewall being down means the customer's app is down — a fundamentally different trust contract. **Gated on a real demand signal** plus sustained real usage. If built, SDK-first (an SDK does not put us in the reliability path the way a proxy does).

### D5 — Regulation-as-code deferred ✅
A governance tool giving wrong compliance answers is worse than no tool: it produces false confidence, which is a liability, not a feature. Credo AI's moat here is a legal team. **Gated on recruiting a real reviewer.** Until then: link to official sources (EUR-Lex, NIST) and let users map manually.

### D6 — MLflow dropped ✅
MLflow's value is experiment tracking and model packaging — adjacent to governance, not the same thing. `githubRegistry.js` already covers the governance-relevant part (real commits, real provenance). If a real user asks, ship an export adapter rather than take on the dependency.

### D7 — Hosting region must be Mumbai ✅
`ai.gov-prod` runs in AWS `ap-south-1` (Mumbai). Any compute writing to it should be co-located.

**This decision has now been threatened twice by well-meaning generic recommendations** — once suggesting Fly.io `ams` (Amsterdam), once suggesting Hetzner (which has **no India datacenter at all**: Germany, Finland, US, Singapore only) as the default Coolify host. Both would have silently added cross-continent latency to every database write. Verified correct answer: **Vultr, Mumbai region**. Do not change without re-checking the live Supabase project region first.

### D8 — Roadmap vocabulary: Waves ✅
Two competing naming schemes (Phases and Waves) in one repo is a maintenance tax. Waves win — they map to decision gates, not just build order.
