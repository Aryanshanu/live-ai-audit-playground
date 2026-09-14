# Architecture Reference — Unified Governance POC

Captured 2026-09-14 from the schema of a prior proof-of-concept (145 tables), preserved here so the design work isn't lost. This is a **capability map, not a port**: it records *what domains a complete unified governance platform covers*, which is exactly the thing that's hard to know in advance.

**What this is not:** none of the POC's code, styling, or copy is reproduced. This records *information architecture* — what sections a complete governance platform needs — rebuilt independently under GOV.AX naming.

## Information architecture (captured from the running app)

The POC organised 31 destinations into 8 groups. This is the most valuable single artifact here: it is a worked answer to "how do you make unified governance navigable," which is genuinely hard to get right from first principles.

| Group | Destinations |
|---|---|
| *(top level)* | Command Center · AI Governance Hub · System Admin · User Management |
| **AUDIT** | Audit Center |
| **MONITOR** | Observability Hub · Platform Health · Alerts & Signals · Ongoing Validation |
| **GOVERN** | Intake & Approvals · Compliance Hub · Risk & Anomalies · Policy & Guardrails · Knowledge & Reports |
| **DATA** | Data Inventory · Data Quality |
| **RESPONSIBLE AI** | Validation Hub · Controller Governance · Fairness · Fidelity · Safety · Privacy · Transparency |
| **SECURITY** | Security Dashboard · AI Pentesting · Jailbreak Lab · Threat Modeling |
| **REGISTRIES** | Use Case Registry · Model Registry · Projects |
| **CONFIGURE** | Robustness Benchmarks · Environments · Settings · Documentation |

### What's worth stealing from this structure

1. **RAI is decomposed into five named dimensions** — Fairness, Fidelity, Safety, Privacy, Transparency — rather than one lump. GOV.AX collapses all of this into "RAI," which is less legible to a non-technical reviewer who only cares about one dimension.
2. **Separating "Intake & Approvals" from everything else.** Governance starts *before* a model exists — at intake — which is a workflow GOV.AX has no concept of.
3. **"Ongoing Validation" as distinct from "Audit Center."** Point-in-time audit and continuous revalidation are different activities and the POC treats them as such.
4. **A Command Center landing page** aggregating status, rather than dropping the user into a tool.

### The page format (adopted)

Every page in the reference shares one shape, which GOV.AX now follows:

- **Persistent collapsible sidebar** — logo mark, product name, role label, then uppercase-grouped sections. Scales to many destinations in a way a top switcher cannot.
- **Page banner** — `h1` title + one-line subtitle + contextual actions (e.g. a `Refresh` button, a `Healthy` status pill), then theme toggle and user menu.
- **Content region**, then a version footer.
- **List pages** (Model Registry): search input + primary action, an explicit `Showing X of Y` count, then rows carrying type tag, environment tag, name, description, version, risk level, status, owner, and updated date.
- **Evaluation pages** (Fairness): a capability-badge strip, a target selector plus a `Run` action, a genuine empty state (`Select a Model` + "1 model available"), then score tiles and a custom-prompt test panel.

### The pillar page anatomy (adopted)

Every evaluation page in the reference shares one shape, which GOV.AX now implements as a single reusable component:

1. **Capability strip** — mode badge (`BOTH`/`INPUT`/`OUTPUT` Analysis), an `Input:` and `Output:` description of what is actually analysed, then engine badges.
2. **Target selector + run action** — `Select Model` plus a pillar-specific verb (`Run Safety Test`, `Run Privacy Audit`, `Run Pentest`).
3. **Empty state** — `Select a Model` with a line explaining what selecting one enables.
4. **Score tiles** once a target is chosen.
5. **Custom Prompt Test** — a `Load Attack Sample` picker, a free-text prompt box with a pillar-specific example, and `Run Test`.

**The best idea here is #5.** Letting someone throw their own adversarial prompt at a live model and read the real response is worth more than any number of canned results, and GOV.AX now does it.

**What was deliberately not copied:** the reference's engine badges name `Detoxify + Gemini 2.5 Pro`, `AIF360 Metrics`, and `K2 Reasoning`. GOV.AX does not run those, so claiming them would be a lie told by a badge. Its badges name its own engines and mark each `live`, `built but undeployed`, or `not built` with a coloured dot.

One more honest divergence: the reference's Fairness, Safety and Privacy pages all showed the same two tiles — `74 FAIRNESS` and `1 OVERALL` — regardless of which pillar was open, so the Privacy page displayed a fairness score. GOV.AX shows per-run containment and vector counts from the actual probes that just executed.

### The admin dashboard pattern

Its System Admin page used a consistent shape: four status tiles across the top (Database connectivity + round-trip ms, Role Assignments, Avg Latency 24h, Open Incidents), then a live audit-log feed ("Last 20 events"), then three summary panels (Infrastructure row-counts per table, Traffic 24h with blocked/warned/error counts, Platform Summary).

One notable control: an **Emergency Platform Lock** ("Suspend ALL active AI systems immediately. Use only during a confirmed security breach"). Real enforcement, not just reporting — GOV.AX has no equivalent, and arguably shouldn't until it actually sits in a request path.

**An honest observation from its own audit log:** the visible entries were `UPDATE` and `DELETE` on `evaluation_runs` and `models`. That log is mutable — records can be altered or removed. GOV.AX's audit log is append-only and hash-chained, with both properties proven by test. That is one dimension where GOV.AX is genuinely ahead of the reference, and worth keeping.

## The 14 domains

Row counts indicate which parts were genuinely exercised vs. scaffolded.

### 1. Identity & Access
`profiles` · `user_roles` · `role_personas` · `api_keys` · `model_api_keys` · `user_provider_keys` · `revoked_tokens` · `rate_limits`
→ GOV.AX status: ✅ covered (org-scoped RBAC, arguably better — per-org roles vs. global)

### 2. AI Inventory & Registry
`models` · `model_versions` · `datasets` · `model_datasets` · `use_cases` · `use_case_model_links` · `systems` · `projects` · `ownership`
→ GOV.AX: 🟡 partial — GitHub-backed registry only, no first-class `models` table. **Highest-value gap.**

### 3. Evaluation
`evaluation_suites` · `evaluation_runs` · `evaluation_results` · `evaluation_schedules` · `evaluation_schedule_runs` · `evaluation_requirements` · `test_scenarios` · `test_run_results`
→ GOV.AX: 🟡 audits exist but aren't modelled as reusable *suites* run on a *schedule*

### 4. Monitoring & Telemetry
`telemetry_logs` · `drift_alerts` · `request_logs` · `events_raw` · `function_metrics` · `slo_config` · `slo_definitions`
→ GOV.AX: ❌ absent (Wave 4 — needs the Python service)

### 5. Incidents & Response
`incidents` · `app_errors` · `rca_templates` · `escalation_rules` · `sla_escalation_log` · `suspension_events`
→ GOV.AX: ❌ absent. Note `suspension_events` — the POC could suspend a model, i.e. real enforcement.

### 6. Compliance & Policy
`control_frameworks` · `controls` · `control_assessments` · `attestations` · `compliance_mappings` (258 rows) · `eu_ai_act_articles` (11) · `regulatory_reports` · `policy_packs` · `policy_versions` · `governance_policies` · `governance_enforcements` · `nl_policy_history`
→ GOV.AX: 🟡 static clause text only. The 258 compliance mappings show what "regulation-as-code" actually costs in content.

### 7. Human-in-the-Loop & Workflow
`review_queue` (75) · `decisions` · `decision_ledger` · `decision_explanations` · `decision_appeals` · `decision_overrides` · `decision_outcomes` · `system_approvals` · `deployment_gates` · `auto_approval_policies` · `threshold_validations`
→ GOV.AX: 🟡 GitHub-issue escalation only. **`decision_appeals` is notable** — a subject can contest an automated decision, which is an EU AI Act expectation most tools skip.

### 8. Risk & Impact
`risk_assessments` · `risk_metrics` · `impact_assessments` · `harm_taxonomy` · `population_impact_metrics` · `predictive_governance` · `risk_policy_bindings`
→ GOV.AX: ❌ absent. `harm_taxonomy` is a real RAI primitive.

### 9. AI Security
`security_test_runs` · `security_findings` · `attack_library` (20) · `automated_test_cases` · `threat_models` · `threat_vectors` (15) · `threat_scenarios_library` · `red_team_campaigns` · `red_team_tests` · `guardrail_rules` (12) · `security_config` · `security_audit_log` (356)
→ GOV.AX: 🟡 4 live probes, no reusable `attack_library`. **Converting hardcoded probes into a data-driven library is a clear, cheap win.**

### 10. Data Quality
`dq_data` (506) · `dq_rules` (27) · `dq_profiles` · `dq_rule_executions` · `dq_incidents` · `dq_dashboard_assets` · `data_contracts` · `data_contract_violations` · `data_drift_events` · `data_drift_alerts` · `dataset_quality_runs` · `quality_issues` · `dataset_anomalies` · `silver_data` · `gold_quality_metrics` · `data_sources` · `data_uploads`
→ GOV.AX: 🟡 real CSV analysis, but ephemeral — nothing persists, no declarative `dq_rules`. Note the medallion pattern (raw → silver → gold).

### 11. Lineage & Knowledge Graph
`kg_nodes` (129) · `kg_edges` (78) · `data_lineage` · `dataset_lineage_edges` · `data_transformations` · `dataset_snapshots` · `feature_registry` · `feature_values` · `semantic_definitions` · `semantic_definition_versions` · `semantic_query_log` · `semantic_drift_alerts`
→ GOV.AX: ❌ absent. A governance **knowledge graph** linking every entity is the most architecturally distinctive idea in the POC.

### 12. AI Discovery & Third Parties
`ai_vendors` · `ai_agents` · `agent_traces` · `shadow_ai_discoveries` · `integration_connections`
→ GOV.AX: ❌ absent. `shadow_ai_discoveries` = finding unsanctioned AI in the org.

### 13. RAI Scoring
`rai_composite_scores` · `dataset_bias_reports` · `weight_profiles`
→ GOV.AX: ✅ comparable (`UnifiedGovernanceScore` + real Fairlearn). `weight_profiles` (configurable scoring weights) is a good idea we lack.

### 14. Platform Operations
`platform_config` · `platform_config_history` · `organization_settings` · `notification_channels` · `notification_history` · `gateway_config` · `deployment_environments` · `governance_activation_state` · `admin_audit_log` (409) · `audit_report_ledger` · `processing_queue` · `idempotency_cache` · `llm_prompt_cache` · `conversation_sessions` · `remediation_actions` · `intelligence_reports` · `governance_agent_runs` · `data_retention_policies` · `gdpr_pseudonym_map` · `gdpr_erasure_requests`
→ GOV.AX: 🟡 audit log only (though ours is hash-chained, which the POC's wasn't). **`gdpr_erasure_requests` + `gdpr_pseudonym_map`** are real DPDP/GDPR primitives.

## Correction: ~90 edge functions (found later, initially missed)

The table list alone was **not** the blueprint, and presenting it as one was wrong. The reference also runs roughly **90 Supabase edge functions** — that is where the actual logic lives. Function source is not retrievable (the API returns only stub comments), so what follows is derived from names, versions and auth config, which is still substantial.

| Cluster | Functions |
|---|---|
| **RAI evaluation** | `eval-fairness` · `eval-toxicity-hf` · `eval-privacy-hf` · `eval-explainability-hf` · `eval-hallucination-hf` · `eval-data-quality` · `run-rai-evaluation` · `rai-reasoning-engine` |
| **Security** | `security-pentest` · `security-jailbreak` · `security-threat-model` · `run-red-team` · `custom-prompt-test` · `detect-governance-bypass` |
| **Data quality (12)** | `dq-control-plane` · `dq-ingest-data` · `dq-profile-dataset` · `dq-generate-rules` · `dq-execute-rules` · `dq-detect-anomalies` · `dq-raise-incidents` · `dq-truth-enforcer` · `dq-generate-dashboard-assets` · `dq-chat` · `validate-contract` · `run-quality-tests` |
| **Knowledge graph (5)** | `kg-query` · `kg-sync` · `kg-upsert` · `kg-explain` · `kg-lineage` |
| **Gateway / enforcement** | `ai-gateway` · `gateway-route` · `ai-governance-gateway` · `policy-violation-handler` · `cicd-gate` |
| **Policy-as-code** | `nl-to-policy` · `compile-policy` · `policy-lint` |
| **Decision governance** | `log-decision` · `explain-decision` · `process-appeal` · `track-outcome` · `hitl-auto-assist` · `threshold-validator` |
| **Remediation** | `generate-remediation` · `execute-remediation` · `revert-remediation` |
| **Agents / assistants** | `governance-agent` · `copilot` · `rai-assistant` · `realtime-chat` |
| **Enterprise integration** | `collibra-audit-sync` · `collibra-monitor-sync` · `collibra-rai-sync` · `collibra-registry-sync` |
| **Semantic layer (5)** | `semantic-compiler` · `semantic-query` · `semantic-layer-gateway` · `semantic-drift-check` · `semantic-query-log` |
| **Monitoring** | `detect-drift` · `check-slo-breaches` · `sla-escalation-monitor` · `incident-lifecycle` · `compute-runtime-risk` · `predictive-governance` |
| **Reporting** | `generate-audit-report` · `generate-scorecard` · `generate-model-card` · `weekly-intelligence-report` |

### Four things this changes

1. **They built the gateway.** `ai-gateway`, `gateway-route`, `ai-governance-gateway` mean the POC *did* sit in the request path — the inline-enforcement capability GOV.AX deferred (D4). That deferral still stands on reliability grounds, but "nobody built it" was the wrong reason.
2. **`eval-*-hf` confirms Hugging Face inference** was the evaluation backend — the same zero-cost pattern GOV.AX uses independently. Convergent, and a good sign.
3. **`generate-remediation` / `execute-remediation` / `revert-remediation`** is a full remediation lifecycle with rollback. GOV.AX's remediation agent is draft-only by design, but *revert* is the piece that makes execution defensible.
4. **The knowledge graph and semantic layer were genuinely implemented**, not scaffolded — 5 functions each, against 129 `kg_nodes` and 78 `kg_edges`.

### Still unexplored, stated plainly

30 of 31 UI pages, every table's column-level schema, all RLS policies, database functions and triggers, and every edge function's implementation. The reference is substantially larger than what has been examined.

## Third pass: Data Quality and AI Governance depth (2026-09-14)

The prior passes covered RAI/Security pillar pages and four cross-cutting views, but left the two other named pillars thin: Data Quality was a single ephemeral CSV uploader (zero Supabase calls — every real analysis this app ever computed was lost on refresh), and "AI Governance" was schema with no interface. Closed both, and formalized the customer/admin boundary as [ACCESS-ARCHITECTURE.md](ACCESS-ARCHITECTURE.md) rather than leaving it as an unwritten convention.

**Data Quality Center**: `dq_runs` (persisted results, any org member) + `dq_rules` (declarative thresholds, owner/admin only — RLS-enforced, verified with a real viewer-role user whose rule-creation attempt was rejected). Real Analyze / Rules / History UI.

**AI Governance**: Model Registry and Use Case Registry got real register/list interfaces on top of schema that existed since the second pass. The governance-meaningful action — changing `risk_tier` or `lifecycle_stage` — is now blocked for non-admins by a column-level trigger, not a row-level policy, so a member can still edit a model's description while being rejected on its risk classification. Verified with a real second user: registered a model successfully, was rejected reclassifying it, then the same row's risk_tier was changed successfully by the org owner.

Views with real UI: 16 of 18 (was 14/18).

## Second pass: what GOV.AX could genuinely back (2026-09-14)

After the pillar pages, compared every remaining reference destination against GOV.AX's actual exports (`RULE_REGISTRY`, `GOVERNANCE_RULES`, `historyStore.js`, the Supabase schema) rather than guessing. Four destinations were genuinely backable and were built:

- **Audit Center** — reads real `rai_audits` rows plus local session history, kept visibly separate since a database record and a browser-only record are different strengths of evidence.
- **Compliance Hub** — 15 real rule-to-clause mappings, built by reading the `clause`/`regulation` field already attached to every rule, so it cannot drift from what the engines check without the underlying rule also changing.
- **Threat Modeling** — chains the existing `generateThreatNarrative()` output, previously only reachable via a download button, into its own destination.
- **Settings / Documentation** — account state and every project doc, linked directly rather than duplicated.

**A real bug caught while building this**: the Compliance Hub's first draft read `r.clause` on both rule sources, but `rules.js`'s `GOVERNANCE_RULES` uses a `regulation` field, not `clause`. That silently dropped all 6 DPDP/PSA Framework citations — exactly the entries most relevant to an India-focused compliance page — while looking like it worked, since the `RULE_REGISTRY` source (which does use `clause`) still populated most of the page. Caught by checking the actual exported field names against the real source files before trusting the aggregation, not by the UI looking broken.

**Still not added, on purpose:** Data Inventory, Intake & Approvals, Policy & Guardrails, Observability Hub, Ongoing Validation — none have a real computation behind them yet. Adding them now would be the exact capability-inflation-by-navigation this whole exercise has been trying to avoid.

## Honest scope assessment

GOV.AX has 9 tables. This POC has 145. **Replicating it wholesale would be the exact "15 speculative features, 0 users" trap** flagged in `DECISIONS.md` — and most of these tables have 0 rows, meaning they were scaffolded rather than used.

Prioritised by (value × evidence it was actually used):

| Priority | What | Why |
|---|---|---|
| **1** | `models` / `model_versions` / `use_cases` registry | Foundational — everything else references it. GOV.AX's biggest structural gap. |
| **2** | `attack_library` as data | Converts 4 hardcoded probes into an extensible library. Cheap, immediate. |
| **3** | `dq_rules` declarative rules | Makes existing CSV analysis persistent and configurable. 27 real rows = genuinely used. |
| **4** | `review_queue` + `decision_ledger` | 75 real rows — the most-exercised workflow in the POC. |
| **5** | Knowledge graph (`kg_nodes`/`kg_edges`) | Most distinctive idea; also the biggest build. |
| Deferred | Telemetry, incidents, GDPR, shadow AI, semantic layer | Real, but gated on the Python service and real usage. |

Everything below priority 4 stays gated by the rules already in `DECISIONS.md`: no speculative building ahead of real usage.
