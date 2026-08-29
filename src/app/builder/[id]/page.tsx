import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import BuilderClient from "@/components/resume/BuilderClient";
import { 
  ResumeData, 
  DEFAULT_THEME, 
  ExperienceItem, 
  EducationItem, 
  ResumeTheme, 
  TextBlockStyle 
} from "@/types";

interface SkillMeta {
  skillsText?: string;
  certifications?: string;
  theme?: ResumeTheme;
  blockStyles?: Record<string, TextBlockStyle>;
}

export default async function BuilderPage({ params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;

  let initialData: ResumeData = {
    firstName: "",
    lastName: "",
    jobTitle: "",
    email: "",
    phone: "",
    address: "",
    summary: "",
    experience: [],
    education: [],
    skills: "",
    certifications: "",
    theme: DEFAULT_THEME,
    blockStyles: {},
  };

  if (id !== "new") {
    const existing = await prisma.resume.findUnique({
      where: { id, userId },
    });

    if (!existing) redirect("/dashboard");

    // Fixes the ESLint 'any' errors by casting to proper types
    const metaData = existing.skills ? (existing.skills as SkillMeta) : {};

    initialData = {
      firstName: existing.fullName?.split(" ")[0] || "",
      lastName: existing.fullName?.split(" ").slice(1).join(" ") || "",
      jobTitle: existing.jobTitle || "",
      email: existing.email || "",
      phone: existing.phone || "",
      address: existing.address || "",
      summary: existing.summary || "",
      experience: (existing.experience as unknown as ExperienceItem[]) || [],
      education: (existing.education as unknown as EducationItem[]) || [],
      skills: metaData.skillsText || "",
      certifications: metaData.certifications || "",
      theme: metaData.theme || DEFAULT_THEME,
      blockStyles: metaData.blockStyles || {},
    };
  }

  return <BuilderClient initialData={initialData} resumeId={id} />;
}