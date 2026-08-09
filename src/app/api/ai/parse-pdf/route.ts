import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file || file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a valid PDF file." }, { status: 400 });
    }

    // 1. Convert the file to a base64 string
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Data = buffer.toString("base64");

    const prompt = `Act as an expert resume parser. Read the attached PDF resume and map it to the requested JSON structure. Keep descriptions concise.`;

    // 2. Pass the PDF directly to Gemini as inline data alongside a strict JSON schema
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        prompt,
        {
          inlineData: {
            data: base64Data,
            mimeType: "application/pdf",
          },
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            jobTitle: { type: "STRING", description: "The most recent or primary job title" },
            summary: { type: "STRING", description: "A 2-3 sentence professional summary" },
            skills: { type: "STRING", description: "A comma-separated list of core skills" },
            experience: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  company: { type: "STRING" },
                  role: { type: "STRING" },
                  date: { type: "STRING" },
                  description: { type: "STRING" },
                },
              },
            },
          },
        },
      },
    });

    if (!response.text) throw new Error("Empty AI response");

    // 3. Gemini guarantees standard JSON matching your schema; no regex required!
    const parsedResume = JSON.parse(response.text);

    return NextResponse.json(parsedResume);
  } catch (error) {
    console.error("PDF Parsing Error:", error);
    return NextResponse.json({ error: "Failed to process the PDF." }, { status: 500 });
  }
}