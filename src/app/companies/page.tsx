"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Search,
  MapPin,
  Briefcase,
  ArrowUpRight,
  AlertCircle,
  Building2,
} from "lucide-react";
import PublicHeader from "@/components/marketing/PublicHeader";
import PublicFooter from "@/components/marketing/PublicFooter";

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
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-amber-600",
  "bg-slate-700",
  "bg-rose-600",
  "bg-purple-600",
  "bg-blue-600",
  "bg-teal-600",
  "bg-orange-600",
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

      return {
        name,
        jobs: companyJobs,
        openRoles: companyJobs.length,
        locations,
        employmentTypes,
        skills,
        logoUrl,
      };
    })
    .sort((a, b) => b.openRoles - a.openRoles || a.name.localeCompare(b.name));
}

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function CompaniesPage() {
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900">
      <PublicHeader active="/companies" />

      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-14 md:pt-24 md:pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-3xl md:text-5xl font-extrabold tracking-tight mb-4 max-w-3xl mx-auto leading-[1.15]"
        >
          Discover companies that are hiring
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-sm md:text-base text-slate-500 max-w-xl mx-auto mb-8"
        >
          {isLoading
            ? "Loading companies…"
            : `Browse ${companies.length} compan${companies.length === 1 ? "y" : "ies"} with ${totalOpenRoles} open role${totalOpenRoles === 1 ? "" : "s"} right now, and tailor your resume to what each one is looking for.`}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto"
        >
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by company, location, or skill..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
        </motion.div>

        {employmentTypeOptions.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center mt-5">
            {employmentTypeOptions.map((type) => (
              <button
                key={type}
                onClick={() => setEmploymentType(type)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                  employmentType === type
                    ? "bg-indigo-600 border-indigo-600 text-white"
                    : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {isLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-6 rounded-2xl bg-white border border-slate-200/60 animate-pulse">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-11 h-11 rounded-xl bg-slate-100" />
                    <div className="h-5 w-16 bg-slate-100 rounded-full" />
                  </div>
                  <div className="h-4 w-2/3 bg-slate-100 rounded mb-2" />
                  <div className="h-3 w-full bg-slate-100 rounded mb-1" />
                  <div className="h-3 w-4/5 bg-slate-100 rounded mb-4" />
                  <div className="h-9 w-full bg-slate-100 rounded-xl" />
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

          {!isLoading && !error && companies.length === 0 && (
            <div className="text-center py-20 text-slate-500 text-sm">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-3" />
              No companies have published roles yet. Check back soon.
            </div>
          )}

          {!isLoading && !error && companies.length > 0 && filtered.length === 0 && (
            <div className="text-center py-20 text-slate-500 text-sm">
              No companies match “{query}”. Try a different search or filter.
            </div>
          )}

          {!isLoading && !error && filtered.length > 0 && (
            <motion.div
              initial="hidden"
              animate="visible"
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((c) => (
                <motion.div
                  key={c.name}
                  variants={fadeUp}
                  className="group p-6 rounded-2xl bg-white border border-slate-200/60 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col"
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.logoUrl}
                        alt=""
                        className="w-11 h-11 rounded-xl object-cover shrink-0 border border-slate-100"
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

                  <h3 className="text-base font-bold text-slate-900 mb-1 wrap-break-word">{c.name}</h3>

                  <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1 wrap-break-word">
                    Hiring for{" "}
                    {c.jobs
                      .slice(0, 2)
                      .map((j) => j.title)
                      .join(", ")}
                    {c.jobs.length > 2 ? `, +${c.jobs.length - 2} more` : ""}.
                  </p>

                  {c.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {c.skills.slice(0, 3).map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-1 rounded-full max-w-full truncate"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1 min-w-0">
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">
                        {c.locations[0]}
                        {c.locations.length > 1 ? ` +${c.locations.length - 1}` : ""}
                      </span>
                    </span>
                  </div>

                  <Link
                    href={`/jobs?company=${encodeURIComponent(c.name)}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors"
                  >
                    <Briefcase size={14} /> View Jobs <ArrowUpRight size={14} />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}