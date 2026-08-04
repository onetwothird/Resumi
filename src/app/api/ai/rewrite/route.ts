import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@clerk/nextjs/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { text, jobTitle } = await req.json();
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Rewrite this professional summary for a ${jobTitle} to be ATS-optimized, action-oriented, and professional. Return ONLY the rewritten text, no quotes or explanations.\n\nOriginal: ${text}`;
    
    const result = await model.generateContent(prompt);
    return NextResponse.json({ text: result.response.text().trim() });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    return new NextResponse("AI Error", { status: 500 });
  }
}