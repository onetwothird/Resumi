import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { internalError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/admin";
import { isPlanId, isBillingInterval, type PlanId } from "@/lib/plans";

export const dynamic = "force-dynamic";

/**
 * One account in full, for the admin drill-down.
 *
 * This is the endpoint that returns the things the list deliberately omits:
 * the full payment ledger, the audit trail for this account, and enough profile
 * state to tell a real user from a signup that never did anything.
 *
 * It is scoped by `id` from the URL and authorized purely by requireAdmin — there
 * is no per-user ownership check, because an admin reading someone else's
 * account is the entire point. The distinction that matters is that this is a
 * read: nothing here can be influenced by the id being "wrong", and every
 * mutation lives in its own route that re-checks the admin claim.
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminId = await requireAdmin();
    if (!adminId) {
      return NextResponse.json({ error: "Not allowed." }, { status: 403 });
    }

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        role: true,
        location: true,
        createdAt: true,
        plan: true,
        planStatus: true,
        planExpiresAt: true,
        adminNote: true,
        showEmail: true,
        _count: { select: { resumes: true, jobs: true, applications: true, payments: true } },
        payments: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            plan: true,
            interval: true,
            amount: true,
            currency: true,
            status: true,
            paymongoPaymentId: true,
            paidAt: true,
            createdAt: true,
          },
        },
        auditEntries: {
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            id: true,
            action: true,
            fromValue: true,
            toValue: true,
            note: true,
            effectiveAt: true,
            createdAt: true,
            actor: { select: { id: true, email: true, name: true } },
          },
        },
        resumes: {
          orderBy: { updatedAt: "desc" },
          take: 10,
          // Title only. An admin reviewing a billing question needs to see that
          // the account has real work in it, not the contents of someone's CV.
          select: { id: true, title: true, updatedAt: true, atsScore: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "No such user." }, { status: 404 });
    }

    /**
     * The account's Clerk role is not in the database — it lives in
     * publicMetadata and is read from the session token everywhere else in the
     * app. Reading it here costs one Backend API call, so it is only done for
     * the single account being viewed rather than for the list. Without it the
     * panel cannot tell a jobseeker from an employer, which is the first thing
     * anyone reviewing an account wants to know.
     */
    let clerkRole: string | null = null;
    try {
      const { clerkClient } = await import("@clerk/nextjs/server");
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(id);
      clerkRole =
        ((clerkUser.publicMetadata as { role?: string } | undefined)?.role ?? null);
    } catch (error) {
      // A deleted Clerk account with a surviving User row is a real state, and
      // it should not make the whole panel 500. Report it as unknown.
      console.error(
        "[admin/users/:id] clerk lookup failed:",
        error instanceof Error ? error.message : error
      );
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        username: user.username,
        // `User.role` is the profile headline, not the account role. Named
        // `headline` here so the two cannot be confused in the UI.
        headline: user.role,
        location: user.location,
        createdAt: user.createdAt.toISOString(),
        plan: (isPlanId(user.plan) ? user.plan : "free") as PlanId,
        planStatus: user.planStatus,
        planExpiresAt: user.planExpiresAt?.toISOString() ?? null,
        adminNote: user.adminNote,
        showEmail: user.showEmail,
        accountRole: clerkRole,
        counts: {
          resumes: user._count.resumes,
          jobs: user._count.jobs,
          applications: user._count.applications,
          payments: user._count.payments,
        },
        payments: user.payments.map((p) => ({
          ...p,
          interval: isBillingInterval(p.interval) ? p.interval : "month",
          paidAt: p.paidAt?.toISOString() ?? null,
          createdAt: p.createdAt.toISOString(),
        })),
        auditEntries: user.auditEntries.map((entry) => ({
          ...entry,
          effectiveAt: entry.effectiveAt?.toISOString() ?? null,
          createdAt: entry.createdAt.toISOString(),
        })),
        resumes: user.resumes.map((r) => ({
          ...r,
          updatedAt: r.updatedAt.toISOString(),
        })),
      },
    });
  } catch (error) {
    return internalError("GET /api/admin/users/:id", error);
  }
}
