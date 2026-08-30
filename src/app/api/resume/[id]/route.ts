import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;

    // A brand-new, unsaved resume has no id to look up yet — return an
    // empty 200 rather than treating it as a lookup failure.
    if (id === "new") {
      return NextResponse.json(null);
    }

    const resume = await prisma.resume.findFirst({
      where: { id, userId },
    });

    if (!resume) return new NextResponse("Not found", { status: 404 });

    return NextResponse.json(resume);
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

    const { id } = await params;
    const data = await req.json();

    // If the user has explicitly renamed the resume (data.titleIsCustom),
    // trust whatever title they typed and keep the flag set — autosave
    // must never clobber a manual rename. Otherwise, auto-derive the title
    // from the resume's content on every save: Job Title, then full name,
    // then a generic placeholder.
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
    };

    const resume = await prisma.resume.upsert({
      where: { id: id === "new" ? "temp-id-prevent-match" : id },
      update: dbPayload,
      create: {
        ...dbPayload,
        userId,
      },
    });

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
