"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Crown,
  CreditCard,
  FileText,
  LayoutDashboard,
  Loader2,
  RefreshCw,
  Search,
  Shield,
  StickyNote,
  TrendingUp,
  User as UserIcon,
  Users,
  Wallet,
  X,
} from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";
import { PLANS, PLAN_ORDER, formatPeso, type PlanId } from "@/lib/plans";
import type { AdminStats } from "@/lib/admin-stats";

/**
 * The admin panel.
 *
 * Client-rendered on purpose, and the reason is worth stating: the primary
 * workflow here is "look at a list, click a row, change a number, see the list
 * again". Every one of those steps is a round-trip to a /api/admin route, and a
 * server component per step would mean a full navigation between each. The
 * initial stats arrive as a prop from the server page so the first paint is real
 * data, and everything after that is fetch + local state.
 *
 * Stated plainly: this panel shows every account's email, plan and payment
 * history to whoever holds isAdmin. That is the point of it, and it is why the
 * flag is set in Clerk by hand and never from application code.
 */

interface AdminUserRow {
  id: string;
  email: string;
  name: string | null;
  plan: PlanId;
  planExpiresAt: string | null;
  planStatus: string | null;
  createdAt: string;
  resumeCount: number;
  jobCount: number;
  paymentCount: number;
  lifetimeValue: number;
  expired: boolean;
}

interface UserListResponse {
  users: AdminUserRow[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

interface PaymentRow {
  id: string;
  userId: string;
  plan: string;
  interval: string;
  amount: number;
  currency: string;
  status: string;
  paymongoPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { email: string; name: string | null };
}

interface AuditEntry {
  id: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  note: string;
  effectiveAt: string | null;
  createdAt: string;
  actor: { id: string; email: string; name: string | null };
  target: { id: string; email: string; name: string | null } | null;
}

interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  headline: string | null;
  location: string | null;
  createdAt: string;
  plan: PlanId;
  planStatus: string | null;
  planExpiresAt: string | null;
  adminNote: string | null;
  showEmail: boolean;
  accountRole: string | null;
  counts: { resumes: number; jobs: number; applications: number; payments: number };
  payments: (PaymentRow & { id: string })[];
  auditEntries: AuditEntry[];
  resumes: { id: string; title: string; updatedAt: string; atsScore: number | null }[];
}

type Tab = "users" | "payments" | "audit";

export default function AdminClient({ initialStats }: { initialStats: AdminStats }) {
  const [tab, setTab] = useState<Tab>("users");
  const [stats, setStats] = useState(initialStats);

  // Toast state is local rather than routed through the app's Toast component,
  // which is driven by a ToastStack the caller has to own. Three lines of state
  // is cheaper than threading that through a page this size.
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(
    null
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = useCallback((message: string, variant: "success" | "error") => {
    setToast({ message, variant });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 3500);
  }, []);

  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  // Refetched after every write so the header numbers reflect the change
  // immediately rather than on the next full page load.
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
        <StatsRow stats={stats} onRefresh={refreshStats} />

        {tab === "users" && <UsersTab notify={notify} onChanged={refreshStats} />}
        {tab === "payments" && <PaymentsTab notify={notify} onChanged={refreshStats} />}
        {tab === "audit" && <AuditTab />}
      </main>

      {toast && (
        <div
          role="status"
          className="fixed top-4 left-1/2 z-[110] flex w-full max-w-sm -translate-x-1/2 items-start gap-2.5 rounded-xl border border-gray-200 bg-white px-4 py-3 shadow-lg"
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

/* ------------------------------------------------------------------ header */

function AdminHeader({ tab, onTab }: { tab: Tab; onTab: (t: Tab) => void }) {
  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "audit", label: "Audit log", icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
            <ResumiLogo className="h-7 w-7" />
            <span className="hidden sm:inline">Resumi</span>
          </Link>
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200 ring-inset">
            <Shield size={12} aria-hidden />
            Admin
          </span>
        </div>

        <nav className="hidden items-center gap-1 text-sm font-medium text-gray-500 md:flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                tab === id
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Back to app
            <ArrowUpRight size={14} aria-hidden />
          </Link>
          {/* Mobile tab switcher. The desktop nav is hidden below md and there
              is no other way to reach the other two tabs on a phone. */}
          <div className="flex items-center gap-0.5 md:hidden">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onTab(id)}
                aria-label={label}
                aria-current={tab === id ? "page" : undefined}
                className={`rounded-lg p-2 transition-colors ${
                  tab === id ? "bg-indigo-50 text-indigo-700" : "text-gray-500"
                }`}
              >
                <Icon size={18} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------- stats */

function StatsRow({ stats, onRefresh }: { stats: AdminStats; onRefresh: () => void }) {
  const [refreshing, setRefreshing] = useState(false);

  const doRefresh = async () => {
    setRefreshing(true);
    onRefresh();
    setTimeout(() => setRefreshing(false), 600);
  };

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

/* ------------------------------------------------------------------- users */

function UsersTab({
  notify,
  onChanged,
}: {
  notify: (m: string, v: "success" | "error") => void;
  onChanged: () => void;
}) {
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "paid" | "free" | "expiring">("all");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<UserListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  // Captured at fetch time, not read during render, so every "days left" in the
  // table is measured against one instant.
  const [fetchedAt, setFetchedAt] = useState(0);

  // Debounced so typing does not fire a request per keystroke. The value in
  // `search` is what the query uses; `query` is just the input.
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

  const filters: { id: typeof filter; label: string }[] = [
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
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

      {selected && (
        <UserDrawer
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

function Th({
  children,
  align = "left",
}: {
  children: React.ReactNode;
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

function EmptyState({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Users;
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

function PlanBadge({ plan, expired }: { plan: PlanId; expired: boolean }) {
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
 */
function ExpiryCell({
  expiresAt,
  plan,
  now,
}: {
  expiresAt: string | null;
  plan: PlanId;
  /** Single reference instant, passed down from the fetch that produced the row. */
  now: number;
}) {
  if (plan === "free") {
    return <span className="text-xs text-gray-400">—</span>;
  }
  if (!expiresAt) {
    return <span className="text-xs font-medium text-gray-500">No expiry</span>;
  }

  // `now` is a prop rather than Date.now() so the countdown is computed once per
  // fetch and every row in the table is measured against the same instant —
  // otherwise rows rendered across a tick disagree by a day.
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ------------------------------------------------------------------ drawer */

/**
 * The per-account side panel.
 *
 * A side drawer rather than a second page: the admin's mental model is a list,
 * and a list that you leave to inspect one row and have to navigate back from is
 * a worse version of the list. It renders its own detail fetch so opening it is
 * a request rather than a navigation.
 *
 * Plan changes go through a confirmation step, because this is the one
 * irreversible-feeling action in the product: it grants or revokes real paid
 * access, there is no undo, and the audit log is a record rather than a
 * rewind. The reason field is required on that confirmation, not the form, so
 * the admin cannot skip past it.
 */
function UserDrawer({
  userId,
  onClose,
  notify,
  onChanged,
}: {
  userId: string;
  onClose: () => void;
  notify: (m: string, v: "success" | "error") => void;
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

  // Reference instant captured at fetch time. The confirm dialog's projected
  // expiry and the "is this lapsed" badge both derive from it, so the two cannot
  // disagree if the dialog is left open across a day boundary.
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
      // Seed the form from the account so the common case — "extend this by a
      // month" — does not start from a blank slate.
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

  // Escape closes the drawer, and the page behind it stops scrolling. Same
  // approach as ConfirmModal.
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
        // Explicit null, not omitted: omitting would be read as "leave the
        // expiry alone", and the admin asking for "no expiry" means it.
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
      {/* Portalled for the same reason the checkout dialog is: template.tsx
          animates filter and y on a wrapper around every page, and a filtered
          ancestor becomes the containing block for fixed descendants, so an
          in-place overlay centres on the page box instead of the screen. */}
      {typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex justify-end bg-slate-900/40 backdrop-blur-sm"
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

      {/* One dialog, not two stacked confirms. The reason is a required field
          inside it rather than a separate step, so there is no way to reach the
          write without having written something — and the summary of what is
          about to change is on screen at the same time as the box asking why. */}
      {confirming && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
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
                      This grants paid access with{" "}
                      <strong>no expiry</strong>. It is recorded in the audit log
                      and there is no undo from here.
                    </>
                  ) : (
                    <>
                      Access runs for{" "}
                      <strong>
                        {term} {term === "1" ? "month" : "months"}
                      </strong>{" "}
                      from now (until{" "}
                      {new Date(
                        loadedAt + 30 * 24 * 60 * 60 * 1000 * Number(term)
                      ).toLocaleDateString("en-PH", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                      ). It is recorded in the audit log and there is no undo
                      from here.
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
  /** Reference instant from the fetch, so the lapsed check is not Date.now(). */
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
          <p className="mt-1 text-xs text-gray-500">
            Account role: {detail.accountRole}
          </p>
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
          Month length comes from the plan catalogue, so a granted month is
          exactly a purchased month.
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

function PaymentHistory({ detail }: { detail: UserDetail }) {
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

function PaymentStatus({ status }: { status: string }) {
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

function ActivityPanel({ detail }: { detail: UserDetail }) {
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

function NoteEditor({
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

function describeAction(action: string) {
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

/* ---------------------------------------------------------------- payments */

function PaymentsTab({
  notify,
  onChanged,
}: {
  notify: (m: string, v: "success" | "error") => void;
  onChanged: () => void;
}) {
  const [status, setStatus] = useState<"pending" | "paid" | "failed" | "expired" | "">(
    "pending"
  );
  const [data, setData] = useState<{
    payments: PaymentRow[];
    page: number;
    totalPages: number;
    total: number;
  } | null>(null);
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
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
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
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
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

/* ------------------------------------------------------------------- audit */

function AuditTab() {
  const [data, setData] = useState<{
    entries: AuditEntry[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");

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
                    {e.fromValue && e.toValue && (
                      <span className="text-xs text-gray-500">
                        {e.fromValue} → <strong className="text-gray-800">{e.toValue}</strong>
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-gray-400">
                    {new Date(e.createdAt).toLocaleString("en-PH")}
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-gray-700">{e.note}</p>
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
