"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { UserButton, useUser } from "@clerk/nextjs";
import { 
  Plus, 
  MapPin, 
  Clock, 
  Briefcase, 
  MoreVertical, 
  Edit3, 
  Eye, 
  Trash2,
  Users,
  TrendingUp,
  User,
  FileText
} from "lucide-react";
import { JobListItem, EmployerAnalytics } from "@/types/employer";
import NotificationBell from "@/components/dashboard/NotificationBell";
import InboxDropdown from "@/components/dashboard/InboxDropdown";

interface Props {
  initialJobs: JobListItem[];
  analytics?: EmployerAnalytics;
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

function salaryLabel(job: JobListItem) {
  if (job.salaryMin && job.salaryMax) {
    return `₱${job.salaryMin.toLocaleString()} – ₱${job.salaryMax.toLocaleString()}`;
  }
  if (job.salaryMin) return `From ₱${job.salaryMin.toLocaleString()}`;
  if (job.salaryMax) return `Up to ₱${job.salaryMax.toLocaleString()}`;
  return null;
}

function skillsOf(job: JobListItem): string[] {
  return Array.isArray(job.skills) ? job.skills.filter((s): s is string => typeof s === "string") : [];
}

export default function EmployerDashboardClient({ initialJobs, analytics }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useUser();
  
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const published = initialJobs.filter((j) => j.status === "published");
  const drafts = initialJobs.filter((j) => j.status === "draft");

  useEffect(() => {
    const handleClickOutside = () => setOpenMenuId(null);
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-[#F7F9FC]">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/employer/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon/icons.png" alt="Resumi Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
            <span className="hidden sm:inline">Resumi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link 
              href="/employer/dashboard" 
              className={`transition-colors ${pathname === '/employer/dashboard' ? 'text-gray-900 font-bold' : 'hover:text-gray-900'}`}
            >
              Dashboard
            </Link>
            <Link 
              href="/employer/candidates" 
              className={`transition-colors ${pathname?.includes('/candidates') || pathname?.includes('/applicants') ? 'text-gray-900 font-bold' : 'hover:text-gray-900'}`}
            >
              Candidates
            </Link>
            <Link 
              href="/employer/interviews" 
              className={`transition-colors ${pathname?.includes('/interviews') ? 'text-gray-900 font-bold' : 'hover:text-gray-900'}`}
            >
              Interviews
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:block">
            <NotificationBell />
          </div>
          <div className="hidden sm:block">
            <InboxDropdown />
          </div>
          <div className="flex items-center gap-2 sm:ml-2">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link
                  label="Edit Profile"
                  labelIcon={<User size={15} />}
                  href="/profile"
                />
                <UserButton.Link
                  label="Candidate Dashboard"
                  labelIcon={<FileText size={15} />}
                  href="/dashboard"
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 lg:px-6 py-6 sm:py-8">
        
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Your Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
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

        {/* Analytics Overview Cards */}
        {analytics && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <Briefcase size={16} />
                <span className="text-sm font-medium">Total Jobs</span>
              </div>
              <span className="text-3xl font-extrabold text-gray-900">{analytics.totalJobs}</span>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-gray-500 mb-2">
                <TrendingUp size={16} />
                <span className="text-sm font-medium">Active Roles</span>
              </div>
              <span className="text-3xl font-extrabold text-gray-900">{analytics.activeJobs}</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-indigo-100 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 text-indigo-600 mb-2">
                <Users size={16} />
                <span className="text-sm font-medium">Total Applicants</span>
              </div>
              <span className="text-3xl font-extrabold text-indigo-700">{analytics.totalApplicants}</span>
            </div>
          </div>
        )}

        <h2 className="text-lg font-bold text-gray-900 mb-4">Recent Postings</h2>

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
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {initialJobs.map((job) => {
              const displayImage = job.posterImageUrl || user?.imageUrl;
              const isMenuOpen = openMenuId === job.id;
              const salary = salaryLabel(job);
              const skills = skillsOf(job);

              return (
                <div
                  key={job.id}
                  className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 flex flex-col hover:shadow-md transition-shadow relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    {displayImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={displayImage}
                        alt="Profile"
                        className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-2xl bg-indigo-600 text-white font-bold flex items-center justify-center text-lg shrink-0">
                        {job.company?.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                    
                    <div className="flex flex-col items-end gap-2 relative">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full text-center ${
                            job.status === "published"
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {job.status}
                        </span>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenuId(isMenuOpen ? null : job.id);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-900 rounded-md hover:bg-gray-100 transition-colors"
                        >
                          <MoreVertical size={16} />
                        </button>
                      </div>

                      {isMenuOpen && (
                        <div className="absolute top-8 right-0 w-36 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                          <button 
                            onClick={(e) => { e.stopPropagation(); router.push(`/employer/jobs/${job.id}`); }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                          >
                            <Edit3 size={14} /> Edit Job
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation();  }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 flex items-center gap-2 transition-colors"
                          >
                            <Eye size={14} /> View Public
                          </button>
                          <div className="h-px w-full bg-gray-100 my-1"></div>
                          <button 
                            onClick={(e) => { e.stopPropagation(); /* Add delete logic */ }}
                            className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                          >
                            <Trash2 size={14} /> Delete
                          </button>
                        </div>
                      )}

                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full text-center">
                        {job.employmentType}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-0.5 line-clamp-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-gray-500 mb-4 line-clamp-1">{job.company}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-1">
                    <span className="flex items-center gap-1">
                      <MapPin size={12} /> {job.remote ? "Remote" : job.location || "Location not set"}
                    </span>
                    <span className="flex items-center gap-1" suppressHydrationWarning>
                      <Clock size={12} /> Updated {timeAgo(job.updatedAt)}
                    </span>
                  </div>
                  
                  {/* Highlighted Applicants Count */}
                  <div className="flex items-center gap-1.5 mt-2 text-sm font-semibold text-indigo-600">
                    <Users size={14} />
                    <span>{job.applicantCount || 0} Applicants</span>
                  </div>

                  {salary && (
                    <p className="text-xs font-semibold text-gray-700 mt-2">{salary}</p>
                  )}

                  {skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {skills.slice(0, 4).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-1 rounded-full max-w-full truncate"
                        >
                          {skill}
                        </span>
                      ))}
                      {skills.length > 4 && (
                        <span className="text-[10px] font-semibold text-gray-400 px-1 py-1">
                          +{skills.length - 4} more
                        </span>
                      )}
                    </div>
                  )}

                  <div className="mt-auto" />

                  <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-medium line-clamp-1">
                      Posted by {user?.fullName || "you"}
                    </span>
                    
                    <button 
                      onClick={() => router.push(
                        job.applicantCount > 0 
                          ? `/employer/jobs/${job.id}/applicants` 
                          : `/employer/jobs/${job.id}`
                      )}
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1 group"
                    >
                      {job.applicantCount > 0 ? "Review Applicants" : "Manage Job"} 
                      <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}