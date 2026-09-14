# ⚖️ GOV.AX — Open-Source AI Governance Platform

> **Real-time AI model auditing across Responsible AI, Data Quality, AI Security, and Governance — with every finding honestly tagged by how strong its evidence actually is.**

[![Deploy to GitHub Pages](https://github.com/Aryanshanu/live-ai-audit-playground/actions/workflows/deploy.yml/badge.svg)](https://github.com/Aryanshanu/live-ai-audit-playground/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)

📍 **[ROADMAP.md](ROADMAP.md)** — the wave plan · **[DECISIONS.md](DECISIONS.md)** — architecture decisions · **[SECURITY.md](SECURITY.md)** — the RLS boundary · **[BENCHMARKS.md](BENCHMARKS.md)** — the honest reality check against live competitors · **[EVIDENCE-TIERS.md](EVIDENCE-TIERS.md)** — the evidence-tier spec

---

## What this actually is right now

GOV.AX audits AI systems two ways — a free-text **Architecture Sandbox** and a **Hugging Face Hub Model Scanner** — and layers a growing set of real capabilities on top: live adversarial probing against actual models, real fairness math on uploaded datasets, an in-browser ML classifier, and a real Postgres backend with RBAC and an immutable audit log.

**The one thing that makes this different from most tools like it:** every single finding is tagged with how strong its evidence actually is, visible right on the card — not buried in a methodology doc.

| Tier | What it means |
|---|---|
| 🟡 **Heuristic** | Matched a keyword in free text. Weakest evidence — proves someone wrote a phrase, not that the system behaves that way. |
| 🔵 **Verified** | Computed from real structured data — HF Hub API metadata, or actual statistics from an uploaded CSV. |
| 🟣 **On-Device** | A real open-source ML model ran in your browser (zero token, zero server call) to classify the text. |
| 🟢 **Live Test** | An actual probe was fired at a live model and its real response was checked. Strongest evidence this tool can produce. |

Most audit tools show you one score and ask you to trust it. This one shows the score *and* how much of it is backed by real testing versus a keyword match — including an honest percentage on the Unified Governance Score itself.

---

## Current status

| | |
|---|---|
| Registered users | **1** (verified: profile, personal org, and owner role all auto-created correctly) |
| Audits ever run through the UI | **0** — signup path now confirmed working; the audit itself is the remaining step. See [docs/FIRST-AUDIT.md](docs/FIRST-AUDIT.md) |
| Python service endpoints built | 3 (ModelScan, Fairlearn, SHAP) |
| Python service endpoints **reachable** | **0** — not deployed |
| Multi-tenancy | ✅ org-scoped, isolation proven with two real users |
| Audit log | ✅ append-only + hash-chained, both proven by test |

## Honest status check — read this before the feature list

- The Supabase backend (`ai.gov-prod`) is real, schema-complete, and advisor-verified for security and performance — and as of this writing has **zero users and zero audits ever run against it.** The infrastructure is correct; it has not yet been exercised by a real second person.
- The Python service that would run real Fairlearn/AIF360/SHAP/ModelScan doesn't exist yet — that's `ROADMAP.md` Phase 1, currently blocked on a hosting decision, not on unsolved engineering.
- The Python analysis service (`services/rai-agent/`) now has **three real, tested endpoints** — ModelScan supply-chain scanning, Fairlearn fairness metrics, and SHAP explainability. Every one is verified against ground truth, not just "returns numbers without crashing." **None of them are deployed**, so nothing in the UI can reach them yet. "Built and tested" is a genuinely weaker claim than "live," and this README won't blur the two.
- Full detail, including a line-by-line capability comparison against Credo AI, IBM watsonx.governance, Fiddler, Cisco AI Defense (formerly Robust Intelligence), and Palo Alto Prisma AIRS (formerly Protect AI), is in **[BENCHMARKS.md](BENCHMARKS.md)**.

---

## Live capability snapshot

| Capability | Status | Evidence tier |
|---|---|---|
| DPDP Act 2023 / PSA Framework rule checks on real HF model metadata | ✅ Live | 🔵 Verified |
| Free-text architecture audit (9 rules across RAI/Security/Quality/Legal) | ✅ Live | 🟡 Heuristic |
| Real disparate-impact (four-fifths rule) fairness check on uploaded CSVs | ✅ Live | 🔵 Verified |
| Real PII pattern scanning — both uploaded data *and* live model output | ✅ Live | 🔵 Verified |
| 4-probe live security suite (injection, extraction, jailbreak, content-moderation bypass) against real models via free HF inference | ✅ Live | 🟢 Live Test |
| "Thorough scan" — real multi-variant statistical containment rate, honest sample size disclosed | ✅ Live | 🟢 Live Test |
| In-browser zero-shot risk classifier (transformers.js, zero token, zero server) | ✅ Live | 🟣 On-Device |
| AI-powered semantic audit (catches what keyword rules structurally can't) | ✅ Live | 🟢 Live Test |
| GitHub-backed centralized model registry (real commits, real git-history lineage) | ✅ Live | — |
| GitHub Issues-backed Ethics Board escalation for CRITICAL findings | ✅ Live | — |
| Real Supabase RBAC (Postgres RLS, not a client dropdown) | ✅ Live, 🔴 zero real users | — |
| Immutable audit log — **empirically proven**, not asserted (real user created, UPDATE/DELETE both confirmed blocked) | ✅ Live | 🔵 Verified |
| Hash-chained tamper-evidence — a real superuser tamper was detected and the exact row located | ✅ Live | 🔵 Verified |
| Real SHAP explainability (surrogate-based, never deserializes uploaded models) | 🟡 Built & tested, **not deployed** | 🔵 Verified |
| Model file supply-chain scanning (ModelScan) | 🟡 Built & tested, **not deployed** | 🔵 Verified |
| Real Fairlearn metrics (demographic parity, equalized odds) | 🟡 Built & tested, **not deployed** | 🔵 Verified |
| System Check — self-diagnostic naming the exact failure in the signup→audit→DB path | ✅ Live | 🔵 Verified |
| Guest (anonymous) sign-in | ✅ Live | 🔵 Verified |
| Platform admin — read-only cross-org access, audit-logged | ✅ Live | 🔵 Verified |
| Model registry — models, versions, use cases, EU AI Act risk tiers | ✅ Live (schema; UI pending) | 🔵 Verified |
| Attack library — adversarial probes as extensible data, not hardcoded | ✅ Live (schema; runtime wiring pending) | 🔵 Verified |
| Governance Map — full navigation with honest per-item status (live/partial/schema/planned) | ✅ Live | 🔵 Verified |
| Command Center — admin dashboard with live status tiles, audit-log feed, and inventory | ✅ Live | 🔵 Verified |
| Sidebar app shell — sectioned navigation, collapsible, page headers, dark/light theme | ✅ Live | 🔵 Verified |
| Pillar evaluation pages — Fairness, Safety, Privacy, AI Pentesting, Transparency | ✅ Live | 🟢 Live Test |
| Custom Prompt Test — throw your own adversarial prompt at a live model, see the raw response | ✅ Live | 🟢 Live Test |
| Multi-tenant orgs with per-org roles, isolation proven with two real users | ✅ Live | 🔵 Verified |
| Production-scale drift/observability | ❌ Not built | — |
| Multi-tenant orgs, stage-gate approvals, SIEM export | ❌ Not built | — |

---

## Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                      Browser (Next.js, static export)         │
│  ┌──────────────┐  ┌──────────────────┐  ┌─────────────────┐ │
│  │  Sandbox      │  │  HF Model         │  │  In-Browser ML   │ │
│  │  (heuristic   │  │  Scanner          │  │  Classifier      │ │
│  │  rules)       │  │  (verified data)  │  │  (transformers.js)│ │
│  └──────┬───────┘  └────────┬──────────┘  └──────────────────┘ │
└─────────┼───────────────────┼──────────────────────────────────┘
          │                   │
          ▼                   ▼
┌─────────────────┐  ┌──────────────────────┐  ┌─────────────────┐
│ Hugging Face Hub │  │ HF Inference Router   │  │  GitHub API       │
│ (model metadata) │  │ (live probes, user's  │  │  (registry, HITL  │
│                  │  │  own free credits)    │  │  escalation)       │
└─────────────────┘  └──────────────────────┘  └─────────────────┘
          │
          ▼
┌──────────────────────────────────────┐
│  Supabase Postgres (ai.gov-prod)      │
│  RBAC · immutable audit log ·         │
│  rai_audits / fairness_metrics /      │
│  explainability_reports (0 rows,      │
│  schema-only until the Phase 1        │
│  Python service exists)               │
└──────────────────────────────────────┘
```

**Key design decisions:**
- **Zero-cost by default** — every live feature uses either the user's own free HF inference credits or genuine on-device compute. Nothing requires a paid API key to try.
- **RLS is the real security boundary**, not client-side gating. This is a static export (GitHub Pages) with no server, so there's no middleware layer — Postgres Row Level Security enforces access control regardless of what the client does.
- **Rule-as-Code** — every regulation/heuristic is a plain JS object; adding one is pushing to an array, not refactoring core logic.

---

## Quick Start

```bash
git clone https://github.com/Aryanshanu/live-ai-audit-playground.git
cd live-ai-audit-playground
npm install
npm run dev
```

Open [http://localhost:3000/live-ai-audit-playground](http://localhost:3000/live-ai-audit-playground).

```bash
npm run build   # static output to ./out/ — GitHub Pages or any static host
```

---

## Project Structure

```
live-ai-audit-playground/
├── ROADMAP.md                       # Phased plan toward broader parity
├── BENCHMARKS.md                    # Detailed live comparison vs. competitors
├── services/rai-agent/              # Python analysis service (FastAPI + Docker)
│   ├── main.py                      #   /checks/modelscan · /checks/fairness · /checks/explainability
│   ├── Dockerfile                   #   Deploys via Coolify on a Vultr Mumbai VPS
│   └── README.md                    #   Deploy steps + honest limitations per check
├── src/
│   ├── app/page.jsx                 # Mode switcher: Sandbox ↔ HF Model Scanner
│   ├── components/
│   │   ├── auth/                    # Real Supabase Auth (AuthForm, AuthGate)
│   │   ├── SandboxWorkspace.jsx      # Free-text architecture input
│   │   ├── ComplianceReportPanel.jsx # HF model audit results
│   │   ├── DynamicSecurityPanel.jsx  # Live probe suite + remediation agent + registry/escalation
│   │   ├── DataQualityUpload.jsx     # Real CSV fairness + quality analysis
│   │   ├── BrowserClassifierPanel.jsx# In-browser zero-shot classifier
│   │   ├── SemanticAuditPanel.jsx    # AI-powered semantic audit
│   │   └── UnifiedGovernanceScore.jsx# The evidence-weighted composite score
│   └── lib/
│       ├── rules.js / auditEngine.js       # The two heuristic rule engines
│       ├── evidenceTiers.js                # The shared honesty taxonomy
│       ├── livePromptProbe.js              # Real live security probes
│       ├── semanticAuditEngine.js          # Real LLM-powered semantic audit
│       ├── dataQualityAnalyzer.js          # Real disparate-impact + data quality math
│       ├── browserClassifier.js            # In-browser transformers.js classifier
│       ├── githubRegistry.js / githubEscalation.js  # GitHub-backed registry + HITL
│       ├── modelCardCompleteness.js        # Real Model Cards standard scorer
│       ├── api/raiEngine.js                # Caller for the Python service (contract-verified)
│       └── supabase/                       # Real backend: client, auth, persistence
```

---

## What GOV.AX doesn't do (yet)

Each deferral has a stated gate — see [DECISIONS.md](DECISIONS.md).


Stated plainly, because a governance tool that overstates itself is worse than none:

- **No production drift/observability at scale** — Fiddler's core strength. Planned, not built.
- **No inline firewall** blocking live model traffic — Cisco AI Defense's core strength. Planned, not built.
- **No stage-gate approval workflows or SIEM export.**
- **Regulatory mapping is static text on 9 rules**, not a versioned, maintained policy engine. Credo AI employs a legal team for this; the planned counter is regulation-as-code with community governance, which does not exist yet.
- **The Python analysis service is not deployed** — three real tested endpoints exist and none are reachable.

We also will not match incumbents on brand trust, enterprise sales, 24/7 support, or legal staffing. The counters are self-hosting, auditability, and zero cost — not pretending otherwise. See [BENCHMARKS.md](BENCHMARKS.md).

## Security & Privacy

- **Client-side heuristics run entirely in your browser** — the Sandbox mode's keyword engine never leaves your tab.
- **Live features use your own credentials** — HF tokens for inference probes, GitHub tokens for registry/escalation — passed directly to the respective API, never stored or proxied through any GOV.AX-controlled server.
- **The Supabase backend is real infrastructure with real RLS** — verified with zero security-advisor findings, but genuinely new and genuinely untested by real users. Treat accordingly until it has real production hours behind it.

---

## Contributing / Adding Rules

The sandbox engine uses a plain registry pattern — adding a rule is pushing an object to `RULE_REGISTRY` in `src/lib/auditEngine.js`, no core refactor needed. See `ROADMAP.md` for the larger architectural direction (the Python analysis service, multi-agent swarm, and continuous monitoring phases) before starting anything bigger than a single rule.

---

## License

MIT License — see [LICENSE](LICENSE).

---

<div align="center">
  <strong>⚖️ GOV.AX</strong> — honest about what's real, working on making more of it real.
</div>
