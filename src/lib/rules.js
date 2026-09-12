/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GOV.AX — Rule-as-Code Governance Engine
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Translates India's DPDP Act 2023 and the PSA
 * Techno-Legal AI Framework 2024 into deterministic,
 * executable client-side validations.
 *
 * Architecture: Unified Registry Pattern
 * Adding a new regulation = pushing a new object
 * into the GOVERNANCE_RULES array. Zero core changes.
 */

// ── Permissive License Registry ──
const PERMISSIVE_LICENSES = [
  'mit', 'apache-2.0', 'bsd-2-clause', 'bsd-3-clause',
  'cc-by-4.0', 'cc-by-sa-4.0', 'llama3', 'llama3.1',
  'llama3.2', 'llama3.3', 'gemma', 'openrail', 'openrail++',
  'bigscience-openrail-m', 'creativeml-openrail-m',
  'artistic-2.0', 'wtfpl', 'unlicense', 'zlib', 'isc',
];

// ── Alignment Keywords ──
const ALIGNMENT_KEYWORDS = [
  'instruct', 'chat', 'safe', 'rlhf', 'dpo',
  'aligned', 'guarded', 'censored',
];

// ── Governance Rules Matrix ──
const GOVERNANCE_RULES = [
  {
    id: 'DPDP-01',
    pillar: 'Privacy & Minor Protection',
    regulation: 'DPDP Act — Section 6',
    severity: 'CRITICAL',
    message:
      'Behavioral profiling of minors detected. DPDP Act strictly prohibits targeted tracking and monitoring of children under 18.',
    remediation:
      'Implement verified parental consent gates. DPDP Act strictly bars targeted profiling of children.',
    evaluate: (input) =>
      input.minorData === true && input.behavioralTracking === true,
  },
  {
    id: 'DPDP-02',
    pillar: 'Data Sovereignty',
    regulation: 'DPDP Act — Section 16',
    severity: 'HIGH',
    message:
      'Data pipeline architecture routes user vectors into prohibited jurisdictions while processing minor data.',
    remediation:
      'Update cloud infrastructure configuration to utilize regional instances anchored exclusively in-country.',
    evaluate: (input) =>
      input.crossBorder === true && input.minorData === true,
  },
  {
    id: 'DPDP-03',
    pillar: 'Data Lineage & Provenance',
    regulation: 'DPDP Act — Section 7',
    severity: 'MEDIUM',
    message:
      'Model card license field is unknown or undefined. Undefined licenses trigger IP compliance flags under data provenance mandates.',
    remediation:
      'Verify model architecture weights provenance. Contact the model publisher for explicit licensing clarification.',
    evaluate: (_input, meta) =>
      !meta.license || meta.license === 'unknown' || meta.license.trim() === '',
  },
  {
    id: 'PSA-01',
    pillar: 'Transparency & Fairness',
    regulation: 'PSA Framework — Pillar 1',
    severity: 'CRITICAL',
    message:
      'Commercial deployment of restricted or non-commercial open-weights risks catastrophic licensing lawsuits under PSA Transparency Guidelines.',
    remediation:
      'Switch deployment engine to an explicit open-source baseline model like Llama-3 or Mistral with permissive licensing.',
    evaluate: (input, meta) => {
      if (input.useCase !== 'customer-facing') return false;
      const license = (meta.license || '').toLowerCase().trim();
      if (!license || license === 'unknown') return true;
      return !PERMISSIVE_LICENSES.some((p) => license.includes(p));
    },
  },
  {
    id: 'PSA-02',
    pillar: 'Safety & Alignment',
    regulation: 'PSA Framework — Pillar 6',
    severity: 'HIGH',
    message:
      'Base models lack instruction fine-tuning and are highly prone to adversarial prompts and hallucinations in customer-facing contexts.',
    remediation:
      'Swap the core repository configuration targeting a designated alignment model ending in -Instruct or -Chat.',
    evaluate: (input, meta) => {
      if (input.useCase !== 'customer-facing') return false;
      const idLower = (input.modelId || '').toLowerCase();
      const tags = (meta.tags || []).map((t) => t.toLowerCase());
      const hasInId = ALIGNMENT_KEYWORDS.some((k) => idLower.includes(k));
      const hasInTags = ALIGNMENT_KEYWORDS.some((k) =>
        tags.some((t) => t.includes(k)),
      );
      return !hasInId && !hasInTags;
    },
  },
  {
    id: 'PSA-03',
    pillar: 'Accountability & Inclusivity',
    regulation: 'PSA Framework — Pillar 2',
    severity: 'HIGH',
    message:
      'Customer-facing deployment processing minor data requires enhanced accountability safeguards and impact assessments.',
    remediation:
      'Deploy age-verification gates and implement a Data Protection Impact Assessment (DPIA) before production launch.',
    evaluate: (input) =>
      input.minorData === true && input.useCase === 'customer-facing',
  },
];

// ── Severity Weights ──
const SEVERITY_WEIGHTS = {
  CRITICAL: 35,
  HIGH: 25,
  MEDIUM: 15,
};

// ── Core Evaluation Function ──
/**
 * Evaluates a model deployment configuration against the
 * full governance rules matrix.
 *
 * @param {Object} input - User form inputs
 * @param {string} input.modelId - Hugging Face model identifier
 * @param {string} input.useCase - Deployment use-case category
 * @param {boolean} input.minorData - Processes data of minors
 * @param {boolean} input.behavioralTracking - Behavioral monitoring enabled
 * @param {boolean} input.crossBorder - Cross-border data transfer
 * @param {Object} modelMeta - Normalized metadata from HF API
 * @returns {{ score: number, results: Array }}
 */
export function evaluateCompliance(input, modelMeta) {
  const startTime = performance.now();

  const results = GOVERNANCE_RULES.map((rule) => {
    const failed = rule.evaluate(input, modelMeta);
    return {
      id: rule.id,
      pillar: rule.pillar,
      regulation: rule.regulation,
      severity: rule.severity,
      status: failed ? 'fail' : 'pass',
      message: failed
        ? rule.message
        : `Compliant with ${rule.regulation}.`,
      remediation: failed ? rule.remediation : null,
    };
  });

  const maxDeductions = GOVERNANCE_RULES.reduce(
    (sum, r) => sum + SEVERITY_WEIGHTS[r.severity],
    0,
  );
  const actualDeductions = results
    .filter((r) => r.status === 'fail')
    .reduce((sum, r) => sum + SEVERITY_WEIGHTS[r.severity], 0);

  const score = Math.max(
    0,
    Math.min(100, Math.round(100 - (actualDeductions / maxDeductions) * 100)),
  );

  const elapsed = performance.now() - startTime;
  /* istanbul ignore next */
  if (typeof console !== 'undefined') {
    console.log(`[GOV.AX] Rule engine evaluated in ${elapsed.toFixed(2)}ms`);
  }

  return { score, results, evaluationTimeMs: elapsed };
}

export { GOVERNANCE_RULES, SEVERITY_WEIGHTS };
