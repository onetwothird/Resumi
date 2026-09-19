import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || `${userId}@placeholder.com`;

    // Normalize empty strings to null to avoid unique constraint violations
    // (Prisma treats "" as a real value, so two users with username="" would clash)
    const cleanUsername = body.username?.trim() || null;

    // Sync name & username to Clerk
    try {
      await client.users.updateUser(userId, {
        firstName: body.fullName?.split(" ")[0] || "",
        lastName: body.fullName?.split(" ").slice(1).join(" ") || "",
        username: cleanUsername || undefined,
      });
    } catch (clerkError) {
      console.warn("Clerk sync issue (e.g. username taken):", clerkError);
    }

    const profileData = {
      name: body.fullName || null,
      username: cleanUsername,
      role: body.role || null,
      location: body.location || null,
      bio: body.bio || null,
      website: body.website || null,
      social: body.social || null,
      github: body.github || null,
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
    console.error("[PATCH /api/profile]", error);
    const message = error instanceof Error ? error.message : "Database Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
