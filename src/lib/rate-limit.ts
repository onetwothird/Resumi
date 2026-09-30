import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * Database-backed fixed-window rate limiting.
 *
 * Why the database and not an in-process Map:
 *   - This app runs on Vercel, so each request may land on a different
 *     instance and a cold start wipes any in-memory state. A Map would let
 *     an attacker multiply their quota by the number of warm instances.
 *   - Neon Postgres is already a dependency, so this adds no new infra and
 *     no new environment variable.
 *
 * The cost is one upsert per limited request, which is a single primary-key
 * conflict update - cheap, and only on the routes that actually need it.
 *
 * Fails OPEN on database error: if the RateLimit table has not been migrated
 * yet, or the database is briefly unreachable, requests are allowed through
 * and the failure is logged. Failing closed here would take every AI feature
 * offline, which is strictly worse than briefly having no limit. The status
 * quo before this change was no limit at all, so failing open is never a
 * regression.
 */

let warnedMissingTable = false;

export type RateLimitResult =
  | { ok: true; remaining: number; limit: number }
  | { ok: false; remaining: 0; limit: number; retryAfterSeconds: number };

/**
 * Best-effort client identity.
 *
 * `x-forwarded-for` is client-controllable in general, but Vercel overwrites
 * it at the edge, so the left-most entry is the real client on this
 * deployment. If it is absent we fall back to the user id alone, which still
 * limits a signed-in user across IP rotation.
 */
export function clientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "unknown"
  );
}

/**
 * Consume one unit from the caller's budget for `scope`.
 *
 * @param scope  names the action, e.g. "ai:rewrite". Keep it stable: changing
 *               it resets every user's counters for that action.
 * @param limit  requests allowed per window
 * @param windowMs  window length in milliseconds
 * @param identity  who is being limited. Prefer the Clerk userId when signed
 *                  in; fall back to the client IP for anonymous callers.
 */
export async function rateLimit(
  scope: string,
  identity: string,
  limit: number,
  windowMs: number
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = BigInt(Math.floor(now / windowMs) * windowMs);
  const key = `${scope}:${identity}`;

  try {
    // Atomic increment. ON CONFLICT DO UPDATE means concurrent requests
    // cannot both read count and then write, which would let a burst slip
    // through the limit.
    const rows = await prisma.$queryRaw<Array<{ count: number }>>`
      INSERT INTO "RateLimit" ("key", "windowStart", "count")
      VALUES (${key}, ${windowStart}, 1)
      ON CONFLICT ("key", "windowStart")
      DO UPDATE SET "count" = "RateLimit"."count" + 1
      RETURNING "count"
    `;

    const count = Number(rows[0]?.count ?? 1);

    if (count > limit) {
      // Seconds until the current window rolls over.
      const resetAt = Number(windowStart) + windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - now) / 1000));
      return { ok: false, remaining: 0, limit, retryAfterSeconds };
    }

    return { ok: true, remaining: Math.max(0, limit - count), limit };
  } catch (error) {
    if (!warnedMissingTable) {
      warnedMissingTable = true;
      console.error(
        "[rate-limit] unavailable, allowing request. If this persists, run: npx prisma migrate deploy"
      );
    }
    console.error("[rate-limit]", error instanceof Error ? error.message : error);
    return { ok: true, remaining: limit, limit };
  }
}

/**
 * Route-handler wrapper: returns a 429 NextResponse when the caller is over
 * budget, or null when the request may proceed.
 *
 *   const limited = await enforceRateLimit(req, "ai:rewrite", { userId }, 10, 60_000);
 *   if (limited) return limited;
 */
export async function enforceRateLimit(
  req: Request,
  scope: string,
  userId: string | null | undefined,
  limit: number,
  windowMs: number
): Promise<NextResponse | null> {
  // Prefer the authenticated identity: it is stable, cannot be rotated by
  // swapping IPs, and is the thing we actually want to bound spend on.
  const identity = userId ? `u:${userId}` : `ip:${clientIp(req)}`;
  const result = await rateLimit(scope, identity, limit, windowMs);

  if (result.ok) {
    return null;
  }

  return NextResponse.json(
    {
      error:
        "Too many requests. Please wait a moment and try again.",
      retryAfterSeconds: result.retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

/**
 * Preset budgets. AI calls cost real money per invocation, so those are the
 * tight ones; the free-form endpoints are looser but still bounded so they
 * cannot be used to fill the database.
 */
export const RATE_LIMITS = {
  /** 10 AI calls per minute per user. */
  ai: { limit: 10, windowMs: 60_000 },
  /** 5 PDF parses per 10 minutes - each one is a full Gemini upload. */
  aiPdf: { limit: 5, windowMs: 10 * 60_000 },
  /** 5 testimonial submissions per hour, keyed by IP. */
  testimonial: { limit: 5, windowMs: 60 * 60_000 },
  /** 30 resume saves per minute. */
  resumeWrite: { limit: 30, windowMs: 60_000 },
  /** 30 messages per minute. */
  message: { limit: 30, windowMs: 60_000 },
  /**
   * 5 checkout sessions per 10 minutes. Tighter than the other write budgets
   * because each one of these creates a real payable session on the merchant's
   * live PayMongo account, and because each is a chance to hand someone a
   * duplicate charge to complain about.
   */
  checkout: { limit: 5, windowMs: 10 * 60_000 },
} as const;
