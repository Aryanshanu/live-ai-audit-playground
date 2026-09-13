/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CORE.GOV — Model Card Completeness Scorer
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Previously "model card check" meant a handful of pass/fail rules
 * (license present, pipeline tag present). This computes an actual
 * completeness PERCENTAGE against the fields the Model Cards standard
 * (Mitchell et al., 2019, "Model Cards for Model Reporting") says a
 * responsibly documented model should have — not just license/pipeline,
 * but training data provenance, evaluation results, and language/scope
 * documentation, using the real fields HF's API actually exposes for
 * each (cardData.license, cardData.datasets, cardData.model-index /
 * cardData.metrics, cardData.language, tags, pipeline_tag).
 *
 * HONEST LIMITS: HF's `cardData` field is the YAML front-matter of the
 * model card, not the full README body. A model could have excellent
 * prose documentation in its README that isn't captured here at all —
 * this checks what's in the structured metadata, not full-text quality.
 */

const CRITERIA = [
  {
    key: 'license',
    label: 'License',
    weight: 20,
    check: (meta) => meta.license && meta.license !== 'unknown',
  },
  {
    key: 'pipeline',
    label: 'Task / Pipeline Tag',
    weight: 15,
    check: (meta) => meta.pipelineTag && meta.pipelineTag !== 'Not specified',
  },
  {
    key: 'library',
    label: 'Library / Framework',
    weight: 10,
    check: (meta) => meta.libraryName && meta.libraryName !== 'Unknown',
  },
  {
    key: 'tags',
    label: 'Descriptive Tags',
    weight: 10,
    check: (meta) => Array.isArray(meta.tags) && meta.tags.length >= 3,
  },
  {
    key: 'datasets',
    label: 'Training Data Documented',
    weight: 20,
    check: (meta) => Array.isArray(meta.cardData?.datasets) && meta.cardData.datasets.length > 0,
  },
  {
    key: 'evaluation',
    label: 'Evaluation Results Documented',
    weight: 15,
    check: (meta) =>
      Array.isArray(meta.cardData?.['model-index']) && meta.cardData['model-index'].length > 0,
  },
  {
    key: 'language',
    label: 'Language / Scope Documented',
    weight: 10,
    check: (meta) => Boolean(meta.cardData?.language),
  },
];

/**
 * @param {object} modelMeta - normalized metadata from fetchModelMetadata()
 * @returns {{score: number, criteria: Array<{key, label, met, weight}>}}
 */
export function scoreModelCardCompleteness(modelMeta) {
  const results = CRITERIA.map((c) => ({
    key: c.key,
    label: c.label,
    weight: c.weight,
    met: Boolean(c.check(modelMeta)),
  }));

  const totalWeight = CRITERIA.reduce((sum, c) => sum + c.weight, 0);
  const earnedWeight = results.filter((r) => r.met).reduce((sum, r) => {
    const criterion = CRITERIA.find((c) => c.key === r.key);
    return sum + criterion.weight;
  }, 0);

  return {
    score: Math.round((earnedWeight / totalWeight) * 100),
    criteria: results,
  };
}
