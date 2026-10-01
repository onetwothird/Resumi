"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Shield } from "lucide-react";
import { EmptyState, describeAction } from "@/components/features/admin/admin-ui";
import type { AuditEntry } from "@/components/features/admin/types";

/**
 * The audit trail.
 *
 * Read-only and deliberately unfilterable beyond action type. This is the record
 * that makes an otherwise inexplicable plan defensible months later, so it is
 * append-only: nothing in the panel edits or deletes an entry, and no route
 * accepts a delete. The only affordance here is filtering, and the only writes
 * that can add rows are the two confirmation dialogs.
 *
 * The filter options are hardcoded rather than read from ADMIN_ACTIONS. If a new
 * action were added to the registry and forgotten here, "All" would still show
 * it -- the gap would be a missing fast filter, not a hidden record.
 */

export default function AdminAuditTrail() {
  const [data, setData] = useState<{ entries: AuditEntry[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");

  /**
   * Unlike the other two tabs, a failure here is swallowed.
   *
   * A dropped audit fetch has nothing the admin can do about it and no fallback
   * that would help -- the log is the log. Surfacing an error toast over a stale
   * trail would imply the trail is broken when it is merely absent, which is
   * worse than showing what was last loaded.
   */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ perPage: "50" });
      if (action) params.set("action", action);
      const res = await fetch(`/api/admin/audit?${params}`, { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, [action]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: initial fetch populates the trail
    void load();
  }, [load]);

  const actions = [
    { id: "", label: "All" },
    { id: "plan.set", label: "Plan changes" },
    { id: "payment.mark_paid", label: "Marked paid" },
    { id: "user.note", label: "Notes" },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap gap-1.5">
        {actions.map((a) => (
          <button
            key={a.id || "all"}
            type="button"
            onClick={() => setAction(a.id)}
            aria-pressed={action === a.id}
            className={`min-h-9 rounded-full px-3.5 text-sm font-semibold border transition-colors ${
              action === a.id
                ? "border-indigo-600 bg-indigo-600 text-white"
                : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            Loading…
          </div>
        ) : data && data.entries.length === 0 ? (
          <EmptyState
            icon={Shield}
            title="Nothing logged yet"
            body="Every plan change, payment reconciliation and note edit through this panel lands here."
          />
        ) : (
          <ul className="divide-y divide-gray-100">
            {data?.entries.map((e) => (
              <li key={e.id} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700 ring-1 ring-indigo-200 ring-inset">
                      {describeAction(e.action)}
                    </span>
                    {/* Both halves required. An entry with only a fromValue or
                        only a toValue is a partial write, and showing one arrow
                        with a blank on the other end would imply a transition
                        that did not happen. */}
                    {e.fromValue && e.toValue && (
                      <span className="text-xs text-gray-500">
                        {e.fromValue} → <strong className="text-gray-800">{e.toValue}</strong>
                      </span>
                    )}
                  </div>
                  {/* Timestamp rather than just a date, and pinned to en-PH for
                      the same reason formatDate is: an audit entry with no time
                      cannot be ordered against another one by eye. */}
                  <span className="text-[11px] text-gray-400">
                    {new Date(e.createdAt).toLocaleString("en-PH")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-gray-700">{e.note}</p>
                {/* Actor first, then target. The actor is who is accountable for
                    the change; the target is who it happened to. Reading them in
                    that order matches the question being asked of a log line. */}
                <p className="mt-0.5 text-[11px] text-gray-500">
                  {e.actor.email}
                  {e.target && ` → ${e.target.email}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
