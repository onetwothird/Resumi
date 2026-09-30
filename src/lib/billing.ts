import "server-only";

import prisma from "@/lib/prisma";
import {
  PLAN_RANK,
  getPlan,
  isPlanId,
  periodMs,
  type BillingInterval,
  type PlanId,
} from "@/lib/plans";

/**
 * Turning a completed payment into an entitlement.
 *
 * Shared by the webhook handler and the reconciliation endpoint so both take
 * exactly the same path — the bug this avoids is a payment that upgrades the
 * account via the webhook but not via the fallback (or vice versa), which is
 * indistinguishable from "payments randomly work".
 */

export interface BillingState {
  plan: PlanId;
  planStatus: string | null;
  planExpiresAt: string | null;
  /** True while access has not run out. Null expiry means "no expiry set". */
  active: boolean;
}

export async function getBillingState(userId: string): Promise<BillingState> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, planStatus: true, planExpiresAt: true },
  });

  const plan = isPlanId(user?.plan) ? user.plan : "free";
  const expiresAt = user?.planExpiresAt ?? null;

  return {
    plan,
    planStatus: user?.planStatus ?? null,
    planExpiresAt: expiresAt ? expiresAt.toISOString() : null,
    // A null expiry on a paid plan means access never lapses (e.g. granted by
    // hand), which is the safe reading: err towards keeping access on.
    active: plan === "free" || expiresAt === null || expiresAt.getTime() > Date.now(),
  };
}

/**
 * Mark a Payment paid and grant the plan it bought.
 *
 * Idempotent, and it has to be: PayMongo retries a webhook delivery up to 12
 * times, and the reconciliation endpoint can be polled repeatedly from the
 * success page. Calling this twice must extend the subscription once, not
 * twice, and must not be a source of extra credit.
 */
export async function recordPaidPayment(
  paymentId: string,
  options: { paymongoPaymentId?: string | null; paidAt?: Date | null } = {}
): Promise<BillingState | null> {
  const payment = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!payment) return null;

  // Already settled. Nothing to do, and crucially do not re-extend the expiry.
  if (payment.status === "paid") {
    return getBillingState(payment.userId);
  }

  const planId = isPlanId(payment.plan) ? payment.plan : null;
  if (!planId || planId === "free") {
    // A "free" plan should never produce a Payment row, but if one exists it
    // must not be allowed to grant anything.
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "failed" },
    });
    return getBillingState(payment.userId);
  }

  const plan = getPlan(planId);
  const interval: BillingInterval =
    payment.interval === "year" ? "year" : "month";
  const durationMs = periodMs(plan, interval);
  const now = options.paidAt ?? new Date();

  const user = await prisma.user.findUnique({
    where: { id: payment.userId },
    select: { plan: true, planExpiresAt: true },
  });

  const currentPlan = isPlanId(user?.plan) ? user.plan : "free";

  // Renewing early adds to the remaining time instead of replacing it, so
  // someone who pays again before expiry does not lose the days they had left.
  const base = user?.planExpiresAt && user.planExpiresAt > now ? user.planExpiresAt : now;
  const planExpiresAt = new Date(base.getTime() + durationMs);

  // Grant the better of what they have and what they bought. Someone on
  // Premium who taps "buy Pro" should keep Premium rather than have their
  // account silently downgraded by their own purchase.
  const grantedPlan: PlanId =
    PLAN_RANK[planId] >= PLAN_RANK[currentPlan] ? planId : currentPlan;

  await prisma.$transaction([
    prisma.payment.update({
      where: { id: paymentId },
      data: {
        status: "paid",
        paidAt: now,
        paymongoPaymentId: options.paymongoPaymentId ?? payment.paymongoPaymentId,
      },
    }),
    prisma.user.update({
      where: { id: payment.userId },
      data: {
        plan: grantedPlan,
        planExpiresAt,
        // One-off payment, not a subscription: there is no provider-side
        // status to mirror. Left null so the column means "no subscription".
        planStatus: null,
      },
    }),
  ]);

  return getBillingState(payment.userId);
}

/**
 * Record a failed or abandoned attempt.
 *
 * Deliberately does NOT touch the user's plan: someone whose renewal payment
 * failed keeps whatever access they had paid for, because the failure of a
 * new attempt is not evidence that an old one was refunded.
 */
export async function recordFailedPayment(
  paymentId: string,
  status: "failed" | "expired"
): Promise<void> {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { status: true },
  });
  if (!payment || payment.status === "paid") return;

  await prisma.payment.updateMany({
    where: { id: paymentId, status: { not: "paid" } },
    data: { status },
  });
}
