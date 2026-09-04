import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id: applicationId } = await params;
    const body = await req.json();

    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: { job: true },
    });

    if (!application || application.job.userId !== userId) {
      return new NextResponse("Not Found or Unauthorized", { status: 404 });
    }

    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: {
        status: body.status !== undefined ? body.status : application.status,
        notes: body.notes !== undefined ? body.notes : application.notes,
      },
    });

    return NextResponse.json(updatedApplication);
  } catch (error) {
    console.error("Update Application Error:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}