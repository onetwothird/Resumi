import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { z } from "zod";
import { internalError, validationError } from "@/lib/api-response";

const applySchema = z.object({
  resumeId: z.string().min(1).max(64).nullish(),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const params = await Promise.resolve(context.params);
    const jobId = params.id;

    const parsed = applySchema.safeParse(await req.json().catch(() => ({})));
    if (!parsed.success) {
      return validationError(parsed.error);
    }
    const { resumeId } = parsed.data;

    // Confirm the job exists and is actually open before creating anything.
    // Previously a caller could POST an arbitrary job id (or the id of a
    // draft job, which no public page ever links to) and the application row
    // plus both notifications were created regardless.
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true, userId: true, title: true, company: true, status: true },
    });

    if (!job || job.status !== "published") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.userId === userId) {
      return NextResponse.json(
        { error: "You cannot apply to your own job posting." },
        { status: 400 }
      );
    }

    // Verify the attached resume actually belongs to the applicant.
    //
    // To be precise about the previous impact: this was NOT an exploitable
    // IDOR. applicants/[applicantId]/page.tsx:48-50 resolves resumeId via
    // `application.user.resumes.find(...)`, which is scoped to the
    // applicant's own resumes, so a forged id resolved to undefined and fell
    // back to their first resume. It was still worth closing: it stored a
    // foreign id in a shared column, it accepted any JSON value in that
    // field, and it depended on that scoping staying intact if the read side
    // ever changed.
    let attachedResumeId: string | null = null;
    if (resumeId) {
      const owned = await prisma.resume.findFirst({
        where: { id: resumeId, userId },
        select: { id: true },
      });
      if (owned) attachedResumeId = owned.id;
    }

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || `${userId}@placeholder.com`;

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email },
    });

    const application = await prisma.application.create({
      data: {
        jobId,
        userId,
        resumeId: attachedResumeId,
        status: "pending",
      },
    });

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
        userId,
        title: "Application Submitted ✅",
        message: `Your application for ${job.title} at ${job.company} was sent successfully. Good luck!`,
        link: "/dashboard",
      }
    });

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
    return internalError("POST /api/jobs/[id]/apply", error);
  }
}
