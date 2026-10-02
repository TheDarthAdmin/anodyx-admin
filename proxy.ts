import { NextResponse, type NextRequest } from "next/server";

import { contentSecurityPolicy, upstreamHeaders, upstreamUrl } from "@/lib/proxy-headers";
import { platformApiUrl, platformSecret } from "@/lib/server/config";

/**
 * - `/api/*` → `${PLATFORM_API_URL}/platform/*`, with the shared secret added here on
 *   the server. The browser never sees it, and a secret sent by the browser is dropped.
 * - Every page gets a nonce-based Content-Security-Policy.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const target = upstreamUrl(pathname, search, platformApiUrl());
  if (target) {
    return NextResponse.rewrite(new URL(target), {
      request: { headers: upstreamHeaders(request.headers, platformSecret()) },
    });
  }
  if (pathname.startsWith("/api")) return new NextResponse(null, { status: 404 });

  const nonce = btoa(crypto.randomUUID());
  const csp = contentSecurityPolicy(nonce, process.env.NODE_ENV !== "production");
  const headers = new Headers(request.headers);
  headers.set("x-nonce", nonce);
  headers.set("Content-Security-Policy", csp);
  const response = NextResponse.next({ request: { headers } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: [{ source: "/((?!_next/static|_next/image|brand/|icon.svg).*)" }],
};
