/**
 * Calculates the completion progress of a resume based on filled sections.
 *
 * Sections and weights:
 *   Personal Details (name, jobTitle, email, phone) – 40%
 *   Summary                                                    – 15%
 *   Experience (≥1 entry with company + role filled)           – 20%
 *   Education (≥1 entry with school + degree filled)           – 10%
 *   Skills                                                     – 10%
 *   Certifications                                              –  5%
 */

export interface ResumeProgress {
  /** 0-100 overall percentage */
  percentage: number;
  /** Per-section completion flags */
  sections: {
    personal: boolean;
    summary: boolean;
    experience: boolean;
    education: boolean;
    skills: boolean;
    certifications: boolean;
  };
}

export interface ProgressInput {
  firstName?: string | null;
  lastName?: string | null;
  jobTitle?: string | null;
  email?: string | null;
  phone?: string | null;
  summary?: string | null;
  experience?: unknown;
  education?: unknown;
  skills?: string | null;
  certifications?: string | null;
}

export function calculateResumeProgress(data: ProgressInput): ResumeProgress {
  try {
    const personal =
      Boolean(data.firstName?.trim()) ||
      Boolean(data.lastName?.trim()) ||
      Boolean(data.jobTitle?.trim()) ||
      Boolean(data.email?.trim()) ||
      Boolean(data.phone?.trim());

    const summary = Boolean(data.summary?.trim());

    const experienceList = Array.isArray(data.experience) ? data.experience : [];
    const experience =
      experienceList.length > 0 &&
      experienceList.some((item) => {
        if (!item || typeof item !== "object") return false;
        const exp = item as Record<string, unknown>;
        return Boolean(typeof exp.company === "string" && exp.company.trim()) ||
               Boolean(typeof exp.role === "string" && exp.role.trim());
      });

    const educationList = Array.isArray(data.education) ? data.education : [];
    const education =
      educationList.length > 0 &&
      educationList.some((item) => {
        if (!item || typeof item !== "object") return false;
        const edu = item as Record<string, unknown>;
        return Boolean(typeof edu.school === "string" && edu.school.trim()) ||
               Boolean(typeof edu.degree === "string" && edu.degree.trim());
      });

    const skills = Boolean(typeof data.skills === "string" && data.skills.trim());
    const certifications = Boolean(typeof data.certifications === "string" && data.certifications.trim());

    const sections = { personal, summary, experience, education, skills, certifications };

    // Weighted calculation
    const percentage =
      (personal ? 40 : 0) +
      (summary ? 15 : 0) +
      (experience ? 20 : 0) +
      (education ? 10 : 0) +
      (skills ? 10 : 0) +
      (certifications ? 5 : 0);

    return { percentage, sections };
  } catch {
    // Never let progress calculation crash a save — return 0% on error
    return {
      percentage: 0,
      sections: {
        personal: false,
        summary: false,
        experience: false,
        education: false,
        skills: false,
        certifications: false,
      },
    };
  }
}
