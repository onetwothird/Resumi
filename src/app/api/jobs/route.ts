import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth, clerkClient } from "@clerk/nextjs/server";

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

    // Fetch the real email from Clerk to prevent @unique constraint database crashes
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(userId);
    const email = clerkUser.primaryEmailAddress?.emailAddress || `${userId}@placeholder.com`;

    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { 
        id: userId, 
        email: email 
      },
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
        skills: Array.isArray(body.skills) ? body.skills : [],
        status: body.status === "published" ? "published" : "draft",
      },
    });

    return NextResponse.json(job);
  } catch (error: unknown) {
    console.error("Create Job Error:", error);
    
    // Return the actual database error to the frontend toast notification
    const errorMessage = error instanceof Error ? error.message : "Database Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const jobs = await prisma.job.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: {
          select: { applications: true }
        }
      }
    });

    const formattedJobs = jobs.map((job) => ({
      ...job,
      applicantCount: job._count.applications,
      _count: undefined,
    }));

    return NextResponse.json(formattedJobs);
  } catch (error: unknown) {
    console.error("List Jobs Error:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}