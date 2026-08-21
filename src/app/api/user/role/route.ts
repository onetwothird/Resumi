import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const role = body?.role;

  if (role !== "employer" && role !== "jobseeker") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const client = await clerkClient();
  await client.users.updateUser(userId, {
    publicMetadata: { role },
  });

  return NextResponse.json({ role });
}
