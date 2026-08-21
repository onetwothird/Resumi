import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import EmployerDashboardClient from "@/components/employer/EmployerDashboardClient";
import { JobListItem } from "@/types/employer";

export default async function EmployerDashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const jobs = await prisma.job.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  const initialJobs: JobListItem[] = jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company,
    location: j.location,
    remote: j.remote,
    employmentType: j.employmentType,
    status: j.status as "draft" | "published",
    updatedAt: j.updatedAt.toISOString(),
    createdAt: j.createdAt.toISOString(),
  }));

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-gray-900">
      <EmployerDashboardClient initialJobs={initialJobs} />
    </div>
  );
}