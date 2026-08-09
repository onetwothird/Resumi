// Destination: src/app/api/ai/interview-feedback/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface QaPair {
  question: string;
  answer: string;
}

interface FeedbackResult {
  score: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

function parseFeedbackResult(raw: string): FeedbackResult {
  let text = raw.trim();
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (match) text = match[0];

  const parsed = JSON.parse(text);
  if (
    typeof parsed.score !== "number" ||
    !Array.isArray(parsed.strengths) ||
    !Array.isArray(parsed.improvements) ||
    typeof parsed.summary !== "string"
  ) {
    throw new Error("Unexpected AI response shape");
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(parsed.score))),
    strengths: parsed.strengths.slice(0, 4).map(String),
    improvements: parsed.improvements.slice(0, 4).map(String),
    summary: parsed.summary,
  };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const data = await req.json();
    const targetJobTitle: string = (data.targetJobTitle || "the role").trim();
    const qa: QaPair[] = Array.isArray(data.qa) ? data.qa : [];

    if (qa.length === 0) {
      return NextResponse.json({ error: "No answers to review." }, { status: 400 });
    }

    const transcript = qa
      .map(
        (pair, i) =>
          `Q${i + 1}: ${pair.question}\nA${i + 1}: ${pair.answer?.trim() || "(no answer given)"}`
      )
      .join("\n\n");

    const prompt = `Act as a warm but honest interview coach. A candidate just finished a mock interview for the role of "${targetJobTitle}". Here is the transcript:

${transcript}

Evaluate their performance. Consider clarity, structure (e.g. the STAR method for behavioral answers), relevance to the role, and the confidence conveyed through their wording. If an answer is missing or very short, treat that as an area to improve rather than ignoring it.

Return ONLY a raw JSON object with this exact structure (no markdown fences or backticks, just the raw JSON):
{
  "score": 78,
  "strengths": ["Strength 1", "Strength 2"],
  "improvements": ["Improvement 1", "Improvement 2"],
  "summary": "A short 2-3 sentence overall summary of how they did."
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const raw = response.text;
    if (!raw) {
      return NextResponse.json({ error: "AI returned an empty response" }, { status: 502 });
    }

    const result = parseFeedbackResult(raw);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Interview Feedback Error:", error);
    return NextResponse.json({ error: "AI Error" }, { status: 500 });
  }
}