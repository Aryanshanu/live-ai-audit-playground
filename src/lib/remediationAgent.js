/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CORE.GOV — Remediation Agent
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * The first genuinely agentic thing in this codebase: a real multi-step
 * loop where each step's output becomes the next step's input (memory),
 * running autonomously without a human between steps, to produce a final
 * artifact a human then reviews.
 *
 * WHY THIS IS SCOPED THE WAY IT IS:
 * OWASP's Top 10 for Agentic Applications (2026, ASI01-ASI10) defines
 * agentic risk in terms of goal hijacking, tool misuse, memory poisoning,
 * and privilege abuse — all of which require the agent to hold real tool
 * access, credentials, or the ability to act on external systems. This
 * agent deliberately has NONE of that: it only reads an issues list
 * already computed elsewhere and drafts TEXT. It cannot execute code,
 * call external APIs, modify files, or take any action a human hasn't
 * already reviewed. This isn't a workaround to avoid building "real"
 * agentic capability — it's the correct scope for a first agentic
 * feature in a governance tool: prove the loop works and stays legible
 * before ever considering giving it real-world tool access.
 *
 * COST: same as the live probes — uses the user's own HF token and free
 * monthly inference credits. 3 sequential calls per run.
 */

async function callHfChat(modelId, hfToken, messages, maxTokens = 200) {
  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${hfToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: modelId, messages, max_tokens: maxTokens }),
  });

  if (!response.ok) {
    throw new Error(`HF inference call failed (HTTP ${response.status}). Check your token and that this model is available via chat-completions.`);
  }
  const data = await response.json();
  return data?.choices?.[0]?.message?.content || '';
}

/**
 * Runs a 3-step autonomous remediation loop against the top issue in a
 * report: Plan (rank issues) -> Draft (write a fix) -> Critique (review
 * its own draft against the cited clause). Each step's real output feeds
 * the next step's prompt — genuine memory, not three independent calls.
 *
 * @param {Array} issues - the audit's issues list (any engine's shape,
 *   as long as items have {ruleId|id, pillar, message, clause|regulation})
 * @param {string} modelId - which model does the reasoning (the AGENT's
 *   brain — this is independent of whatever model was AUDITED)
 * @param {string} hfToken - the user's own HF token
 * @param {function} onStep - callback(stepName) fired as each step starts
 * @returns {Promise<{steps: Array<{name, output}>, finalRemediation: string}>}
 */
export async function runRemediationAgent(issues, modelId, hfToken, onStep) {
  if (!hfToken) {
    throw new Error('A Hugging Face token is required to run the remediation agent.');
  }
  if (!issues || issues.length === 0) {
    throw new Error('No issues to remediate — run an audit first.');
  }

  const steps = [];

  // ── Step 1: PLAN — rank issues by real remediation priority ──
  onStep?.('Planning: ranking issues by priority');
  const issueSummary = issues
    .slice(0, 8)
    .map((i, idx) => `${idx + 1}. [${i.severity}] ${i.ruleId || i.id} — ${i.message}`)
    .join('\n');

  const planOutput = await callHfChat(modelId, hfToken, [
    { role: 'system', content: 'You are a security/compliance remediation planner. Given a list of audit findings, identify which ONE finding should be fixed first and explain why in 2-3 sentences. Be concise and specific.' },
    { role: 'user', content: `Findings:\n${issueSummary}\n\nWhich one should be fixed first, and why?` },
  ]);
  steps.push({ name: 'Plan', output: planOutput });

  // ── Step 2: DRAFT — write a concrete remediation for the prioritized issue ──
  onStep?.('Drafting: writing a concrete remediation');
  const topIssue = issues[0];
  const draftOutput = await callHfChat(modelId, hfToken, [
    { role: 'system', content: 'You are a remediation engineer. Write a concrete, specific fix (a short config snippet, policy statement, or code change) for the given finding. Do not restate the problem — write the actual fix.' },
    { role: 'user', content: `Prioritization rationale from the planning step:\n${planOutput}\n\nFinding to fix: ${topIssue.message}\nCited clause: ${topIssue.clause || topIssue.regulation || 'N/A'}\n\nWrite the concrete fix.` },
  ], 250);
  steps.push({ name: 'Draft', output: draftOutput });

  // ── Step 3: CRITIQUE — the agent reviews its own draft ──
  onStep?.('Critiquing: reviewing the draft against the cited clause');
  const critiqueOutput = await callHfChat(modelId, hfToken, [
    { role: 'system', content: 'You are a skeptical reviewer. Check whether the drafted fix actually satisfies the cited clause. If it has a gap, say so specifically and suggest the missing piece in 2-3 sentences. If it looks sufficient, say so briefly.' },
    { role: 'user', content: `Cited clause: ${topIssue.clause || topIssue.regulation || 'N/A'}\nDrafted fix:\n${draftOutput}\n\nDoes this fix actually satisfy the clause? What's missing, if anything?` },
  ]);
  steps.push({ name: 'Self-Critique', output: critiqueOutput });

  return {
    steps,
    finalRemediation: draftOutput,
    reasoningModel: modelId,
  };
}
