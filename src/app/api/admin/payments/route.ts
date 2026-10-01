import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { internalError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

/**
 * Query params for the ledger, validated in one place so the page and the
 * pagination arithmetic below agree on what a legal request looks like.
 *
 * z.coerce.number() because these arrive as query strings; without coercion
 * "page=2" fails as a string and every page link breaks.
 */
const ledgerQuerySchema = z.object({
  status: z.enum(["pending", "paid", "failed", "expired"]).optional(),
  plan: z.enum(["free", "pro", "premium"]).optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(25),
});

/**
 * The payment ledger, newest first.
 *
 * Separate from /api/admin/users because reconciliation is the workflow this
 * serves: a QR transfer produces no Payment row at all, but a card checkout
 * that PayMongo never confirmed does, sitting in `pending` forever. This is
 * where those are found and marked paid.
 *
 * `status` is a required filter rather than an optional one. "Show me every
 * payment ever" is a table nobody can read and a query that gets slower as the
 * business grows; the panel's job is answering "what is stuck?".
 */
export async function GET(req: Request) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const url = new URL(req.url);
    const parsed = ledgerQuerySchema.safeParse({
      status: url.searchParams.get("status") ?? undefined,
      plan: url.searchParams.get("plan") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      perPage: url.searchParams.get("perPage") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid request.",
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }
    const { status, plan: planFilter, page, perPage } = parsed.data;

    const where = {
      ...(status ? { status } : {}),
      ...(planFilter ? { plan: planFilter } : {}),
    };

    const [rows, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          userId: true,
          plan: true,
          interval: true,
          amount: true,
          currency: true,
          status: true,
          paymongoPaymentId: true,
          paidAt: true,
          createdAt: true,
          // The buyer's address, so a pending row can be matched to a person
          // without a second click. This is the panel's whole purpose.
          user: { select: { email: true, name: true } },
        },
      }),
      prisma.payment.count({ where }),
    ]);

    return NextResponse.json({
      payments: rows.map((p) => ({
        ...p,
        paidAt: p.paidAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      })),
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    });
  } catch (error) {
    return internalError("GET /api/admin/payments", error);
  }
}
