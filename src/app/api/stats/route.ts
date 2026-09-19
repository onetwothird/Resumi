import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [totalResumes, totalCompanies, totalJobs] = await Promise.all([
      prisma.resume.count(),
      prisma.job.findMany({
        where: { status: "published" },
        select: { company: true },
        distinct: ["company"],
      }).then((jobs) => new Set(jobs.map((j) => j.company.trim().toLowerCase())).size),
      prisma.job.count({ where: { status: "published" } }),
    ]);

    return NextResponse.json({
      resumesBuilt: totalResumes,
      companiesHiring: totalCompanies,
      openRoles: totalJobs,
    });
  } catch (error) {
    console.error("Stats Error:", error);
    return NextResponse.json({
      resumesBuilt: 0,
      companiesHiring: 0,
      openRoles: 0,
    });
  }
}
