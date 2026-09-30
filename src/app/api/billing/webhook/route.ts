import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { recordFailedPayment, recordPaidPayment } from "@/lib/billing";
import { verifyWebhookSignature } from "@/lib/paymongo";

export const runtime = "nodejs";

/**
 * PayMongo webhook receiver.
 *
 * Two properties matter more than anything else in a payment webhook:
 *
 *  - Authenticity. The signature is verified against the RAW body before any
 *    parsing, because this endpoint grants paid entitlements and an
 *    unverified one is a free-Pro button for anyone who can POST.
 *  - Exactly-once effect. PayMongo retries a failed delivery up to 12 times
 *    and can deliver duplicates, so a repeated `payment.paid` must not extend
 *    someone's access twice. recordPaidPayment() returns early for a row that
 *    is already paid.
 *
 * Every event type is acknowledged with 200. Returning 4xx/5xx for an event we
 * simply do not handle would trigger PayMongo's retry logic and pile up
 * delivery attempts for something that will never be processed.
 */

interface WebhookEvent {
  data?: {
    id?: string;
    type?: string;
    attributes?: {
      type?: string;
      livemode?: boolean;
      data?: {
        id?: string;
        type?: string;
        attributes?: Record<string, unknown>;
      };
    };
  };
}

/**
 * Map a webhook's resource back to the local Payment row.
 *
 * There are two possible linkages and PayMongo uses a different one depending
 * on the resource:
 *
 *  - A checkout session carries our reference directly, and we stored the
 *    session id on the Payment row when we created it. Exact match.
 *  - A payment carries it as `external_reference_number` — the
 *    `reference_number` we sent at checkout, which is our Payment row id.
 *
 * `payment_intent` events have no such field, so `payment_intent.succeeded` is
 * only usable when it arrives with a reference some other way. The reliable
 * signal for a completed checkout is `checkout_session.payment.paid`, which is
 * also what PayMongo's own hosted-checkout guide tells you to subscribe to.
 */
async function resolvePaymentId(
  resourceType: string | undefined,
  resourceId: string | undefined,
  resourceAttributes: Record<string, unknown>
): Promise<string | null> {
  if (!resourceType) return null;

  if (resourceType === "checkout_session" && resourceId) {
    const row = await prisma.payment.findUnique({
      where: { checkoutSessionId: resourceId },
      select: { id: true },
    });
    return row?.id ?? null;
  }

  if (resourceType === "payment") {
    const reference = resourceAttributes.external_reference_number;
    if (typeof reference === "string" && reference.length > 0) {
      const row = await prisma.payment.findUnique({
        where: { id: reference },
        select: { id: true },
      });
      return row?.id ?? null;
    }
  }

  return null;
}

export async function POST(req: Request) {
  // Read the body ONCE, as text. Verification runs on these exact bytes —
  // re-serialising the parsed object will not produce the same signature.
  const raw = await req.text();

  if (!verifyWebhookSignature(raw, req.headers.get("Paymongo-Signature"))) {
    // 401 because this means "not from PayMongo", not "malformed". PayMongo
    // retries either way.
    return NextResponse.json({ error: "Invalid signature." }, { status: 401 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: "Malformed payload." }, { status: 400 });
  }

  const attributes = event.data?.attributes;
  const type = attributes?.type ?? "";
  const resource = attributes?.data;
  const resourceType = resource?.type;
  const resourceId = resource?.id;
  const resourceAttributes = resource?.attributes ?? {};

  // `livemode` is deliberately NOT used as an authorization check. It is
  // self-asserted by the payload, and PayMongo's own guidance is to use it as
  // an extra guard rather than the only safeguard. Test-mode and live-mode
  // events share one endpoint and one user table, so accepting both is correct
  // here; what separates them is the HMAC, which is keyed per endpoint.
  const isLivemode = attributes?.livemode ?? null;

  try {
    switch (type) {
      case "checkout_session.payment.paid":
      case "payment.paid": {
        const paymentId = await resolvePaymentId(
          resourceType,
          resourceId,
          resourceAttributes
        );
        if (!paymentId) {
          // A payment this deployment did not originate (e.g. one created in
          // the PayMongo dashboard). Nothing to grant; not an error.
          break;
        }
        await recordPaidPayment(paymentId, {
          paymongoPaymentId:
            resourceType === "payment" ? resourceId ?? null : null,
        });
        break;
      }

      case "checkout_session.payment.failed":
      case "payment.failed": {
        const paymentId = await resolvePaymentId(
          resourceType,
          resourceId,
          resourceAttributes
        );
        if (paymentId) await recordFailedPayment(paymentId, "failed");
        break;
      }

      case "checkout_session.expired": {
        const paymentId = await resolvePaymentId(
          resourceType,
          resourceId,
          resourceAttributes
        );
        if (paymentId) await recordFailedPayment(paymentId, "expired");
        break;
      }

      // `checkout_session.completed` fires when the customer finishes the
      // checkout flow, which for QR Ph or an e-wallet does NOT mean they
      // paid. Intentionally a no-op: treating it as success would grant access
      // to anyone who walked to the QR screen and left.
      case "checkout_session.completed":
      // Listed so they are visibly acknowledged rather than looking dropped.
      // The integration grows into these once recurring billing is enabled.
      case "subscription.activated":
      case "subscription.updated":
      case "subscription.past_due":
      case "subscription.unpaid":
      case "subscription.invoice.paid":
      case "subscription.invoice.payment_failed":
      case "refund.succeeded":
      case "dispute.created":
      default:
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    // A 500 makes PayMongo retry, which is right for a transient database
    // blip. It will not fix a bug, so the detail is logged here where a human
    // will see it.
    console.error(
      `[paymongo webhook] ${type} (livemode=${isLivemode}):`,
      error instanceof Error ? error.message : error
    );
    return NextResponse.json({ error: "Failed to process event." }, { status: 500 });
  }
}
