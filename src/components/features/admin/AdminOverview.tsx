"use client";

import { useState } from "react";
import { AlertTriangle, Crown, Loader2, RefreshCw, TrendingUp, Users, Wallet } from "lucide-react";
import { formatPeso } from "@/lib/plans";
import type { AdminStats } from "@/lib/admin-stats";

/**
 * The overview cards and the "needs a look" banner.
 *
 * Split out from the shell because it is the one region that is always on
 * screen: the numbers have to stay visible and refetchable while the admin works
 * in a tab below, and keeping it a separate component makes that refetch a single
 * prop rather than shared state in the parent.
 *
 * The banner is the point of the panel, not decoration. "Needs a look" counts
 * two specific states where money and entitlement have come apart -- a paid plan
 * whose date has passed, and a payment stuck in pending -- and those are the only
 * counts here that imply an action a human has to take.
 */
export default function AdminOverview({
  stats,
  onRefresh,
}: {
  stats: AdminStats;
  /** Kicked after every successful write so the numbers never lag the list. */
  onRefresh: () => void;
}) {
  const [refreshing, setRefreshing] = useState(false);

  const doRefresh = async () => {
    setRefreshing(true);
    onRefresh();
    // The fetch is fire-and-forget via the prop. Holding the spinner for a fixed
    // beat rather than awaiting keeps the header responsive even if the request
    // is slow; the numbers simply update when they arrive.
    setTimeout(() => setRefreshing(false), 600);
  };

  /**
   * The two revenue figures round-trip through pesos to centavos because
   * formatPeso expects minor units. getAdminStats already divided by 100 when
   * summing, so this is not a second division -- it is restoring the unit
   * formatPeso was written against, which is the whole reason that helper exists.
   */
  const cards = [
    {
      label: "Total users",
      value: stats.totals.users.toLocaleString("en-US"),
      sub: `+${stats.signups.last7Days} in 7 days`,
      icon: Users,
      tone: "text-gray-900",
    },
    {
      label: "Paid accounts",
      value: stats.totals.paid.toLocaleString("en-US"),
      sub: `${stats.plans.pro} Pro · ${stats.plans.premium} Premium`,
      icon: Crown,
      tone: "text-indigo-600",
    },
    {
      label: "Revenue collected",
      value: formatPeso(Math.round(stats.revenue.lifetime * 100)),
      sub: `${formatPeso(Math.round(stats.revenue.last30Days * 100))} last 30 days`,
      icon: Wallet,
      tone: "text-emerald-600",
    },
    {
      label: "Needs a look",
      value: (stats.attention.expiringSoon + stats.attention.lapsedButStillPaid).toLocaleString(
        "en-US"
      ),
      sub: `${stats.attention.lapsedButStillPaid} lapsed · ${stats.revenue.pendingCount} pending payments`,
      icon: TrendingUp,
      // Red only when something is actually lapsed. A pending payment is
      // routine; a paid plan that expired without granting anything is not, and
      // the colour is what makes that distinction at a glance.
      tone: stats.attention.lapsedButStillPaid > 0 ? "text-red-600" : "text-gray-900",
    },
  ];

  return (
    <section className="mb-6">
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-lg font-bold text-gray-900">Overview</h1>
        <button
          type="button"
          onClick={doRefresh}
          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50"
        >
          {refreshing ? (
            <Loader2 size={13} className="animate-spin" aria-hidden />
          ) : (
            <RefreshCw size={13} aria-hidden />
          )}
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(({ label, value, sub, icon: Icon, tone }) => (
          <div
            key={label}
            className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {label}
              </p>
              <Icon size={16} className={tone} aria-hidden />
            </div>
            <p className={`mt-2 text-2xl font-extrabold tracking-tight ${tone}`}>{value}</p>
            <p className="mt-1 text-xs text-gray-500">{sub}</p>
          </div>
        ))}
      </div>

      {(stats.attention.lapsedButStillPaid > 0 || stats.revenue.pendingCount > 0) && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
          <p className="text-sm text-amber-900">
            {stats.attention.lapsedButStillPaid > 0 && (
              <>
                <strong>
                  {stats.attention.lapsedButStillPaid}{" "}
                  {stats.attention.lapsedButStillPaid === 1 ? "account is" : "accounts are"}
                </strong>{" "}
                still on a paid plan past its expiry date.{" "}
              </>
            )}
            {stats.revenue.pendingCount > 0 && (
              <>
                <strong>{stats.revenue.pendingCount}</strong>{" "}
                {stats.revenue.pendingCount === 1 ? "payment is" : "payments are"} still
                pending — usually a card checkout PayMongo never confirmed, or a QR
                transfer that needs recording by hand.
              </>
            )}
          </p>
        </div>
      )}
    </section>
  );
}