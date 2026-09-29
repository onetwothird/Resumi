import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/ensure-user";
import { internalError, validationError } from "@/lib/api-response";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { resumePayloadSchema, resumeTitleSchema } from "@/lib/validation";
import { calculateResumeProgress, ResumeProgress, ProgressInput } from "@/lib/resume-progress";
import { Prisma } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    
    if (id === "new") {
      return NextResponse.json(null);
    }

    const resume = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Calculate progress on-the-fly for resumes saved before this feature
    let completionProgress = resume.completionProgress as ResumeProgress | null;
    if (!completionProgress) {
      completionProgress = calculateResumeProgress(resume as unknown as ProgressInput);
      // Persist it so future loads are fast
      await prisma.resume.update({
        where: { id },
        data: { completionProgress: completionProgress as unknown as Prisma.InputJsonValue },
      });
    }

    return NextResponse.json({ ...resume, completionProgress });
  } catch (error) {
    return internalError("GET /api/resume/[id]", error);
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    await ensureUser(userId);

    // The editor autosaves, so this is the highest-frequency write in the app.
    // The limit is generous enough that normal editing never trips it and
    // tight enough that a scripted writer cannot flood the table.
    const limited = await enforceRateLimit(
      req,
      "resume:write",
      userId,
      RATE_LIMITS.resumeWrite.limit,
      RATE_LIMITS.resumeWrite.windowMs
    );
    if (limited) return limited;

    const { id } = await params;

    // Validate and sanitize before anything touches the database. Every
    // richText field below is rendered via dangerouslySetInnerHTML in
    // components/features/resume/templates/renderer.tsx, so this is the
    // boundary that stops a stored payload from executing in the editor.
    const parsed = resumePayloadSchema.safeParse(
      await req.json().catch(() => null)
    );
    if (!parsed.success) {
      return validationError(parsed.error);
    }
    const data = parsed.data;

    const customTitle = typeof data.title === "string" ? data.title : "";
    const isCustomTitle = data.titleIsCustom === true && customTitle.trim().length > 0;

    const fullName = [data.firstName, data.lastName]
      .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
      .join(" ")
      .trim();

    const derivedTitle =
      (typeof data.jobTitle === "string" && data.jobTitle) || fullName || "Untitled Resume";

    const completionProgress = calculateResumeProgress(data);

    const dbPayload = {
      title: isCustomTitle ? customTitle : derivedTitle,
      titleIsCustom: isCustomTitle,
      firstName: data.firstName ?? null,
      lastName: data.lastName ?? null,
      jobTitle: data.jobTitle ?? null,
      email: data.email ?? null,
      phone: data.phone ?? null,
      address: data.address ?? null,
      summary: data.summary ?? null,
      experience: data.experience as unknown as Prisma.InputJsonValue,
      education: data.education as unknown as Prisma.InputJsonValue,
      // Json? columns need the explicit DbNull sentinel to store SQL NULL;
      // a bare `null` is not accepted by the generated client.
      skills: (data.skills ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
      certifications: data.certifications ?? null,
      theme: (data.theme ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
      blockStyles: (data.blockStyles ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
      completionProgress: completionProgress as unknown as Prisma.InputJsonValue,
    };

    const resume = id === "new"
      ? await prisma.resume.create({ data: { ...dbPayload, userId } })
      : await (async () => {
          const existing = await prisma.resume.findFirst({ where: { id, userId } });
          if (existing) {
            return prisma.resume.update({ where: { id }, data: dbPayload });
          }
          // Unknown id for this user — treat as a fresh resume so a stale
          // client id (e.g. from a deleted resume) can't clobber someone
          // else's data, and hangs up a clean record instead.
          return prisma.resume.create({ data: { ...dbPayload, userId } });
        })();

    return NextResponse.json(resume);
  } catch (error) {
    return internalError("POST /api/resume/[id]", error);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const parsed = resumeTitleSchema.safeParse(
      await req.json().catch(() => null)
    );
    if (!parsed.success) {
      return validationError(parsed.error);
    }

    const existing = await prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const resume = await prisma.resume.update({
      where: { id },
      data: { title: parsed.data.title, titleIsCustom: true },
    });

    return NextResponse.json(resume);
  } catch (error) {
    return internalError("PATCH /api/resume/[id]", error);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;

    const { count } = await prisma.resume.deleteMany({
      where: { id, userId },
    });
    if (count === 0) return NextResponse.json({ error: "Not found" }, { status: 404 });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    return internalError("DELETE /api/resume/[id]", error);
  }
}
