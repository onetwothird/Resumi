import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * Content-Security-Policy.
 *
 * Notes on the two loose ends:
 * - `script-src 'unsafe-inline'` is required because Next.js injects inline
 *   bootstrap/hydration scripts. Moving to per-request nonces is the strict
 *   fix, but that needs the proxy to mint a nonce and thread it through
 *   headers(); worth doing, not worth doing in the same change as this.
 * - `img-src https:` is required because Clerk-hosted avatars
 *   (img.clerk.com) and user-supplied poster images are rendered as <img>
 *   throughout the app.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "connect-src 'self' https://*.clerk.accounts.dev https://*.clerk.com",
  "frame-src 'self' https://*.clerk.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  ...(isDev ? [] : ["upgrade-insecure-requests"]),
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // The mock-interview flow uses getUserMedia, so camera/microphone must stay
  // self-allowed. Nothing else in the app needs a device permission.
  { key: "Permissions-Policy", value: "camera=(self), microphone=(self), geolocation=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  // Do not advertise the framework and version to every visitor.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
