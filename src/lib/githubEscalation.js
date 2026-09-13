/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CORE.GOV — Human-in-the-Loop Escalation (GitHub Issues as Ethics Board)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * The RFC asks for "programmatic escalation paths that auto-route
 * high-risk outputs... to an internal AI Ethics Board for review."
 * Previously, "human-in-the-loop" only existed as a keyword GOV.AX
 * checked for in someone else's prose — it never implemented escalation.
 *
 * This is the real implementation: when CRITICAL findings exist, this
 * files an actual GitHub Issue in a repo the user controls, tagged for
 * human review. That IS a genuine escalation mechanism — a real ticket
 * lands in a real queue a human has to look at — using free, real
 * infrastructure (GitHub Issues) instead of a database GOV.AX would
 * have to run itself.
 *
 * HONEST LIMITATIONS: this creates a ticket; it does not (and should
 * not) automatically block a deployment or take any other action.
 * Escalation-to-a-human is exactly the point — a tool that "auto-routes
 * to an Ethics Board" and then also auto-resolves itself isn't actually
 * putting a human in the loop.
 */

const GITHUB_API = 'https://api.github.com';

/**
 * Files a GitHub Issue summarizing CRITICAL/HIGH findings for human
 * review — the actual escalation ticket.
 */
export async function fileEthicsBoardIssue({ owner, repo, githubToken, findings, subjectLabel }) {
  if (!owner || !repo || !githubToken) {
    throw new Error('GitHub owner, repo, and token are all required to file an escalation issue.');
  }
  if (!findings || findings.length === 0) {
    throw new Error('No findings to escalate.');
  }

  const critical = findings.filter((f) => f.severity === 'CRITICAL' || f.severity === 'HIGH');
  if (critical.length === 0) {
    throw new Error('No CRITICAL/HIGH findings — escalation is reserved for findings that actually warrant human review.');
  }

  const body = [
    `## Governance Escalation: ${subjectLabel || 'Unlabeled Audit'}`,
    '',
    `Auto-filed by GOV.AX because ${critical.length} CRITICAL/HIGH finding(s) require human review.`,
    '',
    ...critical.map(
      (f, i) => `### ${i + 1}. [${f.severity}] ${f.ruleId || f.id}\n- **Finding:** ${f.message}\n- **Remediation:** ${f.remediation}\n- **Evidence tier:** ${f.evidenceType || 'unspecified'}`
    ),
    '',
    '---',
    '*This ticket is a human-review request, not an automated block. No action was taken automatically beyond filing this issue.*',
  ].join('\n');

  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/issues`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: `[Governance Escalation] ${subjectLabel || 'Audit'} — ${critical.length} finding(s) need review`,
      body,
    }),
  });

  if (response.status === 401) throw new Error('GitHub token was rejected (401). Check it has Issues: Write permission on this repo.');
  if (response.status === 404) throw new Error(`Repo ${owner}/${repo} not found or token lacks access (404).`);
  if (!response.ok) throw new Error(`GitHub API error (HTTP ${response.status}) while filing the escalation issue.`);

  const data = await response.json();
  return { issueUrl: data.html_url, issueNumber: data.number };
}
