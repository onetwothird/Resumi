import { NextResponse } from "next/server";
import { internalError, validationError } from "@/lib/api-response";
import { adminPlanSchema } from "@/lib/validation";
import { adminSetPlan, requireAdmin } from "@/lib/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Set a user's plan by hand.
 *
 * This is the endpoint the whole panel exists for. It exists because a QR
 * transfer has no webhook: the money arrives in a bank app and nothing in this
 * system ever hears about it, so the only way to make the account match reality
 * is for a person to say so. That makes this the most privileged write in the
 * app — it can grant paid access that nobody paid for — which is why it is
 * rate-limited, requires a written reason, and writes an audit row in the same
 * transaction as the change.
 *
 * POST rather than PATCH: the body always carries the full intended plan state,
 * and a partial body would leave "I meant to change the expiry but not the
 * plan" ambiguous at the type level.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    // Bounded so a compromised session cannot be used to rewrite every account
    // in a loop. Generous for interactive use, tight enough to be noticeable.
    const limited = await enforceRateLimit(
      req,
      "admin:plan",
      adminId,
      60,
      60_000
    );
    if (limited) return limited;

    const { id } = await params;

    const parsed = adminPlanSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    // Spelled out rather than passing `parsed.data` straight through: the schema
    // makes planExpiresAt optional (omitted means "leave it alone" to a reader of
    // the schema), but this endpoint always sets it, so the "no expiry" case has
    // to arrive as an explicit null. Spreading would also forward `note`, which
    // is the audit reason and not part of the grant.
    const result = await adminSetPlan(
      adminId,
      id,
      {
        plan: parsed.data.plan,
        months: parsed.data.months,
        planExpiresAt: parsed.data.planExpiresAt ?? null,
      },
      parsed.data.note
    );
    if (!result) {
      return NextResponse.json({ error: "No such user." }, { status: 404 });
    }

    return NextResponse.json({
      from: result.from,
      to: result.to,
      planExpiresAt: result.planExpiresAt,
    });
  } catch (error) {
    return internalError("POST /api/admin/users/:id/plan", error);
  }
}
