import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

const SENDER_NAME_FALLBACK = "Someone on Resumi";

async function resolveSenderName(userId: string): Promise<string> {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    if (clerkUser.fullName?.trim()) return clerkUser.fullName;
  } catch {
    // Fall through to the local DB.
  }

  const dbUser = await prisma.user.findUnique({ where: { id: userId } });
  if (dbUser?.name?.trim()) return dbUser.name;
  if (dbUser?.username) return `@${dbUser.username}`;

  return SENDER_NAME_FALLBACK;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const messages = await prisma.message.findMany({
      where: { receiverId: userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json(messages);
  } catch (error: unknown) {
    console.error("GET Messages Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database Error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId, content } = await req.json();
    const trimmed = typeof content === "string" ? content.trim() : "";
    if (!receiverId || typeof receiverId !== "string") {
      return NextResponse.json({ error: "Missing receiver." }, { status: 400 });
    }
    if (!trimmed) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }
    if (receiverId === userId) {
      return NextResponse.json({ error: "You can't message yourself." }, { status: 400 });
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || `${userId}@placeholder.com`;

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email },
    });

    const senderName = await resolveSenderName(userId);

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        senderName,
        content: trimmed,
      },
    });

    const receiverExists = await prisma.user.findUnique({ where: { id: receiverId } });
    if (receiverExists) {
      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: `New Message from ${senderName}`,
          message: trimmed.length > 60 ? trimmed.substring(0, 60) + "..." : trimmed,
          link: "/messages",
        },
      });
    }

    return NextResponse.json(message);
  } catch (error: unknown) {
    console.error("POST Message Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to save message to database." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    const { id } = await req.json();

    await prisma.message.updateMany({
      where: { id, receiverId: userId },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("PATCH Message Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database Error" }, { status: 500 });
  }
}