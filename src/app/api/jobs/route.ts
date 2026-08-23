import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const body = await req.json();

    if (!body.title?.trim() || !body.company?.trim()) {
      return NextResponse.json(
        { error: "Title and company are required." },
        { status: 400 }
      );
    }

    // Ensure the user row exists (same guard your resume route uses) —
    // without this, the insert below fails on the userId foreign key.
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: "user@example.com" },
    });

    const job = await prisma.job.create({
      data: {
        userId,
        title: body.title,
        posterImageUrl: body.posterImageUrl || null,
        company: body.company,
        location: body.remote ? null : body.location || null,
        remote: !!body.remote,
        employmentType: body.employmentType || "Full-time",
        salaryMin: body.salaryMin ? parseInt(body.salaryMin, 10) : null,
        salaryMax: body.salaryMax ? parseInt(body.salaryMax, 10) : null,
        description: body.description || null,
        requirements: body.requirements || null,
        skills: Array.isArray(body.skills) ? body.skills : [], // Json field
        status: body.status === "published" ? "published" : "draft",
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error("Create Job Error:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const jobs = await prisma.job.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error("List Jobs Error:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}