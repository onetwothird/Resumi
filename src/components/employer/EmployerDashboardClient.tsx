"use client";

import { useRouter } from "next/navigation";
import { Bell, Mail, Plus, MapPin, Clock, Briefcase } from "lucide-react";
import ResumiLogo from "@/components/logo/ResumiLogo";
import { JobListItem } from "@/types/employer";

interface Props {
  initialJobs: JobListItem[];
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

export default function EmployerDashboardClient({ initialJobs }: Props) {
  const router = useRouter();
  const published = initialJobs.filter((j) => j.status === "published");
  const drafts = initialJobs.filter((j) => j.status === "draft");

  return (
    <div className="flex flex-col min-h-screen">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0">
        <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
          <ResumiLogo className="w-8 h-8" />
          <span className="hidden sm:inline">Resumi</span>
          <span className="hidden sm:inline text-xs font-semibold text-slate-400 border border-slate-200 rounded-full px-2 py-0.5 ml-1">
            Employer
          </span>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <button className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors">
            <Bell size={16} />
          </button>
          <button className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors">
            <Mail size={16} />
          </button>
          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs shrink-0">
            E
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 lg:px-6 py-6 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Job Posts</h1>
            <p className="text-sm text-gray-500">
              {published.length} published &middot; {drafts.length} draft{drafts.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={() => router.push("/employer/post-job")}
            className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl shadow-sm hover:bg-indigo-700 transition-colors w-full sm:w-auto"
          >
            <Plus size={16} /> Post a Job
          </button>
        </div>

        {initialJobs.length === 0 ? (
          <div className="text-center py-16 sm:py-24 bg-white border border-dashed border-gray-200 rounded-2xl px-4">
            <Briefcase className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm font-semibold text-gray-700 mb-1">No jobs posted yet</p>
            <p className="text-sm text-gray-400 mb-5">Post your first role to start matching with candidates.</p>
            <button
              onClick={() => router.push("/employer/post-job")}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors w-full sm:w-auto"
            >
              <Plus size={16} /> Post a Job
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {initialJobs.map((job) => (
              <div
                key={job.id}
                className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-bold text-gray-900">{job.title}</h3>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        job.status === "published"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {job.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                    <span>{job.company}</span>
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {job.remote ? "Remote" : job.location || "—"}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Updated {timeAgo(job.updatedAt)}
                    </span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 self-start sm:self-center">
                  {job.employmentType}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}