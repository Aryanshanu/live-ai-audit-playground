# GOV.AX vs. Live Competitors — Detailed Benchmark

**As of:** 2026-09-14 (multi-tenancy landed; isolation proven with two real users)

## Decisions log (summary — full rationale in [DECISIONS.md](DECISIONS.md))

| ID | Decision | Status |
|---|---|---|
| D1 | Python service hosting | ⚠️ Pending — **no 4th endpoint until endpoint #1 is reachable** |
| D2 | What this project is for | ⚠️ Pending owner decision |
| D3 | Multi-tenancy before first user | ✅ Done 2026-09-14, isolation proven |
| D4 | Inline firewall | Deferred — demand-gated |
| D5 | Regulation-as-code | Deferred — reviewer-gated |
| D6 | MLflow | Dropped — GitHub registry covers the governance-relevant part |
| D7 | Mumbai region | ✅ Locked (threatened twice by generic recommendations) |

## Deferred, and the gate for each

| Item | Why deferred | Gate to revisit |
|---|---|---|
| Inline firewall | Different trust contract — if it's down, the customer's app is down | A real demand signal + sustained real usage |
| Regulation-as-code | Wrong compliance answers are worse than none; produces false confidence | A committed legal/policy reviewer |
| MLflow | Adjacent to governance, not the same thing | A real user asking — then an export adapter, not a dependency |
| 4th Python endpoint | Three already exist and none are reachable | Endpoint #1 live at a public URL |
**Companion to:** `ROADMAP.md` (phased plan) — this document is the reality check the roadmap is measured against.

## Methodology, stated plainly

Every GOV.AX row below is checked against the actual repository and the actual live Supabase project (`ai.gov-prod`) as of this date — not the plan, the state. Every competitor row is checked against the research already done this session (funding, acquisition status, actual product capabilities from their own materials). Where I'm inferring a competitor capability from general knowledge rather than a source pulled this session, it's marked. Nothing here is rounded up to make a number look better.

**Verified fact that frames this whole document:** the `ai.gov-prod` Supabase project has **2 registered users** and, as of 2026-09-14 10:03 UTC, **1 real audit run end-to-end through the live production UI** — executed via browser automation against `https://aryanshanu.github.io/live-ai-audit-playground/`, independently verified against the database afterward (real `rai_audits` row, real `audit_log` entry, hash-chain `intact: true`). See `docs/FIRST-AUDIT.md` for the full transcript and `docs/SYSTEM-AUDIT.md` for the system inventory. `fairness_metrics`/`explainability_reports` remain 0 rows — those depend on the still-undeployed Python service. The schema is real and advisor-verified. Nothing has used it. That gap — schema vs. live usage — is the single most important thing to hold in mind reading everything below.

---

## Corporate reality check (repeated from the roadmap, because it changes every row below)

| Entity | Status | Scale you'd actually be measured against |
|---|---|---|
| Credo AI | Independent | ~60-74 employees, ~$40M raised, ~$3.7M revenue |
| IBM watsonx.governance | Division of IBM | IBM: ~280,000 employees, ~$60B revenue |
| Fiddler AI | Independent | ~100-118 employees, ~$100M raised, Fortune 500 customers |
| "Robust Intelligence" | **Acquired by Cisco, Aug 2024** — now Cisco AI Defense | Cisco: ~90,000 employees, ~$240B market cap |
| "Protect AI" | **Acquired by Palo Alto Networks, closed Jul 2025** (~$500M+ deal) — now part of Prisma AIRS | Palo Alto Networks: ~$120B market cap |

---

## Dimension-by-dimension capability matrix

Legend: ✅ Live & real · 🟡 Partial/schema-only/limited · ❌ Absent

| Capability | GOV.AX (verified today) | Credo AI | IBM watsonx.gov | Fiddler | Cisco AI Defense | Palo Alto Prisma AIRS |
|---|---|---|---|---|---|---|
| **Bias/fairness metrics on real data** | 🟡 Client-side four-fifths math live; **real Fairlearn** (`demographic_parity_ratio`, `equalized_odds_ratio`) built & tested server-side — **not deployed** | ✅ Core product | ✅ Core product | 🟡 Secondary to observability | ❌ Not their focus | ❌ Not their focus |
| **Real explainability (SHAP/LIME)** | 🟡 Real SHAP built & tested (`/checks/explainability`, ground-truth verified) — **but the service is not deployed**, so zero rows still | 🟡 Some | 🟡 Some | ✅ Core product (their founding use case) | ❌ | ❌ |
| **Model card / registry** | 🟡 Real HF-metadata completeness scorer (`modelCardCompleteness.js`) + GitHub-backed external registry (`githubRegistry.js`, real commits). No centralized DB registry populated (0 rows in `rai_audits`) | ✅ Core product | ✅ Core product | 🟡 Secondary | ❌ | 🟡 Via AI-BOM |
| **RBAC** | ✅ Real Postgres RLS, now **per-org** and exercised with a real second account during isolation testing | ✅ | ✅ | ✅ | ✅ (Cisco-grade) | ✅ (Palo Alto-grade) |
| **Immutable audit log** | ✅ **Empirically proven**, not asserted — a real authenticated user was created and UPDATE/DELETE both confirmed blocked. Now also hash-chained: tampering by a service-role/DBA (which RLS cannot stop) was performed in a real test and the exact altered row was detected | ✅ | ✅ | 🟡 | ✅ | ✅ |
| **Live adversarial/injection testing** | ✅ Real — 4 live probes against actual models via HF inference, verified with mocked-fetch tests, "thorough scan" gives real n=3 statistical rate | ❌ Not their focus | 🟡 Some LLM risk checks | ❌ Not their focus | ✅ Core product (pioneered "AI Firewall") | 🟡 Secondary |
| **Real-time inline firewall (blocking live traffic)** | ❌ Not built | ❌ | ❌ | ❌ | ✅ **Their entire original differentiator** | 🟡 |
| **Model file supply-chain scanning (pickle/malware)** | 🟡 Real ModelScan integration built & tested (`/checks/modelscan`) — **not deployed** | ❌ | ❌ | ❌ | ❌ | ✅ **Their entire original differentiator** (ModelScan is literally their own OSS tool) |
| **Production drift/observability at scale** | ❌ Not built (Phase 3, needs Phase 1 first) | ❌ Not their focus | 🟡 Some | ✅ **Their entire original differentiator**, now "giga-scale" streaming | ❌ | ❌ |
| **Regulatory framework mapping (EU AI Act, NIST)** | 🟡 Rule `clause` fields cite regulations by name (e.g. "DPDP Act — Section 6"), but it's static text on 9 heuristic rules, not a maintained, versioned policy engine | ✅ **Core differentiator** — dedicated legal/policy team maintains this | ✅ | ❌ | ❌ | ❌ |
| **In-browser / zero-cost live ML inference** | ✅ **Nobody else on this list does this** — real transformers.js zero-shot classifier, zero token, zero server cost | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Evidence-tier transparency (is this a real test or a guess?)** | ✅ **Nobody else on this list publishes this as a first-class concept** — every finding tagged heuristic/verified/local-inference/live-dynamic | ❌ Not published as a concept | ❌ | ❌ | ❌ | ❌ |
| **Multi-tenant orgs** | ✅ **Org-scoped with proven isolation** — two real users tested; neither could read or write the other's data. Per-org roles (owner/admin/auditor/viewer/external_auditor), personal org auto-created on signup | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Stage-gate deployment approval workflows** | ❌ Not built | ✅ | ✅ **Core product** | 🟡 | 🟡 | 🟡 |
| **SIEM/enterprise security tool integration** | ❌ Not built | ❌ Not their focus | 🟡 | 🟡 | ✅ (native to Cisco Security Cloud) | ✅ (native to Prisma) |
| **Actual production usage / paying customers** | ❌ **Zero.** 0 signups, 0 audits run, ever | ✅ Real customers, ~$3.7M revenue | ✅ Massive (IBM's install base) | ✅ Fortune 500 customers | ✅ Cisco's entire enterprise base | ✅ Palo Alto's entire enterprise base |

---

## What this table actually says, without softening it

**Rows where GOV.AX is at genuine parity or ahead:** four — multi-tenant isolation (proven, not asserted), evidence-tier transparency (now published as a spec, [EVIDENCE-TIERS.md](EVIDENCE-TIERS.md)), zero-cost in-browser inference, and hash-chained tamper-evident audit logging that any signed-in auditor can independently verify without read access to log contents. Both are real, both are verified, both are architecturally interesting, and **neither is a reason a security or compliance team picks a platform.** They're good differentiators for a technical audience, not yet reasons to migrate off an incumbent.

**Rows where GOV.AX has a real foundation but zero live exercise:** RBAC, immutable audit log, model registry. The infrastructure is correct — genuinely, advisor-verified correct — but "0 users, 0 audits" means none of it has been tested against a real workflow. This is the single most fixable gap on this entire table, and it doesn't require new features — it requires *using what already exists*.

**Rows that moved from ❌ to 🟡 (built and tested, but not deployed):** real explainability (SHAP), model file supply-chain scanning (ModelScan), and server-side Fairlearn fairness metrics. All three are real, ground-truth-verified code in `services/rai-agent/`. **None of them are reachable by a user**, because the service has never been deployed — this is the honest meaning of 🟡 here, and it is a materially weaker claim than ✅.

**Rows that remain fully absent:** inline firewall, production-scale observability, multi-tenancy, stage-gate workflows, SIEM integration.

**Rows where "catching up" isn't really the right frame:** the two acquired companies' core differentiators (Cisco's inline firewall, Palo Alto's supply-chain AI-BOM) are now backed by two of the largest security companies on earth. Closing the *functional* gap (per the earlier OSS-parity analysis, genuinely 50-90% depending on which piece) doesn't close the *trust* gap — a security team choosing between "Cisco AI Defense" and "an open-source project with zero live users" is not making a decision based on feature parity.

---

## Blockers, named specifically per gap

| Gap | What's actually blocking it | Type |
|---|---|---|
| Real explainability (SHAP) | ~~Needs the Python service~~ **Built and tested.** Now blocked only on deployment (provision Vultr Mumbai VPS + install Coolify) | **Deployment, not engineering** |
| Model file scanning (ModelScan) | ~~Same~~ **Built and tested.** Same single remaining blocker: deployment | **Deployment, not engineering** |
| Production observability at scale | Needs Phase 1 to exist first, generating data to observe | **Sequencing** |
| Inline firewall | Needs an actual deployed model with real traffic to sit in front of — GOV.AX audits models, it doesn't host them | **Product-scope question**, not just engineering |
| Regulatory framework mapping (Credo AI's actual moat) | Needs *ongoing, continuous* legal/policy expertise to track law changes — this is a staffing problem forever, not a one-time build | **Structural** — no amount of engineering closes an ongoing-expertise gap |
| Zero live usage | **Resolved for the core loop.** 2 real users exist, 1 real audit has run end-to-end through the live production UI, independently verified against the database (see `docs/FIRST-AUDIT.md`). What remains is *volume*, not proof-of-concept — one real audit is not load testing or comprehensive coverage of every feature. **Partially addressed:** the audit-log path has now been exercised end-to-end with real writes during immutability/tamper testing, so the "never been exercised by anything" claim is no longer fully true of that subsystem | **Go-to-market**, not engineering |
| Multi-tenancy | Real schema migration (org-scoped RLS instead of user-scoped) — scoped in Roadmap Phase 4 | **Effort** — genuinely buildable |

---

## The honest bottom line

Two separate scores, because they answer different questions:

- **"If we finished building everything already scoped in `ROADMAP.md`, what % of competitor *functionality* would we match?"** — per the earlier analysis, realistically **60-65%** blended, higher (75-85%) on audit-time checks, lower (35-50%) on production-scale infrastructure.
- **"What % of competitor *reality* — functionality that's actually live, tested, and in front of real users — do we match today?"** — meaningfully lower than the functionality number, because two of the biggest infrastructure pieces (RBAC, audit log) that show ✅ above have never been exercised by an actual second human being. A correct system with zero users isn't the same claim as a correct system in production, even before comparing to competitors at all.

**The highest-leverage next move, based on this table, might not be new code.** It might be: get the existing Supabase auth flow actually smoke-tested with a real second user, run one real audit through the real database, and only then decide whether the next investment is Phase 1 (new capability) or fixing whatever breaks in that first real usage.
