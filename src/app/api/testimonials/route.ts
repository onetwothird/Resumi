import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const testimonials = await prisma.testimonial.findMany({
      where: { approved: true },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        role: true,
        company: true,
        quote: true,
        rating: true,
      },
    });

    return NextResponse.json(testimonials);
  } catch (error) {
    console.error("Fetch Testimonials Error:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    const body = await req.json();
    const { name, role, company, quote, rating } = body;

    if (!name?.trim() || !quote?.trim()) {
      return NextResponse.json(
        { error: "Name and testimonial are required." },
        { status: 400 }
      );
    }

    if (quote.trim().length < 20) {
      return NextResponse.json(
        { error: "Testimonial must be at least 20 characters." },
        { status: 400 }
      );
    }

    const testimonial = await prisma.testimonial.create({
      data: {
        userId: userId || null,
        name: name.trim(),
        role: role?.trim() || null,
        company: company?.trim() || null,
        quote: quote.trim(),
        rating: Math.max(1, Math.min(5, Number(rating) || 5)),
        approved: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your testimonial will appear after review.",
      id: testimonial.id,
    });
  } catch (error) {
    console.error("Submit Testimonial Error:", error);
    return new NextResponse("Database Error", { status: 500 });
  }
}
