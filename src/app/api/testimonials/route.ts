import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/lib/prisma";
import { internalError, validationError } from "@/lib/api-response";
import { testimonialSchema } from "@/lib/validation";

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
    return internalError("GET /api/testimonials", error);
  }
}

export async function POST(req: Request) {
  try {
    // Sign-in is NOT required here: the submission form lives in
    // PublicFooter, which renders on /, /pricing and /for-employers, so
    // requiring auth would break the feature for anonymous visitors.
    //
    // What was broken is different and worse. `auth()` was called, its
    // result discarded, and every submission was written with
    // `approved: true` - overwriting the schema's own
    // `approved Boolean @default(false)`. GET only returns approved rows,
    // so any unauthenticated caller could publish arbitrary name/company/
    // quote text straight onto the landing page, with no review step.
    //
    // The fix is moderation, not auth: submissions land as approved=false
    // and become visible only after a human approves them. userId is still
    // recorded when the visitor happens to be signed in.
    const { userId } = await auth();

    const parsed = testimonialSchema.safeParse(
      await req.json().catch(() => null)
    );
    if (!parsed.success) {
      return validationError(parsed.error);
    }
    const { name, role, company, quote, rating } = parsed.data;

    const testimonial = await prisma.testimonial.create({
      data: {
        userId: userId ?? null,
        name,
        role: role ?? null,
        company: company ?? null,
        quote,
        rating: rating ?? 5,
        // Pending review. GET filters on approved, so this row is invisible
        // until it is approved out of band.
        approved: false,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Thank you! Your testimonial will appear after review.",
      id: testimonial.id,
    });
  } catch (error) {
    return internalError("POST /api/testimonials", error);
  }
}
