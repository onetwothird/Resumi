// C:\resumi\src\app\api\notifications\route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json(notifications);
  } catch {
    return new NextResponse("Database Error", { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await req.json();

    await prisma.notification.update({
      where: { id, userId },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch {
    return new NextResponse("Database Error", { status: 500 });
  }
}