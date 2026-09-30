import { NextResponse } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { ensureUser } from "@/lib/ensure-user";
import { internalError, validationError } from "@/lib/api-response";
import { checkoutSchema } from "@/lib/validation";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import {
  PaymongoError,
  activePaymentMethods,
  createCheckoutSession,
  paymongoConfigured,
} from "@/lib/paymongo";
import {
  PLAN_RANK,
  chargeAmount,
  getPlan,
  isPlanId,
  type BillingInterval,
  type PaidPlanId,
} from "@/lib/plans";

export const runtime = "nodejs";

/**
 * Create a PayMongo checkout session for a paid plan.
 *
 * Amount resolution is one-directional: the client says WHICH plan and WHICH
 * interval, and this route reads the amount from the catalogue. There is no
 * code path where a price arrives from the request.
 */
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
    }

    if (!paymongoConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured on this deployment." },
        { status: 503 }
      );
    }

    // Every call to this route creates a real, payable checkout session on a
    // live merchant account, so it is rate limited per user independently of
    // how many IP addresses they rotate through.
    const limited = await enforceRateLimit(
      req,
      "billing:checkout",
      userId,
      RATE_LIMITS.checkout.limit,
      RATE_LIMITS.checkout.windowMs
    );
    if (limited) return limited;

    const parsed = checkoutSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) return validationError(parsed.error);

    const planId = parsed.data.plan as PaidPlanId;
    const interval = parsed.data.interval as BillingInterval;
    const plan = getPlan(planId);

    // Refuse to sell a plan the user already has and that has not lapsed.
    // Buying the same plan again is a legitimate renewal, so only block it when
    // the current entitlement is actually still running.
    const user = await ensureUser(userId);
    if (!user) {
      // ensureUser only fails to find a row if Clerk and the database
      // disagree about who this is; charging someone in that state would
      // create a payment with no account to attach it to.
      return internalError("POST /api/billing/checkout", new Error("no user row"));
    }

    const entitlementValid =
      user.planExpiresAt !== null && user.planExpiresAt.getTime() > Date.now();

    if (user.plan === planId && entitlementValid) {
      return NextResponse.json(
        { error: `You already have ${plan.name} active.` },
        { status: 409 }
      );
    }

    // Buying a plan below the one already held is almost certainly a mistake
    // (the pricing page lists Free/Pro/Premium in order and the highlight
    // lands on Pro). Say so instead of taking the money.
    const currentPlan: PaidPlanId | null =
      isPlanId(user.plan) && user.plan !== "free" ? user.plan : null;
    if (
      entitlementValid &&
      currentPlan !== null &&
      PLAN_RANK[planId] < PLAN_RANK[currentPlan]
    ) {
      return NextResponse.json(
        { error: `You already have ${getPlan(currentPlan).name} active.` },
        { status: 409 }
      );
    }

    const amount = chargeAmount(plan, interval);
    if (amount <= 0) {
      return NextResponse.json(
        { error: "That plan cannot be purchased." },
        { status: 400 }
      );
    }

    // Record the attempt before redirecting. If PayMongo succeeds but the
    // browser never comes back, this row is the only record that the customer
    // was offered a specific amount, which is what makes reconciliation
    // possible and disputes answerable.
    const payment = await prisma.payment.create({
      data: {
        userId,
        plan: planId,
        interval,
        amount,
        currency: "PHP",
        status: "pending",
      },
    });

    const origin = new URL(req.url).origin;
    const clerkUser = await currentUser();
    const email =
      clerkUser?.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser?.emailAddresses[0]?.emailAddress;
    const name =
      [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
      clerkUser?.fullName ||
      undefined;

    try {
      const session = await createCheckoutSession({
        // Our own Payment row id. Comes back on the payment as
        // external_reference_number, which is how the webhook and the
        // reconciliation poll find this row again.
        referenceNumber: payment.id,
        lineItems: [
          {
            name: `Resumi ${plan.name} — ${interval === "year" ? "12 months" : "1 month"}`,
            amount,
            quantity: 1,
          },
        ],
        paymentMethodTypes: await activePaymentMethods(),
        successUrl: `${origin}/upgrade?checkout=success&payment=${payment.id}`,
        cancelUrl: `${origin}/upgrade?checkout=cancelled&payment=${payment.id}`,
        description: `Resumi ${plan.name}`,
        billing: { email, name },
      });

      await prisma.payment.update({
        where: { id: payment.id },
        data: { checkoutSessionId: session.id },
      });

      return NextResponse.json({
        url: session.checkoutUrl,
        paymentId: payment.id,
        livemode: session.livemode,
      });
    } catch (error) {
      // Do not leave a dangling pending row when session creation failed.
      // `payment` is created inside this handler's scope, so it is safe to
      // reference here.
      await prisma.payment
        .update({
          where: { id: payment.id },
          data: { status: "failed" },
        })
        .catch(() => {});

      if (error instanceof PaymongoError) {
        console.error("[billing/checkout]", error.message);
        return NextResponse.json(
          {
            error:
              "We could not start checkout. Please try again in a moment.",
          },
          { status: 502 }
        );
      }
      throw error;
    }
  } catch (error) {
    return internalError("POST /api/billing/checkout", error);
  }
}
