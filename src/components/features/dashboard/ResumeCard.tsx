"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import {
  FileText, Calendar, MoreVertical, Pencil, Copy, Trash2,
  Share2, Sparkles, CheckCircle, AlertTriangle, X, Loader2, Check
} from "lucide-react";
import { ResumeListItem } from "@/types/dashboard";
import { formatRelativeDate } from "@/lib/format";

interface AtsResult {
  score: number;
  recommendations: string[];
}

interface ResumeCardProps {
  resume: ResumeListItem;
  isBusy?: boolean;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string, title: string) => void;
  pushToast: (msg: string, v: "success"|"info"|"error") => void;
}

export default function ResumeCard({
  resume,
  isBusy = false,
  onRename,
  onDuplicate,
  onDeleteRequest,
  pushToast
}: ResumeCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [draftTitle, setDraftTitle] = useState(resume.title);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [atsError, setAtsError] = useState<string | null>(null);
  const [isAtsModalOpen, setIsAtsModalOpen] = useState(false);

  const displayTitle =
    resume.title && resume.title !== "My Resume"
      ? resume.title
      : resume.jobTitle || "Untitled resume";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    if (isEditingTitle) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditingTitle]);

  const commitRename = () => {
    const trimmed = draftTitle.trim();
    setIsEditingTitle(false);
    if (trimmed && trimmed !== resume.title) {
      onRename(resume.id, trimmed);
    } else {
      setDraftTitle(resume.title);
    }
  };

  // Share Link — copy resume URL to clipboard
  const handleShareLink = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);

    const url = `${window.location.origin}/resume/${resume.id}`;
    try {
      await navigator.clipboard.writeText(url);
      pushToast("Shareable link copied to clipboard!", "success");
    } catch {
      // Fallback for older browsers
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      pushToast("Shareable link copied to clipboard!", "success");
    }
  }, [resume.id, pushToast]);

  // Analyze with AI
  const handleAnalyze = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    setMenuOpen(false);
    setIsAnalyzing(true);
    setAtsError(null);
    setAtsResult(null);
    setIsAtsModalOpen(true);

    try {
      // Fetch full resume data
      const resumeRes = await fetch(`/api/resume/${resume.id}`);
      if (!resumeRes.ok) throw new Error("Failed to load resume data");
      const resumeData = await resumeRes.json();

      if (!resumeData.summary?.trim()) {
        setAtsError("Add a professional summary to this resume before analyzing.");
        setIsAnalyzing(false);
        return;
      }

      // Call ATS analysis API
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(resumeData),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Analysis failed");
      }

      const result = await res.json();
      if (typeof result.score !== "number" || !Array.isArray(result.recommendations)) {
        throw new Error("Malformed response from AI");
      }

      setAtsResult(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setAtsError(msg);
    } finally {
      setIsAnalyzing(false);
    }
  }, [resume.id]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-emerald-700 bg-emerald-50 border-emerald-200";
    if (score >= 60) return "text-amber-700 bg-amber-50 border-amber-200";
    return "text-red-700 bg-red-50 border-red-200";
  };

  return (
    <>
      <div
        className={`bg-white border border-gray-200 rounded-2xl h-80 p-6 hover:shadow-md hover:border-indigo-300 transition-all duration-200 flex flex-col justify-between group relative ${
          isBusy ? "opacity-60 pointer-events-none" : ""
        }`}
      >
        <div className="absolute top-4 right-4 z-10" ref={menuRef}>
          <button
            onClick={(e) => {
              e.preventDefault();
              setMenuOpen((v) => !v);
            }}
            aria-label="Resume actions"
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all ${
              menuOpen ? "opacity-100 bg-indigo-50 text-indigo-600" : "opacity-0 group-hover:opacity-100"
            }`}
          >
            <MoreVertical size={16} />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-xl py-1 z-20 overflow-hidden">
              <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); setDraftTitle(resume.title); setIsEditingTitle(true); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                <Pencil size={14} /> Rename
              </button>
              <button onClick={handleShareLink} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
                <Share2 size={14} /> Share Link
              </button>
              <button onClick={handleAnalyze} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
                <Sparkles size={14} /> Analyze with AI
              </button>
              <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDuplicate(resume.id); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                <Copy size={14} /> Duplicate
              </button>
              <div className="h-px bg-gray-100 my-1 mx-2" />
              <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); onDeleteRequest(resume.id, displayTitle); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors">
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>

        <Link href={`/resume/${resume.id}`} className="flex flex-col h-full justify-between">
          <div>
            <div className="bg-indigo-50 text-indigo-600 w-11 h-11 rounded-xl flex items-center justify-center mb-5 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
              <FileText size={20} />
            </div>

            {isEditingTitle ? (
              <input
                ref={inputRef}
                value={draftTitle}
                onChange={(e) => setDraftTitle(e.target.value)}
                onClick={(e) => e.preventDefault()}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    inputRef.current?.blur();
                  } else if (e.key === "Escape") {
                    setDraftTitle(resume.title);
                    setIsEditingTitle(false);
                  }
                }}
                className="w-full font-bold text-lg text-gray-900 mb-2 bg-transparent border-b-2 border-indigo-600 outline-none pb-0.5"
              />
            ) : (
              <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1 pr-6">
                {displayTitle}
              </h3>
            )}

            <p className="text-xs text-gray-500 line-clamp-3 leading-relaxed mt-2">
              {resume.summary || "No professional summary added yet. Open this resume to write one."}
            </p>
          </div>

          <div className="mt-3">
            {/* Progress bar */}
            {resume.completionProgress && (
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-semibold text-gray-500">Completion</span>
                  <span className={`text-[11px] font-bold ${
                    resume.completionProgress.percentage === 100
                      ? "text-emerald-600"
                      : resume.completionProgress.percentage >= 50
                      ? "text-amber-600"
                      : "text-gray-500"
                  }`}>
                    {resume.completionProgress.percentage}%
                  </span>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${
                      resume.completionProgress.percentage === 100
                        ? "bg-emerald-500"
                        : resume.completionProgress.percentage >= 50
                        ? "bg-amber-400"
                        : "bg-indigo-400"
                    }`}
                    style={{ width: `${resume.completionProgress.percentage}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center justify-between text-xs font-medium text-gray-400 border-t border-gray-100 pt-3">
              <div className="flex items-center gap-1.5">
                <Calendar size={13} />
                <span suppressHydrationWarning>
                  {isMounted ? `Edited ${formatRelativeDate(resume.updatedAt)}` : "Loading..."}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* ATS Analysis Modal */}
      {isAtsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px]">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center shrink-0">
                  <Sparkles size={19} className="text-purple-600" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">ATS Analysis</h3>
                  <p className="text-xs text-gray-500 truncate max-w-52">{displayTitle}</p>
                </div>
              </div>
              <button
                onClick={() => setIsAtsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6">
              {isAnalyzing && (
                <div className="py-10 flex flex-col items-center gap-4">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-purple-100 animate-ping opacity-40" />
                    <div className="relative w-14 h-14 rounded-2xl bg-purple-50 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-purple-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-500">Analyzing your resume with AI...</p>
                </div>
              )}

              {atsError && !isAnalyzing && (
                <div className="py-8 flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-3">
                    <AlertTriangle size={20} className="text-red-500" />
                  </div>
                  <p className="text-sm text-gray-600 max-w-sm">{atsError}</p>
                  <button
                    onClick={() => setIsAtsModalOpen(false)}
                    className="mt-4 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                </div>
              )}

              {atsResult && !isAnalyzing && (
                <div className="space-y-5">
                  {/* Score */}
                  <div className="flex items-center gap-4">
                    <div className={`text-3xl font-black px-5 py-3 rounded-xl border ${getScoreColor(atsResult.score)}`}>
                      {atsResult.score}
                      <span className="text-sm font-bold opacity-60">/100</span>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">
                        {atsResult.score >= 80
                          ? "Great! Your resume is highly ATS-friendly."
                          : atsResult.score >= 60
                          ? "Good start — a few improvements will help."
                          : "Needs work to pass ATS filters."}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Based on keyword optimization, clarity, and structure</p>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recommendations</h4>
                    <div className="space-y-2.5">
                      {atsResult.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                          <CheckCircle size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700 leading-relaxed">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={() => setIsAtsModalOpen(false)}
                    className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
