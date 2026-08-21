"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  MapPin,
  DollarSign,
  Clock,
  Building2,
  Tag,
  X,
  Loader2,
  Save,
  Rocket,
  Bell,
  Mail,
} from "lucide-react";
import { ToastStack, ToastItem } from "@/components/ui/Toast";
import ResumiLogo from "@/components/logo/ResumiLogo";

type EmploymentType = "Full-time" | "Part-time" | "Contract" | "Internship";

interface JobFormState {
  title: string;
  company: string;
  location: string;
  remote: boolean;
  employmentType: EmploymentType;
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string;
  skills: string[];
}

const EMPLOYMENT_TYPES: EmploymentType[] = ["Full-time", "Part-time", "Contract", "Internship"];

const emptyJob = (): JobFormState => ({
  title: "",
  company: "",
  location: "",
  remote: false,
  employmentType: "Full-time",
  salaryMin: "",
  salaryMax: "",
  description: "",
  requirements: "",
  skills: [],
});

export default function PostJobForm() {
  const router = useRouter();
  const [job, setJob] = useState<JobFormState>(emptyJob());
  const [skillInput, setSkillInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = (message: string, variant: "success" | "error") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
  };
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  const update = <K extends keyof JobFormState>(field: K, value: JobFormState[K]) => {
    setJob((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;
    if (job.skills.includes(trimmed)) {
      setSkillInput("");
      return;
    }
    update("skills", [...job.skills, trimmed]);
    setSkillInput("");
  };

  const removeSkill = (skill: string) => {
    update("skills", job.skills.filter((s) => s !== skill));
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill();
    }
  };

  const submitJob = async (status: "draft" | "published") => {
    if (!job.title.trim() || !job.company.trim()) {
      pushToast("Add a job title and company before continuing.", "error");
      return;
    }

    const setLoading = status === "draft" ? setIsSaving : setIsPublishing;
    setLoading(true);
    try {
      const res = await fetch("/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...job, status }),
      });
      if (!res.ok) throw new Error("Failed to save job");
      const saved = await res.json();
      pushToast(status === "draft" ? "Draft saved" : "Job published!", "success");
      if (status === "published" && saved?.id) {
        router.push("/employer/dashboard");
      }
    } catch {
      pushToast(
        status === "draft" ? "Couldn't save draft. Try again." : "Couldn't publish job. Try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  const salaryLabel =
    job.salaryMin && job.salaryMax
      ? `$${job.salaryMin} – $${job.salaryMax}`
      : job.salaryMin
      ? `From $${job.salaryMin}`
      : job.salaryMax
      ? `Up to $${job.salaryMax}`
      : null;

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F7F9FC]">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
        <div
          className="flex items-center gap-2 font-bold text-indigo-600 text-xl cursor-pointer"
          onClick={() => router.push("/employer/dashboard")}
        >
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
            {job.company?.charAt(0) || "E"}
          </div>
        </div>
      </header>

      <div className="min-h-14 py-3 bg-white border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between px-4 shrink-0 z-10 shadow-sm gap-3 sm:gap-0">
        <div>
          <h1 className="font-semibold text-gray-800">Post a Job</h1>
          <p className="text-xs text-gray-400">Fill in the details, then publish or save for later.</p>
        </div>
        <div className="flex flex-row gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => submitJob("draft")}
            disabled={isSaving || isPublishing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 lg:px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-gray-500" />}
            Save Draft
          </button>
          <button
            onClick={() => submitJob("published")}
            disabled={isSaving || isPublishing}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 lg:px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {isPublishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Rocket className="w-4 h-4" />}
            Publish Job
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-6">
            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Briefcase size={16} className="text-gray-400" /> Job Basics
              </h3>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Job Title</label>
                <input
                  className="w-full p-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500"
                  placeholder="e.g. Senior Product Designer"
                  value={job.title}
                  onChange={(e) => update("title", e.target.value)}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Company</label>
                  <input
                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500"
                    placeholder="Your company name"
                    value={job.company}
                    onChange={(e) => update("company", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Employment Type</label>
                  <select
                    value={job.employmentType}
                    onChange={(e) => update("employmentType", e.target.value as EmploymentType)}
                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm bg-white outline-none focus:border-indigo-500"
                  >
                    {EMPLOYMENT_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 sm:items-end">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Location</label>
                  <input
                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500 disabled:bg-gray-50 disabled:text-gray-400"
                    placeholder="e.g. Austin, TX"
                    value={job.location}
                    onChange={(e) => update("location", e.target.value)}
                    disabled={job.remote}
                  />
                </div>
                <label className="flex items-center gap-2 text-sm text-gray-600 sm:pb-2.5 pt-1 sm:pt-0 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={job.remote}
                    onChange={(e) => update("remote", e.target.checked)}
                    className="w-4 h-4 accent-indigo-600 shrink-0"
                  />
                  This role is remote
                </label>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <DollarSign size={16} className="text-gray-400" /> Compensation
                <span className="text-xs font-normal text-gray-400">(optional)</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Min ($/yr)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500"
                    placeholder="80,000"
                    value={job.salaryMin}
                    onChange={(e) => update("salaryMin", e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Max ($/yr)</label>
                  <input
                    type="number"
                    className="w-full p-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500"
                    placeholder="110,000"
                    value={job.salaryMax}
                    onChange={(e) => update("salaryMax", e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Building2 size={16} className="text-gray-400" /> Description
              </h3>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">About the Role</label>
                <textarea
                  rows={5}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:border-indigo-500"
                  placeholder="Describe what this person will do day to day..."
                  value={job.description}
                  onChange={(e) => update("description", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Requirements</label>
                <textarea
                  rows={4}
                  className="w-full p-3 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:border-indigo-500"
                  placeholder="One requirement per line..."
                  value={job.requirements}
                  onChange={(e) => update("requirements", e.target.value)}
                />
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Tag size={16} className="text-gray-400" /> Skills & Tags
              </h3>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  className="flex-1 p-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-indigo-500"
                  placeholder="Type a skill and press Enter"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={handleSkillKeyDown}
                />
                <button
                  onClick={addSkill}
                  className="px-4 py-2.5 sm:py-2 text-sm font-semibold border border-gray-200 rounded-md hover:bg-gray-50 transition-colors w-full sm:w-auto"
                >
                  Add
                </button>
              </div>
              {job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold pl-3 pr-2 py-1.5 rounded-full"
                    >
                      {skill}
                      <button onClick={() => removeSkill(skill)} className="hover:text-indigo-900">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>

        <aside className="hidden lg:flex w-96 bg-gray-100/50 border-l border-gray-200 overflow-y-auto p-6 shrink-0 flex-col">
          <span className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Live Preview</span>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-bold flex items-center justify-center text-sm shrink-0">
                {job.company?.charAt(0).toUpperCase() || "?"}
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full text-center">
                {job.employmentType}
              </span>
            </div>

            <h3 className="text-base font-bold text-gray-900 mb-0.5">
              {job.title || "Job Title"}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{job.company || "Your Company"}</p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <MapPin size={12} /> {job.remote ? "Remote" : job.location || "Location"}
              </span>
              {salaryLabel && (
                <span className="flex items-center gap-1">
                  <DollarSign size={12} /> {salaryLabel}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Clock size={12} /> Just now
              </span>
            </div>

            {job.description && (
              <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap mb-4 line-clamp-5">
                {job.description}
              </p>
            )}

            {job.skills.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-5">
                {job.skills.map((skill) => (
                  <span key={skill} className="text-[11px] font-medium bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
                    {skill}
                  </span>
                ))}
              </div>
            )}

            <button className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl">
              Apply Now
            </button>
          </div>
        </aside>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}