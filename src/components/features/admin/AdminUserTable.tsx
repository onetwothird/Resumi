"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Search, User as UserIcon, Users } from "lucide-react";
import { formatPeso } from "@/lib/plans";
import { EmptyState, ExpiryCell, PlanBadge, Th, formatDate } from "@/components/features/admin/admin-ui";
import AdminUserDrawer from "@/components/features/admin/AdminUserDrawer";
import type { Notify, UserListResponse } from "@/components/features/admin/types";

/**
 * The users tab: search, filter, page, click a row.
 *
 * Owns the list's own state and its own fetch, and nothing else. That is the
 * whole design of the panel -- the list, the drawer and the ledger each manage
 * their own requests rather than sharing one client-side cache, because the
 * writes are rare and the alternative (a cache with invalidation rules) is more
 * machinery than three tabs and a drawer actually need.
 */

/** Filter buckets. "expiring" is a server-side bucket, not a client-side filter,
 *  because deciding what counts as expiring means comparing planExpiresAt against
 *  a date across the whole table -- doing that on a page of 25 rows would report
 *  an empty result set for a table that is full of them. */
type Filter = "all" | "paid" | "free" | "expiring";

export default function AdminUserTable({
  notify,
  onChanged,
}: {
  notify: Notify;
  /** Bubbled to the shell so the overview numbers refresh after a write. */
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  /**
   * Reference instant captured at fetch time rather than read during render, so
   * every "days left" in the table is measured against one moment. Reading
   * Date.now() in the render would mean rows straddling a tick disagree by a day,
   * which reads as a data bug rather than a timing artifact.
   */
  const [fetchedAt, setFetchedAt] = useState(0);

  /**
   * Debounced, and `query` is kept separate from `search` on purpose.
   *
   * `query` is what the input is bound to; `search` is what the request uses.
   * Collapsing them would mean the request changes on every keystroke. The
   * search term also resets to page 1, because staying on page 7 of a result set
   * that now has one page shows an empty table and reads as "the search is
   * broken".
   */
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, page: String(page), perPage: "25" });
      if (search) params.set("q", search);
      const res = await fetch(`/api/admin/users?${params}`, { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setData(await res.json());
      setFetchedAt(Date.now());
    } catch (error) {
      notify(error instanceof Error ? error.message : "Couldn't load users.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, page, search, notify]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: initial fetch populates the table
    void load();
  }, [load]);

  const filters: { id: Filter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "paid", label: "Paid" },
    { id: "free", label: "Free" },
    { id: "expiring", label: "Expiring / lapsed" },
  ];

  return (
    <>
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search
            size={15}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or email"
            aria-label="Search users"
            className="w-full rounded-xl border border-gray-200 bg-gray-50/50 py-2.5 pr-3 pl-9 text-sm text-gray-800 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => {
                setFilter(f.id);
                setPage(1);
              }}
              aria-pressed={filter === f.id}
              className={`min-h-9 rounded-full px-3.5 text-sm font-semibold border transition-colors ${
                filter === f.id
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {loading && !data ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" aria-hidden />
            Loading users…
          </div>
        ) : data && data.users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users match"
            body={
              search
                ? `Nothing found for "${search}".`
                : "No accounts in this bucket yet."
            }
          />
        ) : (
          /*
            The scroll container and the min-width are two halves of one decision.
            Seven columns of identity, plan, expiry, three numerics and a date will
            not fit a phone, and the only honest options are scrolling sideways or
            dropping columns. Scrolling keeps every number visible, so the table
            holds its width and the wrapper scrolls -- on a phone you swipe the
            table, you do not get a narrower table with three columns missing.

            min-w-180 is the bare-number form Tailwind v4 emits as 180 * 0.25rem =
            45rem = 720px. Written as min-w-720px it is silently dropped: v4 only
            accepts a bare number on a spacing scale, not a bare number suffixed
            with px, so the table loses its width floor and the columns collapse
            instead of scrolling.
          */
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="border-b border-gray-200 bg-gray-50/60">
                <tr>
                  <Th>Account</Th>
                  <Th>Plan</Th>
                  <Th>Expires</Th>
                  <Th align="right">Resumes</Th>
                  <Th align="right">Paid</Th>
                  <Th align="right">Value</Th>
                  <Th align="right">Joined</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.users.map((u) => (
                  <tr
                    key={u.id}
                    className="cursor-pointer transition-colors hover:bg-gray-50"
                    onClick={() => setSelected(u.id)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                          <UserIcon size={14} aria-hidden />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-gray-900">
                            {u.name || "—"}
                          </p>
                          <p className="truncate text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <PlanBadge plan={u.plan} expired={u.expired} />
                    </td>
                    <td className="px-4 py-3">
                      <ExpiryCell expiresAt={u.planExpiresAt} plan={u.plan} now={fetchedAt} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {u.resumeCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {u.paymentCount}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold text-gray-900">
                      {u.lifetimeValue > 0 ? formatPeso(Math.round(u.lifetimeValue * 100)) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right text-xs whitespace-nowrap text-gray-500">
                      {formatDate(u.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && data.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
            <p className="text-xs text-gray-500">
              Page {data.page} of {data.totalPages} · {data.total.toLocaleString("en-US")} accounts
            </p>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Keyed so switching between two accounts remounts the drawer rather than
          showing the previous account's detail until the new fetch lands. */}
      {selected && (
        <AdminUserDrawer
          key={selected}
          userId={selected}
          onClose={() => setSelected(null)}
          notify={notify}
          onChanged={() => {
            void load();
            onChanged();
          }}
        />
      )}
    </>
  );
}
