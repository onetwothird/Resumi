import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { FileText } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import DashboardClient from "../../components/dashboard/DashboardClient";
import { ResumeListItem } from "../../types/dashboard";

export default async function DashboardPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in");
  }

  const resumes = await prisma.resume.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b px-8 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
            <FileText className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Resumi
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-gray-500">
            My Dashboard
          </span>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-8 md:p-12">
        <DashboardClient initialResumes={initialResumes} />
      </main>
    </div>
  );
}