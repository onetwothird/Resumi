"use client";

import { CreditCard, FileText, Loader2 } from "lucide-react";
import { PLANS, formatPeso, type PlanId } from "@/lib/plans";
import { EmptyState, PaymentStatus, describeAction, formatDate } from "@/components/features/admin/admin-ui";
import type { UserDetail } from "@/components/features/admin/types";

/**
 * The drawer's three read-and-secondary panels.
 *
 * Kept apart from the drawer shell because they hold no state of their own --
 * every one is a pure render of `detail`, which the drawer fetched -- and
 * because together they are the panel's "read" surface as opposed to its "write"
 * surface. The drawer is where the plan editor and its confirmation live; this
 * file is where you go to find out what already happened.
 */

/**
 * The account's payment ledger, read-only.
 *
 * The empty state says a QR transfer will not appear here either, because that
 * is the single most likely reason an admin is staring at an account that they
 * know paid. The route to fix it is the Plan tab, and naming that here saves a
 * round of hunting.
 */
export function PaymentHistory({ detail }: { detail: UserDetail }) {
  if (detail.payments.length === 0) {
    return (
      <EmptyState
        icon={CreditCard}
        title="No payments"
        body="This account has never attempted a checkout. A QR transfer will not appear here either — use the Plan tab to record it."
      />
    );
  }
  return (
    <div className="space-y-2">
      {detail.payments.map((p) => (
        <div
          key={p.id}
          className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 p-3"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              {PLANS[p.plan as PlanId]?.name ?? p.plan} · {formatPeso(p.amount)}
            </p>
            <p className="text-xs text-gray-500">
              {p.interval === "year" ? "Annual" : "Monthly"} ·{" "}
              {p.paidAt ? `paid ${formatDate(p.paidAt)}` : formatDate(p.createdAt)}
            </p>
          </div>
          <PaymentStatus status={p.status} />
        </div>
      ))}
    </div>
  );
}

/**
 * How much this account actually does, plus its admin history.
 *
 * Deliberately aggregate. The count tiles answer "is this a real account" in one
 * glance, and the resume list gives evidence without exposing a CV: title and
 * ATS score are enough to tell a working account from an abandoned signup, and
 * the panel has no business reading someone's document contents.
 *
 * The audit entries are scoped to this account and show the actor, so an admin
 * can see not just that a change was made but who made it -- including if it was
 * made by someone other than them.
 */
export function ActivityPanel({ detail }: { detail: UserDetail }) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {[
          { label: "Resumes", value: detail.counts.resumes },
          { label: "Jobs", value: detail.counts.jobs },
          { label: "Applications", value: detail.counts.applications },
          { label: "Payments", value: detail.counts.payments },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 p-3 text-center">
            <p className="text-lg font-extrabold text-gray-900">{s.value}</p>
            <p className="text-[11px] text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Resumes
        </p>
        {detail.resumes.length === 0 ? (
          <p className="text-sm text-gray-500">No resumes yet.</p>
        ) : (
          <ul className="space-y-1.5">
            {detail.resumes.map((r) => (
              <li
                key={r.id}
                className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <FileText size={13} className="shrink-0 text-gray-400" aria-hidden />
                  <span className="truncate text-sm text-gray-800">{r.title}</span>
                </span>
                <span className="shrink-0 text-xs text-gray-500">
                  {r.atsScore != null ? `ATS ${r.atsScore}` : formatDate(r.updatedAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Admin changes
        </p>
        {detail.auditEntries.length === 0 ? (
          <p className="text-sm text-gray-500">No admin has touched this account.</p>
        ) : (
          <ul className="space-y-1.5">
            {detail.auditEntries.map((e) => (
              <li key={e.id} className="rounded-lg border border-gray-200 px-3 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-gray-800">
                    {describeAction(e.action)}
                  </span>
                  <span className="shrink-0 text-[11px] text-gray-500">
                    {formatDate(e.createdAt)}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-gray-600">{e.note}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">by {e.actor.email}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * The private staff note.
 *
 * Wording that matters: "not shown to the account holder anywhere in the app".
 * An admin writing a dispute note needs to know it cannot be seen by the person
 * it is about, and that guarantee comes from the fact that no user-facing route
 * selects User.adminNote -- not from anything enforced here.
 *
 * The button reads "Clear note" when the field is empty rather than being
 * disabled, because clearing is a real action someone will want, and a disabled
 * button with no explanation is more confusing than an accurate label.
 */
export function NoteEditor({
  value,
  setValue,
  onSave,
  saving,
}: {
  value: string;
  setValue: (v: string) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <div>
      <p className="text-sm leading-relaxed text-gray-600">
        Private to admins. Not shown to the account holder anywhere in the app.
        Use it for the context that a plan column cannot hold — who you spoke
        to, which transfer this was, what to do if they come back.
      </p>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        placeholder="e.g. Paid ₱1,910.40 for Pro annual via QR on 1 Oct 2026. Asked me to remind them to set up auto-renew — they declined."
        className="mt-3 w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
      />
      <button
        type="button"
        onClick={onSave}
        disabled={saving}
        className="mt-3 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-60"
      >
        {saving && <Loader2 size={15} className="animate-spin" aria-hidden />}
        {value.trim() ? "Save note" : "Clear note"}
      </button>
    </div>
  );
}