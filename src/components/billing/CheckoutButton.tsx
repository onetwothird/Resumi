"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import type { BillingInterval, PaidPlanId } from "@/lib/plans";

interface CheckoutButtonProps {
  plan: PaidPlanId;
  interval: BillingInterval;
  children: React.ReactNode;
  className?: string;
  /** Shown instead of `children` while the checkout session is being created. */
  pendingLabel?: string;
  /**
   * Where to send a signed-out visitor instead of starting checkout. Defaults
   * to the page the button is on, so returning after sign-in lands back here
   * rather than on a dashboard.
   */
  signedOutHref?: string;
}

/**
 * Starts a PayMongo checkout for a plan.
 *
 * The button carries no price. It sends the plan id and interval, and
 * /api/billing/checkout resolves the amount server-side from the catalogue, so
 * a tampered client cannot decide what it is charged — the amount on the
 * pricing page and the amount on the PayMongo page come from the same object.
 *
 * A 401 is not an error state: it means the visitor is not signed in, so the
 * only useful response is to send them to sign in and bring them back.
 */
export default function CheckoutButton({
  plan,
  interval,
  children,
  className = "",
  pendingLabel = "Opening checkout…",
  signedOutHref,
}: CheckoutButtonProps) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();

  async function startCheckout() {
    if (pending) return;
    setPending(true);
    setError(null);

    try {
      const response = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, interval }),
      });

      if (response.status === 401) {
        // Sign-in is an internal route, so this is a client-side navigation.
        // (The PayMongo URL below is a different origin and has to be a full
        // page load.)
        const target = signedOutHref ?? pathname ?? "/pricing";
        router.push(`/sign-in?redirect_url=${encodeURIComponent(target)}`);
        return;
      }

      const data = (await response.json().catch(() => null)) as {
        url?: string;
        error?: string;
      } | null;

      if (!response.ok || !data?.url) {
        setError(data?.error ?? "We could not start checkout. Please try again.");
        setPending(false);
        return;
      }

      // Full navigation on purpose: the PayMongo checkout page is a different
      // origin, and using an in-app router would leave a back-button that
      // replays a POST.
      window.location.href = data.url;
    } catch {
      setError("Network error. Please check your connection and try again.");
      setPending(false);
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={startCheckout}
        disabled={pending}
        aria-busy={pending}
        className={`w-full flex items-center justify-center gap-2 min-h-11 ${className}`}
      >
        {pending && <Loader2 size={16} className="animate-spin" aria-hidden />}
        {pending ? pendingLabel : children}
      </button>

      {error && (
        <p
          role="alert"
          className="mt-2 flex items-start gap-1.5 text-xs text-red-600"
        >
          <AlertCircle size={14} className="mt-px shrink-0" aria-hidden />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
