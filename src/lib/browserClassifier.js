/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CORE.GOV — In-Browser Governance Classifier (transformers.js)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Every other live-testing feature in this app (the security probes, the
 * semantic audit) requires the user's own HF token and makes a network
 * call to a remote model. This one doesn't need either: it downloads a
 * real, open-source zero-shot classification model
 * (Xenova/distilbert-base-uncased-mnli, ONNX-converted for the browser)
 * ONCE, caches it, and then classifies text entirely on-device via
 * WebAssembly — no token, no per-call network round-trip, genuinely
 * real-time after that first load.
 *
 * Package loading: this does NOT bundle @huggingface/transformers via npm.
 * After three different real webpack failures trying to force it through
 * Next.js's bundler (native .node binaries pulled in via a require.context
 * pattern, wrong package.json export condition resolved, and finally
 * onnxruntime-web's own internal worker chunk using import.meta.url in a
 * way webpack's chunk-splitting couldn't parse), the correct fix is to
 * stop fighting the bundler: this loads the library as a genuine runtime
 * ES module from a CDN, exactly as the library's own official browser
 * demo does (huggingface.co/spaces/.../zero-shot-classification.html
 * uses the identical `import ... from 'https://cdn.jsdelivr.net/npm/...'`
 * pattern). The `webpackIgnore` magic comment tells webpack to leave this
 * import alone at build time; the browser's native module loader handles
 * it at runtime, with zero bundling involved.
 */

const MODEL_ID = 'Xenova/distilbert-base-uncased-mnli';
const CDN_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.7.6';

/**
 * HONEST LIMITATIONS:
 * - First run downloads ~67MB (quantized ONNX weights) — not instant on
 *   a slow connection, though it caches after that.
 * - This sandbox has no network path to huggingface.co or jsdelivr.net,
 *   so the actual CDN import, model download, and inference have NEVER
 *   been executed end-to-end here. This needs a real-browser smoke test
 *   before being trusted — the earlier npm-bundled version failed three
 *   different ways at build time, which this approach avoids structurally
 *   (no build-time bundling at all), but "avoids the build-time failure
 *   mode" is not the same claim as "verified working."
 * - Zero-shot classification with a general-purpose MNLI model is a
 *   different (and generally weaker) kind of evidence than a model
 *   fine-tuned specifically for this task — treat findings as a fast
 *   triage signal, not a verdict.
 */

const RISK_LABELS = [
  'prompt injection vulnerability',
  'personal data privacy violation',
  'algorithmic bias or discrimination',
  'lack of human oversight',
  'unsafe or harmful content risk',
  'data quality or drift issue',
  'unfair or predatory pricing',
];

let classifierPromise = null;

/**
 * Lazily loads and caches the classifier pipeline. Dynamic import keeps
 * this heavy, browser-only library out of the server-rendered bundle
 * path entirely — it's only ever fetched when a client actually calls
 * this function.
 */
async function getClassifier(onProgress) {
  if (!classifierPromise) {
    classifierPromise = (async () => {
      const { pipeline } = await import(/* webpackIgnore: true */ CDN_URL);
      return pipeline('zero-shot-classification', MODEL_ID, {
        progress_callback: onProgress,
      });
    })();
  }
  return classifierPromise;
}

/**
 * Classifies text against governance risk categories entirely in-browser.
 *
 * @param {string} text
 * @param {function} onProgress - optional, receives transformers.js's
 *   raw progress events (includes {status, file, progress, loaded, total})
 * @returns {Promise<Array<{ruleId, layer, evidenceType, severity, message, remediation}>>}
 */
export async function classifyGovernanceRisk(text, onProgress) {
  if (!text || !text.trim()) return [];

  const classifier = await getClassifier(onProgress);
  const result = await classifier(text, RISK_LABELS, { multi_label: true });

  // result: {sequence, labels: [...sorted by score desc], scores: [...]}
  const findings = [];
  result.labels.forEach((label, idx) => {
    const score = result.scores[idx];
    if (score > 0.6) {
      findings.push({
        ruleId: `LOCAL-ML-${label.replace(/\s+/g, '-').toUpperCase()}`,
        layer: mapLabelToLayer(label),
        evidenceType: 'local_inference',
        severity: score > 0.85 ? 'HIGH' : 'MEDIUM',
        message: `In-browser classifier flagged "${label}" with ${(score * 100).toFixed(0)}% confidence.`,
        remediation: 'This is a fast triage signal from a general-purpose model, not a specific citation — investigate manually before treating it as confirmed.',
        clause: 'Local ML Inference (zero-shot)',
      });
    }
  });

  return findings;
}

function mapLabelToLayer(label) {
  if (label.includes('bias') || label.includes('discrimination')) return 'rai';
  if (label.includes('injection') || label.includes('harmful')) return 'security';
  if (label.includes('privacy')) return 'legal';
  if (label.includes('drift') || label.includes('quality')) return 'quality';
  if (label.includes('oversight')) return 'legal';
  if (label.includes('pricing')) return 'rai';
  return 'legal';
}
