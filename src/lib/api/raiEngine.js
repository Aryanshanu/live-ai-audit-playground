/**
 * Frontend caller for the RAI Agent Service (services/rai-agent/).
 *
 * Every shape here matches the ACTUAL Pydantic models in main.py, which
 * were tested end-to-end via FastAPI's TestClient before this file was
 * written — not a guessed/hypothetical API shape. In particular:
 *
 * - `runFairnessCheck` takes y_true/y_pred/sensitive_features directly,
 *   because the real endpoint audits decisions a model already made —
 *   it does not accept a dataset_id and compute predictions itself.
 * - `small_sample_warning` is a STRING (an informative message) or null,
 *   never a boolean — that's the whole point of it. A boolean would
 *   throw away the message itself (e.g. "Smallest group has only 87
 *   rows — below 1000, a 'non-compliant' result here can be sampling
 *   noise rather than real bias..."), which is real, tested behavior,
 *   not a hypothetical flag.
 * - group_a/group_b are PER-METRIC (inside each entry of `metrics`),
 *   not global top-level fields — a single audit can have a different
 *   worst/best group pairing for different metrics in principle, even
 *   though in the current implementation both metrics share the same
 *   pairing (computed once from selection rate).
 *
 * No TypeScript here deliberately — this project has no TypeScript
 * toolchain (no tsconfig.json, no `typescript` dependency), same reason
 * src/lib/supabase/client.js is plain JS instead of client.ts.
 */

const ENGINE_BASE_URL = process.env.NEXT_PUBLIC_RAI_ENGINE_URL;

function requireEngineUrl() {
  if (!ENGINE_BASE_URL) {
    throw new Error(
      'NEXT_PUBLIC_RAI_ENGINE_URL is not configured — the RAI Agent Service has not been deployed yet, or the env var was not set at build time (remember: NEXT_PUBLIC_* vars must be present at BUILD time for a static export, not just runtime).'
    );
  }
  return ENGINE_BASE_URL;
}

async function handleResponse(response) {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Request failed with status ${response.status}`);
  }
  return response.json();
}

/**
 * @param {object} params
 * @param {string} [params.auditId] - if provided, the service persists results to rai_findings/fairness_metrics
 * @param {string} params.protectedAttribute - display name, e.g. "gender"
 * @param {number[]} params.yTrue - ground truth labels
 * @param {number[]} params.yPred - the model's actual predictions
 * @param {string[]} params.sensitiveFeatures - group label per row, same length as yTrue/yPred
 * @returns {Promise<{
 *   protected_attribute: string,
 *   n_rows: number,
 *   n_groups: number,
 *   metrics: Array<{metric_type: string, value: number, group_a: string, group_b: string, compliant: boolean}>,
 *   per_group_selection_rate: Record<string, number>,
 *   small_sample_warning: string | null,
 * }>}
 */
export async function runFairnessCheck({ auditId, protectedAttribute, yTrue, yPred, sensitiveFeatures }) {
  const baseUrl = requireEngineUrl();
  const response = await fetch(`${baseUrl}/checks/fairness`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audit_id: auditId ?? null,
      protected_attribute: protectedAttribute,
      y_true: yTrue,
      y_pred: yPred,
      sensitive_features: sensitiveFeatures,
    }),
  });
  return handleResponse(response);
}

/**
 * @param {object} params
 * @param {string} params.modelId - Hugging Face repo id, e.g. "org/model-name" — NOT a URL
 * @param {string} [params.auditId]
 * @returns {Promise<{
 *   model_id: string,
 *   scanned_at: string,
 *   clean: boolean,
 *   raw_output: string,
 *   findings: Array<{severity: string, description: string}>,
 *   known_limitations: string,
 * }>}
 */
export async function runModelScan({ modelId, auditId }) {
  const baseUrl = requireEngineUrl();
  const response = await fetch(`${baseUrl}/checks/modelscan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model_id: modelId, audit_id: auditId ?? null }),
  });
  return handleResponse(response);
}

/**
 * @param {object} params
 * @param {string} [params.auditId]
 * @param {string[]} params.featureNames
 * @param {number[][]} params.featureValues - rows x features, one value per featureName
 * @param {number[]} params.predictions - the black-box model's actual predictions for those rows
 * @returns {Promise<{
 *   method: string,
 *   n_rows: number,
 *   n_features: number,
 *   fidelity: number,
 *   feature_importances: Array<{feature: string, mean_abs_shap: number, rank: number}>,
 *   low_fidelity_warning: string | null,
 *   methodology_note: string,
 * }>}
 *
 * NOTE on `fidelity`: this is CROSS-VALIDATED, not train-set accuracy —
 * a real bug was caught in testing where train-set fidelity reported
 * 1.0 for pure-noise predictions (RandomForest memorizes its training
 * set). Any UI showing this number should also surface
 * `low_fidelity_warning` when present: a SHAP explanation of a
 * surrogate that doesn't match the real model is a confident-looking
 * wrong answer, which is worse than no answer.
 */
export async function runExplainabilityCheck({ auditId, featureNames, featureValues, predictions }) {
  const baseUrl = requireEngineUrl();
  const response = await fetch(`${baseUrl}/checks/explainability`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      audit_id: auditId ?? null,
      feature_names: featureNames,
      feature_values: featureValues,
      predictions,
    }),
  });
  return handleResponse(response);
}

/**
 * @returns {Promise<{status: string, supabase_connected: boolean}>}
 */
export async function checkEngineHealth() {
  const baseUrl = requireEngineUrl();
  const response = await fetch(`${baseUrl}/health`);
  return handleResponse(response);
}
