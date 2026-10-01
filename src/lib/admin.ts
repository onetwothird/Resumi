import "server-only";

import { auth, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { isPlanId, PLANS, periodMs, type PlanId } from "@/lib/plans";

/**
 * Admin authorization and the privileged writes that go with it.
 *
 * ## Who is an admin
 *
 * Clerk `publicMetadata.isAdmin`, and nothing else. The flag is set by hand in
 * the Clerk dashboard; there is no code path in this app that can set it on
 * itself, which is the point. A DB column would have been wrong here: every
 * read would have to go through the database, and a bug that wrote to the
 * column would be a privilege-escalation bug rather than a data bug.
 *
 * It is read from the *session token* (`sessionClaims.metadata`) rather than
 * from a `clerkClient().users.getUser()` call, for the same reason
 * src/proxy.ts reads the role claim from there: the token is already verified,
 * so the check costs no network round-trip. The trade is that revoking admin
 * takes effect on the next session refresh, not instantly.
 *
 * ## Why this file is the only writer
 *
 * `recordPaidPayment` in src/lib/billing.ts is the one place that turns money
 * into a plan, and it deliberately refuses to downgrade: it grants the better
 * of what the user has and what was bought. That is correct for an automated
 * webhook, where a user cannot be trusted to describe their own purchase. It is
 * wrong for an admin, who needs to move someone *down* to free when a transfer
 * turns out to be a mistake — which is the whole reason the panel exists.
 *
 * So the admin path writes User.plan directly, and always records what it did.
 * Keeping both paths here means the rule "a plan change is always attributable
 * to a payment or to a named admin" is checkable by reading one file.
 */

/** Actions recorded in AdminAuditLog.action. Text in the DB, not an enum, so
 *  adding one does not need a migration. */
export const ADMIN_ACTIONS = {
  /** An admin set plan and/or planExpiresAt by hand. */
  planSet: "plan.set",
  /** A Payment row was reconciled to paid outside a webhook. */
  paymentMarkPaid: "payment.mark_paid",
  /** An admin wrote the private staff note. */
  userNote: "user.note",
} as const;

export type AdminAction = (typeof ADMIN_ACTIONS)[keyof typeof ADMIN_ACTIONS];

/**
 * Is the current session an admin?
 *
 * Returns the admin's own userId on success, or null. Callers must treat null as
 * a hard stop — this is the single gate, and a null here must never fall
 * through to a write.
 */
export async function requireAdmin(): Promise<string | null> {
  const { userId, sessionClaims } = await auth();
  if (!userId) return null;

  const metadata = sessionClaims?.metadata as { isAdmin?: unknown } | undefined;
  // Strictly === true. A truthy check would treat the string "false", which is
  // exactly what a careless dashboard edit or a JSON round-trip produces, as
  // granting access.
  if (metadata?.isAdmin !== true) return null;

  return userId;
}

/**
 * Make sure the admin has a User row, so AdminAuditLog.actorId can point at
 * something.
 *
 * An admin is normally a real account with a row, but Clerk users are created
 * before the app's first write, and an admin promoted before ever opening a
 * dashboard page has no row. The audit foreign key is NOT NULL, so without this
 * the very first logged action would fail on a constraint.
 *
 * Looks the row up by email as well as id, and re-keys it if the Clerk id
 * changed — the same recovery path src/lib/ensure-user.ts uses, so an admin
 * promoted onto a re-created account lands on the existing row rather than
 * colliding on the unique email.
 */
async function ensureAdminRow(adminId: string): Promise<void> {
  const existing = await prisma.user.findUnique({ where: { id: adminId } });
  if (existing) return;

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(adminId);
  const email =
    clerkUser.emailAddresses.find((e) => e.id === clerkUser.primaryEmailAddressId)
      ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;
  if (!email) {
    throw new Error(`Admin ${adminId} has no email address to create a row for`);
  }

  const byEmail = await prisma.user.findUnique({ where: { email } });
  if (byEmail && byEmail.id !== adminId) {
    await prisma.$executeRawUnsafe(
      'UPDATE "User" SET id = $1 WHERE id = $2',
      adminId,
      byEmail.id
    );
    return;
  }

  const name =
    [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  await prisma.user.create({ data: { id: adminId, email, name } });
}

export interface PlanGrant {
  plan: PlanId;
  /** ISO string, or null to mean "never expires". */
  planExpiresAt: string | null;
  /**
   * A convenience instead of a date: grant the plan for a whole number of
   * periods measured from now. This is what the panel's "1 month / 3 months /
   * 1 year" buttons send, so the period length comes from the catalogue in
   * src/lib/plans.ts rather than from a hardcoded day count in the client.
   */
  months?: number;
}

/**
 * Set a user's plan by hand.
 *
 * Unlike recordPaidPayment this will downgrade: an admin moving someone to free
 * is the case that cannot be expressed any other way. It refuses to silently
 * widen a grant though — `plan` is required, so a partial edit that only meant
 * to touch the expiry cannot leave the plan column untouched by accident.
 *
 * The audit row is written in the same transaction as the user update. If the
 * log insert fails the plan change rolls back with it, which is the correct
 * order: a plan nobody can explain is worse than a plan that did not change.
 */
export async function adminSetPlan(
  adminId: string,
  targetUserId: string,
  grant: PlanGrant,
  note: string
): Promise<{ from: PlanId; to: PlanId; planExpiresAt: string | null } | null> {
  if (!isPlanId(grant.plan)) {
    throw new Error(`Refusing to set an unknown plan: ${String(grant.plan)}`);
  }

  await ensureAdminRow(adminId);

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { plan: true },
  });
  // No row means the Clerk account has never written to the app. Return null
  // rather than throwing so the route can answer 404 instead of a 500 that
  // reads like a server fault.
  if (!target) return null;

  const from = isPlanId(target.plan) ? target.plan : "free";
  const to = grant.plan;

  let planExpiresAt: Date | null = null;
  if (grant.months != null) {
    // The month length comes from the catalogue (periodMs returns the same
    // MONTH_MS for every plan), not a day count typed here or by the client, so
    // "1 month" always means exactly what a purchased month means. Falls back
    // to a 30-day month for the free plan, whose period is null by design —
    // granting free for a term is still meaningful to an admin setting an
    // expiry date.
    const monthMs = periodMs(PLANS[to], "month") || 30 * 24 * 60 * 60 * 1000;
    planExpiresAt = new Date(Date.now() + monthMs * grant.months);
  } else if (grant.planExpiresAt) {
    const parsed = new Date(grant.planExpiresAt);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error("planExpiresAt is not a valid date");
    }
    planExpiresAt = parsed;
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: {
        plan: to,
        planExpiresAt,
        // Cleared rather than set to "active": this is not a subscription, so
        // there is no provider-side state to mirror. Same reason
        // recordPaidPayment nulls it.
        planStatus: null,
      },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: adminId,
        targetUserId,
        action: ADMIN_ACTIONS.planSet,
        fromValue: from,
        toValue: to,
        note,
        effectiveAt: planExpiresAt,
      },
    }),
  ]);

  return { from, to, planExpiresAt: planExpiresAt?.toISOString() ?? null };
}

/**
 * Reconcile a Payment to paid.
 *
 * Delegates to recordPaidPayment rather than writing the columns, so a manual
 * grant and a real webhook grant produce byte-identical results: same plan
 * resolution, same stacking of the expiry, same idempotency. The only thing
 * added is the audit row, which is the point — this path has no webhook
 * signature behind it.
 */
export async function adminMarkPaymentPaid(
  adminId: string,
  paymentId: string,
  note: string
): Promise<{ targetUserId: string | null; alreadyPaid: boolean } | null> {
  await ensureAdminRow(adminId);

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    select: { userId: true, status: true, plan: true },
  });
  if (!payment) return null;

  const alreadyPaid = payment.status === "paid";

  // recordPaidPayment is a no-op on an already-paid row, so calling it anyway
  // is safe; the flag is only for the message shown back to the admin.
  const { recordPaidPayment } = await import("@/lib/billing");
  await recordPaidPayment(paymentId, { paymongoPaymentId: null });

  await prisma.adminAuditLog.create({
    data: {
      actorId: adminId,
      targetUserId: payment.userId,
      action: ADMIN_ACTIONS.paymentMarkPaid,
      fromValue: payment.status,
      toValue: "paid",
      note,
      effectiveAt: new Date(),
    },
  });

  return { targetUserId: payment.userId, alreadyPaid };
}

/** Write the private staff note. Separate from the plan so a note never
 *  implies the plan changed. */
export async function adminSetNote(
  adminId: string,
  targetUserId: string,
  note: string
): Promise<void> {
  await ensureAdminRow(adminId);

  const target = await prisma.user.findUnique({
    where: { id: targetUserId },
    select: { adminNote: true },
  });
  if (!target) return;

  const trimmed = note.trim();
  await prisma.$transaction([
    prisma.user.update({
      where: { id: targetUserId },
      data: { adminNote: trimmed || null },
    }),
    prisma.adminAuditLog.create({
      data: {
        actorId: adminId,
        targetUserId,
        action: ADMIN_ACTIONS.userNote,
        fromValue: target.adminNote ? "note" : null,
        toValue: trimmed ? "note" : null,
        // The note text itself is the record, so it is not duplicated here; the
        // log says the note was touched and the column holds what it says.
        note: trimmed
          ? "Staff note updated."
          : "Staff note cleared.",
      },
    }),
  ]);
}
