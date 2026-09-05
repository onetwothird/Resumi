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
      return NextResponse.json({ error: "Not Found or Unauthorized" }, { status: 404 });
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: body.status !== undefined ? body.status : application.status,
      },
    });

    if (body.status && body.status !== application.status) {
      const statusData: Record<string, { label: string, title: string }> = {
        pending: { label: "Pending", title: "Application Update" },
        reviewing: { label: "Under Review", title: "Profile Under Review 👀" },
        interviewing: { label: "Selected for Interview", title: "Interview Invitation! 📅" },
        hired: { label: "Hired", title: "Congratulations! 🎉" },
        rejected: { label: "Not Selected", title: "Application Update" },
      };
      
      const newStatus = statusData[body.status] || { label: body.status, title: "Application Update" };

      await prisma.notification.create({
        data: {
          userId: application.userId, 
          title: newStatus.title,
          message: `Your application for ${application.job.title} at ${application.job.company} has been updated to: ${newStatus.label}.`,
          link: "/dashboard",
        },
      });
    }

    return NextResponse.json(updatedApplication);
  } catch {
    return NextResponse.json({ error: "Database Error" }, { status: 500 });
  }
}