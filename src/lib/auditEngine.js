/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GOV.AX — Dual-Layer Lexical & Heuristic Audit Engine
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Scans raw architecture descriptions, system prompts, data workflows,
 * and model cards for compliance liabilities under:
 *   1. India's Digital Personal Data Protection (DPDP) Act 2023
 *   2. MeitY's IndiaAI 8 Foundational Principles
 *
 * Runs 100% client-side inside browser memory.
 */

const RULE_REGISTRY = [
  {
    id: "DPDP-SEC-06",
    framework: "dpdp",
    pillar: "Notice & Consent",
    keywords: ["track", "collect", "harvest", "scraped", "scrape", "location", "biometric"],
    negativeKeywords: ["consent screen", "explicit consent", "opt-in", "user consent", "consent manager"],
    severity: "CRITICAL",
    message: "Data extraction architecture tracking user metrics lacks programmatic indicators verifying cross-language consent hooks.",
    remediation: "Deploy multi-lingual explicit opt-in consent modals supporting regional languages under the 8th Schedule of the Indian Constitution."
  },
  {
    id: "DPDP-SEC-07",
    framework: "dpdp",
    pillar: "Purpose & Storage Limitation",
    keywords: ["indefinitely", "retain forever", "logs permanent", "store continuous", "indefinite retention", "held indefinitely"],
    negativeKeywords: ["purge policy", "auto-delete", "cron job", "ttl", "retention limit", "erased after"],
    severity: "CRITICAL",
    message: "Data tracking architecture retains diagnostic telemetry indefinitely, violating the strict DPDP storage limitation framework.",
    remediation: "Implement a time-to-live (TTL) configuration setting data objects to automatically purge post-inference."
  },
  {
    id: "DPDP-SEC-16",
    framework: "dpdp",
    pillar: "Cross-Border Transfer",
    keywords: ["foreign server", "overseas", "global bucket", "us-east", "eu-west", "cross-border", "offshore"],
    negativeKeywords: ["in-country", "sovereign cloud", "local data center", "mumbai region", "india cloud"],
    severity: "HIGH",
    message: "Data pipeline routes sensitive user vectors or personal data into offshore jurisdictions without localized sovereign backup.",
    remediation: "Reconfigure cloud routing parameters to anchor primary data stores within sovereign Indian cloud regions."
  },
  {
    id: "INDIAAI-PILLAR-02",
    framework: "indiaai",
    pillar: "Inclusivity & Diversity",
    keywords: ["english-centric", "standard dataset", "web-scraped data", "only english", "english only"],
    negativeKeywords: ["indic languages", "multilingual", "vernacular", "bhashini", "ai4bharat", "indic"],
    severity: "HIGH",
    message: "Model training parameters reveal standard English-centric scraping pipelines, creating high systemic bias indicators against non-urban demographics.",
    remediation: "Integrate synthetic variant balance matching pipelines utilizing open Indic repositories (e.g., AI4Bharat / Bhashini)."
  },
  {
    id: "INDIAAI-PILLAR-06",
    framework: "indiaai",
    pillar: "Transparency & Explainability",
    keywords: ["black-box", "black box", "proprietary weight", "hidden parameters", "un-auditable", "opaque"],
    negativeKeywords: ["xai", "explainable", "shap", "lime", "interpretability", "model card", "open-weights"],
    severity: "HIGH",
    message: "Pipeline leverages closed-source un-auditable black-box weights without localized explainable AI (XAI) instrumentation.",
    remediation: "Inject feature attribution logging tools (like SHAP or LIME telemetry frameworks) before pushing models to endpoint deployment."
  },
  {
    id: "INDIAAI-PILLAR-04",
    framework: "indiaai",
    pillar: "Safety & Misinformation Control",
    keywords: ["raw model", "unfiltered", "no moderation", "direct prompt", "un-aligned"],
    negativeKeywords: ["guardrails", "nemo guardrails", "safety filter", "content moderation", "output sanitizer", "instruct"],
    severity: "CRITICAL",
    message: "System routes user prompts directly into raw un-aligned inference endpoints without safety guardrails or content moderation layers.",
    remediation: "Deploy an intermediate moderation layer (e.g., NeMo Guardrails or Llama Guard) to filter out harmful or rogue generative outputs."
  }
];

/**
 * Runs the heuristic audit engine on raw user architecture description text.
 *
 * @param {string} text - Raw input text describing system architecture or workflow
 * @param {string} mode - 'dual' | 'dpdp' | 'indiaai'
 * @returns {{ score: number, issues: Array }} Evaluation result
 */
export function runAuditEngine(text, mode = 'dual') {
  if (!text || !text.trim()) {
    return { score: 100, issues: [] };
  }

  const normalizedText = text.toLowerCase();
  const triggeredIssues = [];
  let baseScore = 100;

  // Filter rules targeting selected evaluation scope
  const targetRules = RULE_REGISTRY.filter((rule) => {
    if (mode === 'dual') return true;
    return rule.framework === mode;
  });

  targetRules.forEach((rule) => {
    // Check if user text contains keyword signals
    const containsTrigger = rule.keywords.some((kw) => normalizedText.includes(kw));
    // Check if user has explicitly stated remediation/mitigation measures
    const lacksMitigation = !rule.negativeKeywords.some((neg) => normalizedText.includes(neg));

    if (containsTrigger && lacksMitigation) {
      triggeredIssues.push({
        ruleId: rule.id,
        framework: rule.framework,
        pillar: rule.pillar,
        severity: rule.severity,
        message: rule.message,
        remediation: rule.remediation,
      });

      // Deduct score based on severity
      baseScore -= rule.severity === 'CRITICAL' ? 25 : 15;
    }
  });

  return {
    score: Math.max(0, baseScore),
    issues: triggeredIssues,
  };
}
