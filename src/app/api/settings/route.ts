import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from "@/lib/notification-settings";
import { internalError } from "@/lib/api-response";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // No Clerk round trip here: nothing reads an email from this response,
    // and fetching the Clerk user added a network hop to every Settings load.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true },
    });

    const settings: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(typeof user?.settings === "object" && user.settings !== null
        ? (user.settings as Partial<NotificationSettings>)
        : {}),
    };

    return NextResponse.json({ settings });
  } catch (error: unknown) {
    return internalError("GET /api/settings", error);
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const raw = body?.settings;
    if (!raw || typeof raw !== "object") {
      return NextResponse.json({ error: "Missing settings payload." }, { status: 400 });
    }
    // Keep only known switches with boolean values. The body used to be
    // spread straight into the stored JSON, so any key or value went in.
    const incoming: { -readonly [K in keyof NotificationSettings]?: boolean } = {};
    for (const key of Object.keys(DEFAULT_NOTIFICATION_SETTINGS) as (keyof NotificationSettings)[]) {
      if (typeof raw[key] === "boolean") incoming[key] = raw[key];
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: { settings: true, email: true },
    });

    const merged: NotificationSettings = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(typeof existing?.settings === "object" && existing.settings !== null
        ? (existing.settings as Partial<NotificationSettings>)
        : {}),
      ...incoming,
    };

    // Only a first-time user without a row needs Clerk (for the email).
    let updated;
    if (existing) {
      updated = await prisma.user.update({ where: { id: userId }, data: { settings: merged } });
    } else {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);
      updated = await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.primaryEmailAddress?.emailAddress || `${userId}@placeholder.com`,
          settings: merged,
        },
      });
    }

    return NextResponse.json({ settings: updated.settings });
  } catch (error: unknown) {
    return internalError("PATCH /api/settings", error);
  }
}