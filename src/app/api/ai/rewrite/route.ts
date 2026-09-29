import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { internalError, validationError } from "@/lib/api-response";
import { aiRewriteSchema } from "@/lib/validation";

// Reused across invocations (Next.js keeps the module warm between requests)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Each call is a billable Gemini request, so bound it per user before
    // doing any work.
    const limited = await enforceRateLimit(
      req,
      "ai:rewrite",
      userId,
      RATE_LIMITS.ai.limit,
      RATE_LIMITS.ai.windowMs
    );
    if (limited) return limited;

    const parsed = aiRewriteSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return validationError(parsed.error);
    }
    const { text, jobTitle } = parsed.data;

    const prompt = `Rewrite this professional summary for a ${jobTitle || "professional"} to be ATS-optimized, action-oriented, and professional. Return ONLY the rewritten text, no quotes or explanations.\n\nOriginal: ${text}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const rewritten = response.text?.trim();
    if (!rewritten) {
      return NextResponse.json({ error: "AI returned an empty response" }, { status: 502 });
    }

    return NextResponse.json({ text: rewritten });
  } catch (error) {
    return internalError("POST /api/ai/rewrite", error);
  }
}
