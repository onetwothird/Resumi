import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { adminUserQuerySchema } from "@/lib/validation";
import { internalError, validationError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin";
import { isPlanId, type PlanId } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * The admin user list.
 *
 * Read-only. Every field that could be sensitive is either deliberately
 * excluded or aggregated rather than returned raw: resume contents, applicant
 * data and messages are all reachable from the detail endpoint for a specific
 * account, but the list only needs enough to decide who to click.
 *
 * `total` is a second count query rather than a single grouped query because the
 * filtered count and the page window have to agree; Postgres cannot give both
 * from one result set without a window function over the whole table.
 */
export async function GET(req: Request) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      // 403 rather than 401: the caller is authenticated, they are just not
      // allowed here. The proxy already redirects anonymous visitors to sign-in
      // before this route is ever reached.
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const url = new URL(req.url);
    const parsed = adminUserQuerySchema.safeParse({
      q: url.searchParams.get("q") ?? undefined,
      plan: url.searchParams.get("plan") ?? undefined,
      filter: url.searchParams.get("filter") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      perPage: url.searchParams.get("perPage") ?? undefined,
    });
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const { q, plan, filter, page, perPage } = parsed.data;
    const now = new Date();

    /**
     * "Expiring" is the bucket that makes the panel worth having: paid users
     * whose access runs out within 14 days, plus anyone whose paid plan has
     * already lapsed. A lapsed paid plan is included because it is the case
     * that most needs a human — the money arrived, the entitlement did not, and
     * only someone looking at the account can tell whether that is a bug or a
     * genuinely expired purchase.
     */
    const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const where: Record<string, unknown> = {};

    if (q) {
      // Case-insensitive contains across the two fields an admin would have.
      // `mode: "insensitive"` is the Postgres way; no raw SQL, so no injection
      // surface from the search term.
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ];
    }

    if (plan !== "any") {
      where.plan = plan;
    }

    if (filter === "paid") {
      where.plan = { in: ["pro", "premium"] };
    } else if (filter === "free") {
      where.plan = "free";
    } else if (filter === "expiring") {
      where.AND = [
        { plan: { in: ["pro", "premium"] } },
        {
          OR: [
            { planExpiresAt: null },
            { planExpiresAt: { lte: in14Days } },
          ],
        },
      ];
    }

    const [rows, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: [{ createdAt: "desc" }],
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          email: true,
          name: true,
          plan: true,
          planExpiresAt: true,
          planStatus: true,
          createdAt: true,
          // Counts, not rows. An admin needs "3 resumes" to judge whether the
          // account is real; they do not need the resume text in a list view.
          _count: { select: { resumes: true, jobs: true, payments: true } },
          payments: {
            where: { status: "paid" },
            select: { amount: true },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      users: rows.map((row) => {
        const rowPlan: PlanId = isPlanId(row.plan) ? row.plan : "free";
        const expiresAt = row.planExpiresAt;
        return {
          id: row.id,
          email: row.email,
          name: row.name,
          plan: rowPlan,
          planExpiresAt: expiresAt ? expiresAt.toISOString() : null,
          planStatus: row.planStatus,
          createdAt: row.createdAt.toISOString(),
          resumeCount: row._count.resumes,
          jobCount: row._count.jobs,
          paymentCount: row._count.payments,
          // Lifetime paid revenue in pesos. Summed here so the column does not
          // need a join, and divided by 100 because the column is centavos.
          lifetimeValue: row.payments.reduce((sum, p) => sum + p.amount, 0) / 100,
          expired:
            rowPlan !== "free" &&
            expiresAt !== null &&
            expiresAt.getTime() <= now.getTime(),
        };
      }),
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    });
  } catch (error) {
    return internalError("GET /api/admin/users", error);
  }
}
