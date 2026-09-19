import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from "@/lib/notification-settings";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || "";

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

    return NextResponse.json({ email, settings });
  } catch (error: unknown) {
    console.error("GET Settings Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const incoming = body?.settings as Partial<NotificationSettings> | undefined;
    if (!incoming || typeof incoming !== "object") {
      return NextResponse.json({ error: "Missing settings payload." }, { status: 400 });
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

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);

    const updated = await prisma.user.upsert({
      where: { id: userId },
      update: { settings: merged },
      create: {
        id: userId,
        email: existing?.email || clerkUser.primaryEmailAddress?.emailAddress || `${userId}@placeholder.com`,
        settings: merged,
      },
    });

    return NextResponse.json({ settings: updated.settings });
  } catch (error: unknown) {
    console.error("PATCH Settings Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database Error" }, { status: 500 });
  }
}