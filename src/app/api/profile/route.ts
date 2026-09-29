import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { internalError, validationError } from "@/lib/api-response";
import { profileSchema } from "@/lib/validation";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const limited = await enforceRateLimit(
      req,
      "profile:write",
      userId,
      RATE_LIMITS.resumeWrite.limit,
      RATE_LIMITS.resumeWrite.windowMs
    );
    if (limited) return limited;

    // Whitelist the fields. The body is no longer spread into the update, so
    // a client cannot set any column the form does not declare.
    const parsed = profileSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return validationError(parsed.error);
    }
    const body = parsed.data;

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || `${userId}@placeholder.com`;

    // Normalize empty strings to null to avoid unique constraint violations
    // (Prisma treats "" as a real value, so two users with username="" would clash)
    const cleanUsername = body.username || null;

    // Sync name & username to Clerk
    try {
      await client.users.updateUser(userId, {
        firstName: body.fullName?.split(" ")[0] || "",
        lastName: body.fullName?.split(" ").slice(1).join(" ") || "",
        username: cleanUsername ?? undefined,
      });
    } catch (clerkError) {
      console.warn("Clerk sync issue (e.g. username taken):", clerkError);
    }

    const profileData = {
      name: body.fullName || null,
      username: cleanUsername,
      // Display headline, not the account role - see profileSchema.
      role: body.role || null,
      location: body.location || null,
      bio: body.bio || null,
      website: body.website || null,
      social: body.social || null,
      github: body.github || null,
      // Only write the flag when the client actually sent it, so an older
      // client that omits it cannot silently reset the user's choice.
      ...(body.showEmail === undefined ? {} : { showEmail: body.showEmail }),
    };

    // First try to find by Clerk id
    let existing = await prisma.user.findUnique({ where: { id: userId } });

    // If not found by id, check if a record exists with this email (different id)
    // This handles the case where the DB id doesn't match the Clerk userId
    if (!existing) {
      existing = await prisma.user.findUnique({ where: { email } });
      if (existing && existing.id !== userId) {
        // Re-key the existing record to the current Clerk userId
        await prisma.$executeRawUnsafe(
          'UPDATE "User" SET id = $1 WHERE id = $2',
          userId,
          existing.id
        );
        existing.id = userId;
      }
    }

    let updatedUser;
    if (existing) {
      updatedUser = await prisma.user.update({
        where: { id: userId },
        data: profileData,
      });
    } else {
      updatedUser = await prisma.user.create({
        data: {
          id: userId,
          email,
          ...profileData,
        },
      });
    }

    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    return internalError("PATCH /api/profile", error);
  }
}
