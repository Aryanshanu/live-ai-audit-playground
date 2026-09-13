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

**Known debt carried forward:** sandbox-mode (free-text) audits still only write to `localStorage`, not the database. RBAC exists in schema but no admin UI exists to grant roles yet (must be done via direct SQL today).

---

## Phase 1 — The Real RAI Agent (next up)

**Goal:** Make `fairness_metrics` and `explainability_reports` stop being empty tables. This is the single highest-leverage next step because it's the most obvious gap between "what the schema promises" and "what actually runs."

### Architecture decision (needs your confirmation before building)

None of Fairlearn, AIF360, or SHAP run in a browser — they're Python libraries needing real compute. This requires a **separate service**, not a Next.js addition:

```
┌─────────────┐      HTTPS       ┌──────────────────────┐      writes      ┌─────────────┐
│  GOV.AX     │ ───────────────► │  RAI Agent Service    │ ───────────────► │  Supabase   │
│  (Next.js)  │                  │  FastAPI + Fairlearn/  │                  │  Postgres   │
│  browser    │ ◄─────────────── │  AIF360 + SHAP         │ ◄─────────────── │  (Phase 0)  │
└─────────────┘   audit status   └──────────────────────┘   read results    └─────────────┘
```

**Hosting options, real tradeoffs (your call, I can't decide this for you):**

| Option | Cost | Fit for SHAP/AIF360 | Complexity |
|---|---|---|---|
| Vercel Python serverless | Free tier exists | ❌ Poor — cold starts + package size limits are a real problem for `shap`'s compiled dependencies | Low |
| Railway / Fly.io (Docker) | ~$5-20/mo | ✅ Good — persistent container, no cold-start tax | Medium |
| Self-hosted VPS + Docker | ~$5-10/mo (Hetzner/DO) | ✅ Good | Medium-high (you manage uptime) |
| AWS ECS/Fargate | Pay-per-use, can be $0 at low volume | ✅ Good | High (more AWS surface area) |

**Recommendation:** Railway or Fly.io — Docker-native, genuinely cheap, far less operational overhead than raw ECS, and neither has Vercel's serverless constraints for heavy ML dependencies.

### Concrete build steps once hosting is chosen

1. **FastAPI service skeleton** — `/audit` endpoint accepting `{model_id, dataset_url, protected_attributes}`, returns a job id immediately (async — these jobs can take real time).
2. **Fairlearn integration** — real `demographic_parity_ratio`, `equalized_odds_ratio`, compute against an actual uploaded dataset + actual model predictions (not the simplified client-side approximation from Phase 0).
3. **SHAP integration** — `TreeExplainer`/`KernelExplainer` depending on model type; store `feature_importances` as JSON matching the `explainability_reports` schema exactly.
4. **Supabase service-role write-back** — the agent writes results using Supabase's service role key (server-side only, never exposed to the browser), inserting into `rai_audits`/`fairness_metrics`/`explainability_reports`.
5. **Job status polling** — GOV.AX's frontend polls `rai_audits.status` (already `pending`/`running`/`completed`/`failed` in the schema) rather than needing a websocket.
6. **Dockerfile + CI** — build and push to the chosen host's registry.

**Honest scope note:** this alone — one agent, one FastAPI service, real metric libraries — is itself a multi-week task done properly (dataset upload handling, model-loading for arbitrary HF models, error handling for malformed inputs, actual SHAP compute time on non-trivial models). Not a single-session addition.

---

## Phase 2 — The Multi-Agent Swarm

**Goal:** The CrewAI/LangGraph architecture from the agentic blueprint — Supervisor + 4 specialist agents (Data Quality, RAI, AI Security, Lifecycle/Cost) collaborating and cross-critiquing.

- Requires Phase 1's pattern (FastAPI + real libraries) repeated for 3 more agents: Data Quality (Great Expectations/YData-Profiling), Security (Garak, ART), Lifecycle (Infracost, FOSSA/Tern).
- Requires an orchestration layer (LangGraph is the more production-proven pick per earlier research — 1.0 stable, used at Uber/LinkedIn/Klarna).
- Requires an LLM to actually run the supervisor/aggregator reasoning — this needs either local open-weight models (Ollama/vLLM, real GPU cost) or continuing the HF-Inference-API pattern (free tier, rate-limited).
- Cross-agent "critique" (the RFC's Phase 3) is the hardest part to get right — it's not just calling 4 agents in parallel, it's a real conversational protocol between them.

**This phase is where "dozens of engineers, years" starts being the honest comparison** — 4 real specialist agents with real OSS tool integrations, each maintained and updated as those libraries change, is a genuine team's worth of ongoing work, not a milestone you finish once.

---

## Phase 3 — Continuous Monitoring

**Goal:** Move from "audit at a point in time" to "watch a deployed model over time" — drift detection, production guardrails, scheduled re-audits.

- Needs a scheduler (cron-based re-runs of Phase 1/2 agents against the same model over time).
- Needs real drift math (Population Stability Index, KS-tests) — computable in Python alongside the Phase 1 service.
- Needs alerting integration (Slack/Teams/Jira webhooks) — technically simple, but is real integration surface, one connector at a time.

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
