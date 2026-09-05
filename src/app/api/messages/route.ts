import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

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

    const client = await clerkClient();
    const sender = await client.users.getUser(userId);
    const senderName = sender.fullName || "An Employer";

    const message = await prisma.message.create({
      data: {
        senderId: userId,
        receiverId,
        senderName,
        content,
      },
    });

    await prisma.notification.create({
      data: {
        userId: receiverId,
        title: `New Message from ${senderName}`,
        message: content.length > 60 ? content.substring(0, 60) + "..." : content,
        link: null,
      }
    });

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

    await prisma.message.update({
      where: { id, receiverId: userId },
      data: { isRead: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("PATCH Message Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database Error" }, { status: 500 });
  }
}