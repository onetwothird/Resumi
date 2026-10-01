"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Crown, CreditCard, LayoutDashboard, Loader2, StickyNote, X } from "lucide-react";
import { PLANS, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { PlanBadge } from "@/components/features/admin/admin-ui";
import {
  ActivityPanel,
  NoteEditor,
  PaymentHistory,
} from "@/components/features/admin/AdminUserPanels";
import type { Notify, UserDetail } from "@/components/features/admin/types";

/**
 * The per-account side drawer: the panel's write surface.
 *
 * A side drawer rather than a second page. The admin's mental model is a list,
 * and a list you have to leave to inspect one row and navigate back from is a
 * worse version of the list. It runs its own detail fetch, so opening it is a
 * request rather than a navigation, and the list underneath keeps its scroll
 * position and filters.
 *
 * ## Why the plan change is confirmed
 *
 * This is the one action in the product that grants or revokes real paid access.
 * There is no undo: the audit log is a record, not a rewind. So the plan is never
 * written from the form directly. The admin picks a plan and a term, presses
 * Continue, and the confirmation dialog both states what is about to happen and
 * requires a written reason before the Apply button enables.
 *
 * The reason is collected inside that dialog rather than on the form so there is
 * no path that reaches the write without one -- an unexplained grant of paid
 * access is indistinguishable from a mistake once it is three weeks old.
 */
export default function AdminUserDrawer({
  userId,
  onClose,
  notify,
  onChanged,
}: {
  userId: string;
  onClose: () => void;
  notify: Notify;
  /** Fires after a successful plan write so the list and stats both refresh. */
  onChanged: () => void;
}) {
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"plan" | "payments" | "activity" | "note">("plan");

  const [plan, setPlan] = useState<PlanId>("free");
  const [term, setTerm] = useState<"none" | "1" | "3" | "12">("1");
  const [reason, setReason] = useState("");
  const [confirming, setConfirming] = useState(false);
  const [saving, setSaving] = useState(false);

  const [note, setNote] = useState("");
  const [noteSaving, setNoteSaving] = useState(false);

  /**
   * Reference instant captured at fetch time. The confirmation's projected expiry
   * and the "is this lapsed" badge both derive from it, so a dialog left open
   * across a day boundary cannot show an expiry that disagrees with the badge
   * underneath it.
   */
  const [loadedAt, setLoadedAt] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const body: { user: UserDetail } = await res.json();
      setDetail(body.user);
      // Seed the form from the account so the common case -- "extend this by a
      // month" -- does not start from a blank slate that has to be rebuilt.
      setPlan(body.user.plan);
      setNote(body.user.adminNote ?? "");
      setLoadedAt(Date.now());
    } catch (error) {
      notify(error instanceof Error ? error.message : "Couldn't load this account.", "error");
    } finally {
      setLoading(false);
    }
  }, [userId, notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: initial fetch populates the drawer
    void load();
  }, [load]);

  // Escape closes, and the page behind stops scrolling.
  //
  // The scrollbar-width compensation is omitted here (the checkout dialog does it)
  // because this drawer is anchored to the right edge: padding the body would
  // shift the table underneath it sideways for the length of the animation while
  // the drawer itself stays put, which is more distracting than a few pixels of
  // width change.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  const submitPlan = async () => {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { plan, note: reason };
      if (term === "none") {
        // Explicit null, not omitted. Omitting it reads as "leave the expiry
        // alone", and an admin choosing "No expiry" means it.
        body.planExpiresAt = null;
      } else {
        body.months = Number(term);
      }

      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error ?? `Request failed (${res.status})`);
      }
      notify(`Plan set to ${PLANS[plan].name}.`, "success");
      setConfirming(false);
      setReason("");
      void load();
      onChanged();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Couldn't change the plan.", "error");
    } finally {
      setSaving(false);
    }
  };

  /**
   * The note is saved without notifying the parent.
   *
   * A note changes nothing the list or the stats display, so refetching both would
   * be a request that cannot change the screen. The drawer reloads itself so the
   * saved state is confirmed from the server rather than trusted locally.
   */
  const saveNote = async () => {
    setNoteSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${encodeURIComponent(userId)}/note`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.error ?? `Request failed (${res.status})`);
      }
      notify(note.trim() ? "Note saved." : "Note cleared.", "success");
      void load();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Couldn't save the note.", "error");
    } finally {
      setNoteSaving(false);
    }
  };

  const tabs = [
    { id: "plan" as const, label: "Plan", icon: Crown },
    { id: "payments" as const, label: "Payments", icon: CreditCard },
    { id: "activity" as const, label: "Activity", icon: LayoutDashboard },
    { id: "note" as const, label: "Note", icon: StickyNote },
  ];

  return (
    <>
      {/*
        Portalled to document.body for the same reason the checkout dialog is:
        template.tsx animates filter and y on a wrapper around every page, and a
        filtered ancestor becomes the containing block for fixed descendants. An
        in-place overlay would therefore centre on the page box instead of the
        screen and slide around as the page scrolls.

        The typeof guard keeps createPortal out of the server render entirely;
        document does not exist there.
      */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-100 flex justify-end bg-slate-900/40 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label="Account details"
            onClick={onClose}
          >
            <aside
              onClick={(e) => e.stopPropagation()}
              className="flex h-full w-full max-w-lg flex-col overflow-hidden bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-gray-200 px-5 py-4">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-bold text-gray-900">
                    {detail?.name || detail?.email || "Loading…"}
                  </h2>
                  {detail && (
                    <p className="truncate text-xs text-gray-500">{detail.email}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Close"
                  className="-m-1 shrink-0 rounded-full p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                >
                  <X size={17} />
                </button>
              </div>

              {loading || !detail ? (
                <div className="flex flex-1 items-center justify-center gap-2 text-sm text-gray-500">
                  <Loader2 size={16} className="animate-spin" aria-hidden />
                  Loading…
                </div>
              ) : (
                <>
                  <div className="flex gap-1 border-b border-gray-200 px-3">
                    {tabs.map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        aria-current={tab === id ? "page" : undefined}
                        className={`-mb-px inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors ${
                          tab === id
                            ? "border-indigo-600 text-indigo-700"
                            : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        <Icon size={13} aria-hidden />
                        {label}
                      </button>
                    ))}
                  </div>

                  <div className="flex-1 overflow-y-auto p-5">
                    {tab === "plan" && (
                      <PlanEditor
                        detail={detail}
                        plan={plan}
                        setPlan={setPlan}
                        term={term}
                        setTerm={setTerm}
                        onSubmit={() => setConfirming(true)}
                        loadedAt={loadedAt}
                      />
                    )}

                    {tab === "payments" && <PaymentHistory detail={detail} />}

                    {tab === "activity" && <ActivityPanel detail={detail} />}

                    {tab === "note" && (
                      <NoteEditor
                        value={note}
                        setValue={setNote}
                        onSave={saveNote}
                        saving={noteSaving}
                      />
                    )}
                  </div>
                </>
              )}
            </aside>
          </div>,
          document.body
        )}

      {/* One dialog, not two stacked confirms. The summary of what is about to
          change and the box asking why are on screen together, and the reason is
          a required field inside it rather than a separate step. */}
      {confirming && (
        <div
          className="fixed inset-0 z-120 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onClick={() => !saving && setConfirming(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Crown size={19} aria-hidden />
              </div>
              <div>
                <h3 className="text-base leading-tight font-bold text-gray-900">
                  Set {detail?.name || detail?.email || "this account"} to{" "}
                  {PLANS[plan].name}?
                </h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
                  {term === "none" ? (
                    <>
                      This grants paid access with <strong>no expiry</strong>. It is
                      recorded in the audit log and there is no undo from here.
                    </>
                  ) : (
                    <>
                      Access runs for{" "}
                      <strong>
                        {term} {term === "1" ? "month" : "months"}
                      </strong>{" "}
                      from now (until{" "}
                      {new Date(
                        // 30 days per month here matches the preview only. The
                        // stored value comes from periodMs() in the plan
                        // catalogue, so a "month" the admin granted is exactly a
                        // month a paying customer bought -- this date is an
                        // approximation for the human reading it, not the
                        // authority.
                        loadedAt + 30 * 24 * 60 * 60 * 1000 * Number(term)
                      ).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      ). It is recorded in the audit log and there is no undo from
                      here.
                    </>
                  )}
                </p>
              </div>
            </div>

            <label
              htmlFor="admin-plan-reason"
              className="mt-4 block text-xs font-semibold tracking-wide text-gray-500 uppercase"
            >
              Why is this changing?
            </label>
            <textarea
              id="admin-plan-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              autoFocus
              placeholder="e.g. Paid ₱199 via QR on 1 Oct, confirmed in bank app"
              className="mt-1.5 w-full resize-y rounded-xl border border-gray-200 bg-gray-50/50 p-3 text-sm text-gray-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
            />
            <p className="mt-1.5 text-xs text-gray-500">
              Goes into the audit log so this is explainable later. Required.
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirming(false)}
                disabled={saving}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitPlan}
                disabled={saving || reason.trim().length < 3}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-40"
              >
                {saving && <Loader2 size={14} className="animate-spin" aria-hidden />}
                Apply change
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The plan form: current state, target plan, term.
 *
 * Two decisions and a Continue button. It does not save -- that is the
 * confirmation's job. Keeping the form free of the reason field is what keeps
 * the confirmation necessary rather than decorative.
 *
 * "For how long" offers a fixed set of terms rather than a date input on
 * purpose. Terms are what people actually grant ("give them a month"), they map
 * onto the catalogue's own period lengths so a granted month equals a purchased
 * month, and they avoid the class of bug where an admin hand-types an expiry and
 * the number the user is shown disagrees with what was written.
 */
function PlanEditor({
  detail,
  plan,
  setPlan,
  term,
  setTerm,
  onSubmit,
  loadedAt,
}: {
  detail: UserDetail;
  plan: PlanId;
  setPlan: (p: PlanId) => void;
  term: "none" | "1" | "3" | "12";
  setTerm: (t: "none" | "1" | "3" | "12") => void;
  onSubmit: () => void;
  loadedAt: number;
}) {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-gray-50/60 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Current
          </span>
          <PlanBadge
            plan={detail.plan}
            expired={
              detail.plan !== "free" &&
              detail.planExpiresAt !== null &&
              new Date(detail.planExpiresAt).getTime() <= loadedAt
            }
          />
        </div>
        <p className="mt-1.5 text-sm text-gray-700">
          {detail.plan === "free" ? (
            "No paid plan."
          ) : detail.planExpiresAt ? (
            <>
              {PLANS[detail.plan].name} ·{" "}
              {new Date(detail.planExpiresAt).toLocaleDateString("en-PH", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </>
          ) : (
            `${PLANS[detail.plan].name} · no expiry`
          )}
        </p>
        {detail.accountRole && (
          <p className="mt-1 text-xs text-gray-500">Account role: {detail.accountRole}</p>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          Set plan to
        </p>
        <div className="grid grid-cols-3 gap-2">
          {PLAN_ORDER.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setPlan(id)}
              aria-pressed={plan === id}
              className={`min-h-11 rounded-xl border px-2 text-sm font-semibold transition-colors ${
                plan === id
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-700 hover:border-indigo-300"
              }`}
            >
              {PLANS[id].name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
          For how long
        </p>
        <div className="grid grid-cols-4 gap-2">
          {(
            [
              { id: "1", label: "1 mo" },
              { id: "3", label: "3 mo" },
              { id: "12", label: "12 mo" },
              { id: "none", label: "No expiry" },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTerm(t.id)}
              aria-pressed={term === t.id}
              className={`min-h-11 rounded-xl border px-2 text-xs font-semibold transition-colors ${
                term === t.id
                  ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Month length comes from the plan catalogue, so a granted month is exactly
          a purchased month.
        </p>
      </div>

      <button
        type="button"
        onClick={onSubmit}
        className="w-full min-h-11 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
      >
        Continue
      </button>
    </div>
  );
}