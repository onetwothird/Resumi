import { NextResponse } from "next/server";
import { internalError, validationError } from "@/lib/api-response";
import { adminMarkPaidSchema } from "@/lib/validation";
import { adminMarkPaymentPaid, requireAdmin } from "@/lib/admin";
import { enforceRateLimit } from "@/lib/rate-limit";

/**
 * Reconcile one Payment to paid.
 *
 * This is the one admin action that produces a real entitlement, so it is
 * treated as carefully as a checkout: it delegates to the same
 * recordPaidPayment the webhook uses, which means the same plan-resolution and
 * stacking rules, and it is idempotent — a Payment already marked paid is
 * reported as such and the expiry is not extended a second time.
 *
 * The reason field is required. Marking a payment paid is an assertion that
 * money arrived, made by a person with no system-verifiable evidence behind it,
 * and the audit row is the only place that assertion is recorded.
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

    const limited = await enforceRateLimit(
      req,
      "admin:mark-paid",
      adminId,
      30,
      60_000
    );
    if (limited) return limited;

    const { id } = await params;

    const parsed = adminMarkPaidSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const result = await adminMarkPaymentPaid(adminId, id, parsed.data.note);
    if (!result) {
      return NextResponse.json({ error: "No such payment." }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return internalError("POST /api/admin/payments/:id/mark-paid", error);
  }
}
