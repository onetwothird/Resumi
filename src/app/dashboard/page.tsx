import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import DashboardClient from "@/components/features/dashboard/DashboardClient";
import { ResumeListItem } from "@/types/dashboard";

export default async function DashboardPage() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  // Read the role from the already-verified session token instead of calling
  // the Clerk Backend API on every render. src/proxy.ts reads the same claim.
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

  if (role === "employer") redirect("/employer/dashboard");
  if (role !== "jobseeker") redirect("/onboarding");

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    // Only the fields DashboardClient actually reads. Without this the
    // experience/education/theme/blockStyles JSON blobs were fetched on
    // every dashboard load and immediately discarded by the map below.
    select: {
      id: true,
      title: true,
      jobTitle: true,
      summary: true,
      updatedAt: true,
      createdAt: true,
      completionProgress: true,
    },
  });

  const initialResumes: ResumeListItem[] = resumes.map((r) => ({
    id: r.id,
    title: r.title,
    jobTitle: r.jobTitle,
    summary: r.summary,
    updatedAt: r.updatedAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
    completionProgress: (r.completionProgress as ResumeListItem["completionProgress"]) ?? null,
  }));

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-gray-900">
      <DashboardClient initialResumes={initialResumes} />
    </div>
  );
}