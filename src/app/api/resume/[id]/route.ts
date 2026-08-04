import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

// 1. Update the signature to expect a Promise for params
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // 2. Await the params to extract the ID
    const { id } = await params;

    const data = await req.json();
    
    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: "user@example.com" } 
    });

    // Save Resume
    const resume = await prisma.resume.upsert({
      // 3. Use the extracted 'id' variable here
      where: { id: id === "new" ? "temp-id-prevent-match" : id },
      update: { ...data },
      create: { ...data, userId, id: undefined },
    });

    return NextResponse.json(resume);
  } catch (error) {
    console.error(error);
    return new NextResponse("Database Error", { status: 500 });
  }
}