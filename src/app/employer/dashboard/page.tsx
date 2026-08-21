import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import EmployerDashboardClient from "@/components/employer/EmployerDashboardClient";
import prisma from "@/lib/prisma"; 
import type { Job } from "@prisma/client";
import { JobListItem } from "@/types/employer";

export default async function EmployerDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const role = clerkUser.publicMetadata?.role as "employer" | "jobseeker" | undefined;

  if (role === "jobseeker") redirect("/dashboard");
  if (role !== "employer") redirect("/onboarding");

  const rows = await prisma.job.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  const jobs: JobListItem[] = rows.map((j: Job) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    status: j.status as JobListItem["status"],
    remote: j.remote,
    location: j.location ?? null,
    employmentType: j.employmentType as JobListItem["employmentType"],
    createdAt: j.createdAt.toISOString(),
    updatedAt: j.updatedAt.toISOString(),
  }));

  return <EmployerDashboardClient initialJobs={jobs} />;
}