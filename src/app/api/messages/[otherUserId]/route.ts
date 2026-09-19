import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

interface RouteContext {
  params: Promise<{ otherUserId: string }> | { otherUserId: string };
}

export async function GET(_req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const params = await Promise.resolve(context.params);
    const otherUserId = params.otherUserId;

    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: userId },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: 200,
    });

    const other = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { name: true, username: true },
    });

    let otherName = other?.name || other?.username || "User";
    let otherImageUrl: string | null = null;
    try {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(otherUserId);
      if (clerkUser.fullName) otherName = clerkUser.fullName;
      otherImageUrl = clerkUser.imageUrl;
    } catch {
      // Fall back to the local DB info above.
    }

    return NextResponse.json({
      otherUserId,
      otherName,
      otherUsername: other?.username ?? null,
      otherImageUrl,
      messages: messages.map((m) => ({
        id: m.id,
        senderId: m.senderId,
        senderName: m.senderName,
        content: m.content,
        isRead: m.isRead,
        createdAt: m.createdAt.toISOString(),
        mine: m.senderId === userId,
      })),
    });
  } catch (error: unknown) {
    console.error("GET Conversation Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database Error" }, { status: 500 });
  }
}

// Mark every message in this thread (sent by `otherUserId` to us) as read.
export async function PATCH(_req: Request, context: RouteContext) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const params = await Promise.resolve(context.params);
    const otherUserId = params.otherUserId;

    await prisma.message.updateMany({
      where: { senderId: otherUserId, receiverId: userId, isRead: false },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("PATCH Conversation Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database Error" }, { status: 500 });
  }
}