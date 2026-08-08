"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Plus, Search, FileX2, FilePlus2, Bell, Mail, Mic, Bot, X, PlaySquare, Square } from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ResumeListItem } from "@/types/dashboard";
import { formatRelativeDate } from "@/lib/format";
import ResumeCard from "@/components/dashboard/ResumeCard";
import HiringRoadmap from "@/components/dashboard/HiringRoadmap";
import JobBoard from "@/components/dashboard/JobBoard";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ToastStack, ToastItem } from "@/components/ui/Toast";
import ResumiLogo from "@/components/logo/ResumiLogo";

type SortOption = "updated" | "created" | "name";
type TabOption = "resumes" | "jobs";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "updated", label: "Last edited" },
  { value: "created", label: "Newest" },
  { value: "name", label: "Name A–Z" },
];

const AI_QUESTIONS = [
  "Hi there! Let's practice. Can you tell me a little bit about yourself?",
  "What would you say is your greatest professional strength?",
  "Describe a time you had to overcome a difficult challenge at work.",
  "Where do you see your career heading in the next five years?",
  "Great job. Do you have any questions for me?"
];

interface DashboardClientProps {
  initialResumes: ResumeListItem[];
}

export default function DashboardClient({ initialResumes }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabOption>("resumes");
  const [resumes, setResumes] = useState<ResumeListItem[]>(initialResumes);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- AI Voice Interview State ---
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);

  const pushToast = (message: string, variant: "success" | "error" | "info") => {
    const id = Date.now() + Math.random();
    // @ts-expect-error - overriding toast variant for extended UI
    setToasts((prev) => [...prev, { id, message, variant }]);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const startAiInterview = () => {
    setIsAiModalOpen(true);
    setQuestionIndex(0);
    setTranscript("");
    setIsInterviewActive(false);
  };

  const speakAndListen = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      pushToast("Voice features are not supported in your browser.", "error");
      return;
    }
    setIsListening(false);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.1;
    utterance.onend = () => startListening();
    window.speechSynthesis.cancel(); 
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current][0].transcript;
      setTranscript((prev) => prev + " " + result);
    };
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    recognition.start();
  };

  const handleNextQuestion = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setTranscript("");
    const nextIdx = questionIndex + 1;
    if (nextIdx < AI_QUESTIONS.length) {
      setQuestionIndex(nextIdx);
      speakAndListen(AI_QUESTIONS[nextIdx]);
    } else {
      setIsInterviewActive(false);
      pushToast("Interview practice completed!", "success");
    }
  };

  const toggleInterview = () => {
    if (isInterviewActive) {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsInterviewActive(false);
    } else {
      setIsInterviewActive(true);
      speakAndListen(AI_QUESTIONS[questionIndex]);
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, []);

  const setBusy = (id: string, busy: boolean) => {
    setBusyIds((prev) => {
      const next = new Set(prev);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const filteredAndSorted = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = resumes;
    if (q) {
      list = list.filter((r) => {
        const title = r.title && r.title !== "My Resume" ? r.title : "";
        return title.toLowerCase().includes(q) || (r.jobTitle || "").toLowerCase().includes(q);
      });
    }
    return [...list].sort((a, b) => {
      if (sortBy === "name") {
        const an = (a.title !== "My Resume" ? a.title : a.jobTitle) || "";
        const bn = (b.title !== "My Resume" ? b.title : b.jobTitle) || "";
        return an.localeCompare(bn);
      }
      if (sortBy === "created") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [resumes, query, sortBy]);

  const mostRecentEdit = useMemo(() => {
    if (resumes.length === 0) return null;
    return resumes.reduce((latest, r) => new Date(r.updatedAt) > new Date(latest.updatedAt) ? r : latest);
  }, [resumes]);

  const handleRename = async (id: string, title: string) => {
    const previous = resumes;
    setResumes((prev) => prev.map((r) => (r.id === id ? { ...r, title } : r)));
    setBusy(id, true);
    try {
      const res = await fetch(`/api/resume/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (!res.ok) throw new Error("Rename failed");
      pushToast("Resume renamed", "success");
    } catch {
      setResumes(previous);
      pushToast("Couldn't rename resume. Try again.", "error");
    } finally {
      setBusy(id, false);
    }
  };

  const handleDuplicate = async (id: string) => {
    setBusy(id, true);
    try {
      const res = await fetch(`/api/resume/${id}/duplicate`, { method: "POST" });
      if (!res.ok) throw new Error("Duplicate failed");
      const copy: ResumeListItem = await res.json();
      setResumes((prev) => [copy, ...prev]);
      pushToast("Resume duplicated", "success");
    } catch {
      pushToast("Couldn't duplicate resume. Try again.", "error");
    } finally {
      setBusy(id, false);
    }
  };

  const requestDelete = (id: string, title: string) => setDeleteTarget({ id, title });

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { id } = deleteTarget;
    const previous = resumes;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/resume/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setResumes((prev) => prev.filter((r) => r.id !== id));
      pushToast("Resume deleted", "success");
      setDeleteTarget(null);
    } catch {
      setResumes(previous);
      pushToast("Couldn't delete resume. Try again.", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  const hasResumes = resumes.length > 0;
  const hasResults = filteredAndSorted.length > 0;

  return (
    <>
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-8">
          <Link href="/dashboard" onClick={() => setActiveTab("resumes")} className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <ResumiLogo className="w-8 h-8" />
            Resumi
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <button 
              onClick={() => setActiveTab("resumes")} 
              className={`font-semibold transition-colors ${activeTab === "resumes" ? "text-indigo-600" : "hover:text-gray-900"}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab("jobs")} 
              className={`font-semibold transition-colors flex items-center gap-1 ${activeTab === "jobs" ? "text-indigo-600" : "hover:text-gray-900"}`}
            >
              Jobs
            </button>
            
            <Link href="/resume/new" className="hover:text-gray-900 transition-colors">Builder</Link>
            
            <button onClick={startAiInterview} className="flex items-center gap-1 text-indigo-600 font-semibold hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
              <Bot size={16} /> AI Coach
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => pushToast("You have 0 new notifications.", "info")} className="p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors">
            <Bell size={16} />
          </button>
          <button onClick={() => pushToast("Inbox is currently empty.", "info")} className="p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors">
            <Mail size={16} />
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <UserButton />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 md:p-10">
        
        {activeTab === "jobs" ? (
          <JobBoard />
        ) : (
          <>
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">My Resumes</h1>
                  <p className="text-sm text-gray-500">
                    {hasResumes ? (
                      <>
                        {resumes.length} resume{resumes.length === 1 ? "" : "s"}
                        {mostRecentEdit && <> · last edited {formatRelativeDate(mostRecentEdit.updatedAt)}</>}
                      </>
                    ) : "Manage, edit, and export your tailored resumes."}
                  </p>
                </div>

                {hasResumes && (
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search resumes"
                        className="pl-9 pr-3 py-2 w-56 text-sm rounded-xl border border-gray-200 bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                      />
                    </div>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="text-sm rounded-xl border border-gray-200 bg-white text-gray-800 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
                    >
                      {SORT_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {!hasResumes && (
                <div className="bg-white flex flex-col items-center justify-center text-center py-20 px-6 border-2 border-dashed border-gray-200 rounded-2xl shadow-xs">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                    <FilePlus2 size={26} />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Start your first resume</h2>
                  <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
                    Build a tailored, ATS-friendly resume in minutes and export it as a polished PDF.
                  </p>
                  <Link href="/resume/new" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md">
                    <Plus size={18} /> Create resume
                  </Link>
                </div>
              )}

              {hasResumes && !hasResults && (
                <div className="bg-white flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-gray-200 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3"><FileX2 size={22} /></div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1">No resumes match &ldquo;{query}&rdquo;</h3>
                  <p className="text-sm text-gray-500 mb-4">Try a different search term.</p>
                  <button onClick={() => setQuery("")} className="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Clear search</button>
                </div>
              )}

              {hasResumes && hasResults && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  <Link href="/resume/new" className="group flex flex-col items-center justify-center h-80 bg-white border-2 border-dashed border-indigo-200 rounded-2xl hover:bg-indigo-50/40 hover:border-indigo-500 transition-all duration-200 cursor-pointer shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform">
                      <Plus size={24} strokeWidth={2.5} />
                    </div>
                    <p className="font-bold text-indigo-700 text-base">Create New Resume</p>
                    <p className="text-xs text-indigo-400 mt-0.5">Start from scratch</p>
                  </Link>
                  {filteredAndSorted.map((resume) => (
                    <ResumeCard key={resume.id} resume={resume} isBusy={busyIds.has(resume.id)} onRename={handleRename} onDuplicate={handleDuplicate} onDeleteRequest={requestDelete} pushToast={pushToast} />
                  ))}
                </div>
              )}

              <HiringRoadmap hasResumes={hasResumes} onStartAiInterview={startAiInterview} />
            </div>
          </>
        )}
      </main>

      {/* --- Advanced AI Voice Interview Modal (Redesigned) --- */}
      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm transition-all">
          
          {/* Main Modal Container */}
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-110 overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Header: Smooth Gradient matching the mockup */}
            <div className="bg-linear-to-r from-[#6366F1] to-[#8B5CF6] px-6 py-5 text-white relative flex items-center gap-4">
              <button 
                onClick={() => { setIsAiModalOpen(false); window.speechSynthesis.cancel(); if (recognitionRef.current) recognitionRef.current.stop(); }} 
                className="absolute top-5 right-5 w-7 h-7 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
              </button>
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                <Bot size={20} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[17px] font-bold leading-tight tracking-tight">AI Interview Coach</h2>
                <p className="text-[13px] font-medium text-white/80 mt-0.5">Question {questionIndex + 1} of {AI_QUESTIONS.length}</p>
              </div>
            </div>
            
            {/* Body */}
            <div className="p-7 flex flex-col items-center">
              
              {/* Question Bubble - Left aligned with smart shadow */}
              <div className="bg-white rounded-2xl p-5 w-full mb-8 border border-gray-200 shadow-sm">
                <p className="text-gray-800 font-medium text-[15px] leading-relaxed">
                  &ldquo;{AI_QUESTIONS[questionIndex]}&rdquo;
                </p>
              </div>

              {/* Central Mic Button - Perfect circle, lighter background */}
              <div className="relative flex items-center justify-center w-20 h-20 mb-8">
                {isListening && <span className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-20"></span>}
                <button 
                  onClick={toggleInterview}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 outline-none ${isListening ? 'bg-violet-50 scale-105 shadow-md' : 'bg-gray-50 hover:bg-gray-100'}`}
                >
                  <Mic size={28} strokeWidth={1.5} className={isListening ? "text-violet-600 animate-pulse" : "text-gray-400"} />
                </button>
              </div>

              {/* User Answer Textarea Placeholder */}
              <div className="w-full bg-white rounded-2xl p-5 min-h-27.5 border border-gray-200 mb-7 shadow-sm">
                <p className={`text-[14px] leading-relaxed ${transcript ? 'text-gray-700' : 'text-gray-400 italic'}`}>
                  {transcript || (isListening ? "Listening to your answer..." : "Your answer will appear here...")}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 w-full">
                <button 
                  onClick={toggleInterview}
                  className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] text-white transition-all outline-none shadow-sm hover:shadow active:scale-[0.98] ${isInterviewActive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-[#6366F1] hover:bg-indigo-600'}`}
                >
                  {isInterviewActive ? <><Square size={16} fill="currentColor" /> Stop</> : <><PlaySquare size={16} /> Start Interview</>}
                </button>
                <button 
                  onClick={handleNextQuestion}
                  disabled={!isInterviewActive && questionIndex === 0}
                  className="flex-1 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-400 font-bold text-[14px] rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed outline-none border border-transparent"
                >
                  Next Question
                </button>
              </div>
              
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete this resume?"
        description={`"${deleteTarget?.title}" will be permanently deleted. This can't be undone.`}
        confirmLabel="Delete"
        danger
        isLoading={isDeleting}
        onConfirm={confirmDelete}
        onCancel={() => !isDeleting && setDeleteTarget(null)}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}