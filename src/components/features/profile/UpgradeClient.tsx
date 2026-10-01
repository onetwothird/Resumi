"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  LayoutDashboard,
  Bookmark,
  Crown,
  User as UserIcon,
  Settings,
  Check,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  XCircle,
  Loader2,
  CreditCard,
} from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";
import NotificationBell from "@/components/features/dashboard/NotificationBell";
import InboxDropdown from "@/components/features/dashboard/InboxDropdown";
import MobileNav from "@/components/layout/MobileNav";
import CheckoutButton from "@/components/billing/CheckoutButton";
import {
  PLANS,
  PLAN_ORDER,
  formatPeso,
  isPlanId,
  monthlyEquivalent,
  type BillingInterval,
  type PlanId,
} from "@/lib/plans";

/** Mirrors the shape of GET /api/billing/status. */
interface BillingState {
  plan: PlanId;
  planStatus: string | null;
  planExpiresAt: string | null;
  active: boolean;
  payment?: { id: string; status: string; plan: string; amount: number } | null;
}

export default function UpgradeClient({
  initialPlan,
  initialExpiresAt,
  initialActive,
}: {
  initialPlan: PlanId;
  initialExpiresAt: string | null;
  initialActive: boolean;
}) {
  const { user } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Not `setInterval`: that name belongs to the timer API, and shadowing it
  // inside this component makes the polling call below unreadable.
  const [interval, setCycle] = useState<BillingInterval>("month");
  const [state, setState] = useState<BillingState>({
    plan: initialPlan,
    planStatus: null,
    planExpiresAt: initialExpiresAt,
    active: initialActive,
  });
  // The checkout return carries ?checkout=success&payment=<id>.
  const outcome = searchParams.get("checkout");
  const paymentId = searchParams.get("payment");
  // Cancelling is not a transition, it is just where the URL landed. Reading it
  // during render instead of copying it into state on mount keeps it correct on
  // back/forward navigation for free.
  const wasCancelled = outcome === "cancelled";

  // Only the confirmation is real state: it starts "pending" on arrival from
  // PayMongo and becomes "paid" when the server says so. Initialised from the
  // URL rather than set in an effect, which would cost an extra render pass.
  const [settled, setSettled] = useState<"paid" | "pending" | null>(
    outcome === "success" && paymentId ? "pending" : null
  );

  // The webhook is the primary signal, but it needs a public HTTPS endpoint and
  // so cannot fire during local development; polling the status route covers
  // both, since that route also reconciles the payment against PayMongo itself.
  useEffect(() => {
    if (settled !== "pending" || !paymentId) return;

    const abort = { cancelled: false };

    const check = async () => {
      try {
        const response = await fetch(
          `/api/billing/status?payment=${encodeURIComponent(paymentId)}`
        );
        if (!response.ok) return;
        const data = (await response.json()) as BillingState;
        if (abort.cancelled) return;
        setState(data);
        if (data.payment?.status === "paid") {
          setSettled("paid");
          // Strip ?checkout=… so a refresh does not resume polling a payment
          // that has already been accounted for.
          router.replace(pathname ?? "/upgrade");
        }
      } catch {
        // Transient failure; the next tick retries.
      }
    };

    void check();
    const timer = setInterval(check, 2500);
    return () => {
      abort.cancelled = true;
      clearInterval(timer);
    };
    // Depends on `settled` so polling stops once the payment is confirmed.
    // `paymentId` is read from the URL, which does not change under us.
  }, [settled, paymentId, router, pathname]);

  const currentPlan = isPlanId(state.plan) ? state.plan : "free";
  const onProOrAbove = currentPlan !== "free" && state?.active !== false;

  return (
    <div className="min-h-dvh bg-[#F4F6F8] flex flex-col font-sans">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <ResumiLogo className="w-8 h-8" />
            <span className="hidden sm:inline">Resumi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/jobs" className="hover:text-gray-900 transition-colors">Jobs</Link>
            <Link href="/companies" className="hover:text-gray-900 transition-colors">Companies</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <NotificationBell />
          <InboxDropdown />
          <div className="flex items-center gap-2 sm:ml-2">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link label="Edit Profile" labelIcon={<UserIcon size={15} />} href="/profile" />
                <UserButton.Link label="Employer Dashboard" labelIcon={<Crown size={15} />} href="/employer/dashboard" />
                <UserButton.Link label="Pricing" labelIcon={<CreditCard size={15} />} href="/pricing" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
        <MobileNav
          items={[
            { label: "Home", href: "/dashboard", icon: LayoutDashboard },
            { label: "Jobs", href: "/jobs", icon: Briefcase },
            { label: "Companies", href: "/companies", icon: Building2 },
          ]}
          label="Open navigation"
        />
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">

        {/* Synchronized Sidebar */}
        <aside className="md:col-span-3 space-y-8">
          <div className="flex items-center gap-3 px-2">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-sm">
                {user?.fullName?.charAt(0) || "U"}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{user?.fullName || "User"}</h3>
              <p className="text-xs text-gray-500 truncate">@{user?.username || "username"}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <LayoutDashboard size={18} className={pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-400'} /> Dashboard
            </Link>
            <Link href="/saved" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/saved' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Bookmark size={18} className={pathname === '/saved' ? 'text-indigo-600' : 'text-gray-400'} /> Bookmarks
            </Link>
            <Link href="/upgrade" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/upgrade' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Crown size={18} className={pathname === '/upgrade' ? 'text-indigo-600' : 'text-gray-400'} /> Plans
            </Link>
            <Link href="/profile" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/profile' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <UserIcon size={18} className={pathname === '/profile' ? 'text-indigo-600' : 'text-gray-400'} /> Edit profile
            </Link>
            <Link href="/notifications" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/notifications' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Bell size={18} className={pathname === '/notifications' ? 'text-indigo-600' : 'text-gray-400'} /> Notifications
            </Link>
            <Link href="/settings" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/settings' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Settings size={18} className={pathname === '/settings' ? 'text-indigo-600' : 'text-gray-400'} /> Settings
            </Link>
          </nav>
        </aside>

        {/* Plans */}
        <main className="md:col-span-9 space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              Plans
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Unlock premium AI features and stand out to employers.
            </p>
          </div>

          {settled === "paid" && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-4"
            >
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  Payment received — your plan is active.
                </p>
                <p className="text-sm text-emerald-800">
                  {state?.planExpiresAt
                    ? `It runs until ${new Date(state.planExpiresAt).toLocaleDateString("en-PH", { dateStyle: "long" })}.`
                    : "Thanks for upgrading."}
                </p>
              </div>
            </div>
          )}

          {settled === "pending" && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4"
            >
              <Loader2 size={20} className="mt-0.5 shrink-0 animate-spin text-amber-600" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Confirming your payment…
                </p>
                <p className="text-sm text-amber-800">
                  This usually takes a few seconds. Keep this tab open.
                </p>
              </div>
            </div>
          )}

          {wasCancelled && (
            <div
              role="status"
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4"
            >
              <XCircle size={20} className="mt-0.5 shrink-0 text-gray-500" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Checkout cancelled — nothing was charged.
                </p>
                <p className="text-sm text-gray-600">
                  Pick a plan below whenever you&apos;re ready.
                </p>
              </div>
            </div>
          )}

          {/* Current plan */}
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  Current plan
                </p>
                <p className="mt-1 text-lg font-extrabold text-gray-900">
                  {PLANS[currentPlan].name}
                </p>
              </div>
              {state?.planExpiresAt && (
                <p className="text-sm text-gray-500">
                  {state.active
                    ? `Active until ${new Date(state.planExpiresAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}`
                    : `Expired ${new Date(state.planExpiresAt).toLocaleDateString("en-PH", { dateStyle: "medium" })}`}
                </p>
              )}
            </div>
          </div>

          {/* Interval toggle */}
          <div className="flex items-center gap-2">
            {(["month", "year"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setCycle(option)}
                aria-pressed={interval === option}
                className={`px-4 min-h-11 rounded-full text-sm font-semibold border transition-colors ${
                  interval === option
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                }`}
              >
                {option === "month" ? "Monthly" : "Annual"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {PLAN_ORDER.filter((id) => id !== "free").map((id) => {
              const plan = PLANS[id];
              const isCurrent = currentPlan === id && onProOrAbove;
              const isUpgrade = !isCurrent && currentPlan === "free";

              return (
                <div
                  key={plan.id}
                  className={`flex flex-col rounded-3xl border bg-white p-6 sm:p-7 shadow-sm ${
                    plan.highlighted
                      ? "border-2 border-indigo-600"
                      : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <h2 className="text-lg font-extrabold text-gray-900">{plan.name}</h2>
                    {plan.highlighted && (
                      <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-700">
                        Most Popular
                      </span>
                    )}
                  </div>

                  <div className="mb-1 flex items-end gap-1">
                    <span className="text-4xl font-black text-gray-900">
                      {formatPeso(monthlyEquivalent(plan, interval))}
                    </span>
                    <span className="mb-1 font-medium text-gray-500">/mo</span>
                  </div>
                  <p className="mb-5 text-sm text-gray-500">
                    {plan.prices.month === 0
                      ? "Free forever"
                      : interval === "year"
                        ? `Billed ${formatPeso(plan.prices.year)} annually`
                        : "Billed monthly"}
                  </p>

                  <ul className="mb-7 flex-1 space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm font-medium text-gray-700">
                        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100">
                          <Check size={12} className="text-emerald-700" aria-hidden />
                        </span>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {isCurrent ? (
                    <div className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 size={16} aria-hidden />
                      Your current plan
                    </div>
                  ) : (
                    <CheckoutButton
                      plan={id as "pro" | "premium"}
                      interval={interval}
                      signedOutHref="/upgrade"
                      className={`py-3.5 rounded-xl font-bold transition-colors ${
                        plan.highlighted
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "border border-gray-200 text-gray-700 hover:border-indigo-600 hover:text-indigo-600"
                      }`}
                    >
                      {isUpgrade ? "Upgrade now" : "Switch to " + plan.name}
                    </CheckoutButton>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs leading-relaxed text-gray-500">
            Payments are processed by PayMongo. A plan is charged once at checkout
            and does not renew automatically — you keep it for the full period
            you paid for. Need a refund? Contact us within 14 days of your first
            payment.
          </p>
        </main>
      </div>
    </div>
  );
}
