import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await Promise.resolve(context.params);
    const applicationId = params.id;

    const body = await req.json();

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application || application.job.userId !== userId) {
      return NextResponse.json({ error: "Application not found or unauthorized" }, { status: 404 });
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: body.status !== undefined ? body.status : application.status,
      },
    });

    if (body.status && body.status !== application.status) {
      const statusLabels: Record<string, string> = {
        pending: "Pending",
        reviewing: "Reviewing",
        interviewing: "Interviewing",
        hired: "Hired",
        rejected: "Rejected",
      };
      
      const newStatusLabel = statusLabels[body.status] || body.status;

      await prisma.notification.create({
        data: {
          userId: application.userId, 
          title: "Application Status Updated",
          message: `Your application for ${application.job.title} at ${application.job.company} is now marked as ${newStatusLabel}.`,
          link: "/dashboard",
        },
      });
    }

    return NextResponse.json(updatedApplication);
  } catch (error: unknown) {
    console.error("Update Application Error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Database Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}