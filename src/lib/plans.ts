/**
 * The plan catalogue.
 *
 * This is the single source of truth for what Resumi sells. The pricing page,
 * the upgrade page, the checkout API route and the webhook all read from here,
 * so a price can never be shown on one page and charged at a different amount
 * on another. That was the bug this replaces: /pricing advertised Pro at
 * ₱199/mo while /upgrade advertised "Resumi Pro" at ₱499/month, and neither
 * number had anything to do with what a payment provider was actually asked
 * to charge.
 *
 * MONEY IS STORED IN CENTAVOS, as integers. PayMongo's API takes minor units,
 * and float pesos are how you end up charging ₱1910.3999999999999. Display
 * formatting happens once, in formatPeso().
 */

export type PlanId = "free" | "pro" | "premium";
export type PaidPlanId = Exclude<PlanId, "free">;
export type BillingInterval = "month" | "year";

export const BILLING_INTERVALS: readonly BillingInterval[] = ["month", "year"] as const;

export interface Plan {
  id: PlanId;
  name: string;
  description: string;
  features: string[];
  cta: string;
  /** Marks the recommended plan in the pricing grid. */
  highlighted?: boolean;
  /**
   * Price in centavos for one whole period, charged as a single payment.
   *
   * Annual is not `month * 12 * 0.8` computed at runtime — it is spelled out
   * so the number the customer is charged is visible in one place and can be
   * reviewed without doing arithmetic. Both annual figures divide by 12
   * exactly (191040/12 = 15920, 287040/12 = 23920), which is what lets the
   * "20% off" monthly-equivalent shown on the pricing page be exact rather
   * than rounded.
   */
  prices: Record<BillingInterval, number>;
  /** How long access granted by a paid payment lasts. */
  period: Record<BillingInterval, number> | null;
}

const MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const YEAR_MS = 365 * 24 * 60 * 60 * 1000;

export const PLANS: Record<PlanId, Plan> = {
  free: {
    id: "free",
    name: "Free",
    description: "Get your resume out there and start applying.",
    features: [
      "Build 1 resume",
      "Apply to unlimited jobs",
      "Basic job matching",
      "Community support",
    ],
    cta: "Get started",
    prices: { month: 0, year: 0 },
    period: null,
  },
  pro: {
    id: "pro",
    name: "Pro",
    description: "For active job seekers who want every edge.",
    features: [
      "Unlimited AI-tailored resumes",
      "AI cover letter generator",
      "Job match scoring",
      "Application tracker",
      "Priority email support",
    ],
    cta: "Start free trial",
    highlighted: true,
    // ₱199.00/mo, or ₱1,910.40/yr (= ₱159.20/mo, the 20%-off figure shown
    // on the pricing page).
    prices: { month: 19_900, year: 191_040 },
    period: { month: MONTH_MS, year: YEAR_MS },
  },
  premium: {
    id: "premium",
    name: "Premium",
    description: "Full support from search to signed offer.",
    features: [
      "Everything in Pro",
      "1:1 resume review from a career coach",
      "LinkedIn profile optimization",
      "AI interview prep",
      "Early access to new roles",
    ],
    cta: "Start free trial",
    // ₱299.00/mo, or ₱2,870.40/yr (= ₱239.20/mo).
    prices: { month: 29_900, year: 287_040 },
    period: { month: MONTH_MS, year: YEAR_MS },
  },
};

/** Display order on the pricing page. */
export const PLAN_ORDER: readonly PlanId[] = ["free", "pro", "premium"] as const;

export const PAID_PLAN_IDS: readonly PaidPlanId[] = ["pro", "premium"] as const;

/**
 * Higher means a better plan. Used to refuse a downgrade-sell and to keep the
 * granted plan from being silently downgraded by an out-of-order webhook.
 */
export const PLAN_RANK: Record<PlanId, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && value in PLANS;
}

export function isPaidPlanId(value: unknown): value is PaidPlanId {
  return isPlanId(value) && value !== "free";
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}

export function getPlan(id: PlanId): Plan {
  return PLANS[id];
}

/**
 * What one month of access costs under the given interval.
 *
 * For "year" this is the per-month equivalent of the annual price, which is
 * what the pricing page displays next to the "/mo" suffix when the annual
 * toggle is on. Both annual totals divide by 12 exactly, so this is not
 * rounded and there is no drift between the displayed figure and the charge.
 */
export function monthlyEquivalent(plan: Plan, interval: BillingInterval): number {
  return interval === "year"
    ? Math.round(plan.prices.year / 12)
    : plan.prices.month;
}

/** The amount actually charged for one period, in centavos. */
export function chargeAmount(plan: Plan, interval: BillingInterval): number {
  return plan.prices[interval];
}

/** How long a paid payment extends access, in milliseconds. */
export function periodMs(plan: Plan, interval: BillingInterval): number {
  return plan.period?.[interval] ?? 0;
}

/**
 * Format centavos as a peso amount.
 *
 * Whole pesos drop the decimals (₱199) so the common case reads cleanly, and
 * anything with a fractional part keeps two of them (₱159.20, ₱1,910.40) so an
 * annual charge never looks like a rounded-down or rounded-up number.
 */
export function formatPeso(centavos: number): string {
  const pesos = centavos / 100;
  const isWhole = Math.abs(pesos - Math.round(pesos)) < 1e-9;
  const formatted = isWhole
    ? pesos.toLocaleString("en-US", { maximumFractionDigits: 0 })
    : pesos.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
  return `₱${formatted}`;
}

/** Percent saved by taking the annual price instead of 12 monthly ones. */
export function annualSavingPercent(plan: Plan): number {
  if (plan.prices.month === 0 || plan.prices.year === 0) return 0;
  const yearlyIfMonthly = plan.prices.month * 12;
  return Math.round((1 - plan.prices.year / yearlyIfMonthly) * 100);
}

/** "Billed ₱1,910.40 annually" / "Free forever" / "Billed monthly". */
export function billingNote(plan: Plan, interval: BillingInterval): string {
  if (plan.prices.month === 0) return "Free forever";
  return interval === "year"
    ? `Billed ${formatPeso(plan.prices.year)} annually`
    : "Billed monthly";
}
