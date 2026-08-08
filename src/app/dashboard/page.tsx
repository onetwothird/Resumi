// C:\resumi\src\app\dashboard\page.tsx
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { UserButton } from "@clerk/nextjs";
import { Bell, Mail, ChevronDown } from "lucide-react";
import DashboardClient from "@/components/dashboard/DashboardClient";
import { ResumeListItem } from "@/types/dashboard";

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
    <div className="min-h-screen bg-[#F7F9FC] text-gray-900">
      {/* Global Resumi Navigation Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
            <span className="bg-indigo-600 text-white rounded-md p-1 leading-none text-sm">
              T
            </span>{" "}
            Resumi
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/dashboard" className="text-gray-900 font-semibold">
              Dashboard
            </Link>
            <Link href="/resume/new" className="hover:text-gray-900 transition-colors">
              Builder
            </Link>
            <a href="#" className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              Jobs <ChevronDown size={14} />
            </a>
            <a href="#" className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              AI Tools <ChevronDown size={14} />
            </a>
            <a href="#" className="hover:text-gray-900 transition-colors">
              Insights
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors">
            <Bell size={16} />
          </button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors">
            <Mail size={16} />
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <UserButton />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-6 md:p-10">
        <DashboardClient initialResumes={initialResumes} />
      </main>
    </div>
  );
}