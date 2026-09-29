import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { internalError, validationError } from "@/lib/api-response";
import { aiAnalyzeSchema } from "@/lib/validation";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface AtsResult {
  score: number;
  recommendations: string[];
}


function parseAtsResult(raw: string): AtsResult {
  let text = raw.trim();
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (match) text = match[0];

  const parsed = JSON.parse(text);
  if (
    typeof parsed.score !== "number" ||
    !Array.isArray(parsed.recommendations)
  ) {
    throw new Error("Unexpected AI response shape");
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(parsed.score))),
    recommendations: parsed.recommendations.slice(0, 5).map(String),
  };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Billable Gemini call - bound it per user before doing any work.
    const limited = await enforceRateLimit(
      req,
      "ai:analyze",
      userId,
      RATE_LIMITS.ai.limit,
      RATE_LIMITS.ai.windowMs
    );
    if (limited) return limited;

    const parsed = aiAnalyzeSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return validationError(parsed.error);
    }
    const data = parsed.data;

    const prompt = `Act as an Applicant Tracking System (ATS) expert. Analyze the following resume details for the role of ${data.jobTitle || "a professional"}.

Name: ${data.firstName || ""} ${data.lastName || ""}
Summary: ${data.summary}

Provide an ATS compatibility score out of 100 based on keyword optimization, action verbs, and clarity. Then, provide exactly 3 concise, actionable recommendations to improve this score.

Return ONLY a raw JSON object with this exact structure (no markdown fences or backticks, just the raw JSON):
{
  "score": 85,
  "recommendations": ["Tip 1", "Tip 2", "Tip 3"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const raw = response.text;
    if (!raw) {
      return NextResponse.json({ error: "AI returned an empty response" }, { status: 502 });
    }

    const result = parseAtsResult(raw);
    return NextResponse.json(result);
  } catch (error) {
    return internalError("POST /api/ai/analyze", error);
  }
}