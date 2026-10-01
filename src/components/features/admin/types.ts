import type { PlanId } from "@/lib/plans";

/**
 * The shapes the admin panel exchanges with /api/admin/*.
 *
 * These mirror the JSON each route returns rather than a Prisma model, on
 * purpose. The routes deliberately do not return whole rows -- the list omits
 * resume contents and the detail omits fields nobody should read in this panel
 * -- so typing against the database model would invite a component to reach for
 * something the API never sends, and the failure would show up as undefined at
 * runtime rather than as a type error.
 *
 * Kept in one file so a change to a route's response shape has exactly one place
 * to be reflected. Every field is a string rather than a Date because these are
 * JSON: the routes serialise with toISOString() and a Date here would be a lie
 * about what actually crosses the wire.
 */

export type Tab = "users" | "payments" | "audit";

/**
 * How a panel surface reports the result of a write.
 *
 * Owned by AdminClient rather than by each tab, so the toast appears in one
 * place and the tabs do not each need to know how to render one. Returns void
 * because no caller acts on the outcome: the tab refetches its own list and the
 * shell refetches the stats.
 */
export type Notify = (message: string, variant: "success" | "error") => void;

/** One row of GET /api/admin/users. */
export interface AdminUserRow {
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
  /** Lifetime paid revenue in pesos, not centavos. The route converts. */
  lifetimeValue: number;
  /** True when a paid plan's date has passed. Precomputed server-side. */
  expired: boolean;
}

export interface UserListResponse {
  users: AdminUserRow[];
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
}

/** One row of GET /api/admin/payments. */
export interface PaymentRow {
  id: string;
  userId: string;
  plan: string;
  interval: string;
  /** Centavos, as stored. formatPeso takes the same unit. */
  amount: number;
  currency: string;
  status: string;
  paymongoPaymentId: string | null;
  paidAt: string | null;
  createdAt: string;
  user: { email: string; name: string | null };
}

/** One row of GET /api/admin/audit. */
export interface AuditEntry {
  id: string;
  action: string;
  fromValue: string | null;
  toValue: string | null;
  note: string;
  effectiveAt: string | null;
  createdAt: string;
  actor: { id: string; email: string; name: string | null };
  /** Null when the audited account has since been deleted. */
  target: { id: string; email: string; name: string | null } | null;
}

/** The account returned by GET /api/admin/users/[id]. */
export interface UserDetail {
  id: string;
  email: string;
  name: string | null;
  username: string | null;
  /**
   * The profile's job title, NOT the account role. Named `headline` by the route
   * so the two cannot be conflated in the UI -- conflating them is the kind of
   * bug that reads as "this jobseeker is an employer".
   */
  headline: string | null;
  location: string | null;
  createdAt: string;
  plan: PlanId;
  planStatus: string | null;
  planExpiresAt: string | null;
  adminNote: string | null;
  showEmail: boolean;
  /** employer | jobseeker, read from Clerk. Null if unknown. */
  accountRole: string | null;
  counts: { resumes: number; jobs: number; applications: number; payments: number };
  payments: PaymentRow[];
  auditEntries: AuditEntry[];
  resumes: { id: string; title: string; updatedAt: string; atsScore: number | null }[];
}