/**
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * GOV.AX — Hugging Face Hub API Client
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 * Client-side fetch layer. No server proxy.
 * Passes optional Bearer token locally via header
 * without forwarding or indexing to any pipeline.
 */

const HF_API_BASE = 'https://huggingface.co/api/models';

/**
 * Fetches and normalizes model metadata from the Hugging Face Hub API.
 *
 * @param {string} modelId - Repository namespace (e.g. "meta-llama/Llama-3-8B-Instruct")
 * @param {string|null} token - Optional HF access token for gated models
 * @returns {Promise<Object>} Normalized model metadata
 * @throws {Error} Typed errors: MODEL_NOT_FOUND, GATED_MODEL, RATE_LIMITED, NETWORK_ERROR
 */
export async function fetchModelMetadata(modelId, token) {
  const url = `${HF_API_BASE}/${modelId}`;

  const headers = {
    Accept: 'application/json',
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(url, { headers });
  } catch (networkError) {
    throw new Error('NETWORK_ERROR');
  }

  if (response.status === 404) {
    throw new Error('MODEL_NOT_FOUND');
  }
  if (response.status === 401 || response.status === 403) {
    throw new Error('GATED_MODEL');
  }
  if (response.status === 429) {
    throw new Error('RATE_LIMITED');
  }
  if (!response.ok) {
    throw new Error(`API_ERROR_${response.status}`);
  }

  const data = await response.json();

  // ── License Extraction (multi-source) ──
  // Priority: cardData.license → tags array → fallback "unknown"
  let license = '';

  if (data.cardData && data.cardData.license) {
    license = data.cardData.license;
  }

  if (!license) {
    const licenseTag = (data.tags || []).find((t) =>
      t.startsWith('license:'),
    );
    if (licenseTag) {
      license = licenseTag.replace('license:', '');
    }
  }

  if (!license) {
    license = 'unknown';
  }

  return {
    id: data.id || data.modelId || modelId,
    author: data.author || 'Unknown',
    pipelineTag: data.pipeline_tag || 'Not specified',
    tags: data.tags || [],
    downloads: data.downloads || 0,
    license,
    gated: data.gated || false,
    lastModified: data.lastModified || null,
    libraryName: data.library_name || 'Unknown',
    cardData: data.cardData || null,
  };
}
