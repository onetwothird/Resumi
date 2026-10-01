"use client";

import type { ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { PLANS, type PlanId } from "@/lib/plans";

/**
 * Presentational primitives shared across the admin tabs.
 *
 * These were three separate definitions duplicated inline in the single-file
 * version of this panel -- PlanBadge appeared in the users table and the drawer,
 * PaymentStatus in the ledger and the drawer -- and a plan colour or a date
 * format that drifted between two copies is exactly the kind of bug an admin
 * would read as "the panel is lying to me". One definition, one place to change.
 *
 * Nothing here fetches or holds state. Every component is a pure function of its
 * props, which is what makes them safe to share across tabs.
 */

/**
 * Table column header.
 *
 * align exists because these tables mix left-aligned identity columns with
 * right-aligned numerics, and hand-writing the text-align on each would drift.
 */
export function Th({
  children,
  align = "left",
}: {
  children: ReactNode;
  align?: "left" | "right";
}) {
  return (
    <th
      scope="col"
      className={`px-4 py-2.5 text-xs font-semibold tracking-wide text-gray-500 uppercase ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {children}
    </th>
  );
}

/**
 * The "nothing here" panel.
 *
 * Every empty case gets a body that explains WHY it is empty rather than just
 * stating it, because the most confusing thing an admin can be told is "No
 * results" when the real answer is "QR transfers are not recorded here".
 */
export function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof AlertTriangle;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
      <Icon size={28} className="text-gray-300" aria-hidden />
      <p className="text-sm font-semibold text-gray-700">{title}</p>
      <p className="text-xs text-gray-500">{body}</p>
    </div>
  );
}

/**
 * The plan pill.
 *
 * `expired` is a separate flag rather than being derived from plan and
 * planExpiresAt here, because the callers each already hold a reference instant
 * (the fetch time). Letting this component call Date.now() during render would
 * mean a row that silently reclassified itself at midnight without a refetch.
 *
 * "Lapsed" is shown instead of the plan name deliberately: a row reading "Pro"
 * next to an expiry in the past is the contradiction the panel exists to
 * surface, so the pill leads with the problem.
 */
export function PlanBadge({ plan, expired }: { plan: PlanId; expired: boolean }) {
  if (expired) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-700 ring-1 ring-red-200 ring-inset">
        <AlertTriangle size={11} aria-hidden />
        Lapsed
      </span>
    );
  }
  const styles: Record<PlanId, string> = {
    free: "bg-gray-100 text-gray-600 ring-gray-200",
    pro: "bg-indigo-50 text-indigo-700 ring-indigo-200",
    premium: "bg-amber-50 text-amber-700 ring-amber-200",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${styles[plan]}`}
    >
      {PLANS[plan].name}
    </span>
  );
}

/**
 * Expiry, phrased as how long is left rather than as a date.
 *
 * A date is what the database holds, but the question an admin is actually
 * asking is "does this need attention", and "3 days left" answers it where
 * "2026-10-04" does not. Under a week is highlighted because that is the window
 * where a renewal conversation is still possible.
 *
 * `now` is required rather than defaulted to Date.now() for the reason above:
 * every row in a table is measured against one instant captured at fetch time,
 * so rows that straddle a tick cannot disagree by a day.
 */
export function ExpiryCell({
  expiresAt,
  plan,
  now,
}: {
  expiresAt: string | null;
  plan: PlanId;
  now: number;
}) {
  if (plan === "free") {
    return <span className="text-xs text-gray-400">—</span>;
  }
  if (!expiresAt) {
    return <span className="text-xs font-medium text-gray-500">No expiry</span>;
  }

  const ms = new Date(expiresAt).getTime() - now;
  if (ms <= 0) {
    return <span className="text-xs font-semibold text-red-600">Expired</span>;
  }
  const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
  const urgent = days <= 7;
  return (
    <span
      className={`text-xs font-semibold ${urgent ? "text-amber-600" : "text-gray-600"}`}
      title={new Date(expiresAt).toLocaleString()}
    >
      {days === 1 ? "1 day left" : `${days} days left`}
    </span>
  );
}

/** Payment lifecycle pill. Unknown statuses fall back to the neutral style
 *  rather than rendering unstyled text, so a new provider status added later
 *  degrades to "present but unremarkable" instead of looking like an error. */
export function PaymentStatus({ status }: { status: string }) {
  const styles: Record<string, string> = {
    paid: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    pending: "bg-amber-50 text-amber-700 ring-amber-200",
    failed: "bg-red-50 text-red-700 ring-red-200",
    expired: "bg-gray-100 text-gray-600 ring-gray-200",
  };
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ring-1 ring-inset ${
        styles[status] ?? styles.expired
      }`}
    >
      {status}
    </span>
  );
}

/**
 * en-PH is pinned rather than left to the browser's locale.
 *
 * Every other money-facing surface in this app formats through formatPeso, which
 * is explicit. A bare toLocaleDateString() would render the same audit log
 * differently for an admin in the Philippines and one abroad, and "Jan 5" vs
 * "5 Jan" is genuinely ambiguous next to a payment amount.
 */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/**
 * The stored action code as something readable.
 *
 * The default branch returns the raw code on purpose: ADMIN_ACTIONS in
 * src/lib/admin.ts is the registry of what can appear here, and this switch is a
 * presentation layer over it. An unmapped value means a new action was added
 * without updating the UI, and showing the raw code makes that obvious instead
 * of showing a blank or silently hiding a log entry.
 */
export function describeAction(action: string): string {
  switch (action) {
    case "plan.set":
      return "Plan changed";
    case "payment.mark_paid":
      return "Payment marked paid";
    case "user.note":
      return "Note edited";
    default:
      return action;
  }
}