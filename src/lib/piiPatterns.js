export const EMAIL_RE = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
export const PHONE_RE = /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/;
export const SSN_LIKE_RE = /\b\d{3}-\d{2}-\d{4}\b/;
export const CREDIT_CARD_LIKE_RE = /\b(?:\d[ -]*?){13,16}\b/;

/** @returns {string[]} which pattern types matched, empty if none */
export function scanForPii(text) {
  if (!text) return [];
  const hits = [];
  if (EMAIL_RE.test(text)) hits.push('email');
  if (PHONE_RE.test(text)) hits.push('phone');
  if (SSN_LIKE_RE.test(text)) hits.push('SSN-like');
  if (CREDIT_CARD_LIKE_RE.test(text)) hits.push('card-number-like');
  return hits;
}
