import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";

// Reused across invocations (Next.js keeps the module warm between requests)
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { text, jobTitle } = await req.json();

    if (!text || !text.trim()) {
      return NextResponse.json(
        { error: "Add a summary before rewriting it." },
        { status: 400 }
      );
    }

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
    console.error("Rewrite Error:", error);
    return NextResponse.json({ error: "AI Error" }, { status: 500 });
  }
}