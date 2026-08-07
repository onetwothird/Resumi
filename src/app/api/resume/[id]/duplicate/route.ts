import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { id } = await params;

    const original = await prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!original) return new NextResponse("Not found", { status: 404 });

    // Strip fields that must not be copied verbatim
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, ...rest } =
      original;

    const copy = await prisma.resume.create({
      data: {
        ...rest,
        userId,
        title: `${original.title} (Copy)`,
        experience: rest.experience ?? undefined,
        education: rest.education ?? undefined,
        skills: rest.skills ?? undefined,
      },
    });

    return NextResponse.json(copy);
  } catch (error) {
    console.error(error);
    return new NextResponse("Database Error", { status: 500 });
  }
}