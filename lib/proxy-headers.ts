/** Header name of the shared secret between this portal's server and the API. */
export const SECRET_HEADER = "x-platform-secret";

/** Hop-by-hop or origin headers the upstream should not receive from the browser. */
const DROP = [SECRET_HEADER, "host", "connection", "x-forwarded-host"];

/**
 * Headers for the upstream API call: everything the browser sent (cookies, content
 * type, accept), minus any client-supplied secret, plus the real secret.
 */
export function upstreamHeaders(incoming: Headers, secret: string): Headers {
  const out = new Headers();
  incoming.forEach((value, key) => {
    if (!DROP.includes(key.toLowerCase())) out.set(key, value);
  });
  if (secret) out.set(SECRET_HEADER, secret);
  return out;
}

/** `/api/tenants/x?q=1` → `${base}/platform/tenants/x?q=1`. Null for non-API paths. */
export function upstreamUrl(pathname: string, search: string, base: string): string | null {
  if (pathname !== "/api" && !pathname.startsWith("/api/")) return null;
  const rest = pathname.slice("/api".length);
  if (rest.split("/").some((part) => part === "..")) return null;
  return `${base.replace(/\/+$/, "")}/platform${rest}${search}`;
}

/** Content-Security-Policy for this portal. Nonce-based scripts, no framing, no third parties. */
export function contentSecurityPolicy(nonce: string, dev: boolean): string {
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self'",
    `connect-src 'self'${dev ? " ws: wss:" : ""}`,
    "object-src 'none'",
    "base-uri 'none'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
