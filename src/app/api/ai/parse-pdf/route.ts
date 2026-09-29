import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
import { internalError } from "@/lib/api-response";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

/** Gemini's inline-data limit is 20MB; stay well under it. */
const MAX_PDF_BYTES = 10 * 1024 * 1024;
/** Slack the multipart envelope by 1MB so a legal PDF is never rejected. */
const MAX_UPLOAD_BYTES = MAX_PDF_BYTES + 1024 * 1024;

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    // Most expensive endpoint in the app: a full PDF upload per call. Tighter
    // budget than the text endpoints and a longer window.
    const limited = await enforceRateLimit(
      req,
      "ai:parse-pdf",
      userId,
      RATE_LIMITS.aiPdf.limit,
      RATE_LIMITS.aiPdf.windowMs
    );
    if (limited) return limited;

    // Check Content-Length before buffering the body, so an oversized upload
    // is rejected without being read into memory. Vercel sets this.
    const declaredLength = Number(req.headers.get("content-length") ?? 0);
    if (declaredLength > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "PDF is too large. Maximum size is 10 MB." },
        { status: 413 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Please upload a valid PDF file." }, { status: 400 });
    }

    if (file.size > MAX_PDF_BYTES) {
      return NextResponse.json(
        { error: "PDF is too large. Maximum size is 10 MB." },
        { status: 413 }
      );
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Please upload a valid PDF file." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // file.type comes straight from the client and means nothing. Confirm the
    // bytes really are a PDF before spending a Gemini call on them.
    if (buffer.length < 5 || buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      return NextResponse.json(
        { error: "That file is not a valid PDF." },
        { status: 400 }
      );
    }

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
    return internalError("POST /api/ai/parse-pdf", error);
  }
}
