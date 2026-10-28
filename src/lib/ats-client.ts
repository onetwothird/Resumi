import type { ExperienceItem, EducationItem } from "@/types";

export interface AtsResult {
  score: number;
  recommendations: string[];
}

/** The resume fields the analyzer reads. Anything else on the object is dropped. */
export interface AtsInput {
  id?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  summary?: string | null;
  skills?: string | null;
  certifications?: string | null;
  experience?: Partial<ExperienceItem>[] | null;
  education?: Partial<EducationItem>[] | null;
}

/**
 * POST /api/ai/analyze, shared by the dashboard card and the editor sidebar.
 *
 * Sends only the fields the analyzer reads. The editor's state also carries
 * the theme, which can hold a base64 profile photo several MB in size.
 * Throws an Error whose message is safe to show the user as-is.
 */
export async function requestAtsAnalysis(resume: AtsInput): Promise<AtsResult> {
  let res: Response;
  try {
    res = await fetch("/api/ai/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        resumeId: resume.id ?? null,
        firstName: resume.firstName ?? null,
        lastName: resume.lastName ?? null,
        jobTitle: resume.jobTitle ?? null,
        summary: resume.summary ?? null,
        skills: resume.skills ?? null,
        certifications: resume.certifications ?? null,
        experience: (resume.experience ?? []).slice(0, 30).map((job) => ({
          company: job.company ?? null,
          role: job.role ?? null,
          date: job.date ?? null,
          description: job.description ?? null,
        })),
        education: (resume.education ?? []).slice(0, 30).map((school) => ({
          school: school.school ?? null,
          degree: school.degree ?? null,
          date: school.date ?? null,
        })),
      }),
    });
  } catch {
    throw new Error("Couldn't reach the ATS analyzer. Check your connection and try again.");
  }

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    if (res.status === 400) {
      throw new Error("Part of this resume is too long to analyze. Shorten the longest section and try again.");
    }
    if (typeof body?.error === "string") throw new Error(body.error);
    throw new Error("The ATS analysis failed. Try again in a moment.");
  }

  if (typeof body?.score !== "number" || !Array.isArray(body?.recommendations)) {
    throw new Error("The ATS analyzer sent back an unexpected result. Try again.");
  }
  return body as AtsResult;
}
