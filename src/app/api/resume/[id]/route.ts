import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const data = await req.json();
    
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: "user@example.com" } // Replace with Clerk email if needed
    });

    // Save Resume
    const resume = await prisma.resume.upsert({
      where: { id: params.id === "new" ? "temp-id-prevent-match" : params.id },
      update: { ...data },
      create: { ...data, userId, id: undefined },
    });

    return NextResponse.json(resume);
  } catch (error) {
    console.error(error);
    return new NextResponse("Database Error", { status: 500 });
  }
}