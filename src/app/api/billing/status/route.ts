import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { internalError } from "@/lib/api-response";
import { getBillingState, recordFailedPayment, recordPaidPayment } from "@/lib/billing";
import { findPaidPaymentByReference, paymongoConfigured } from "@/lib/paymongo";
import { billingStatusQuerySchema } from "@/lib/validation";

export const runtime = "nodejs";

/**
 * Billing state for the signed-in user, with a reconciliation side effect.
 *
 * GET ?payment=<id> re-checks that one attempt against PayMongo and promotes
 * it to paid if the money actually landed. This is not a workaround for a
 * missing webhook so much as the thing that makes the flow testable: PayMongo
 * webhooks require a public HTTPS endpoint, so they cannot reach
 * localhost:3000, and without this there would be no way at all to observe a
 * successful payment during development. It is also the self-heal path for a
 * production webhook that is misconfigured or still in its retry window.
 *
 * The caller can only reconcile payments belonging to THEM: the row is looked
 * up with a userId-scoped where clause, never by id alone.
 */
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    const url = new URL(req.url);
    const parsed = billingStatusQuerySchema.safeParse({
      payment: url.searchParams.get("payment") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request." }, { status: 400 });
    }

    const paymentId = parsed.data.payment;

    if (paymentId && paymongoConfigured()) {
      const payment = await prisma.payment.findFirst({
        // userId in the where clause is the authorization check.
        where: { id: paymentId, userId },
        select: { id: true, status: true, plan: true, amount: true, currency: true, paidAt: true },
      });

      if (payment && payment.status !== "paid") {
        try {
          const remote = await findPaidPaymentByReference(payment.id);
          if (remote?.status === "paid") {
            await recordPaidPayment(payment.id, {
              paymongoPaymentId: remote.id,
              paidAt: remote.paidAt ? new Date(remote.paidAt) : new Date(),
            });
          } else if (
            remote &&
            (remote.status === "failed" || remote.status === "expired")
          ) {
            await recordFailedPayment(payment.id, remote.status);
          }
        } catch (error) {
          // A PayMongo hiccup must not break the status page. The webhook is
          // still the primary path; this is only the fallback.
          console.error(
            "[billing/status] reconcile failed:",
            error instanceof Error ? error.message : error
          );
        }
      }

      const settled = paymentId
        ? await prisma.payment.findFirst({
            where: { id: paymentId, userId },
            select: { id: true, status: true, plan: true, amount: true, currency: true, paidAt: true },
          })
        : null;

      const state = await getBillingState(userId);

      return NextResponse.json({
        ...state,
        payment: settled,
      });
    }

    return NextResponse.json(await getBillingState(userId));
  } catch (error) {
    return internalError("GET /api/billing/status", error);
  }
}
