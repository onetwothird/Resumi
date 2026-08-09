// Destination: src/app/api/ai/interview-questions/route.ts
import { NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { auth } from "@clerk/nextjs/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

interface ExperienceInput {
  company?: string;
  role?: string;
  date?: string;
  description?: string;
}

interface QuestionsResult {
  questions: string[];
}

function parseQuestionsResult(raw: string): QuestionsResult {
  let text = raw.trim();
  text = text.replace(/```json/gi, "").replace(/```/g, "").trim();

  const match = text.match(/\{[\s\S]*\}/);
  if (match) text = match[0];

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed.questions)) {
    throw new Error("Unexpected AI response shape");
  }

  const cleaned = parsed.questions
    .map(String)
    .map((q: string) => q.trim())
    .filter((q: string) => q.length > 0)
    .slice(0, 6);

  if (cleaned.length === 0) {
    throw new Error("No questions returned");
  }

  return { questions: cleaned };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const data = await req.json();

    const targetJobTitle: string = (data.targetJobTitle || data.jobTitle || "").trim();
    if (!targetJobTitle) {
      return NextResponse.json(
        { error: "Tell us which job title you're targeting." },
        { status: 400 }
      );
    }

    const summary: string = data.summary || "";
    const skills: string = data.skills || "";
    const experience: ExperienceInput[] = Array.isArray(data.experience) ? data.experience : [];

    const experienceLines = experience
      .slice(0, 5)
      .map(
        (e) =>
          `- ${e.role || "Role"} at ${e.company || "a company"} (${e.date || "dates unknown"}): ${
            e.description || "no description provided"
          }`
      )
      .join("\n");

    const prompt = `Act as an experienced hiring manager about to interview a candidate for the role of "${targetJobTitle}".

Candidate summary: ${summary || "Not provided"}
Candidate skills: ${skills || "Not provided"}
Candidate experience:
${experienceLines || "Not provided"}

Write exactly 5 mock interview questions, in this order:
1. A warm opening question in the spirit of "tell me about yourself," lightly tailored to their background.
2. Two behavioral or competency questions that reference specific details from their experience above and connect them to what the "${targetJobTitle}" role requires.
3. One question that probes a likely gap, transition, or weak spot in their background relative to "${targetJobTitle}".
4. A closing question inviting them to ask questions or share final thoughts.

Keep each question to one or two sentences, natural and conversational, the way a real interviewer would ask it out loud.

Return ONLY a raw JSON object with this exact structure (no markdown fences or backticks, just the raw JSON):
{
  "questions": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    const raw = response.text;
    if (!raw) {
      return NextResponse.json({ error: "AI returned an empty response" }, { status: 502 });
    }

    const result = parseQuestionsResult(raw);
    return NextResponse.json(result);
  } catch (error) {
    console.error("Interview Questions Error:", error);
    return NextResponse.json({ error: "AI Error" }, { status: 500 });
  }
}