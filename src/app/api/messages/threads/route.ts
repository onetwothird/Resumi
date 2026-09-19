import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { MessageThread } from "@/types/messages";

export const dynamic = "force-dynamic";

interface StringRecord {
  [key: string]: string | null;
}

async function resolveContacts(userIds: string[]): Promise<Map<string, { name: string; username: string | null; imageUrl: string | null }>> {
  const result = new Map<string, { name: string; username: string | null; imageUrl: string | null }>();

  if (userIds.length === 0) return result;

  const dbUsers = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, username: true },
  });
  const dbNames: StringRecord = {};
  const dbUsernames: StringRecord = {};
  for (const u of dbUsers) {
    dbNames[u.id] = u.name;
    dbUsernames[u.id] = u.username;
  }

  let clerkNames: StringRecord = {};
  let clerkImages: StringRecord = {};
  try {
    const client = await clerkClient();
    const clerkUsers = await client.users.getUserList({ userId: userIds, limit: userIds.length });
    clerkNames = {};
    clerkImages = {};
    for (const cu of clerkUsers.data) {
      clerkNames[cu.id] = cu.fullName;
      clerkImages[cu.id] = cu.imageUrl;
    }
  } catch (error) {
    console.warn("Clerk bulk lookup failed in message threads:", error);
  }

  for (const id of userIds) {
    const name = clerkNames[id] || dbNames[id] || `@${dbUsernames[id] || "user"}` || "User";
    result.set(id, {
      name,
      username: dbUsernames[id] ?? null,
      imageUrl: clerkImages[id] ?? null,
    });
  }

  return result;
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const messages = await prisma.message.findMany({
      where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    // Group by the other party, keeping the most recent message per thread.
    const threads = new Map<
      string,
      { otherUserId: string; lastMessage: string; lastAt: Date; lastFromMe: boolean; unreadCount: number }
    >();

    for (const m of messages) {
      const otherUserId = m.senderId === userId ? m.receiverId : m.senderId;
      const existing = threads.get(otherUserId);
      if (existing) {
        if (m.createdAt > existing.lastAt) {
          existing.lastMessage = m.content;
          existing.lastAt = m.createdAt;
          existing.lastFromMe = m.senderId === userId;
        }
        if (m.senderId === otherUserId && !m.isRead) existing.unreadCount += 1;
      } else {
        threads.set(otherUserId, {
          otherUserId,
          lastMessage: m.content,
          lastAt: m.createdAt,
          lastFromMe: m.senderId === userId,
          unreadCount: m.senderId === otherUserId && !m.isRead ? 1 : 0,
        });
      }
    }

    const sorted = [...threads.values()].sort((a, b) => b.lastAt.getTime() - a.lastAt.getTime());

    const contacts = await resolveContacts(sorted.map((t) => t.otherUserId));

    const result: MessageThread[] = sorted.map((t) => {
      const contact = contacts.get(t.otherUserId);
      return {
        otherUserId: t.otherUserId,
        otherName: contact?.name || "User",
        otherUsername: contact?.username ?? null,
        otherImageUrl: contact?.imageUrl ?? null,
        lastMessage: t.lastFromMe ? `You: ${t.lastMessage}` : t.lastMessage,
        lastAt: t.lastAt.toISOString(),
        unreadCount: t.unreadCount,
      };
    });

    return NextResponse.json(result);
  } catch (error: unknown) {
    console.error("GET Threads Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Database Error" }, { status: 500 });
  }
}