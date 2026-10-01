import { NextResponse } from "next/server";
import { internalError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin";
import { getAdminStats } from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

/**
 * Dashboard aggregates.
 *
 * force-dynamic rather than a cached route because every figure here is
 * "right now" by definition, and a stale revenue number on a panel someone uses
 * to make billing decisions is worse than a slow one.
 */
export async function GET() {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    return NextResponse.json(await getAdminStats());
  } catch (error) {
    return internalError("GET /api/admin/stats", error);
  }
}
