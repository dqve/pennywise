/**
 * Require browser mutations to prove same-origin intent.
 *
 * Origin is preferred. Sec-Fetch-Site is accepted only as a fallback when
 * Origin is absent; "same-site" is intentionally insufficient because sibling
 * subdomains are still different origins.
 */
export function isSameOriginMutation(request: Request): boolean {
  const requestOrigin = new URL(request.url).origin;
  const origin = request.headers.get('origin');

  if (origin !== null) {
    if (!origin || origin === 'null') return false;
    try {
      return new URL(origin).origin === requestOrigin;
    } catch {
      return false;
    }
  }

  return request.headers.get('sec-fetch-site')?.toLowerCase() === 'same-origin';
}
