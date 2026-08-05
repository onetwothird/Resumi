import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { Plus, FileText, Calendar } from "lucide-react";
import { UserButton } from "@clerk/nextjs";

export default async function DashboardPage() {
  // 1. Get the current logged-in user from Clerk
  const { userId } = await auth();

  // 2. Protect the route (Redirect to login if not authenticated)
  if (!userId) {
    redirect("/sign-in");
  }

  // 3. Fetch all resumes belonging to this user from Neon DB
  const resumes = await prisma.resume.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      updatedAt: "desc", // Show the most recently edited resumes first
    },
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Dashboard Top Navigation */}
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
          <span className="text-sm font-medium text-gray-500">My Dashboard</span>
          <div className="h-6 w-px bg-gray-200 dark:bg-gray-700"></div>
          <UserButton />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto p-8 md:p-12">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              My Resumes
            </h2>
            <p className="text-gray-500">
              Manage, edit, and export your tailored resumes.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          
          {/* 1. Create New Resume Card */}
          <Link
            href="/resume/new"
            className="group flex flex-col items-center justify-center h-80 bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-dashed border-indigo-300 dark:border-indigo-800 rounded-2xl hover:bg-indigo-50 dark:hover:bg-indigo-900/40 hover:border-indigo-500 transition-all duration-300 cursor-pointer"
          >
            <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white mb-4 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-200 transition-all duration-300">
              <Plus size={28} strokeWidth={2.5} />
            </div>
            <p className="font-semibold text-indigo-700 dark:text-indigo-400 text-lg">
              Create New Resume
            </p>
            <p className="text-sm text-indigo-400 dark:text-indigo-600 mt-1">
              Start from scratch
            </p>
          </Link>

          {/* 2. Map through existing resumes */}
          {resumes.map((resume) => (
            <Link
              key={resume.id}
              href={`/resume/${resume.id}`}
              className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl h-80 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative"
            >
              <div>
                {/* Card Icon */}
                <div className="bg-gray-100 dark:bg-gray-800 w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 mb-5 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                  <FileText size={24} />
                </div>
                
                {/* Title & Job Target */}
                <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-1">
                  {resume.title !== "My Resume" ? resume.title : (resume.jobTitle || "Untitled Resume")}
                </h3>
                
                {/* Snippet / Summary */}
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
                  {resume.summary || "No professional summary added yet. Click to edit and generate one with AI."}
                </p>
              </div>

              {/* Footer details (Date modified) */}
              <div className="flex items-center justify-between text-xs font-medium text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-5 mt-4">
                <div className="flex items-center gap-1.5">
                  <Calendar size={14} />
                  <span>
                    Edited {new Date(resume.updatedAt).toLocaleDateString(undefined, { 
                      month: 'short', 
                      day: 'numeric', 
                      year: 'numeric' 
                    })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}