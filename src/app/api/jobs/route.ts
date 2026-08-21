import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma"; 

type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Internship";

interface CreateJobBody {
  title: string;
  company: string;
  location: string;
  remote: boolean;
  employmentType: EmploymentType;
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string;
  skills: string[];
  status: "draft" | "published";
}
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as CreateJobBody | null;

  if (!body?.title?.trim() || !body?.company?.trim()) {
    return NextResponse.json({ error: "Title and company are required" }, { status: 400 });
  }

  if (body.status !== "draft" && body.status !== "published") {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const toIntOrNull = (v: string) => {
    const n = parseInt(v, 10);
    return Number.isFinite(n) ? n : null;
  };

  const job = await prisma.job.create({
    data: {
      userId,
      title: body.title.trim(),
      company: body.company.trim(),
      location: body.remote ? null : body.location?.trim() || null,
      remote: body.remote,
      employmentType: body.employmentType,
      salaryMin: toIntOrNull(body.salaryMin),
      salaryMax: toIntOrNull(body.salaryMax),
      description: body.description || null,
      requirements: body.requirements || null,
      skills: body.skills ?? [],
      status: body.status,
    },
  });

  return NextResponse.json(job, { status: 201 });
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const jobs = await prisma.job.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(jobs);
}