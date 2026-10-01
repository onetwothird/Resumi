import { NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { internalError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

const auditQuerySchema = z.object({
  /** Scope to one account. Unscoped returns the whole trail. */
  userId: z.string().trim().max(64).optional(),
  action: z
    .enum(["plan.set", "payment.mark_paid", "user.note"])
    .optional(),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  perPage: z.coerce.number().int().min(1).max(100).default(50),
});

/**
 * The audit trail.
 *
 * Read-only by design: there is no route in this app that updates or deletes an
 * AdminAuditLog row, and the only way one is created is through the three
 * privileged writes in src/lib/admin.ts. If a change to a plan is not in here,
 * it did not come from the panel.
 *
 * `action` is a zod enum rather than free text so the filter cannot be used to
 * probe the table with arbitrary values, and so a typo in the URL returns a 400
 * instead of an empty list that looks like "no such action has ever happened".
 */
export async function GET(req: Request) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const url = new URL(req.url);
    const parsed = auditQuerySchema.safeParse({
      userId: url.searchParams.get("userId") ?? undefined,
      action: url.searchParams.get("action") ?? undefined,
      page: url.searchParams.get("page") ?? undefined,
      perPage: url.searchParams.get("perPage") ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request.", fields: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { userId, action, page, perPage } = parsed.data;
    const where = { ...(userId ? { targetUserId: userId } : {}), ...(action ? { action } : {}) };

    const [rows, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * perPage,
        take: perPage,
        select: {
          id: true,
          action: true,
          fromValue: true,
          toValue: true,
          note: true,
          effectiveAt: true,
          createdAt: true,
          actor: { select: { id: true, email: true, name: true } },
          target: { select: { id: true, email: true, name: true } },
        },
      }),
      prisma.adminAuditLog.count({ where }),
    ]);

    return NextResponse.json({
      entries: rows.map((row) => ({
        id: row.id,
        action: row.action,
        fromValue: row.fromValue,
        toValue: row.toValue,
        note: row.note,
        effectiveAt: row.effectiveAt?.toISOString() ?? null,
        createdAt: row.createdAt.toISOString(),
        actor: row.actor,
        // Null when the audited account has since been deleted, which is why
        // targetUserId is nullable in the schema.
        target: row.target,
      })),
      page,
      perPage,
      total,
      totalPages: Math.max(1, Math.ceil(total / perPage)),
    });
  } catch (error) {
    return internalError("GET /api/admin/audit", error);
  }
}
