import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: jobId } = await params;

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || `${userId}@placeholder.com`;

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { 
        id: userId, 
        email: email 
      },
    });

    const body = await req.json().catch(() => ({}));
    const resumeId = body.resumeId || null;

    // Create the application
    const application = await prisma.application.create({
      data: {
        jobId,
        userId,
        resumeId,
        status: "pending",
      },
    });

    const job = await prisma.job.findUnique({ 
      where: { id: jobId }, 
      select: { userId: true, title: true } 
    });
    
    if (job) {
      await prisma.notification.create({
        data: {
          userId: job.userId,
          title: "New Application",
          message: `Someone just applied for your ${job.title} position.`,
          link: `/employer/jobs/${jobId}/applicants`,
        }
      });
    }

    return NextResponse.json(application);
  } catch (error: unknown) {
    console.error("Application Error:", error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === "P2002") {
      return NextResponse.json(
        { error: "You have already applied for this role." },
        { status: 400 }
      );
    }

    const errorMessage = error instanceof Error ? error.message : "Database Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}