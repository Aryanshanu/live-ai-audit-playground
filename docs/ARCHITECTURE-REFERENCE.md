# Architecture Reference — Unified Governance POC

Captured 2026-09-14 from the schema of a prior proof-of-concept (145 tables), preserved here so the design work isn't lost. This is a **capability map, not a port**: it records *what domains a complete unified governance platform covers*, which is exactly the thing that's hard to know in advance.

**What this is not:** the POC's UI is auth-gated and its repo is private, so none of its code, visual design, or copy is reproduced here — only the domain structure, rebuilt independently under GOV.AX naming.

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
