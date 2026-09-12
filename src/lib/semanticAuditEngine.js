/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CORE.GOV — Semantic Audit Engine (Live AI Analysis)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * WHY THIS EXISTS: the 9-rule keyword engine in auditEngine.js can only
 * catch a violation if someone already wrote a matching keyword for it.
 * Real-world test scenarios (training-data bias, missing human oversight,
 * proxy discrimination, model staleness, PII-to-third-party-API, etc.)
 * proved this empirically — five deliberately catastrophic scenarios all
 * scored 100% clean because none of their specific phrasing matched any
 * of the 9 rules. That's not a bug in the matcher; it's the structural
 * ceiling of keyword matching itself.
 *
 * This is the real fix: an actual LLM reads the description and reasons
 * about it the way a human auditor would, instead of scanning for
 * pre-written phrases. Same zero-cost pattern as the live security
 * probes — the user's own HF token, their free monthly inference
 * credits, nothing billed to GOV.AX, no backend.
 *
 * This does NOT replace the keyword engine — it runs alongside it as an
 * opt-in, clearly-labeled "live_dynamic_test" tier signal (an LLM's
 * semantic judgment is real evidence, but it's not infallible either:
 * it can miss things, hallucinate a citation, or disagree with a human
 * reviewer — treat it as a second, better-informed opinion, not a
 * verdict).
 */

const AUDIT_SYSTEM_PROMPT = `You are a strict AI governance auditor. You will be given a description of an AI system. Identify concrete governance failures across these four pillars: rai (bias, fairness, proxy discrimination), security (data leakage, injection, excessive privilege, physical/adversarial vulnerability), quality (training-serving skew, staleness, missing/erratic data), and legal (human oversight, kill-switches, third-party data risk, regulatory classification).

Respond with ONLY a JSON array, no prose before or after, no markdown code fences. Each element must have exactly these fields:
{"pillar": "rai"|"security"|"quality"|"legal", "severity": "CRITICAL"|"HIGH"|"MEDIUM", "finding": "specific description of what's wrong, citing the exact detail from the text", "remediation": "specific, actionable fix"}

If you find nothing concerning, respond with an empty array: []
List every real issue you find — do not limit yourself to a fixed number, and do not invent issues that aren't actually supported by the text.`;

function extractJsonArray(content) {
  // Models sometimes wrap JSON in markdown fences or add stray prose
  // despite instructions — strip fences and grab the first [...] block.
  const stripped = content.replace(/```json\s*|```\s*/g, '').trim();
  const match = stripped.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Model did not return a parseable JSON array.');
  return JSON.parse(match[0]);
}

/**
 * @param {string} description - the free-text architecture/system description
 * @param {string} modelId - which model does the auditing (the AUDITOR's
 *   brain, independent of any system being described)
 * @param {string} hfToken - the user's own HF token
 * @returns {Promise<{findings: Array, rawResponse: string}>}
 */
export async function runSemanticAudit(description, modelId, hfToken) {
  if (!hfToken) {
    throw new Error('A Hugging Face token is required for the semantic audit — it makes a real live call, unlike the keyword engine.');
  }
  if (!description || !description.trim()) {
    throw new Error('Nothing to audit — paste a system description first.');
  }

  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: modelId,
      messages: [
        { role: 'system', content: AUDIT_SYSTEM_PROMPT },
        { role: 'user', content: description },
      ],
      max_tokens: 1200,
      temperature: 0.2, // low temperature — this should be consistent, not creative
    }),
  });

  if (response.status === 401) throw new Error('HF token was rejected (401). Check that it\'s valid.');
  if (response.status === 402 || response.status === 429) throw new Error(`Free inference credit/rate limit reached (HTTP ${response.status}).`);
  if (response.status === 404 || response.status === 400) throw new Error(`No inference provider currently serves this model via chat-completions (HTTP ${response.status}). Try a well-known instruct model.`);
  if (!response.ok) throw new Error(`Unexpected response from HF (HTTP ${response.status}).`);

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content || '';

  let findings;
  try {
    findings = extractJsonArray(content);
  } catch (err) {
    throw new Error(`The model's response couldn't be parsed as structured findings: ${err.message}`);
  }

  // Defensive validation — don't trust the model's output shape blindly
  const validated = findings.filter(
    (f) => f && typeof f.finding === 'string' && typeof f.pillar === 'string' && typeof f.severity === 'string'
  ).map((f, idx) => ({
    ruleId: `AI-SEMANTIC-${idx + 1}`,
    layer: ['security', 'quality', 'rai', 'legal'].includes(f.pillar) ? f.pillar : 'legal',
    evidenceType: 'live_dynamic_test',
    severity: ['CRITICAL', 'HIGH', 'MEDIUM'].includes(f.severity) ? f.severity : 'MEDIUM',
    message: f.finding,
    remediation: f.remediation || 'No specific remediation provided by the model.',
    clause: 'AI Semantic Judgment (not a cited regulation)',
  }));

  return { findings: validated, rawResponse: content };
}
