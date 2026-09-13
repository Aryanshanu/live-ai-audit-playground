# GOV.AX Roadmap — Toward an Open-Source AI Governance Platform

**Last updated:** 2026-09-13
**North star:** Reach a meaningful fraction of what Credo AI, IBM watsonx.governance, Fiddler, Robust Intelligence, and Protect AI each built with dozens of engineers over years — as an open-source, self-hostable, Hugging Face-native alternative.

## Reading this document honestly

The five platforms above represent roughly 500+ engineer-years combined. This roadmap does not promise "90% of that" on any specific timeline — it promises an honest, phased path where each phase is real, verified, and shippable on its own, rather than a pile of half-built features. **Phase 0 is done and verified. Everything after that is planned, not built.** Where a phase depends on a decision (hosting, budget, team size), that's flagged explicitly rather than assumed away.

---

## Phase 0 — Foundation ✅ DONE

**Goal:** Replace "client-side heuristics pretending to be enterprise features" with real infrastructure and radical honesty about evidence quality.

| Deliverable | Status | Verification |
|---|---|---|
| Evidence-tier taxonomy (heuristic/verified/local-inference/live-dynamic) applied to every finding | ✅ | Used consistently across all engines |
| Real Supabase backend (`ai.gov-prod`, `ap-south-1`) | ✅ | `list_projects` confirms ACTIVE_HEALTHY |
| Real RBAC (Postgres enum + RLS, not client-side) | ✅ | Security advisor: 0 findings |
| Genuinely immutable audit log (no UPDATE/DELETE policy = hard deny) | ✅ | Verified via RLS policy inspection |
| RAI schema shaped for real Fairlearn/AIF360/SHAP output | ✅ | `fairness_metrics`, `explainability_reports` tables live |
| Real Supabase Auth (signup/login/session) wired into the app | ✅ | Build passes; **not yet smoke-tested in a real browser** |
| 4-probe live security suite + thorough-scan statistical rate | ✅ | Mocked-fetch verified |
| GitHub-backed centralized model registry + HITL escalation | ✅ | Mocked-fetch verified |
| In-browser ML classifier (zero-shot, zero-token) | ✅ | Build verified; **CDN import never executed in a real browser from this environment** |
| Disparate impact (four-fifths rule) on real uploaded data | ✅ | Verified against a synthetic biased dataset |

**Known debt carried forward:** sandbox-mode (free-text) audits still only write to `localStorage`. RBAC roles are now visibly displayed in the UI (fixed — `useRoles()` existed but was never called anywhere, so every user saw an identical interface regardless of role), but there is still no admin UI to *grant* roles — must be done via direct SQL today. The signup "check your email" message used to vanish on a page refresh (fixed — now persisted so it survives a reload while confirmation is pending).

---

## Phase 1 — The Python Analysis Service (next up)

**Reframed from "the RAI agent" to "the Python service"** after mapping this
against real competitor "build-your-own" blueprints (Credo AI, IBM
watsonx.governance, Fiddler, Robust Intelligence, Protect AI — see table
below). Every one of those five stacks depends on Python libraries that
cannot run in a browser: Fairlearn, Evidently AI, Garak, ModelScan, Great
Expectations. That's not a coincidence — it means the real architectural
unlock is **one hosted Python service**, built to be extensible, not five
separate one-off agents. RAI is still the first integration (it's what the
schema is already shaped for), but the service should be designed from day
one to also host the others below without a rebuild.

### What each competitor's real OSS stack maps onto for us

| Competitor target | Their real OSS stack | Adopt as-is? | Notes |
|---|---|---|---|
| Credo AI (governance) | MLflow + Fairlearn + Budibase | **Partial** — Fairlearn yes, MLflow yes (real lineage tracking, which we don't have). **Skip Budibase** — we already have a purpose-built Next.js dashboard; a low-code tool would be a step backward for us specifically, not a gap. | MLflow is a genuine addition: real model-version lineage, which `rai_audits` currently only weakly implies via `model_id` text. |
| IBM watsonx (LLM lifecycle) | OpenInference + Phoenix/DeepEval + Airflow | **Later (Phase 2)** | DeepEval for hallucination/toxicity metrics is a real upgrade over our current marker-based probes — worth adopting once the service exists. |
| Fiddler (observability/drift) | Evidently AI + ClickHouse + Grafana | **Yes, this is exactly Phase 3** | This is more concrete than what Phase 3 said before — adopting this exact stack (not a vague "drift math") is the plan now. |
| Robust Intelligence (adversarial firewall) | Garak (CI/CD) + FastAPI proxy + Llama Guard (inline) | **Yes — and it's bigger than I'd scoped.** Our current 4-probe suite is discrete, on-demand testing (closer to Garak's CI/CD batch mode). An **inline reverse-proxy firewall** running Llama Guard is a genuinely different, more advanced capability — real-time filtering of a live model endpoint's traffic, not a periodic audit. New item, added below. | |
| Protect AI (supply chain) | ModelScan + Trivy + DefectDojo | **Yes, and this is buildable sooner than the others.** | See below — this one doesn't need the full multi-agent orchestration to be valuable; it's a single, self-contained check that plugs directly into the existing HF Model Scanner. |

### A genuinely new, currently-missing capability: model file supply-chain scanning

Right now, GOV.AX's HF Model Scanner reads **metadata only** (license, tags,
pipeline type) via the HF Hub API — it never touches the actual model
weight files. `ModelScan` (Protect AI's own open-source tool) scans
`.pkl`/`.h5`/`SavedModel`/etc. files for unsafe deserialization — the exact
vulnerability class behind real supply-chain attacks on downloaded model
weights. This is a real, currently-absent check directly in our existing
product surface, and it's a smaller, more self-contained build than the
RAI agent (one tool, one clear input/output, no orchestration needed) —
worth sequencing as an early win once the Python service exists, possibly
even before the full Fairlearn/SHAP integration.

### Concrete build steps once hosting is chosen

1. **FastAPI service skeleton** — designed as a router with pluggable
   "checks" (`/checks/fairness`, `/checks/modelscan`, `/checks/shap`, ...)
   rather than a single hardcoded `/audit` endpoint, so later additions
   (Phase 2's DeepEval, Phase 3's Evidently) are new routes, not new services.
2. **ModelScan integration first** — smallest scope, real value, no
   orchestration complexity. Downloads a model's weight file, runs
   `modelscan`, returns findings.
3. **Fairlearn + MLflow integration** — real `demographic_parity_ratio`,
   `equalized_odds_ratio` against actual uploaded dataset + model
   predictions; MLflow tracks the model version lineage the schema
   currently only approximates with a text field.
4. **SHAP integration** — `TreeExplainer`/`KernelExplainer` depending on
   model type; store `feature_importances` matching `explainability_reports`.
5. **Supabase service-role write-back** — server-side only, never exposed
   to the browser.
6. **Job status polling** — `rai_audits.status` already supports
   `pending`/`running`/`completed`/`failed`.
7. **Dockerfile + CI**, deployed to the chosen host.

### Architecture decision (needs your confirmation before building)

None of Fairlearn, AIF360, SHAP, ModelScan, or Evidently run in a browser — they're Python libraries needing real compute. This requires a **separate service**, not a Next.js addition:

```
┌─────────────┐      HTTPS       ┌───────────────────────────┐      writes      ┌─────────────┐
│  GOV.AX     │ ───────────────► │  Python Analysis Service   │ ───────────────► │  Supabase   │
│  (Next.js)  │                  │  FastAPI, pluggable checks: │                  │  Postgres   │
│  browser    │ ◄─────────────── │  ModelScan / Fairlearn+MLflow│ ◄─────────────── │  (Phase 0)  │
└─────────────┘   audit status   │  / SHAP / (later: Evidently) │   read results    └─────────────┘
                                  └───────────────────────────┘
```

**Hosting options, real tradeoffs (your call, I can't decide this for you):**

| Option | Cost | Fit for SHAP/AIF360/ModelScan | Complexity |
|---|---|---|---|
| Vercel Python serverless | Free tier exists | ❌ Poor — cold starts + package size limits are a real problem for `shap`'s compiled dependencies | Low |
| Railway / Fly.io (Docker) | ~$5-20/mo | ✅ Good — persistent container, no cold-start tax | Medium |
| Self-hosted VPS + Docker | ~$5-10/mo (Hetzner/DO) | ✅ Good | Medium-high (you manage uptime) |
| AWS ECS/Fargate | Pay-per-use, can be $0 at low volume | ✅ Good | High (more AWS surface area) |

**Recommendation:** Railway or Fly.io — Docker-native, genuinely cheap, far less operational overhead than raw ECS, and neither has Vercel's serverless constraints for heavy ML dependencies.

**Honest scope note:** even just ModelScan + Fairlearn + MLflow + SHAP as four routes on one service is a multi-week task done properly (dataset upload handling, model-loading for arbitrary HF models, error handling for malformed inputs, real SHAP compute time on non-trivial models). Not a single-session addition.

---

## Phase 2 — The Multi-Agent Swarm

**Goal:** The CrewAI/LangGraph architecture from the agentic blueprint — Supervisor + 4 specialist agents (Data Quality, RAI, AI Security, Lifecycle/Cost) collaborating and cross-critiquing.

- Requires Phase 1's pattern (FastAPI + real libraries) repeated for 3 more agents: Data Quality (Great Expectations/YData-Profiling), Security (Garak, ART), Lifecycle (Infracost, FOSSA/Tern).
- **The Security agent has two genuinely different modes, not one** — this matters, per the Robust Intelligence blueprint: (a) *pre-deployment batch testing* (Garak/ART running thousands of adversarial cases in CI/CD — closer to what our current 4-probe suite already does, just at far greater scale), and (b) a *real-time inline firewall* — a reverse proxy in front of a live model endpoint, running Llama Guard to filter adversarial inputs before they reach the model. (b) is a materially different piece of infrastructure (always-on, latency-sensitive, sits in the request path) from everything else in this roadmap, which is all audit-on-demand. Worth scoping as its own sub-project once (a) exists, not bundled in by default.
- Requires an orchestration layer (LangGraph is the more production-proven pick per earlier research — 1.0 stable, used at Uber/LinkedIn/Klarna).
- Requires an LLM to actually run the supervisor/aggregator reasoning — this needs either local open-weight models (Ollama/vLLM, real GPU cost) or continuing the HF-Inference-API pattern (free tier, rate-limited).
- Cross-agent "critique" (the RFC's Phase 3) is the hardest part to get right — it's not just calling 4 agents in parallel, it's a real conversational protocol between them.

**This phase is where "dozens of engineers, years" starts being the honest comparison** — 4 real specialist agents with real OSS tool integrations, each maintained and updated as those libraries change, is a genuine team's worth of ongoing work, not a milestone you finish once.

---

## Phase 3 — Continuous Monitoring

**Goal:** Move from "audit at a point in time" to "watch a deployed model over time" — drift detection, production guardrails, scheduled re-audits.

**Concrete stack, adopted directly from the Fiddler blueprint** (this is the one competitor mapping that translates almost exactly, not just conceptually): production logs → **ClickHouse** (high-speed time-series storage) → scheduled **Evidently AI** Python jobs computing real drift statistics (PSI, KS-test) against the training baseline → **Grafana** for dashboarding and alerting, with webhook alerts into Slack/Teams/Jira for threshold breaches.

- ClickHouse and Evidently both run in the same kind of container as Phase 1's service — this is an extension of that infrastructure, not a new category of system.
- Needs a scheduler for periodic re-runs (cron is sufficient at this stage — no need for a heavier workflow engine yet).
- Alerting integration is technically simple per-connector, but is real, ongoing integration surface — one connector (Slack, then Teams, then Jira) at a time, not all three simultaneously.

## Phase 4 — Enterprise Surface

**Goal:** Multi-tenant orgs, stage-gate approval workflows, SIEM export, connector ecosystem (Snowflake/BigQuery/Kafka).

This is the largest remaining phase and the most honest place to say: **this is most of the remaining distance to "90% of Credo AI."** Multi-tenancy alone (org-scoped RLS instead of user-scoped) is a real schema migration. Each enterprise data-source connector is its own maintained integration. This phase is realistically where a team, not a side project, is required.

---

## What's actually differentiated, and worth leading with

Being honest about what we'll likely never out-build (compliance certifications, dedicated enterprise support, deep Snowflake/BigQuery connector libraries), here's what's genuinely distinctive about this project *today*, worth being proud of without inflating it:

1. **The evidence-tier taxonomy** — one honesty standard (heuristic → verified → local-inference → live-dynamic) applied uniformly across every pillar and every finding. None of the five named competitors publish this distinction as a first-class UI concept.
2. **Zero-cost live testing** — the security probe suite and in-browser classifier genuinely cost nothing to run, using the user's own free HF credits and on-device compute. Most competitors' dynamic testing is metered/paid.
3. **Open, inspectable, self-hostable** — every rule, every probe, every metric is readable source code, not a black-box SaaS score.

## Immediate next action

Confirm the Phase 1 hosting choice (Railway/Fly.io recommended) so the FastAPI service skeleton can actually be built and deployed, rather than designed in the abstract.
