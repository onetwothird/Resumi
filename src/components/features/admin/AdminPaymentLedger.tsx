"use client";

import { useCallback, useEffect, useState } from "react";
import { CreditCard, Loader2 } from "lucide-react";
import { PLANS, formatPeso, type PlanId } from "@/lib/plans";
import {
  EmptyState,
  PaymentStatus,
  Th,
  formatDate,
} from "@/components/features/admin/admin-ui";
import type { Notify, PaymentRow } from "@/components/features/admin/types";

/**
 * The payments ledger.
 *
 * ## What this tab is for, and what it is not
 *
 * This is the reconciliation queue for card checkouts PayMongo never confirmed:
 * a payment stuck in pending where the money demonstrably arrived but no webhook
 * landed. That is a real case and it needs a human.
 *
 * It is NOT where QR transfers get recorded. A QR transfer creates no Payment
 * row and fires no webhook, so there is nothing here for it to show. The route
 * for that is the account's Plan tab in the users table. The empty state says so
 * in those words, because "this account definitely paid and I cannot find it" is
 * the exact confusion this panel causes if left unstated.
 *
 * ## Why mark-paid delegates rather than writes
 *
 * "Mark paid" posts to /api/admin/payments/[id]/mark-paid, which calls the same
 * recordPaidPayment a real webhook calls. Deliberately: a manually reconciled
 * payment and a webhook-confirmed one must produce identical state, including
 * the plan grant and the expiry calculation. If this tab wrote the plan itself it
 * would be a second implementation of the granting rules, and the two would
 * diverge the first time a rule changed.
 */

type StatusFilter = "pending" | "paid" | "failed" | "expired" | "";

interface PaymentsResponse {
  payments: PaymentRow[];
  page: number;
  totalPages: number;
  total: number;
}

export default function AdminPaymentLedger({
  notify,
  onChanged,
}: {
  notify: Notify;
  onChanged: () => void;
}) {
  // Defaults to pending, not all. The tab exists to clear a queue; opening it on
  // a list of settled payments buries the two rows that need a decision.
  const [status, setStatus] = useState<StatusFilter>("pending");
  const [data, setData] = useState<PaymentsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirm, setConfirm] = useState<PaymentRow | null>(null);
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: "1", perPage: "50" });
      if (status) params.set("status", status);
      const res = await fetch(`/api/admin/payments?${params}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setData(await res.json());
    } catch (error) {
      notify(error instanceof Error ? error.message : "Couldn't load payments.", "error");
    } finally {
      setLoading(false);
    }
  }, [status, notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: initial fetch populates the ledger
    void load();
  }, [load]);

  /**
   * `alreadyPaid` is reported rather than treated as an error.
   *
   * Two admins reconciling the same queue is the normal case for a one-person
   * product, and the loser of that race has done nothing wrong. The route
   * returns alreadyPaid instead of throwing so the second click says "that was
   * already done" rather than a failure the admin has to interpret.
   */
  const markPaid = async () => {
    if (!confirm) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/admin/payments/${encodeURIComponent(confirm.id)}/mark-paid`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ note: reason }),
        }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const result = await res.json();
      notify(
        result.alreadyPaid
          ? "That payment was already paid — nothing changed."
          : `Marked paid. ${PLANS[confirm.plan as PlanId]?.name ?? confirm.plan} granted.`,
        "success"
      );
      setConfirm(null);
      setReason("");
      void load();
      onChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Couldn't mark it paid.", "error");
    } finally {
      setSaving(false);
    }
  };

  const statuses = [
    { id: "pending" as const, label: "Pending" },
    { id: "paid" as const, label: "Paid" },
    { id: "failed" as const, label: "Failed" },
    { id: "expired" as const, label: "Expired" },
    { id: "" as const, label: "All" },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <button
            key={s.id || "all"}
            type="button"
            onClick={() => setStatus(s.id)}
            aria-pressed={status === s.id}
            className={`min-h-9 rounded-full px-3.5 text-sm font-semibold border transition-colors ${
              status === s.id
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            Loading payments…
          </div>
        ) : data && data.payments.length === 0 ? (
          <EmptyState
            icon={CreditCard}
            title="Nothing here"
            body={`No ${status || ""} payments. A QR transfer never creates a row here — record it from the user's Plan tab.`}
          />
        ) : (
          // min-w-160 is 160 * 0.25rem = 40rem = 640px, the bare-number form
          // Tailwind v4 emits. Written as min-w-[640px] it is equivalent; the
          // bracket form was stripped in commit 11fa39e and this one still needs
          // to keep working as the columns change.
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/60">
                <tr>
                  <Th>Account</Th>
                  <Th>Plan</Th>
                  <Th align="right">Amount</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th align="right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.payments.map((p) => (
                  <tr key={p.id} className="transition-colors hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="truncate font-semibold text-gray-900">
                        {p.user.name || "—"}
                      </p>
                      <p className="truncate text-xs text-gray-500">{p.user.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {PLANS[p.plan as PlanId]?.name ?? p.plan}{" "}
                      <span className="text-xs text-gray-400">
                        /{p.interval === "year" ? "yr" : "mo"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold tabular-nums text-gray-900">
                      {formatPeso(p.amount)}
                    </td>
                    <td className="px-4 py-3">
                      <PaymentStatus status={p.status} />
                    </td>
                    <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-500">
                      {formatDate(p.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Only unsettled rows get the button. A settled payment
                          showing an enabled "Mark paid" invites a pointless
                          write that will come back alreadyPaid. */}
                      {p.status === "paid" ? (
                        <span className="text-xs text-gray-400">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            setConfirm(p);
                            setReason("");
                          }}
                          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-indigo-700"
                        >
                          Mark paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {confirm && (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
          onClick={() => !saving && setConfirm(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-gray-900">
              Mark {formatPeso(confirm.amount)} as paid?
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
              This grants{" "}
              <strong>{PLANS[confirm.plan as PlanId]?.name ?? confirm.plan}</strong> to{" "}
              {confirm.user.email} and runs the same code path a real webhook does.
              Confirm the money actually arrived first — this cannot be undone
              from the panel.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="e.g. Confirmed in bank app 1 Oct, ref #12345"
              className="mt-3 w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
            {/* Same ≥3 character floor as the plan confirmation, and for the same
                reason: the note goes into the audit log, and an empty one makes
                the entry unexplainable later. */}
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={markPaid}
                disabled={saving || reason.trim().length < 3}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
              >
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden />}
                Mark paid
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
