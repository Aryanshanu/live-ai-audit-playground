# GOV.AX System Audit

**Status:** Partial delivery against a 13-section PRD request. Sections 1 (System Inventory) and 10 (Consistency Pass) are complete and verified below. Sections 2–9 and 11–13 are **not yet produced** — see "Scoping decision" below for why, and `ROADMAP.md` for where the target-state material they'd contain (policies, controls, risks, incidents, approval gates) is tracked instead.

## Scoping decision — read before the rest of this document

A 13-section, file-by-file, PRD-grade specification was requested in one pass. Producing it honestly in one pass isn't possible: several requested sections (5.1, 6.1) ask for full specifications of entities — `policies`, `controls`, `risks`, `incidents`, `approvals`, `mitigations`, `evidence_artifacts` — that **do not exist in this codebase**. Writing a "full specification" for them would either take as long as building them, or produce content that reads as documentation of something real when it isn't. Given this project's whole discipline has been refusing exactly that move, this document does the opposite: it audits what is verifiably true right now, and defers everything else to `ROADMAP.md` as explicitly-labeled target state.

**Corrections to the requesting prompt's stated context**, verified against the live database, not assumed:

| Prompt assumed | Verified now |
|---|---|
| 0 users | **2** — 1 email signup, 1 anonymous guest signup, both independently confirmed working |
| 0 audits | Was **0** when this table was first written; **now 1**, same day, real end-to-end run — see the update note at the bottom of this document |
| Multi-tenancy not implemented | **Implemented.** Org-scoped RLS, isolation proven with two real users in separate orgs |
| No Data Quality / AI Governance domain | **Partially built this session** — see 1.6 |

---

## Section 1 — System Inventory (Validated)

### 1.2 Frontend components (27 files, `src/components/`)

| Component | Status | Evidence tier | Exercised by a real user path? |
|---|---|---|---|
| `AppShell.jsx` | LIVE | — (chrome) | Unknown — never observed in a real session |
| `PillarPage.jsx` | LIVE | live-dynamic | No |
| `DataQualityCenter.jsx` | LIVE | verified | No |
| `GovernanceRegistry.jsx` (Model/Use Case Registry) | LIVE | verified | No |
| `GovernanceViews.jsx` (Audit Center, Compliance Hub, Threat Modeling, Settings, Docs) | LIVE | mixed | No |
| `SystemCheckPanel.jsx` | LIVE | verified | No |
| `AdminDashboard.jsx` (Command Center) | LIVE | verified | No |
| `AuditPlayground.jsx` | LIVE | verified | No |
| `ComplianceReportPanel.jsx` | LIVE | mixed | No |
| `DynamicSecurityPanel.jsx` | LIVE | live-dynamic | No |
| `SandboxWorkspace.jsx` | LIVE | heuristic | No |
| `DataQualityUpload.jsx` | LIVE (ephemeral, Sandbox-embedded — distinct from `DataQualityCenter.jsx`) | verified | No |
| `BrowserClassifierPanel.jsx` | LIVE | local-inference | No |
| `SemanticAuditPanel.jsx` | LIVE | live-dynamic | No |
| `GovernanceNav.jsx` | **DEAD** — superseded by `AppShell.jsx`'s sidebar, not imported anywhere | — | No |
| `auth/AuthForm.jsx`, `auth/AuthGate.jsx` | LIVE | — | **Yes** — 2 real signups |
| `AppShell.jsx`, `GovernanceInputPanel.jsx`, `ComplianceReportPanel.jsx`, `UnifiedGovernanceScore.jsx` | LIVE | mixed | **UPDATE, same day: Yes** — exercised by the real end-to-end audit in `docs/FIRST-AUDIT.md`, not just AuthForm/AuthGate anymore |
| `PlaceholderView.jsx` | LIVE, intentionally (renders for `attack_library`, `user_management` nav entries) | — | No |
| `IntegrationStudioPanel.jsx`, `IssueCard.jsx`, `InteractiveRadarChart.jsx`, `ComplianceGauge.jsx`, `DataLineageGraph.jsx`, `HistoryIndicator.jsx`, `ToggleSwitch.jsx`, `UnifiedGovernanceScore.jsx` | LIVE | — (presentational) | No |

**Inconsistency found**: `GovernanceNav.jsx` is dead code — built two passes ago, superseded by the `AppShell` sidebar in the very next pass, never removed. Flagged in Section 10.

### 1.5 Backend / lib modules (22 files, `src/lib/`)

| Module | Purpose | Status | Evidence tier produced |
|---|---|---|---|
| `auditEngine.js` | 9 heuristic rules, `RULE_REGISTRY` | LIVE | heuristic |
| `rules.js` | 6 rules, `GOVERNANCE_RULES` (DPDP/PSA) | LIVE | verified |
| `dataQualityAnalyzer.js` | Real CSV stats + disparate impact | LIVE | verified |
| `livePromptProbe.js` | 4 live adversarial probes | LIVE | live-dynamic |
| `semanticAuditEngine.js` | LLM-powered semantic audit | LIVE, **unverified end-to-end** (no network path to HF from the dev sandbox that built it) | live-dynamic |
| `browserClassifier.js` | transformers.js zero-shot classifier | LIVE, **unverified end-to-end** (same reason) | local-inference |
| `modelCardCompleteness.js` | Real Mitchell et al. scorer | LIVE | verified |
| `piiPatterns.js` | Shared regex PII detection | LIVE | verified |
| `githubRegistry.js`, `githubEscalation.js` | GitHub-backed registry/HITL | LIVE, **unverified end-to-end** (mocked-fetch only) | verified |
| `evidenceTiers.js` | The tier taxonomy itself | LIVE | — |
| `navigation.js` | Nav status metadata | LIVE, **PARTIALLY STALE** — see Section 10 | — |
| `pillarConfig.js` | Per-pillar page config | LIVE | — |
| `historyStore.js` | `localStorage` audit history | LIVE | — (explicitly weaker than DB records) |
| `useHfConfig.js` | Persisted HF token/model | LIVE | — |
| `timeFormat.js`, `promptfooExport.js` | Utilities | LIVE | — |
| `remediationAgent.js` | 3-step plan/draft/critique loop | LIVE, **unverified end-to-end** | live-dynamic |
| `supabase/client.js` | Singleton client | LIVE | — |
| `supabase/auth.js` | `useSession`, `useOrgMembership`, `signInAsGuest`, `signIn`, `signUp`, `signOut` | LIVE | — |
| `supabase/auditPersistence.js` | Writes `rai_audits`/`rai_findings` | LIVE, **never exercised by a real user** | verified |
| `api/raiEngine.js` | Caller for the undeployed Python service | LIVE code, **UNREACHABLE** (no deployed target) | live-dynamic (when reachable) |

### 1.6 Database tables (live schema, `ai.gov-prod`, queried directly — 20 tables in `public`)

| Table | Rows | RLS | Purpose |
|---|---|---|---|
| `profiles` | 2 | ✅ | 1:1 with `auth.users` |
| `organizations` | 2 | ✅ | Tenancy root |
| `org_members` | 2 | ✅ | Per-org roles (`owner/admin/auditor/viewer/external_auditor`) |
| `platform_admins` | 1 | ✅ (SELECT only — no write policy for anyone) | Seeded superadmin emails |
| `audit_log` | 0 | ✅ (INSERT+SELECT only — no UPDATE/DELETE policy exists) | Hash-chained immutable log |
| `rai_audits` | 0 | ✅ | Parent record per audit |
| `rai_findings` | 0 | ✅ | Per-finding detail |
| `fairness_metrics` | 0 | ✅ | Schema exists; nothing writes here yet (Python service undeployed) |
| `explainability_reports` | 0 | ✅ | Same |
| `models` | 0 | ✅ + trigger on `risk_tier`/`lifecycle_stage` | AI Governance registry |
| `model_versions` | 0 | ✅ | Model card + completeness score |
| `use_cases` | 0 | ✅ + trigger on `risk_tier` | Use-case registry |
| `use_case_model_links` | 0 | ✅ | Many-to-many |
| `attack_library` | 4 (built-in, `org_id IS NULL`) | ✅ | Probes as data — **not yet read by `livePromptProbe.js` at runtime**, see Section 10 |
| `dq_runs` | 0 | ✅ | Persisted Data Quality Center results |
| `dq_rules` | 0 | ✅ (write restricted to owner/admin) | Declarative DQ thresholds |

**MISSING — assumed absent, confirmed by direct query**: `policies`, `controls`, `control_evaluations`, `risks`, `mitigations`, `approvals`, `gates`, `incidents`, `framework_controls`, `system_mappings`, `evidence_artifacts`. None of these exist. Section 6 of the original request describes a full specification for them; that would be fiction if written now.

### 1.9 Python service endpoints (`services/rai-agent/`, deployed: **no**)

| Endpoint | Status | Verification |
|---|---|---|
| `POST /checks/modelscan` | Tested, unreachable | Mocked console-output parsing, real bug found (double-counting) and fixed |
| `POST /checks/fairness` | Tested, unreachable | Real Fairlearn library, ground-truth synthetic dataset, real bug found (train-set fidelity — n/a here, that was `/checks/explainability`) |
| `POST /checks/explainability` | Tested, unreachable | Real SHAP, surrogate-model design to avoid deserializing user models; real bug found (fidelity measured on training data reported 1.0 for pure noise) and fixed with cross-validation |

All three: written, unit-verified, **never once executed against a live deployment**, because no host has been provisioned. This is the single largest gap between "built" and "live" in the codebase.

### 1.12 Configuration / environment variables

| Variable | Where read | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `client.js` | Hardcoded fallback present (documented as intentional — anon key is public by design) |
| `NEXT_PUBLIC_RAI_ENGINE_URL` | `api/raiEngine.js` | **Unset** — no deployment exists to point at |
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `services/rai-agent/main.py` | Required at deploy time, never set (service undeployed) |

---

## Section 10 — Debugging and Consistency Pass

Real inconsistencies found by checking, not by inspection:

1. **`GovernanceNav.jsx` is dead code.** Built as a slide-out drawer nav, immediately superseded by `AppShell.jsx`'s sidebar in the very next pass. Never deleted, never imported. **Resolution:** delete the file; it currently just sits in the repo contradicting the "no capability inflation" principle by existing as an alternative, unused nav implementation.

2. **`attack_library` is written to but never read at runtime.** The table has 4 real rows (seeded), and `docs/ARCHITECTURE-REFERENCE.md` already flags this honestly in its subtitle text — but `livePromptProbe.js`, the module that actually runs the probes, still uses hardcoded JavaScript constants, not a query against this table. The schema and the runtime have drifted apart. **Resolution:** either wire `livePromptProbe.js` to read `attack_library`, or state in the table's own comment that it is not yet load-bearing (the nav subtitle already does the latter — the source code comment does not).

3. **`navigation.js`'s status metadata is stale relative to `AppShell.jsx`'s.** Two separate files now encode "is this view live/partial/schema" — `src/lib/navigation.js` (built for the now-dead `GovernanceNav.jsx`) and the inline `status` fields inside `AppShell.jsx`'s `VIEWS` array (the one actually rendered). They were not kept in sync after Data Quality/Model Registry/Use Case Registry were upgraded from `schema`/`partial` to `live` in `AppShell.jsx` — `navigation.js` still shows some of the old values. **Resolution:** delete `navigation.js`'s `NAV_SECTIONS` (redundant with `AppShell.jsx`'s `VIEWS`) once `GovernanceNav.jsx` is removed per item 1, since nothing else reads it.

4. **`DataQualityUpload.jsx` and `DataQualityCenter.jsx` are two different components doing overlapping work**, by design (documented inline in `page.jsx`'s comments) — one is the Sandbox's ephemeral embedded check, one is the persisted org-wide center. This is a legitimate distinction, not a bug, but it is not documented anywhere a reader would find it except a code comment. **Resolution:** this document now states it; `README.md`'s component list should note the distinction too.

5. **`BENCHMARKS.md`'s "1 user, 0 audits" is now stale** as of this document — verified count is 2 users. **Resolution:** update in the same pass as this document (see immediate next action).

**No findings** for: environment-variable/code mismatches beyond the known-unset `NEXT_PUBLIC_RAI_ENGINE_URL` (already documented everywhere it appears); test/implementation mismatches (this codebase has no formal test suite — every verification this session was ad hoc mocked-fetch or live-SQL, not a checked-in test file, which is itself worth naming as a gap rather than a passed check).

---

## Immediate next action — UPDATE: completed same day

The original next action (user-count fix, dead-code removal) was completed in the commit that introduced this document. The action that superseded it — run one real audit through the live UI — was also completed the same day, via real browser automation against production, independently verified against the database. See `docs/FIRST-AUDIT.md`. This document's "0 audits" framing throughout Section 1 is now historical, describing the state at time of writing, not the current state — cross-reference `BENCHMARKS.md` for the live number.

Sections 2–4 (as-built architecture, gap analysis, formal frontend/backend split) and 7–9 (evidence tier spec, security model, PRD change plan) remain to be produced. Section 4's formal split is substantially already covered by `docs/ACCESS-ARCHITECTURE.md`, written the same day — the next pass should extend that document rather than duplicate it under a new name.
