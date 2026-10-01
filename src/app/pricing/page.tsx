import type { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";
import PricingClient from "@/components/billing/PricingClient";
import { getBillingState } from "@/lib/billing";
import { isPlanId, type PlanId } from "@/lib/plans";

export const metadata: Metadata = {
  title: "Pricing | Resumi",
  description:
    "Start free and upgrade to Pro or Premium for unlimited AI-tailored resumes, job match scoring and career-coach support.",
};

type Role = "employer" | "jobseeker";

/**
 * The public pricing page.
 *
 * Deliberately a server component even though everything it renders is a client
 * component: /pricing has to work for a visitor who is already signed in, and
 * the only way to know which plan that is — and to mark it in the grid instead
 * of selling it to them again — is to read the session and the billing row here
 * and hand the answer down. Reading it in the browser instead would mean
 * rendering "Start free trial" on every card and correcting it a beat later.
 *
 * The trade is that the page is now dynamic rather than a static shell. That is
 * the same trade /upgrade already makes, and one cheap indexed row read is a
 * fair price for not offering a signed-in user a plan they already own.
 */
export default async function PricingPage() {
  const { userId, sessionClaims } = await auth();

  let currentPlan: PlanId = "free";
  let planActive = true;
  let planExpiresAt: string | null = null;

  if (userId) {
    const state = await getBillingState(userId);
    currentPlan = isPlanId(state.plan) ? state.plan : "free";
    planActive = state.active;
    planExpiresAt = state.planExpiresAt;
  }

  // Same claim proxy.ts routes on. Read from the session token rather than
  // making another Clerk round-trip for a value the middleware already had.
  const role = (sessionClaims?.metadata as { role?: Role } | undefined)?.role;

  return (
    <PricingClient
      signedIn={Boolean(userId)}
      currentPlan={currentPlan}
      planActive={planActive}
      planExpiresAt={planExpiresAt}
      dashboardHref={role === "employer" ? "/employer/dashboard" : "/dashboard"}
    />
  );
}