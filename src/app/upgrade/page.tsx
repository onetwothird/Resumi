import { Suspense } from "react";
import UpgradeClient from "@/components/features/profile/UpgradeClient";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getBillingState } from "@/lib/billing";
import { isPlanId, type PlanId } from "@/lib/plans";

export const metadata = {
  title: "Plans | Resumi",
  description: "Upgrade to Pro or Premium and unlock every Resumi feature.",
};

export default async function UpgradePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in?redirect_url=%2Fupgrade");

  // Read the plan server-side and hand it down, so the page renders with the
  // right plan on the first paint instead of flashing "Free" and correcting
  // itself after a client fetch.
  const state = await getBillingState(userId);

  return (
    <Suspense fallback={null}>
      <UpgradeClient
        initialPlan={isPlanId(state.plan) ? (state.plan as PlanId) : "free"}
        initialExpiresAt={state.planExpiresAt}
        initialActive={state.active}
      />
    </Suspense>
  );
}
