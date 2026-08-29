/* eslint-disable @typescript-eslint/no-unused-vars */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { Prisma } from "@prisma/client";

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

     
    const { 
      id: _id, 
      createdAt: _createdAt, 
      updatedAt: _updatedAt, 
      ...rest 
    } = original;

    const copy = await prisma.resume.create({
      data: {
        ...rest,
        userId,
        title: `${original.title} (Copy)`,
        experience: rest.experience ? (rest.experience as Prisma.InputJsonValue) : undefined,
        education: rest.education ? (rest.education as Prisma.InputJsonValue) : undefined,
        skills: rest.skills ? (rest.skills as Prisma.InputJsonValue) : undefined,
        theme: rest.theme ? (rest.theme as Prisma.InputJsonValue) : undefined,
        blockStyles: rest.blockStyles ? (rest.blockStyles as Prisma.InputJsonValue) : undefined,
      },
    });

    return NextResponse.json(copy);
  } catch (error) {
    console.error(error);
    return new NextResponse("Database Error", { status: 500 });
  }
}