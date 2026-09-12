# ⚖️ GOV.AX — Live AI Audit Playground

> **Real-time, client-side AI model compliance auditing against India's DPDP Act 2023 & PSA AI Governance Framework 2024.**

[![Deploy to GitHub Pages](https://github.com/Aryanshanu/live-ai-audit-playground/actions/workflows/deploy.yml/badge.svg)](https://github.com/Aryanshanu/live-ai-audit-playground/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

---

## 🚀 What Is This?

**GOV.AX** transforms static, abstract legal texts into **executable, deterministic client-side code**. Instead of manual checklists and expensive consulting, this playground lets you:

1. **Input** any Hugging Face model ID
2. **Configure** deployment context (use-case, demographic exposure)
3. **Instantly receive** a scored compliance report against real sovereign regulations

**Zero servers. Zero databases. Zero data retention.** Everything runs in your browser tab.

---

## 🏛️ Regulations Implemented

### India's Digital Personal Data Protection Act (DPDP) 2023

| Rule | Section | What It Checks |
|------|---------|----------------|
| `DPDP-01` | Section 6 — Minor Protection | Behavioral profiling of children under 18 |
| `DPDP-02` | Section 16 — Data Sovereignty | Cross-border transfer of minor data |
| `DPDP-03` | Section 7 — Data Lineage | Unknown/undefined model license provenance |

### PSA Techno-Legal AI Governance Framework 2024

| Rule | Pillar | What It Checks |
|------|--------|----------------|
| `PSA-01` | Transparency & Fairness | Non-permissive license in customer-facing deployment |
| `PSA-02` | Safety & Alignment | Base (non-instruct) model in customer-facing context |
| `PSA-03` | Accountability & Inclusivity | Minor data in customer-facing deployment without safeguards |

---

## 🏗️ Architecture

```
[ Developer Web Browser ]
      │
      ├─► (1) Submits Form (Model ID + Use Case + Toggles)
      │
      ├─► (2) GET Request ──► [ Hugging Face Hub REST API ]
      │                         │
      │   ◄── Returns JSON ─────┘ (License, Tags, Pipeline, Downloads)
      │
      ├─► (3) In-Memory Rule Evaluation (React State) ──► DPDP / PSA Rules Matrix
      │
      └─► (4) Renders Live Dashboard ──► Split-Screen Compliance Report
```

**Key design decisions:**
- **Static Export** (`output: 'export'`) — no Node.js server required
- **Rule-as-Code** — regulations encoded as a JSON rule array; adding a new framework = pushing one object
- **Weighted Scoring** — CRITICAL (35pts), HIGH (25pts), MEDIUM (15pts) deduction weights
- **Multi-source License Detection** — checks `cardData.license`, then parses `tags` array

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- npm 10+

### Local Development

```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/live-ai-audit-playground.git
cd live-ai-audit-playground

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000/live-ai-audit-playground](http://localhost:3000/live-ai-audit-playground) in your browser.

### Production Build

```bash
npm run build
```

This outputs a fully static site to `./out/` — ready for GitHub Pages or any static host.

---

## 🧪 Verification Protocol

### Test Case 1: Critical Failure Scenario
1. Enter `openai-community/gpt2` (base model, MIT license)
2. Select **Customer-Facing Conversational Interface**
3. Enable **Processes data of minors**
4. Enable **Behavioral tracking**
5. Click **RUN AUDIT**
6. **Expected**: Score drops significantly. `DPDP-01` (CRITICAL) and `PSA-02` (HIGH) fire.

### Test Case 2: Compliant Scenario
1. Enter a model with `Instruct` in the name and a permissive license
2. Select **Internal Data Analytics**
3. Leave all toggles OFF
4. **Expected**: High compliance score, all rules pass.

### Test Case 3: API Error Handling
1. Enter `nonexistent/fake-model-xyz`
2. **Expected**: "Model Not Found" error panel with guidance.

---

## 📁 Project Structure

```
live-ai-audit-playground/
├── .github/workflows/deploy.yml    # CI/CD Pipeline
├── next.config.mjs                 # Static export + basePath
├── tailwind.config.js              # Cyberpunk theme
├── postcss.config.js
├── package.json
├── src/
│   ├── app/
│   │   ├── layout.jsx              # Root layout + nav
│   │   ├── page.jsx                # Home page entry
│   │   └── globals.css             # Dark mode theme
│   ├── components/
│   │   ├── AuditPlayground.jsx     # State orchestrator
│   │   ├── GovernanceInputPanel.jsx # Form inputs
│   │   ├── ComplianceReportPanel.jsx # Results dashboard
│   │   ├── ComplianceGauge.jsx     # SVG gauge
│   │   └── ToggleSwitch.jsx        # Accessible toggle
│   └── lib/
│       ├── huggingface.js          # HF API client
│       └── rules.js                # Rule-as-Code engine
└── README.md
```

---

## 🛡️ Security & Privacy

- **Zero Data Retention**: All state is volatile React memory. Closing the tab erases everything.
- **No Analytics/Tracking**: Zero telemetry, no cookies, no third-party scripts.
- **Token Anonymization**: Optional HF tokens are passed via local `Authorization` header only — never stored, logged, or forwarded.
- **Client-Side Only**: No server, no API proxy, no backend.

---

## 🔧 Adding New Rules

The engine uses a **Unified Registry Pattern**. To add a new regulation:

```javascript
// In src/lib/rules.js — just push to the array:
{
  id: 'EU-AI-01',
  pillar: 'Risk Classification',
  regulation: 'EU AI Act — Article 6',
  severity: 'CRITICAL',
  message: 'High-risk AI system requires conformity assessment.',
  remediation: 'Register system with national supervisory authority.',
  evaluate: (input, meta) => {
    // Your logic here
    return input.useCase === 'customer-facing' && someCondition;
  },
}
```

No core code changes. No refactoring. Just add and build.

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
  <br />
  <strong>⚖️ GOV.AX</strong> — Making AI governance clear, real-time, and actionable.
  <br />
  <sub>Built with Next.js · Tailwind CSS · Hugging Face Hub API</sub>
</div>
