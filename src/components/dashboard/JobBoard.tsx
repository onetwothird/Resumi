"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Search,
  MapPin,
  Briefcase,
  Wallet,
  ExternalLink,
  Bookmark,
  Clock,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  Inbox,
  X,
} from "lucide-react";

type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Internship";
type SortOption = "newest" | "salaryHigh" | "salaryLow";

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

const JOB_TYPES: EmploymentType[] = ["Full-time", "Part-time", "Contract", "Internship"];
const WORK_MODELS = ["Remote", "Hybrid", "On-site"] as const;
type WorkModel = (typeof WORK_MODELS)[number];

const LOGO_PALETTE = [
  "bg-blue-50 text-blue-600 border border-blue-100",
  "bg-purple-50 text-purple-600 border border-purple-100",
  "bg-emerald-50 text-emerald-600 border border-emerald-100",
  "bg-rose-50 text-rose-600 border border-rose-100",
  "bg-amber-50 text-amber-600 border border-amber-100",
  "bg-indigo-50 text-indigo-600 border border-indigo-100",
];

function logoColorFor(company: string) {
  const hash = company.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return LOGO_PALETTE[hash % LOGO_PALETTE.length];
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.round(days / 7);
  return `${weeks}w ago`;
}

function salaryLabel(job: ApiJob) {
  if (job.salaryMin && job.salaryMax) {
    return `₱${job.salaryMin.toLocaleString()} - ₱${job.salaryMax.toLocaleString()} / yr`;
  }
  if (job.salaryMin) return `From ₱${job.salaryMin.toLocaleString()} / yr`;
  if (job.salaryMax) return `Up to ₱${job.salaryMax.toLocaleString()} / yr`;
  return null;
}

function skillsOf(job: ApiJob): string[] {
  return Array.isArray(job.skills) ? job.skills.filter((s): s is string => typeof s === "string") : [];
}

function workModelOf(job: ApiJob): WorkModel {
  if (job.remote) return "Remote";
  if (job.location?.toLowerCase().includes("hybrid")) return "Hybrid";
  return "On-site";
}

const POLL_INTERVAL_MS = 30_000;

export default function JobBoard() {
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<ApiJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState(() => searchParams.get("company") || searchParams.get("q") || "");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(new Set());
  const [selectedModels, setSelectedModels] = useState<Set<WorkModel>>(new Set());
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const fetchJobs = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setIsLoading(true);
    try {
      const res = await fetch("/api/jobs/public", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load jobs");
      const data: ApiJob[] = await res.json();
      setJobs(data);
      setError(null);
    } catch {
      setError("Couldn't load job listings. Pull to refresh or try again shortly.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load, then poll quietly + refetch whenever the tab regains focus,
  // so a job an employer just published shows up here without a hard reload.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchJobs();
    const interval = setInterval(() => fetchJobs({ silent: true }), POLL_INTERVAL_MS);
    const onFocus = () => fetchJobs({ silent: true });
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [fetchJobs]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  const toggleModel = (model: WorkModel) => {
    setSelectedModels((prev) => {
      const next = new Set(prev);
      if (next.has(model)) {
        next.delete(model);
      } else {
        next.add(model);
      }
      return next;
    });
  };

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    const locQ = locationQuery.trim().toLowerCase();

    let result = jobs.filter((job) => {
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        skillsOf(job).some((s) => s.toLowerCase().includes(q));

      const matchesLocation =
        !locQ ||
        (job.remote && "remote".includes(locQ)) ||
        (job.location ?? "").toLowerCase().includes(locQ);

      const matchesType = selectedTypes.size === 0 || selectedTypes.has(job.employmentType);
      const matchesModel = selectedModels.size === 0 || selectedModels.has(workModelOf(job));

      return matchesQuery && matchesLocation && matchesType && matchesModel;
    });

    result = [...result].sort((a, b) => {
      if (sortBy === "salaryHigh") return (b.salaryMax ?? b.salaryMin ?? 0) - (a.salaryMax ?? a.salaryMin ?? 0);
      if (sortBy === "salaryLow") return (a.salaryMin ?? a.salaryMax ?? 0) - (b.salaryMin ?? b.salaryMax ?? 0);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [jobs, search, locationQuery, selectedTypes, selectedModels, sortBy]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-6xl mx-auto">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Job Matches
          </h1>
          <p className="text-slate-500 font-medium">
            Browse roles employers have posted, updated in real time.
          </p>
        </div>
      </div>

      <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center gap-2 mb-10 transition-shadow focus-within:shadow-md focus-within:border-indigo-300">
        <div className="relative flex-1 w-full flex items-center">
          <Search className="absolute left-4 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search by job title, skill, or company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <div className="hidden md:block w-px h-8 bg-slate-200 mx-2"></div>

        <div className="relative flex-1 w-full items-center hidden md:flex">
          <MapPin className="absolute left-4 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Location or 'Remote'"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <button
          onClick={() => fetchJobs()}
          className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap"
        >
          Search
        </button>
      </div>

      <button
        onClick={() => setFiltersOpen((v) => !v)}
        className="w-full flex lg:hidden items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 mb-4 font-semibold text-slate-900"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" /> Filters
          {(selectedTypes.size + selectedModels.size) > 0 && (
            <span className="bg-indigo-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
              {selectedTypes.size + selectedModels.size}
            </span>
          )}
        </span>
        {filtersOpen ? <X className="w-4 h-4 text-slate-400" /> : <span className="text-xs text-slate-400">Show</span>}
      </button>

      <div className="flex flex-col lg:flex-row gap-10">
        <aside className={`w-full lg:w-56 shrink-0 ${filtersOpen ? "block" : "hidden"} lg:block`}>
          <div className="lg:sticky lg:top-24 bg-white lg:bg-transparent p-5 lg:p-0 rounded-2xl lg:rounded-none border lg:border-none border-slate-200/80 shadow-sm lg:shadow-none mb-4 lg:mb-0">
            <div className="hidden lg:flex items-center gap-2 font-bold text-slate-900 mb-6">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Job Type</h3>
                <div className="space-y-3">
                  {JOB_TYPES.map((type) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedTypes.has(type)}
                          onChange={() => toggleType(type)}
                          className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-colors cursor-pointer"
                        />
                        <CheckIcon className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Work Model</h3>
                <div className="space-y-3">
                  {WORK_MODELS.map((model) => (
                    <label key={model} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedModels.has(model)}
                          onChange={() => toggleModel(model)}
                          className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-colors cursor-pointer"
                        />
                        <CheckIcon className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">{model}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </aside>

        <div className="flex-1 space-y-5">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-slate-500">
              {isLoading ? "Loading jobs…" : `Showing ${filteredJobs.length} job${filteredJobs.length === 1 ? "" : "s"}`}
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
            >
              <option value="newest">Sort by: Newest</option>
              <option value="salaryHigh">Sort by: Highest Salary</option>
              <option value="salaryLow">Sort by: Lowest Salary</option>
            </select>
          </div>

          {isLoading && (
            <div className="space-y-5">
              {[0, 1, 2].map((i) => (
                <div key={i} className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 animate-pulse flex gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-slate-100 shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-4 w-1/3 bg-slate-100 rounded" />
                    <div className="h-3 w-1/4 bg-slate-100 rounded" />
                    <div className="h-3 w-2/3 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className="bg-white border border-red-100 rounded-2xl p-10 text-center">
              <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">Something went wrong</p>
              <p className="text-sm text-slate-500 mb-5">{error}</p>
              <button
                onClick={() => fetchJobs()}
                className="inline-flex items-center gap-2 text-sm font-semibold bg-slate-900 text-white px-5 py-2.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && jobs.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-14 text-center">
              <Inbox className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">No jobs posted yet</p>
              <p className="text-sm text-slate-500">Check back soon — new roles will show up here as employers publish them.</p>
            </div>
          )}

          {!isLoading && !error && jobs.length > 0 && filteredJobs.length === 0 && (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-14 text-center">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 mb-1">No jobs match your filters</p>
              <p className="text-sm text-slate-500">Try clearing a filter or searching different terms.</p>
            </div>
          )}

          {!isLoading &&
            !error &&
            filteredJobs.map((job) => {
              const skills = skillsOf(job);
              const salary = salaryLabel(job);
              return (
                <div
                  key={job.id}
                  className="group bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col md:flex-row gap-6 relative"
                >
                  {job.posterImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.posterImageUrl}
                      alt=""
                      className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-slate-100"
                    />
                  ) : (
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${logoColorFor(job.company)}`}>
                      {job.company.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2 gap-3">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer mb-1 wrap-break-word">
                          {job.title}
                        </h3>
                        <p className="text-sm font-medium text-slate-500 wrap-break-word">{job.company}</p>
                      </div>

                      <button className="text-slate-300 hover:text-indigo-500 transition-colors p-1 shrink-0">
                        <Bookmark className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 mb-5 mt-4">
                      <span className="flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-slate-400" /> {job.remote ? "Remote" : job.location || "Location not specified"}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Briefcase className="w-4 h-4 text-slate-400" /> {job.employmentType}
                      </span>
                      {salary && (
                        <span className="flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-slate-400" /> {salary}
                        </span>
                      )}
                      <span className="flex items-center gap-1.5" suppressHydrationWarning>
                        <Clock className="w-4 h-4 text-slate-400" /> {timeAgo(job.createdAt)}
                      </span>
                    </div>

                    {skills.length > 0 && (
                      <div className="flex flex-wrap items-center gap-2">
                        {skills.map((tag) => (
                          <span key={tag} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-semibold max-w-full truncate">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-end shrink-0 pt-4 md:pt-0 mt-4 md:mt-0 border-t md:border-t-0 border-slate-100">
                    <Link 
                      href={`/jobs/${job.id}`}
                      className="w-full md:w-auto flex justify-center items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold py-2.5 px-6 rounded-xl transition-colors"
                    >
                      Apply <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}

          {isLoading && jobs.length > 0 && (
            <div className="flex justify-center py-4 text-slate-400 text-xs gap-2 items-center">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Refreshing…
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CheckIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}