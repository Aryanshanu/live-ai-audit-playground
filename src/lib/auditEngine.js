/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CORE.GOV — Multi-Market Dual-Engine Sandbox (US + India + UK)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Universal Architecture Rules Registry for US Enterprise Market Dominance
 * & Global Compliance (FTC Disgorgement, US AI Bill of Rights, CCPA/CPRA,
 * India DPDP Act 2023, and UK AI Whitepaper Framework).
 */

const RULE_REGISTRY = [
  // ================= US ENTERPRISE MARKET LAYER =================
  {
    id: "US-FTC-DISGORGEMENT",
    framework: "us",
    pillar: "Algorithmic Fairness & FTC Compliance",
    keywords: ["scraped without consent", "copyrighted data", "unverified training", "shadow scraping", "unverified data"],
    negativeKeywords: ["clean provenance", "licensed data", "data lineage tool", "data lineage"],
    severity: "CRITICAL",
    message: "WARNING: High risk of FTC Algorithmic Disgorgement. Training models on data lacking clear provenance can force total model destruction.",
    remediation: "Implement strict data lineage logging. Quarantine unverified training vectors immediately."
  },
  {
    id: "US-BILL-OF-RIGHTS-01",
    framework: "us",
    pillar: "Algorithmic Discrimination Protection",
    keywords: ["automated credit", "hiring filter", "resume score", "insurance pricing", "credit analysis"],
    negativeKeywords: ["bias audit", "fairness mitigation", "disparate impact analysis", "disparate impact"],
    severity: "CRITICAL",
    message: "High-risk automated profiling detected under US Blueprint guidelines without explicit disparate impact evaluations.",
    remediation: "Execute a third-party algorithmic bias audit and publish a transparent disparate impact mitigation report."
  },
  {
    id: "US-CCPA-CPRA",
    framework: "us",
    pillar: "US State-Level Privacy (CA/TX/CO)",
    keywords: ["sell data", "monetize profile", "cross-monetize", "share user vector", "cross-context tracking", "monetize"],
    negativeKeywords: ["do not sell button", "opt-out architecture", "global privacy control", "gpc"],
    severity: "CRITICAL",
    message: "Data distribution parameters violate California (CCPA/CPRA), Texas, and Colorado data protection mandates on consumer profiling.",
    remediation: "Inject an explicit 'Do Not Sell or Share My Personal Info' architectural link and respect browser Global Privacy Control (GPC) signals."
  },

  // ================= GLOBAL COMPLIANCE LAYER =================
  {
    id: "DPDP-SEC-07",
    framework: "india",
    pillar: "India DPDP Purpose Limitation",
    keywords: ["indefinitely", "retain forever", "logs permanent", "store continuous", "held indefinitely"],
    negativeKeywords: ["purge policy", "auto-delete", "cron job", "ttl", "retention limit"],
    severity: "CRITICAL",
    message: "Data architecture retains customer metrics indefinitely, directly breaking India's DPDP storage limits.",
    remediation: "Configure a strict time-to-live (TTL) framework to systematically drop database data 30 days post-inference."
  },
  {
    id: "DPDP-SEC-06",
    framework: "india",
    pillar: "India DPDP Notice & Consent",
    keywords: ["track location", "harvest", "scraped", "biometric", "track user"],
    negativeKeywords: ["consent screen", "explicit consent", "opt-in", "user consent"],
    severity: "HIGH",
    message: "Data extraction architecture tracking user metrics lacks programmatic indicators verifying multi-lingual explicit consent hooks under DPDP Act.",
    remediation: "Deploy verified multi-lingual opt-in consent mechanisms supporting regional languages."
  },
  {
    id: "UK-PRO-INNOVATION",
    framework: "uk",
    pillar: "UK Redress & Contestability",
    keywords: ["black-box", "uncontestable", "opaque logic", "un-auditable"],
    negativeKeywords: ["human review", "contest button", "xai", "human-in-the-loop"],
    severity: "HIGH",
    message: "Autonomous evaluation pipeline lacks contestability mechanics under UK AI whitepaper guidelines.",
    remediation: "Deploy a direct human-in-the-loop fallback endpoint allowing end-users to challenge automated model decisions."
  }
];

/**
 * Runs the heuristic audit engine on raw user architecture text against active markets.
 *
 * @param {string} text - Raw input text describing architecture or pipeline
 * @param {Array<string>} activeMarkets - Selected framework markets (e.g. ['us', 'india', 'uk'])
 * @returns {{ score: number, issues: Array }}
 */
export function runAuditEngine(text, activeMarkets = ['us', 'india']) {
  if (!text || !text.trim()) {
    return { score: 100, issues: [] };
  }

  const normalizedText = text.toLowerCase();
  let triggeredIssues = [];
  let baseScore = 100;

  // Evaluate only against regions chosen by the developer
  const targetRules = RULE_REGISTRY.filter((rule) =>
    activeMarkets.includes(rule.framework)
  );

  targetRules.forEach((rule) => {
    const containsTrigger = rule.keywords.some((kw) =>
      normalizedText.includes(kw)
    );
    const lacksMitigation = !rule.negativeKeywords.some((neg) =>
      normalizedText.includes(neg)
    );

    if (containsTrigger && lacksMitigation) {
      triggeredIssues.push({
        ruleId: rule.id,
        framework: rule.framework,
        pillar: rule.pillar,
        severity: rule.severity,
        message: rule.message,
        remediation: rule.remediation,
      });

      baseScore -= rule.severity === 'CRITICAL' ? 25 : 15;
    }
  });

  return {
    score: Math.max(0, baseScore),
    issues: triggeredIssues,
  };
}
