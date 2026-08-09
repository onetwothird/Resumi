"use client";

import { useState } from "react";
import { Search, MapPin, Briefcase, DollarSign, ExternalLink, Bookmark, Clock, SlidersHorizontal, Sparkles } from "lucide-react";

const MOCK_JOBS = [
  {
    id: "1",
    title: "Junior Mobile Developer (Flutter)",
    company: "TechNova Solutions",
    location: "Manila (Hybrid) • Commutable",
    salary: "₱40,000 - ₱60,000 / mo",
    type: "Entry-level",
    posted: "2 hours ago",
    match: "96%",
    tags: ["Flutter", "Dart", "Firebase", "State Management"],
    logo: "T",
    logoColor: "bg-blue-50 text-blue-600 border border-blue-100"
  },
  {
    id: "2",
    title: "Computer Vision / AI Researcher",
    company: "Visionary Labs",
    location: "Remote (Philippines)",
    salary: "₱70,000 - ₱90,000 / mo",
    type: "Contract",
    posted: "1 day ago",
    match: "88%",
    tags: ["Python", "YOLO", "TensorFlow Lite", "Dataset Annotation"],
    logo: "V",
    logoColor: "bg-purple-50 text-purple-600 border border-purple-100"
  },
  {
    id: "3",
    title: "Frontend Web Engineer",
    company: "CloudScale Inc.",
    location: "Makati City (On-site)",
    salary: "₱50,000 - ₱80,000 / mo",
    type: "Full-time",
    posted: "3 days ago",
    match: "91%",
    tags: ["React.js", "Next.js", "Tailwind CSS", "API Integration"],
    logo: "C",
    logoColor: "bg-emerald-50 text-emerald-600 border border-emerald-100"
  },
  {
    id: "4",
    title: "Backend Systems Developer",
    company: "FinTech Global",
    location: "BGC, Taguig (Hybrid)",
    salary: "₱60,000 - ₱100,000 / mo",
    type: "Full-time",
    posted: "1 week ago",
    match: "76%",
    tags: ["Node.js", "Firebase Admin", "NoSQL", "Authentication"],
    logo: "F",
    logoColor: "bg-rose-50 text-rose-600 border border-rose-100"
  }
];

export default function JobBoard() {
  const [search, setSearch] = useState("");

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out max-w-6xl mx-auto">
      
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Job Matches
          </h1>
          <p className="text-slate-500 font-medium">
            Discover roles curated for your skills and experience.
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
            className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-sm font-medium text-slate-900 placeholder:text-slate-400"
          />
        </div>

        <button className="w-full md:w-auto bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-8 rounded-xl transition-all shadow-sm active:scale-95 whitespace-nowrap">
          Search
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        
        <aside className="w-full lg:w-56 shrink-0">
          <div className="sticky top-24">
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-6">
              <SlidersHorizontal className="w-4 h-4" /> Filters
            </div>

            <div className="space-y-8">
              <div>
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">Job Type</h3>
                <div className="space-y-3">
                  {["Full-time", "Part-time", "Contract", "Internship"].map((type, i) => (
                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" defaultChecked={i === 0} className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-colors cursor-pointer" />
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
                  {["Remote", "Hybrid", "On-site"].map((model) => (
                    <label key={model} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input type="checkbox" className="peer appearance-none w-4 h-4 rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-colors cursor-pointer" />
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
            <span className="text-sm font-medium text-slate-500">Showing {MOCK_JOBS.length} recommended jobs</span>
            <select className="bg-transparent text-sm font-semibold text-slate-700 outline-none cursor-pointer hover:text-indigo-600 transition-colors">
              <option>Sort by: Best Match</option>
              <option>Sort by: Newest</option>
              <option>Sort by: Highest Salary</option>
            </select>
          </div>

          {MOCK_JOBS.map((job) => (
            <div 
              key={job.id} 
              className="group bg-white p-6 md:p-8 rounded-3xl border border-slate-200/60 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col md:flex-row gap-6 relative"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 ${job.logoColor}`}>
                {job.logo}
              </div>

              <div className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors cursor-pointer mb-1">
                      {job.title}
                    </h3>
                    <p className="text-sm font-medium text-slate-500">{job.company}</p>
                  </div>
                  
                  <button className="text-slate-300 hover:text-indigo-500 transition-colors p-1">
                    <Bookmark className="w-5 h-5" />
                  </button>
                </div>
                
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 mb-5 mt-4">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {job.location}</span>
                  <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-slate-400" /> {job.type}</span>
                  <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-slate-400" /> {job.salary}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-slate-400" /> {job.posted}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100 mr-2">
                    <Sparkles className="w-3.5 h-3.5" /> {job.match} Match
                  </span>

                  {job.tags.map(tag => (
                    <span key={tag} className="bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-xs font-semibold">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end shrink-0 pt-4 md:pt-0 mt-4 md:mt-0 border-t md:border-t-0 border-slate-100">
                <button className="w-full md:w-auto flex justify-center items-center gap-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-600 hover:text-white font-bold py-2.5 px-6 rounded-xl transition-colors">
                  Apply <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
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