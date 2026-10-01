"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { AdminStats } from "@/lib/admin-stats";
import AdminAuditTrail from "@/components/features/admin/AdminAuditTrail";
import AdminHeader from "@/components/features/admin/AdminHeader";
import AdminOverview from "@/components/features/admin/AdminOverview";
import AdminPaymentLedger from "@/components/features/admin/AdminPaymentLedger";
import AdminUserTable from "@/components/features/admin/AdminUserTable";
import type { Notify, Tab } from "@/components/features/admin/types";

/**
 * The admin panel shell.
 *
 * ## Why this is a client component
 *
 * The primary workflow is "look at a list, click a row, change a number, see the
 * list again". Every one of those steps is a round-trip to an /api/admin route,
 * and a server component per step would mean a full navigation between each --
 * losing the drawer's scroll position, the search box and the selected tab on
 * every write. So the panel is client-rendered and the initial stats arrive as a
 * prop from the server page, which keeps the first paint real data rather than a
 * skeleton followed by a fetch.
 *
 * This file is deliberately just composition: it owns which tab is open, the
 * shared toast, and the stats refetch. Everything with markup in it lives in a
 * sibling file. The previous version of this panel was one 1570-line file holding
 * all of the above plus three tabs, a drawer, a plan editor and four presentational
 * helpers; a change to the plan badge meant reading past the ledger to find out
 * who else rendered one.
 *
 * ## What this panel exposes
 *
 * Stated plainly: this shows every account's email, plan and payment history to
 * whoever holds isAdmin. That is the point of it, and it is why the flag is set
 * in Clerk by hand and never from application code. An admin can read anyone's
 * data and grant or revoke paid access; the audit log is the only accountability.
 */
export default function AdminClient({ initialStats }: { initialStats: AdminStats }) {
  const [tab, setTab] = useState<Tab>("users");
  const [stats, setStats] = useState(initialStats);

  /**
   * Toast state is local rather than routed through the app's Toast component,
   * which is driven by a ToastStack the caller has to own. Three lines of state
   * is cheaper than threading that through a page, and the admin panel has one
   * mount point for it by construction now that this file is only a shell.
   */
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /**
   * Shared by every tab, so a write in the drawer and a write in the ledger both
   * report through the same place.
   *
   * The timer is cleared before each new one is set, so three rapid writes
   * produce three toasts in sequence rather than one that disappears early
   * because a later write reset the clock on an earlier message. The cleanup
   * effect clears it on unmount -- without that, navigating away from the panel
   * mid-toast leaves a timer holding a setState on an unmounted component.
   */
  const notify = useCallback<Notify>((message, variant) => {
    setToast({ message, variant });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  /**
   * Refetched after every write so the overview numbers reflect the change
   * immediately rather than on the next full page load.
   *
   * Stable identity matters here: it is passed to AdminOverview and to each tab's
   * onChanged, so a fresh closure every render would make the refresh prop
   * change every render and defeat any memoisation below it.
   */
  const refreshStats = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/stats", { cache: "no-store" });
      if (res.ok) setStats(await res.json());
    } catch {
      // A stale header is not worth interrupting the admin over; the list below
      // is still correct and will refresh on its own next interaction.
    }
  }, []);

  return (
    <div className="min-h-dvh bg-[#FAFAF9]">
      <AdminHeader tab={tab} onTab={setTab} />

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <AdminOverview stats={stats} onRefresh={refreshStats} />

        {/* Tabs are switched by unmounting rather than hiding, so switching away
            and back refetches. That is the behaviour an admin wants after a
            write: the list they come back to reflects what they just did, not
            what it looked like when they left it. */}
        {tab === "users" && <AdminUserTable notify={notify} onChanged={refreshStats} />}
        {tab === "payments" && <AdminPaymentLedger notify={notify} onChanged={refreshStats} />}
        {tab === "audit" && <AdminAuditTrail />}
      </main>

      {toast && (
        <div
          role="status"
          className="fixed top-4 left-1/2 z-110 flex w-full max-w-sm -translate-x-1/2 items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg"
        >
          {toast.variant === "success" ? (
            <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-emerald-500" />
          ) : (
            <AlertTriangle size={18} className="mt-0.5 shrink-0 text-red-500" />
          )}
          <p className="flex-1 text-sm leading-snug text-gray-700">{toast.message}</p>
        </div>
      )}
    </div>
  );
}
