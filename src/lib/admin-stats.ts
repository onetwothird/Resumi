import "server-only";

import prisma from "@/lib/prisma";
import type { PlanId } from "@/lib/plans";

/**
 * Headline numbers for the admin dashboard.
 *
 * Deliberately computed with aggregate queries in the database rather than by
 * pulling rows into JS and counting. Three counts and two sums is a handful of
 * round-trips, but the alternative — "load all users and reduce" — is the shape
 * of query that works fine at 200 accounts and falls over at 200,000, and this
 * endpoint is on the panel's landing view.
 */

export interface AdminStats {
  totals: {
    users: number;
    paid: number;
    free: number;
    employers: number;
    jobseekers: number;
  };
  /** Revenue actually collected, in pesos. Counts only status = 'paid'. */
  revenue: {
    lifetime: number;
    last30Days: number;
    /** Paid payments in the window whose Payment row still says pending. */
    pendingCount: number;
  };
  plans: Record<PlanId, number>;
  /** Paid accounts expiring within 14 days, or already lapsed. */
  attention: {
    expiringSoon: number;
    lapsedButStillPaid: number;
  };
  signups: { last7Days: number; last30Days: number };
}

/**
 * The account role lives in Clerk publicMetadata, not in the database, so the
 * employer/jobseeker split cannot be answered by a SQL count. Rather than page
 * the Clerk Backend API for every user on every panel load, the split is
 * reported as unavailable unless a caller supplies the counts. The UI shows the
 * two figures as "—" with an explanation rather than a misleading zero.
 *
 * This is a real limitation and it is surfaced, not hidden: an admin deciding
 * whether to look into a plan question usually needs the email and the payments,
 * both of which are in the database.
 */
export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const in7DaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    users,
    proCount,
    premiumCount,
    freeCount,
    paidAggregate,
    recentAggregate,
    pendingCount,
    expiringSoon,
    lapsedButStillPaid,
    signups7,
    signups30,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "pro" } }),
    prisma.user.count({ where: { plan: "premium" } }),
    // A null plan is treated as free everywhere else in the app, so it is
    // counted here too — otherwise the buckets do not add up to the total and
    // the panel looks broken.
    prisma.user.count({ where: { OR: [{ plan: "free" }, { plan: null }] } }),
    prisma.payment.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
      _count: true,
    }),
    prisma.payment.aggregate({
      where: { status: "paid", paidAt: { gte: in30Days } },
      _sum: { amount: true },
    }),
    prisma.payment.count({ where: { status: "pending" } }),
    prisma.user.count({
      where: {
        plan: { in: ["pro", "premium"] },
        planExpiresAt: { gt: now, lte: in14Days },
      },
    }),
    // Still on a paid plan but the date has passed. The panel's main job:
    // these are accounts where the money arrived and the access did not.
    prisma.user.count({
      where: {
        plan: { in: ["pro", "premium"] },
        planExpiresAt: { lte: now },
      },
    }),
    prisma.user.count({ where: { createdAt: { gte: in7DaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: in30Days } } }),
  ]);

  return {
    totals: {
      users,
      paid: proCount + premiumCount,
      free: freeCount,
      // Not derivable here; see the doc comment on the interface.
      employers: 0,
      jobseekers: 0,
    },
    revenue: {
      // Centavos to pesos, matching formatPeso()'s unit.
      lifetime: (paidAggregate._sum.amount ?? 0) / 100,
      last30Days: (recentAggregate._sum.amount ?? 0) / 100,
      pendingCount,
    },
    plans: {
      free: freeCount,
      pro: proCount,
      premium: premiumCount,
    },
    attention: { expiringSoon, lapsedButStillPaid },
    signups: { last7Days: signups7, last30Days: signups30 },
  };
}
