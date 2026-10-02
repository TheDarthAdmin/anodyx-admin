import type { NextConfig } from "next";

const security = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Robots-Tag", value: "noindex, nofollow" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  ...(process.env.NODE_ENV === "production"
    ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }]
    : []),
];

const nextConfig: NextConfig = {
  // Separate build dirs let the dev server and the e2e server run side by side.
  distDir: process.env.NEXT_DIST_DIR || ".next",
  output: "standalone",
  poweredByHeader: false,
  devIndicators: false,
  async headers() {
    return [{ source: "/:path*", headers: security }];
  },
};

export default nextConfig;
