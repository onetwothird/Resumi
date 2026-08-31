import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [companies, candidateUsers, openRoles, jobsPostedThisMonth] =
      await Promise.all([
        prisma.job.findMany({
          where: { status: "published" },
          distinct: ["company"],
          select: { company: true },
        }),
        prisma.resume.findMany({
          distinct: ["userId"],
          select: { userId: true },
        }),
        prisma.job.count({
          where: { status: "published" },
        }),
        prisma.job.count({
          where: {
            status: "published",
            createdAt: { gte: startOfMonth },
          },
        }),
      ]);

    return NextResponse.json({
      companiesHiring: companies.length,
      activeCandidates: candidateUsers.length,
      openRoles,
      jobsPostedThisMonth,
    });
  } catch (error) {
    console.error("Stats Error:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}