import { describe, expect, it } from "vitest";

import { contentSecurityPolicy, SECRET_HEADER, upstreamHeaders, upstreamUrl } from "@/lib/proxy-headers";

describe("upstreamHeaders", () => {
  it("adds the server secret and drops one sent by the browser", () => {
    const incoming = new Headers({
      cookie: "anodyx_platform_session=abc",
      "content-type": "application/json",
      "X-Platform-Secret": "forged-by-client",
      host: "admin.example",
    });
    const out = upstreamHeaders(incoming, "real-secret");
    expect(out.get(SECRET_HEADER)).toBe("real-secret");
    expect(out.get("cookie")).toBe("anodyx_platform_session=abc");
    expect(out.get("content-type")).toBe("application/json");
    expect(out.get("host")).toBeNull();
  });

  it("never forwards a client secret, even without a configured one", () => {
    const out = upstreamHeaders(new Headers({ "x-platform-secret": "forged" }), "");
    expect(out.get(SECRET_HEADER)).toBeNull();
  });
});

describe("upstreamUrl", () => {
  const base = "http://api-uuid:8000/";
  it("maps /api/* onto /platform/*, keeping the query", () => {
    expect(upstreamUrl("/api/tenants/x", "?q=velo", base)).toBe("http://api-uuid:8000/platform/tenants/x?q=velo");
    expect(upstreamUrl("/api", "", base)).toBe("http://api-uuid:8000/platform");
  });
  it("ignores other paths and refuses path traversal", () => {
    expect(upstreamUrl("/tenants", "", base)).toBeNull();
    expect(upstreamUrl("/apix", "", base)).toBeNull();
    expect(upstreamUrl("/api/../resolve/x", "", base)).toBeNull();
  });
});

describe("contentSecurityPolicy", () => {
  it("is nonce-based, forbids framing and only loosens eval in dev", () => {
    const prod = contentSecurityPolicy("n0nce", false);
    expect(prod).toContain("'nonce-n0nce'");
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).not.toContain("unsafe-eval");
    expect(contentSecurityPolicy("n0nce", true)).toContain("unsafe-eval");
  });
});
