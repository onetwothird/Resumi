import { NextResponse } from "next/server";
import prisma from "@/lib/prisma"; 

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      where: {
        status: "published",
      },
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        title: true,
        company: true,
        location: true,
        remote: true,
        employmentType: true,
        salaryMin: true,
        salaryMax: true,
        description: true,
        requirements: true,
        skills: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        posterImageUrl: true, 
      }
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}