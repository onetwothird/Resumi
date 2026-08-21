"use client";

import { useMemo, useState } from "react";
import { motion, Variants } from "framer-motion";
import { Search, MapPin, Users, Briefcase, ArrowUpRight } from "lucide-react";
import PublicHeader from "@/components/marketing/PublicHeader";
import PublicFooter from "@/components/marketing/PublicFooter";

interface Company {
  name: string;
  industry: string;
  location: string;
  size: string;
  openRoles: number;
  blurb: string;
  color: string; 
}

const COMPANIES: Company[] = [
  { name: "Northwind Labs", industry: "Software", location: "Remote", size: "51-200", openRoles: 12, blurb: "Building developer tooling used by teams at every stage of scale.", color: "bg-indigo-600" },
  { name: "Fieldstone Health", industry: "Healthcare", location: "Austin, TX", size: "201-500", openRoles: 7, blurb: "Modernizing patient scheduling and care coordination.", color: "bg-emerald-600" },
  { name: "Ledgerly", industry: "Fintech", location: "New York, NY", size: "11-50", openRoles: 4, blurb: "Accounting software for small businesses that hate accounting software.", color: "bg-amber-600" },
  { name: "Cobalt Robotics Co.", industry: "Manufacturing", location: "Detroit, MI", size: "501-1000", openRoles: 19, blurb: "Warehouse automation hardware and the software that runs it.", color: "bg-slate-700" },
  { name: "Meridian Media", industry: "Media", location: "Remote", size: "11-50", openRoles: 3, blurb: "A small studio producing documentary and branded content.", color: "bg-rose-600" },
  { name: "Sable & Co.", industry: "Retail", location: "Chicago, IL", size: "201-500", openRoles: 9, blurb: "Direct-to-consumer home goods, made to last.", color: "bg-purple-600" },
  { name: "Basecamp Analytics", industry: "Software", location: "Remote", size: "51-200", openRoles: 15, blurb: "Real-time dashboards for operations teams.", color: "bg-blue-600" },
  { name: "Harborview Logistics", industry: "Logistics", location: "Seattle, WA", size: "1000+", openRoles: 22, blurb: "Freight coordination software for regional carriers.", color: "bg-teal-600" },
  { name: "Palette Studio", industry: "Design", location: "Los Angeles, CA", size: "11-50", openRoles: 2, blurb: "A design consultancy for early-stage consumer brands.", color: "bg-orange-600" },
];

const INDUSTRIES = ["All", ...Array.from(new Set(COMPANIES.map((c) => c.industry)))];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

export default function CompaniesPage() {
  const [query, setQuery] = useState("");
  const [industry, setIndustry] = useState("All");

  const filtered = useMemo(() => {
    return COMPANIES.filter((c) => {
      const matchesIndustry = industry === "All" || c.industry === industry;
      const matchesQuery =
        query.trim() === "" ||
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.location.toLowerCase().includes(query.toLowerCase());
      return matchesIndustry && matchesQuery;
    });
  }, [query, industry]);

  const totalOpenRoles = COMPANIES.reduce((sum, c) => sum + c.openRoles, 0);

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
          Browse {COMPANIES.length} companies with {totalOpenRoles} open roles right now, and tailor your resume to what each one is looking for.
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
              placeholder="Search by company or location..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:border-indigo-500 shadow-sm"
            />
          </div>
        </motion.div>

        <div className="flex flex-wrap gap-2 justify-center mt-5">
          {INDUSTRIES.map((ind) => (
            <button
              key={ind}
              onClick={() => setIndustry(ind)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
                industry === ind
                  ? "bg-indigo-600 border-indigo-600 text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
              }`}
            >
              {ind}
            </button>
          ))}
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          {filtered.length === 0 ? (
            <div className="text-center py-20 text-slate-500 text-sm">
              No companies match “{query}”. Try a different search or industry.
            </div>
          ) : (
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
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-11 h-11 rounded-xl ${c.color} text-white font-bold flex items-center justify-center text-sm shrink-0`}>
                      {c.name.charAt(0)}
                    </div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
                      {c.openRoles} open
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{c.name}</h3>
                  <p className="text-sm text-slate-500 leading-relaxed mb-4 flex-1">{c.blurb}</p>

                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-4">
                    <span className="flex items-center gap-1"><MapPin size={12} /> {c.location}</span>
                    <span className="flex items-center gap-1"><Users size={12} /> {c.size}</span>
                  </div>

                  <button className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600 transition-colors">
                    <Briefcase size={14} /> View Jobs <ArrowUpRight size={14} />
                  </button>
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