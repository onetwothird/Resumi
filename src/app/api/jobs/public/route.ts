// src/app/api/jobs/public/route.ts
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
      // IF YOU HAVE A SELECT STATEMENT, MAKE SURE posterImageUrl IS TRUE
      // If you don't use 'select' and just return everything, you can ignore this part.
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
        posterImageUrl: true, // <-- Ensure this is being sent to the frontend
      }
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error(error);
    return new Response("Internal Server Error", { status: 500 });
  }
}