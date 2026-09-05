import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await Promise.resolve(context.params);
    const jobId = params.id;

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || `${userId}@placeholder.com`;

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: email },
    });

    const body = await req.json().catch(() => ({}));
    
    const application = await prisma.application.create({
      data: {
        jobId,
        userId,
        resumeId: body.resumeId || null,
        status: "pending",
      },
    });

    const job = await prisma.job.findUnique({ 
      where: { id: jobId }, 
      select: { userId: true, title: true, company: true } 
    });
    
    if (job) {
      await prisma.notification.create({
        data: {
          userId: job.userId,
          title: "New Application Received",
          message: `A candidate just applied for your ${job.title} role.`,
          link: `/employer/jobs/${jobId}/applicants`,
        }
      });

      await prisma.notification.create({
        data: {
          userId: userId,
          title: "Application Submitted ✅",
          message: `Your application for ${job.title} at ${job.company} was sent successfully. Good luck!`,
          link: "/dashboard",
        }
      });
    }

    return NextResponse.json(application);
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "You have already applied for this role." }, { status: 400 });
    }
    return NextResponse.json({ error: "Database Error" }, { status: 500 });
  }
}