// C:\resumi\src\app\api\notifications\route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const url = new URL(req.url);
    const rawLimit = Number(url.searchParams.get("limit") || "10");
    const limit = Math.min(Math.max(Number.isFinite(rawLimit) ? rawLimit : 10, 1), 50);

    const [notifications, unreadCount, totalCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: limit,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.notification.count({ where: { userId } }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      totalCount,
    });
  } catch {
    return new NextResponse("Database Error", { status: 500 });
  }
}

// PATCH with { id } marks a single notification as read.
// PATCH with {} (or { all: true }) marks every notification as read.
export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = body?.id as string | undefined;

    if (id) {
      await prisma.notification.updateMany({
        where: { id, userId },
        data: { isRead: true },
      });
    } else if (body?.all === true || Object.keys(body).length === 0) {
      await prisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Database Error", { status: 500 });
  }
}

// DELETE with { id } removes a single notification (e.g. from the notifications page).
export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json().catch(() => ({}));
    const id = body?.id as string | undefined;
    if (!id) return NextResponse.json({ error: "Missing notification id" }, { status: 400 });

    await prisma.notification.deleteMany({ where: { id, userId } });

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Database Error", { status: 500 });
  }
}