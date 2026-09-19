import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { ensureUser } from "@/lib/ensure-user";
import { calculateResumeProgress, ResumeProgress, ProgressInput } from "@/lib/resume-progress";
import { Prisma } from "@prisma/client";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    
    if (id === "new") {
      return NextResponse.json(null);
    }

    const resume = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) return new NextResponse("Not found", { status: 404 });

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
    console.error(error);
    return new NextResponse("Database Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    await ensureUser(userId);

    const { id } = await params;
    const data = await req.json();

    const isCustomTitle =
      data.titleIsCustom === true &&
      typeof data.title === "string" &&
      data.title.trim().length > 0;

    const fullName = [data.firstName, data.lastName]
      .filter((part: unknown) => typeof part === "string" && part.trim())
      .join(" ")
      .trim();

    const derivedTitle =
      (typeof data.jobTitle === "string" && data.jobTitle.trim()) ||
      fullName ||
      "Untitled Resume";

    const dbPayload = {
      title: isCustomTitle ? data.title.trim() : derivedTitle,
      titleIsCustom: isCustomTitle,
      firstName: data.firstName,
      lastName: data.lastName,
      jobTitle: data.jobTitle,
      email: data.email,
      phone: data.phone,
      address: data.address,
      summary: data.summary,
      experience: data.experience ?? [],
      education: data.education ?? [],
      skills: data.skills ?? null,
      certifications: data.certifications,
      theme: data.theme ?? null,
      blockStyles: data.blockStyles ?? null,
      completionProgress: calculateResumeProgress(data) as unknown as Prisma.InputJsonValue,
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
    console.error(error);
    return new NextResponse("Database Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;
    const body = await req.json();

    const existing = await prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!existing) return new NextResponse("Not found", { status: 404 });

    const resume = await prisma.resume.update({
      where: { id },
      data: { title: body.title, titleIsCustom: true },
    });

    return NextResponse.json(resume);
  } catch (error) {
    console.error(error);
    return new NextResponse("Database Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;

    const { count } = await prisma.resume.deleteMany({
      where: { id, userId },
    });
    if (count === 0) return new NextResponse("Not found", { status: 404 });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return new NextResponse("Database Error", { status: 500 });
  }
}