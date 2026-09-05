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


    try {
      await client.users.updateUser(userId, {
        firstName: body.fullName?.split(" ")[0] || "",
        lastName: body.fullName?.split(" ").slice(1).join(" ") || "",
        username: body.username?.trim() || undefined,
      });
    } catch (clerkError) {
      console.warn("Clerk sync issue (e.g. username taken):", clerkError);
    }

    const updatedUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        name: body.fullName,
        username: body.username,
        role: body.role,
        location: body.location,
        bio: body.bio,
        website: body.website,
        social: body.social,
        github: body.github,
      },
      create: {
        id: userId,
        email: email,
        name: body.fullName,
        username: body.username,
        role: body.role,
        location: body.location,
        bio: body.bio,
        website: body.website,
        social: body.social,
        github: body.github,
      }
    });

    
    return NextResponse.json(updatedUser);
  } catch (error: unknown) {
    console.error("Profile Update Error:", error);
    const message = error instanceof Error ? error.message : "Database Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}