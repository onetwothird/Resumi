import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * PayMongo API client.
 *
 * Server-only on purpose: everything here reads PAYMONGO_SECRET_KEY, and that
 * key can create checkout sessions and read the full payment history. The
 * public key (PAYMONGO_PUBLIC_KEY) is for creating client-side payment methods
 * in an embedded checkout, which this integration does not do — it uses
 * PayMongo-hosted checkout so no card data ever reaches our server or browser.
 */

const API_BASE = "https://api.paymongo.com";

/**
 * Error thrown by every call that gets a non-2xx from PayMongo.
 *
 * `detail` is kept for logs and deliberately NOT for the API response: it
 * leaks account state ("no subscription payment methods are configured for
 * this organization") and provider internals.
 */
export class PaymongoError extends Error {
  // Written out rather than as constructor parameter properties, so the file
  // can also be run directly by Node's type-stripping loader — which is how
  // the signature verification gets unit-tested without a bundler.
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "PaymongoError";
    this.status = status;
    this.code = code;
  }
}

function secretKey(): string {
  const key = process.env.PAYMONGO_SECRET_KEY;
  if (!key) {
    throw new Error(
      "PAYMONGO_SECRET_KEY is not set. Add it to .env (see .env.example)."
    );
  }
  return key;
}

/** Whether a secret key is present, so the UI can hide checkout rather than 500. */
export function paymongoConfigured(): boolean {
  return Boolean(process.env.PAYMONGO_SECRET_KEY);
}

export function webhookSecret(): string | null {
  return process.env.PAYMONGO_WEBHOOK_SECRET ?? null;
}

type ApiOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  /** Forwarded to the error message only, never to the client. */
  context: string;
};

/**
 * One authenticated call against the PayMongo REST API.
 *
 * Auth is HTTP Basic with the secret key as the username and an EMPTY
 * password — the trailing colon is mandatory. "Basic " + base64(`${key}:`).
 */
export async function paymongoApi<T>(path: string, options: ApiOptions): Promise<T> {
  const { method = "GET", body, context } = options;
  const authorization = Buffer.from(`${secretKey()}:`).toString("base64");

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method,
      headers: {
        Authorization: `Basic ${authorization}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      // Payment state must never be served from a cache.
      cache: "no-store",
    });
  } catch (error) {
    throw new PaymongoError(
      `[${context}] network failure: ${error instanceof Error ? error.message : error}`,
      0
    );
  }

  const raw = await response.text();
  let parsed: unknown = null;
  if (raw) {
    try {
      parsed = JSON.parse(raw);
    } catch {
      // Non-JSON error page (gateway, proxy). Keep the status, drop the body.
      parsed = null;
    }
  }

  if (!response.ok) {
    const errors = (parsed as { errors?: Array<{ code?: string; detail?: string }> })
      ?.errors;
    const first = Array.isArray(errors) ? errors[0] : undefined;
    throw new PaymongoError(
      `[${context}] ${response.status} ${first?.code ?? response.statusText}: ${
        first?.detail ?? raw.slice(0, 300)
      }`,
      response.status,
      first?.code
    );
  }

  return parsed as T;
}

/**
 * Payment methods this merchant account actually has enabled.
 *
 * Rather than hardcoding ["card", "gcash"] and having checkout offer a method
 * the customer cannot actually use, ask PayMongo what is switched on and offer
 * exactly that. Capability activation changes over time, so this is also how
 * cards/GCash/Maya appear in checkout with no code change once the merchant
 * finishes activating them.
 *
 * Memoised per process for a short window: this is called on the checkout
 * click path, and a merchant toggling a payment method does not need it
 * reflected within the same second.
 */
const PAYMENT_METHOD_CACHE_MS = 5 * 60_000;
let paymentMethodCache: { at: number; types: CheckoutPaymentMethod[] } | null = null;

/**
 * The method names passed to the checkout session's `payment_method_types`.
 *
 * Deliberately a pass-through of PayMongo's own vocabulary, NOT a hand-written
 * translation table. `GET /v1/merchants/capabilities/payment_methods` and this
 * field are both PayMongo's, and the checkout API does not validate the list:
 * probing it with "definitely_not_a_real_method" returns 200 exactly like
 * "qrph" does. So a name invented in this file could never be caught as wrong
 * at the API boundary — it would instead render a hosted checkout page with no
 * usable button on it. Passing capability identifiers through verbatim removes
 * that class of silent failure.
 */
export type CheckoutPaymentMethod =
  | "card"
  | "qrph"
  | "gcash"
  | "paymaya"
  | "grab_pay"
  | "shopeepay"
  | "dob"
  | "billease";

/** Identifiers this module is willing to forward. */
const SUPPORTED_METHODS = new Set<string>([
  "card", "qrph", "gcash", "paymaya", "grab_pay", "shopeepay", "dob", "billease",
]);

/**
 * Order the buttons appear in on the hosted checkout page.
 *
 * QR Ph first: it is enabled by default on every activated account, so it is
 * the one thing guaranteed to work. Cards last: most likely to decline.
 */
const METHOD_ORDER: CheckoutPaymentMethod[] = [
  "qrph",
  "gcash",
  "paymaya",
  "grab_pay",
  "shopeepay",
  "billease",
  "dob",
  "card",
];

/**
 * Always offer at least QR Ph.
 *
 * Two reasons, and the second matters more. It is enabled by default on every
 * activated account, so it is the one method guaranteed to work. And because
 * the checkout API does not validate `payment_method_types`, a method this code
 * got wrong would not raise an error — it would produce a checkout page where
 * the customer cannot pay anything. Keeping a known-good method in the list
 * turns a bad identifier into "one fewer button" instead of "no sale".
 */
const FALLBACK_METHODS: CheckoutPaymentMethod[] = ["qrph"];

export async function activePaymentMethods(
  force = false
): Promise<CheckoutPaymentMethod[]> {
  const now = Date.now();
  if (
    !force &&
    paymentMethodCache &&
    now - paymentMethodCache.at < PAYMENT_METHOD_CACHE_MS
  ) {
    return paymentMethodCache.types;
  }

  let types: CheckoutPaymentMethod[];
  try {
    const data = await paymongoApi<{ data?: string[] }>(
      "/v1/merchants/capabilities/payment_methods",
      { context: "GET payment_methods" }
    );
    const active = new Set(data?.data ?? []);
    // Unrecognised identifiers are dropped rather than forwarded blind: they
    // cannot be ordered, cannot be described, and cannot be reasoned about.
    types = METHOD_ORDER.filter((m) => active.has(m) && SUPPORTED_METHODS.has(m));
  } catch (error) {
    console.warn(
      "[paymongo] could not read active payment methods, defaulting to qrph:",
      error instanceof Error ? error.message : error
    );
    types = [];
  }

  if (types.length === 0) types = [...FALLBACK_METHODS];

  paymentMethodCache = { at: now, types };
  return types;
}

/** Forgets the memoised method list. Used after a capability change in tests. */
export function resetPaymentMethodCache(): void {
  paymentMethodCache = null;
}

export interface CheckoutLineItem {
  name: string;
  /** Centavos. Integer — see src/lib/plans.ts for why. */
  amount: number;
  quantity: number;
}

export interface CreateCheckoutSessionInput {
  /**
   * Opaque identifier we control, echoed back on the payment and used to match
   * the webhook and the reconciliation poll to our own Payment row. Set this to
   * the Payment row id.
   */
  referenceNumber: string;
  lineItems: CheckoutLineItem[];
  paymentMethodTypes: CheckoutPaymentMethod[];
  successUrl: string;
  cancelUrl: string;
  /** Shown to the customer on the checkout page. */
  description?: string;
  billing?: { email?: string; name?: string };
}

export interface CheckoutSession {
  id: string;
  checkoutUrl: string;
  livemode: boolean;
}

/**
 * Create a PayMongo-hosted checkout session.
 *
 * This is the only call that spends money-adjacent state: it puts a payable
 * amount in front of a customer. The amount comes from the caller, which in
 * turn reads it from the plan catalogue — never from the request body — so a
 * client cannot ask to be charged ₱1 for Pro.
 */
export async function createCheckoutSession(
  input: CreateCheckoutSessionInput
): Promise<CheckoutSession> {
  const attributes: Record<string, unknown> = {
    line_items: input.lineItems.map((item) => ({
      name: item.name,
      amount: item.amount,
      currency: "PHP",
      quantity: item.quantity,
    })),
    payment_method_types: input.paymentMethodTypes,
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    reference_number: input.referenceNumber,
  };
  if (input.description) attributes.description = input.description;
  if (input.billing?.email || input.billing?.name) {
    attributes.billing = {
      email: input.billing.email,
      name: input.billing.name,
    };
  }

  const response = await paymongoApi<{
    data?: { id?: string; attributes?: { checkout_url?: string; livemode?: boolean } };
  }>("/v2/checkout_sessions", {
    method: "POST",
    body: { data: { attributes } },
    context: "POST checkout_sessions",
  });

  const id = response.data?.id;
  const checkoutUrl = response.data?.attributes?.checkout_url;
  if (!id || !checkoutUrl) {
    throw new PaymongoError(
      "POST checkout_sessions: response had no id/checkout_url",
      502
    );
  }

  return { id, checkoutUrl, livemode: response.data?.attributes?.livemode ?? false };
}

export interface PaymongoPayment {
  id: string;
  status: string;
  amount: number;
  currency: string;
  externalReferenceNumber: string | null;
  paidAt: string | null;
}

type PaymentListResponse = {
  data?: Array<{
    id?: string;
    attributes?: {
      status?: string;
      amount?: number;
      currency?: string;
      external_reference_number?: string | null;
      paid_at?: number | null;
    };
  }>;
};

/**
 * Look up a payment by the reference number we sent at checkout.
 *
 * This exists for two reasons:
 *
 *  1. PayMongo webhooks need a public HTTPS endpoint, so they cannot reach
 *     localhost. Without this, a developer could never see a payment land
 *     during local testing, and a production deployment whose webhook endpoint
 *     is missing or misconfigured would silently never grant access.
 *  2. Webhook delivery is best-effort (12 retries), so the "customer paid but
 *     nothing happened" case needs a way to self-heal.
 *
 * `reference_number` on the checkout session comes back as the payment's
 * `external_reference_number`, which is the documented linkage.
 */
export async function findPaidPaymentByReference(
  reference: string
): Promise<PaymongoPayment | null> {
  const response = await paymongoApi<PaymentListResponse>(
    "/v1/payments?limit=100",
    { context: "GET payments" }
  );

  for (const row of response.data ?? []) {
    const external = row.attributes?.external_reference_number ?? null;
    if (external !== reference) continue;
    return {
      id: row.id ?? "",
      status: row.attributes?.status ?? "unknown",
      amount: row.attributes?.amount ?? 0,
      currency: row.attributes?.currency ?? "PHP",
      externalReferenceNumber: external,
      paidAt:
        typeof row.attributes?.paid_at === "number"
          ? new Date(row.attributes.paid_at * 1000).toISOString()
          : null,
    };
  }

  return null;
}

/**
 * Verify a PayMongo webhook signature.
 *
 * The scheme is HMAC-SHA256 of the RAW request body keyed with the endpoint's
 * secret, hex-encoded, sent in the `Paymongo-Signature` header. Two details
 * matter and both are easy to get wrong:
 *
 *  - It must be the raw bytes. `await req.json()` then re-serialising will not
 *    match, so callers must hand us the unparsed body.
 *  - The comparison must be constant-time, or the signature leaks byte by byte.
 *
 * If no webhook secret is configured this returns false rather than true:
 * an unverified webhook is how an attacker grants themselves Pro for free.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signatureHeader: string | null
): boolean {
  const secret = webhookSecret();
  if (!secret) {
    console.warn(
      "[paymongo] PAYMONGO_WEBHOOK_SECRET is not set; rejecting webhook. " +
        "Add it to .env or this endpoint will never accept an event."
    );
    return false;
  }
  if (!signatureHeader) return false;

  const expected = createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("hex");

  // Accept the signature with or without a `t=<unix>,` / `v1=` prefix: some
  // webhook senders prefix the value, and rejecting those would silently drop
  // every event.
  const provided = signatureHeader
    .split(",")
    .map((part) => part.trim())
    .map((part) => (part.includes("=") ? part.slice(part.indexOf("=") + 1) : part))
    .find((part) => /^[0-9a-f]{64}$/i.test(part));

  if (!provided) return false;

  const a = Buffer.from(expected, "hex");
  const b = Buffer.from(provided.toLowerCase(), "hex");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
