// C:\resumi\src\app\dashboard\page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { ResumeListItem } from "@/types/dashboard";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in"); //[cite: 9]
  }

  const resumes = await prisma.resume.findMany({
    where: { userId }, //[cite: 9]
    orderBy: { updatedAt: "desc" }, //[cite: 9]
  });

  const initialResumes: ResumeListItem[] = resumes.map((r) => ({
    id: r.id,
    title: r.title,
    jobTitle: r.jobTitle,
    summary: r.summary,
    updatedAt: r.updatedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-gray-900">
      <DashboardClient initialResumes={initialResumes} />
    </div>
  );
}