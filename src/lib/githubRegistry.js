/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * CORE.GOV — GitHub-Backed Model Registry
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * The RFC asks for a "centralized" model registry with lineage tracking.
 * historyStore.js is per-browser localStorage — genuinely NOT centralized,
 * nothing shared across users or devices. This is the real fix: commit
 * each audit as a JSON file to a GitHub repo via the Contents API, using
 * the user's own GitHub token (same auth pattern already used elsewhere
 * in this project — a personal access token with repo write access).
 *
 * This is a genuine centralized registry: a GitHub repo IS a real,
 * shared, persistent data store, and git commit history gives real
 * lineage/versioning for free — every past audit for a model is a
 * retrievable commit, not just "the one most recent snapshot."
 *
 * COST: zero — GitHub API calls are free within normal rate limits
 * (5000 requests/hour authenticated). No GOV.AX backend involved; this
 * is a direct browser-to-GitHub call using the user's own token.
 *
 * HONEST LIMITATIONS:
 * - Requires the user to provide a GitHub token with `repo` (or fine-
 *   grained Contents: Read-and-write) permission on a target repo they
 *   control. This is real infrastructure the user must own — GOV.AX
 *   doesn't run a shared database, and that's a deliberate zero-backend
 *   choice, not an oversight.
 * - Not tested against the real GitHub API end-to-end from this session
 *   (verified with mocked fetch only) — creating real commits/issues in
 *   someone's repo without being explicitly asked is not something to
 *   do casually with a code-push token. Smoke-test with a real token
 *   and a disposable test repo before relying on this.
 */

const GITHUB_API = 'https://api.github.com';

function b64EncodeUnicode(str) {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Publishes one audit record to `registry/{modelId-sanitized}/{timestamp}.json`
 * in the target repo. Each publish is a new commit — the registry's
 * "lineage" is simply that repo's git log for that path.
 */
export async function publishToRegistry({ owner, repo, githubToken, record }) {
  if (!owner || !repo || !githubToken) {
    throw new Error('GitHub owner, repo, and token are all required to publish to the registry.');
  }

  const safeModelId = (record.modelOrTitle || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '-');
  const path = `registry/${safeModelId}/${Date.now()}.json`;
  const content = JSON.stringify({ ...record, publishedAt: new Date().toISOString() }, null, 2);

  const response = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/${path}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `chore(registry): audit record for ${safeModelId}`,
      content: b64EncodeUnicode(content),
    }),
  });

  if (response.status === 401) throw new Error('GitHub token was rejected (401). Check it has Contents: Read-and-write permission on this repo.');
  if (response.status === 404) throw new Error(`Repo ${owner}/${repo} not found or token lacks access (404).`);
  if (!response.ok) throw new Error(`GitHub API error (HTTP ${response.status}) while publishing to registry.`);

  const data = await response.json();
  return { path, commitUrl: data.commit?.html_url, sha: data.commit?.sha };
}

/**
 * Fetches the full audit history for one model from the registry — real
 * lineage, reading every past commit under that model's registry path.
 */
export async function fetchRegistryHistory({ owner, repo, githubToken, modelId }) {
  if (!owner || !repo || !githubToken) {
    throw new Error('GitHub owner, repo, and token are all required to read the registry.');
  }
  const safeModelId = (modelId || 'unknown').replace(/[^a-zA-Z0-9._-]/g, '-');

  const listResponse = await fetch(`${GITHUB_API}/repos/${owner}/${repo}/contents/registry/${safeModelId}`, {
    headers: { Authorization: `Bearer ${githubToken}`, Accept: 'application/vnd.github+json' },
  });

  if (listResponse.status === 404) return []; // no history yet for this model — not an error
  if (!listResponse.ok) throw new Error(`GitHub API error (HTTP ${listResponse.status}) while listing registry history.`);

  const files = await listResponse.json();
  const records = await Promise.all(
    files.map(async (f) => {
      const fileResponse = await fetch(f.download_url);
      return fileResponse.ok ? fileResponse.json() : null;
    })
  );

  return records.filter(Boolean).sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
}
