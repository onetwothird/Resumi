"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Search, MapPin, Briefcase, AlertCircle, Building2,
  ChevronDown, Sparkles,
} from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";
import NotificationBell from "@/components/features/dashboard/NotificationBell";
import InboxDropdown from "@/components/features/dashboard/InboxDropdown";

interface ApiJob {
  id: string;
  title: string;
  company: string;
  location: string | null;
  remote: boolean;
  employmentType: string;
  salaryMin: number | null;
  salaryMax: number | null;
  description: string | null;
  requirements: string | null;
  skills: unknown;
  posterImageUrl: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface CompanyGroup {
  name: string;
  jobs: ApiJob[];
  openRoles: number;
  locations: string[];
  employmentTypes: string[];
  skills: string[];
  logoUrl: string | null;
}

const LOGO_PALETTE = [
  "bg-indigo-600", "bg-emerald-600", "bg-amber-600", "bg-slate-700",
  "bg-rose-600", "bg-purple-600", "bg-blue-600", "bg-teal-600", "bg-orange-600",
];

function logoColorFor(company: string) {
  const hash = company.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return LOGO_PALETTE[hash % LOGO_PALETTE.length];
}

function skillsOf(job: ApiJob): string[] {
  return Array.isArray(job.skills) ? job.skills.filter((s): s is string => typeof s === "string") : [];
}

function groupByCompany(jobs: ApiJob[]): CompanyGroup[] {
  const map = new Map<string, ApiJob[]>();
  for (const job of jobs) {
    const key = job.company.trim();
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(job);
  }

  return Array.from(map.entries())
    .map(([name, companyJobs]) => {
      const locations = Array.from(
        new Set(companyJobs.map((j) => (j.remote ? "Remote" : j.location?.trim() || "Location not set")))
      );
      const employmentTypes = Array.from(new Set(companyJobs.map((j) => j.employmentType)));
      const skills = Array.from(new Set(companyJobs.flatMap(skillsOf))).slice(0, 6);
      const logoUrl = companyJobs.find((j) => j.posterImageUrl)?.posterImageUrl || null;

      return { name, jobs: companyJobs, openRoles: companyJobs.length, locations, employmentTypes, skills, logoUrl };
    })
    .sort((a, b) => b.openRoles - a.openRoles || a.name.localeCompare(b.name));
}

export default function CompaniesClient() {
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [employmentType, setEmploymentType] = useState("All");

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/jobs/public", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load companies");
      const data: ApiJob[] = await res.json();
      setJobs(data);
      setError(null);
    } catch {
      setError("Couldn't load companies. Try again shortly.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const companies = useMemo(() => groupByCompany(jobs), [jobs]);

  const employmentTypeOptions = useMemo(() => {
    return ["All", ...Array.from(new Set(jobs.map((j) => j.employmentType)))];
  }, [jobs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return companies.filter((c) => {
      const matchesType = employmentType === "All" || c.employmentTypes.includes(employmentType);
      const matchesQuery =
        !q ||
        c.name.toLowerCase().includes(q) ||
        c.locations.some((loc) => loc.toLowerCase().includes(q)) ||
        c.skills.some((s) => s.toLowerCase().includes(q));
      return matchesType && matchesQuery;
    });
  }, [companies, query, employmentType]);

  const totalOpenRoles = jobs.length;

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-gray-900 flex flex-col">
      {/* Dashboard Header */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <ResumiLogo className="w-8 h-8" />
            <span className="hidden sm:inline">Resumi</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">
              Home
            </Link>
            <Link href="/dashboard?tab=jobs" className="hover:text-gray-900 transition-colors">
              Jobs
            </Link>
            <Link href="/companies" className="text-gray-900 font-semibold transition-colors">
              Companies
            </Link>
            <Link href="/resume/new" className="flex items-center gap-1 hover:text-gray-900 transition-colors">
              Builder <ChevronDown size={14} />
            </Link>
            <Link href="/dashboard" className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors">
              <Sparkles size={14} className="text-indigo-500" /> AI Coach
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:block"><NotificationBell /></div>
          <div className="hidden sm:block"><InboxDropdown /></div>
          <div className="flex items-center gap-2 sm:ml-2">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link label="Edit Profile" labelIcon={<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} href="/profile" />
                <UserButton.Link label="Settings" labelIcon={<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>} href="/settings" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </header>

      {/* Companies Content */}
      <main className="max-w-7xl mx-auto w-full p-6 md:p-10">
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">Companies</h1>
            <p className="text-sm text-gray-500">
              {isLoading
                ? "Loading companies…"
                : `${companies.length} compan${companies.length === 1 ? "y" : "ies"} with ${totalOpenRoles} open role${totalOpenRoles === 1 ? "" : "s"}`}
            </p>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by company, location, or skill..."
                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
              />
            </div>
            {employmentTypeOptions.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {employmentTypeOptions.map((type) => (
                  <button
                    key={type}
                    onClick={() => setEmploymentType(type)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                      employmentType === type
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : "bg-white border-gray-200 text-gray-600 hover:border-indigo-300"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Loading Skeleton */}
          {isLoading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-gray-200 animate-pulse h-64">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gray-100" />
                    <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  </div>
                  <div className="h-4 w-2/3 bg-gray-100 rounded mb-2" />
                  <div className="h-3 w-full bg-gray-100 rounded mb-1" />
                  <div className="h-3 w-4/5 bg-gray-100 rounded mb-4" />
                  <div className="h-9 w-full bg-gray-100 rounded-xl" />
                </div>
              ))}
            </div>
          )}

          {/* Error State */}
          {!isLoading && error && (
            <div className="bg-white border border-red-100 rounded-2xl p-10 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-1">Something went wrong</p>
              <p className="text-sm text-gray-500 mb-5">{error}</p>
              <button
                onClick={() => fetchJobs()}
                className="inline-flex items-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {/* Empty States */}
          {!isLoading && !error && companies.length === 0 && (
            <div className="bg-white flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-gray-200 shadow-xs">
              <Building2 className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No companies yet</h3>
              <p className="text-sm text-gray-500">No companies have published roles yet. Check back soon.</p>
            </div>
          )}

          {!isLoading && !error && companies.length > 0 && filtered.length === 0 && (
            <div className="bg-white flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-gray-200 shadow-xs">
              <Building2 className="w-10 h-10 text-gray-300 mb-3" />
              <h3 className="text-base font-semibold text-gray-900 mb-1">No matches</h3>
              <p className="text-sm text-gray-500">No companies match &quot;{query}&quot;. Try a different search.</p>
              <button onClick={() => { setQuery(""); setEmploymentType("All"); }} className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-700">
                Clear filters
              </button>
            </div>
          )}

          {/* Company Grid */}
          {!isLoading && !error && filtered.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filtered.map((c) => (
                <div
                  key={c.name}
                  className="group bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col h-80"
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logoUrl}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-gray-100"
                      />
                    ) : (
                      <div className={`w-11 h-11 rounded-xl ${logoColorFor(c.name)} text-white font-bold flex items-center justify-center text-sm shrink-0`}>
                        {c.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full shrink-0">
                      {c.openRoles} open
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-1">{c.name}</h3>

                  <p className="text-xs text-gray-500 leading-relaxed mb-3 flex-1 line-clamp-3">
                    Hiring for{" "}
                    {c.jobs.slice(0, 2).map((j) => j.title).join(", ")}
                    {c.jobs.length > 2 ? `, +${c.jobs.length - 2} more` : ""}.
                  </p>

                  {c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {c.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full truncate max-w-full"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-3">
                    <MapPin size={12} className="shrink-0" />
                    <span className="truncate">
                      {c.locations[0]}
                      {c.locations.length > 1 ? ` +${c.locations.length - 1}` : ""}
                    </span>
                  </div>

                  <Link
                    href={`/dashboard?tab=jobs&company=${encodeURIComponent(c.name)}`}
                    className="w-full flex items-center justify-center gap-2 bg-white hover:bg-indigo-600 text-indigo-600 hover:text-white font-bold py-2.5 rounded-xl border-2 border-indigo-600 transition-all duration-200 text-sm"
                  >
                    <Briefcase size={15} /> View Jobs
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
