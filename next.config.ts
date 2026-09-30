import type { NextConfig } from "next";

const isDev = process.env.NODE_ENV !== "production";

/**
 * The Clerk Frontend API host for this deployment.
 *
 * Clerk serves clerk-js, @clerk/ui and the whole API from the host encoded in
 * the publishable key — and that host is NOT always a Clerk domain. Ours is
 * `clerk.resumi-mu.vercel.app`, a custom domain. Hardcoding only Clerk's own
 * domains therefore blocked the script outright: the browser refused it,
 * `useUser()` never resolved, and /sign-in, /sign-up and every UserButton
 * rendered as a blank page with "Clerk: Failed to load Clerk JS" in the
 * console. Decoding the key means the correct origin is right for live, test
 * and proxied instances alike, with no edit here when it changes.
 *
 * The key is `pk_<mode>_<base64 of "host$">`.
 */
function clerkFrontendApiHost(): string | null {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!key) return null;
  try {
    const encoded = key.replace(/^pk_(test|live)_/, "");
    // Restore the padding that hand-decoding drops.
    const padded = encoded + "=".repeat((4 - (encoded.length % 4)) % 4);
    const host = Buffer.from(padded, "base64")
      .toString("utf8")
      .replace(/\$$/, "")
      .trim();
    // Only accept something that looks like a host, so a malformed key degrades
    // to "no extra origin" rather than injecting junk into the CSP.
    return /^[a-z0-9.-]+(?::\d+)?$/i.test(host) ? host : null;
  } catch {
    return null;
  }
}

const clerkHost = clerkFrontendApiHost();

/**
 * Clerk origins to allow on script, style, font and frame.
 *
 * The wildcards cover Clerk's shared CDN (clerk-js, @clerk/ui, fonts, the
 * bot-protection frame). `clerkHost` covers this specific instance when it sits
 * on a custom domain, which neither wildcard matches.
 */
const clerkOrigins = [
  "https://*.clerk.accounts.dev",
  "https://*.clerk.com",
  ...(clerkHost ? [`https://${clerkHost}`] : []),
].join(" ");

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
 * - The `*.clerk.accounts.dev` / `*.clerk.com` origins on script, style,
 *   font and frame are Clerk's own CDN. ClerkProvider loads clerk-js and
 *   @clerk/ui at runtime from there; without them the browser blocks the
 *   script outright, `useUser()` never resolves, and /sign-in, /sign-up and
 *   every UserButton render as a blank page ("Clerk: Failed to load
 *   Clerk JS"). Bot protection adds a Cloudflare Turnstile frame, hence
 *   challenges.cloudflare.com on frame-src.
 * - The instance's own Frontend API host (clerkFrontendApiHost below) is
 *   appended to the same list, because a Clerk instance fronted by a custom
 *   domain is not matched by Clerk's own wildcards.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} ${clerkOrigins}`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com ${clerkOrigins}`,
  `font-src 'self' https://fonts.gstatic.com data: ${clerkOrigins}`,
  "img-src 'self' data: blob: https:",
  // clerkOrigins is repeated here rather than reusing a shorter literal: the
  // session-token refresh, the FAPI calls behind useUser(), and the telemetry
  // endpoint are all connect-src, and missing any one of them leaves a session
  // that loads but never updates.
  `connect-src 'self' ${clerkOrigins} https://clerk-telemetry.com`,
  `frame-src 'self' ${clerkOrigins} https://challenges.cloudflare.com`,
  // Clerk spawns a blob: worker on boot; without this it falls back to
  // script-src, which has no blob: and the worker never starts.
  "worker-src 'self' blob:",
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
