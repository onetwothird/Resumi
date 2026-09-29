// C:\resumi\src\app\employer\dashboard\page.tsx

import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import EmployerDashboardClient from "@/components/features/employer/EmployerDashboardClient";
import prisma from "@/lib/prisma"; 
import { JobListItem, EmployerAnalytics } from "@/types/employer";

export default async function EmployerDashboardPage() {
  const { userId, sessionClaims } = await auth();
  if (!userId) redirect("/sign-in");

  // Read the role from the already-verified session token instead of calling
  // the Clerk Backend API on every render. src/proxy.ts reads the same claim.
  const role = (sessionClaims?.metadata as { role?: string } | undefined)?.role;

  if (role === "jobseeker") redirect("/dashboard");
  if (role !== "employer") redirect("/onboarding");

  const rows = await prisma.job.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      _count: {
        select: { applications: true }
      }
    }
  });

  const analytics: EmployerAnalytics = {
    totalJobs: rows.length,
    activeJobs: rows.filter((j) => j.status === "published").length,
    totalApplicants: rows.reduce((acc, job) => acc + job._count.applications, 0),
  };

  const jobs: JobListItem[] = rows.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    status: j.status as JobListItem["status"],
    remote: j.remote,
    location: j.location ?? null,
    employmentType: j.employmentType as JobListItem["employmentType"],
    posterImageUrl: j.posterImageUrl ?? null,
    salaryMin: j.salaryMin ?? null,
    salaryMax: j.salaryMax ?? null,
    skills: j.skills ?? [],
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
    applicantCount: j._count.applications,
  }));

  return <EmployerDashboardClient initialJobs={jobs} analytics={analytics} />;
}