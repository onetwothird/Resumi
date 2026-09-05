"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Plus, Search, FileX2, FilePlus2, Mic, Bot, X, PlaySquare, Square,
  Video, VideoOff, RotateCcw, TrendingUp, ThumbsUp, Target, ChevronDown,
  Sparkles, Briefcase, FileText, ChevronRight,
  User,
} from "lucide-react";
import { UserButton } from "@clerk/nextjs";
import { ResumeListItem } from "@/types/dashboard";
import { ResumeData } from "@/types";
import { formatRelativeDate } from "@/lib/format";
import ResumeCard from "@/components/features/dashboard/ResumeCard";
import PdfUploader from "@/components/features/dashboard/PdfUploader";
import NotificationBell from "@/components/features/dashboard/NotificationBell";
import JobBoard from "@/components/features/dashboard/JobBoard";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ToastStack, ToastItem } from "@/components/ui/Toast";
import ResumiLogo from "@/components/ui/ResumiLogo";
import InboxDropdown from "@/components/features/dashboard/InboxDropdown";

type SortOption = "updated" | "created" | "name";
type TabOption = "resumes" | "jobs";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "updated", label: "Last edited" },
  { value: "created", label: "Newest" },
  { value: "name", label: "Name A–Z" },
];

type InterviewStage = "setup" | "preparing" | "live" | "reviewing" | "complete";

interface InterviewFeedback {
  score: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

interface ParsedResumeData {
  jobTitle?: string;
  summary?: string;
  skills?: string[];
  experience?: unknown[];
}

interface MockSpeechRecognitionEvent {
  resultIndex: number;
  results: { transcript: string }[][];
}

interface MockSpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((event: MockSpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
}

interface CustomWindow extends Window {
  SpeechRecognition?: new () => MockSpeechRecognition;
  webkitSpeechRecognition?: new () => MockSpeechRecognition;
}

interface DashboardClientProps {
  initialResumes: ResumeListItem[];
}

export default function DashboardClient({ initialResumes }: DashboardClientProps) {
  const [activeTab, setActiveTab] = useState<TabOption>("resumes");
  const [resumes, setResumes] = useState<ResumeListItem[]>(initialResumes);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [page, setPage] = useState(1);
  const RESUMES_PER_PAGE = 8;
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [interviewStage, setInterviewStage] = useState<InterviewStage>("setup");
  const [selectedResumeId, setSelectedResumeId] = useState<string>("");
  const [targetJobTitle, setTargetJobTitle] = useState("");
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<InterviewFeedback | null>(null);

  const [uploadedResumeData, setUploadedResumeData] = useState<ParsedResumeData | null>(null);

  const [isInterviewActive, setIsInterviewActive] = useState(false);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(true);

  const recognitionRef = useRef<MockSpeechRecognition | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const speechSupported =
    typeof window !== "undefined" && (("SpeechRecognition" in window) || ("webkitSpeechRecognition" in window));

  const pushToast = (message: string, variant: "success" | "error" | "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant } as unknown as ToastItem]);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const mostRecentEdit = resumes.length > 0 
    ? resumes.reduce((latest, r) => new Date(r.updatedAt) > new Date(latest.updatedAt) ? r : latest) 
    : null;

  const startAiInterview = () => {
    setIsAiModalOpen(true);
    setInterviewStage("setup");
    setSelectedResumeId(mostRecentEdit?.id ?? "");
    setTargetJobTitle(mostRecentEdit?.jobTitle ?? "");
    setUploadedResumeData(null); 
    setQuestions([]);
    setAnswers([]);
    setFeedback(null);
    setQuestionIndex(0);
    setTranscript("");
    setIsInterviewActive(false);
    setCameraError(null);
    setCameraOn(true);
  };

  const closeAiInterview = () => {
    try {
      window.speechSynthesis?.cancel();
      recognitionRef.current?.stop();
      stopCamera();
    } catch (err) {
      console.error("Error while closing AI Coach:", err);
    } finally {
      setIsInterviewActive(false);
      setIsAiModalOpen(false);
    }
  };

  const startCamera = async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera isn't supported in this browser — continuing with audio only.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      setCameraError(null);
    } catch {
      setCameraError("Camera access was blocked — continuing with audio only.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  };

  const beginInterview = async () => {
    if (!selectedResumeId && !uploadedResumeData) {
      pushToast("Choose a resume to prep with first.", "error");
      return;
    }
    if (!targetJobTitle.trim()) {
      pushToast("Enter the job title you're targeting.", "error");
      return;
    }
    setInterviewStage("preparing");
    try {
      let resumeData;

      if (uploadedResumeData) {
        resumeData = uploadedResumeData;
      } else {
        if (!selectedResumeId) throw new Error("No resume selected");
        const resumeRes = await fetch(`/api/resume/${selectedResumeId}`);
        if (!resumeRes.ok) throw new Error("Failed to load resume");
        resumeData = await resumeRes.json().catch(() => null);
        if (!resumeData) throw new Error("Resume data was empty or malformed");
      }

      const qRes = await fetch("/api/ai/interview-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetJobTitle,
          summary: resumeData.summary,
          skills: resumeData.skills,
          experience: resumeData.experience,
        }),
      });
      if (!qRes.ok) throw new Error("Failed to generate questions");
      const { questions: qs } = await qRes.json();
      if (!Array.isArray(qs) || qs.length === 0) throw new Error("No questions returned");

      setQuestions(qs);
      setAnswers(new Array(qs.length).fill(""));
      setQuestionIndex(0);
      setTranscript("");
      setInterviewStage("live");
      if (cameraOn) startCamera();
    } catch {
      pushToast("Couldn't prepare your mock interview. Try again.", "error");
      setInterviewStage("setup");
    }
  };

  const finishInterview = async (finalAnswers: string[], finalQuestions: string[]) => {
    stopCamera();
    setInterviewStage("reviewing");
    try {
      const res = await fetch("/api/ai/interview-feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetJobTitle,
          qa: finalQuestions.map((q, i) => ({ question: q, answer: finalAnswers[i] || "" })),
        }),
      });
      if (!res.ok) throw new Error("Failed to get feedback");
      const result = await res.json();
      setFeedback(result);
    } catch {
      pushToast("Couldn't generate feedback this time, but great job practicing!", "info");
      setFeedback(null);
    } finally {
      setInterviewStage("complete");
    }
  };

  const restartInterview = () => {
    setInterviewStage("setup");
    setQuestions([]);
    setAnswers([]);
    setFeedback(null);
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
    const win = window as unknown as CustomWindow;
    const SpeechRecognitionConstructor = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SpeechRecognitionConstructor) return;

    const recognition = new SpeechRecognitionConstructor();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event: MockSpeechRecognitionEvent) => {
      try {
        const current = event.resultIndex;
        const result = event.results?.[current]?.[0]?.transcript;
        if (result) setTranscript((prev) => prev + " " + result);
      } catch (err) {
        console.error("Speech recognition result error:", err);
      }
    };
    recognition.onend = () => setIsListening(false);
    setIsListening(true);
    try {
      recognition.start();
    } catch (err) {
      console.error("Speech recognition failed to start:", err);
      setIsListening(false);
    }
  };

  const handleNextQuestion = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    const updatedAnswers = [...answers];
    updatedAnswers[questionIndex] = transcript.trim();
    setAnswers(updatedAnswers);
    setTranscript("");

    const nextIdx = questionIndex + 1;
    if (nextIdx < questions.length) {
      setQuestionIndex(nextIdx);
      if (isInterviewActive) speakAndListen(questions[nextIdx]);
    } else {
      window.speechSynthesis?.cancel();
      setIsInterviewActive(false);
      finishInterview(updatedAnswers, questions);
    }
  };

  const finishEarly = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    window.speechSynthesis?.cancel();
    setIsInterviewActive(false);
    const updatedAnswers = [...answers];
    updatedAnswers[questionIndex] = transcript.trim();
    finishInterview(updatedAnswers, questions);
  };

  const toggleInterview = () => {
    try {
      if (isInterviewActive) {
        window.speechSynthesis?.cancel();
        recognitionRef.current?.stop();
        setIsInterviewActive(false);
      } else {
        setIsInterviewActive(true);
        speakAndListen(questions[questionIndex]);
      }
    } catch (err) {
      console.error("Toggle interview failed:", err);
      setIsInterviewActive(false);
      pushToast("Voice playback hit a snag — you can keep typing your answer.", "error");
    }
  };

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel();
      if (recognitionRef.current) recognitionRef.current.stop();
      streamRef.current?.getTracks().forEach((track) => track.stop());
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

  const resumesOnFirstPage = RESUMES_PER_PAGE - 2;
  const totalPages = Math.max(
    1,
    1 + Math.ceil(Math.max(0, filteredAndSorted.length - resumesOnFirstPage) / RESUMES_PER_PAGE)
  );

  const [prevFilterKey, setPrevFilterKey] = useState(`${query}|${sortBy}`);
  const filterKey = `${query}|${sortBy}`;
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const currentPage = Math.min(page, totalPages);

  const paginatedResumes = useMemo(() => {
    if (currentPage === 1) {
      return filteredAndSorted.slice(0, resumesOnFirstPage);
    }
    const start = resumesOnFirstPage + (currentPage - 2) * RESUMES_PER_PAGE;
    return filteredAndSorted.slice(start, start + RESUMES_PER_PAGE);
  }, [filteredAndSorted, currentPage, resumesOnFirstPage]);

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

  const handlePdfScanComplete = (parsedData: Partial<ResumeData>) => {
    setUploadedResumeData({
      jobTitle: parsedData.jobTitle,
      summary: parsedData.summary,
      skills: typeof parsedData.skills === "string"
        ? parsedData.skills.split(",").map((s) => s.trim())
        : parsedData.skills,
      experience: parsedData.experience,
    });
    setTargetJobTitle(parsedData.jobTitle || "");
    setIsAiModalOpen(true);
    setInterviewStage("setup");
  };

  const hasResumes = resumes.length > 0;
  const hasResults = filteredAndSorted.length > 0;

  return (
    <>
     <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/dashboard" onClick={() => setActiveTab("resumes")} className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <ResumiLogo className="w-8 h-8" />
            <span className="hidden sm:inline">Resumi</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <button onClick={() => setActiveTab("resumes")} className={`transition-colors ${activeTab === "resumes" ? "text-gray-900 font-semibold" : "hover:text-gray-900"}`}>
              Home
            </button>
            <button onClick={() => setActiveTab("jobs")} className={`transition-colors ${activeTab === "jobs" ? "text-gray-900 font-semibold" : "hover:text-gray-900"}`}>
              Jobs
            </button>
            <Link href="/companies" className="flex items-center gap-1 hover:text-gray-900 transition-colors">Companies <ChevronDown size={14}/></Link>
            <Link href="/resume/new" className="flex items-center gap-1 hover:text-gray-900 transition-colors">Builder <ChevronDown size={14}/></Link>
            <button onClick={startAiInterview} className="flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors">
              <Sparkles size={14} className="text-indigo-500" /> AI Coach
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:block">
            <NotificationBell />
          </div>
          {/* REPLACED MAIL BUTTON WITH INBOX DROPDOWN */}
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
                  label="Employer Dashboard"
                  labelIcon={<Briefcase size={15} />}
                  href="/employer/dashboard"
                />
              </UserButton.MenuItems>
            </UserButton>
          </div>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white flex flex-col items-center justify-center text-center py-14 px-6 border border-gray-200 rounded-2xl shadow-xs h-full">
                    <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
                      <FilePlus2 size={26} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">Start your first resume</h2>
                    <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
                      Build a tailored, ATS-friendly resume in minutes and export it as a polished PDF.
                    </p>
                    <Link href="/resume/new" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm">
                      <Plus size={18} /> Create resume
                    </Link>
                  </div>

                  <div className="h-full">
                    <PdfUploader
                      pushToast={pushToast}
                      onScanComplete={handlePdfScanComplete}
                    />
                  </div>
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
                  {currentPage === 1 && (
                    <>
                      <Link href="/resume/new" className="group flex flex-col items-center justify-center h-80 bg-white border-2 border-dashed border-indigo-200 rounded-2xl hover:bg-indigo-50/40 hover:border-indigo-500 transition-all duration-200 cursor-pointer shadow-xs">
                        <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform">
                          <Plus size={24} strokeWidth={2.5} />
                        </div>
                        <p className="font-bold text-indigo-700 text-base">Create New Resume</p>
                        <p className="text-xs text-indigo-400 mt-0.5">Start from scratch</p>
                      </Link>
                      <PdfUploader
                        pushToast={pushToast}
                        onScanComplete={handlePdfScanComplete}
                      />
                    </>
                  )}
                  {paginatedResumes.map((resume) => (
                    <ResumeCard key={resume.id} resume={resume} isBusy={busyIds.has(resume.id)} onRename={handleRename} onDuplicate={handleDuplicate} onDeleteRequest={requestDelete} pushToast={pushToast} />
                  ))}
                </div>
              )}

              {hasResumes && hasResults && totalPages > 1 && (
                <div className="w-full flex items-center justify-center gap-1.5 mt-8">
                  <button
                    onClick={() => setPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 text-sm font-semibold text-gray-500 rounded-lg hover:bg-white hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Prev
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-9 h-9 text-sm font-semibold rounded-lg transition-colors ${
                        p === currentPage
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-gray-600 hover:bg-white hover:text-gray-900"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 text-sm font-semibold text-gray-500 rounded-lg hover:bg-white hover:text-gray-900 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              )}

            </div>
          </>
        )}
      </main>

      {isAiModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] transition-all">
          <div className="bg-white rounded-2xl shadow-xl ring-1 ring-black/5 w-full max-w-125 overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">

            <div className="relative px-6 pt-6 pb-5 border-b border-gray-100 shrink-0">
              <button
                onClick={closeAiInterview}
                className="absolute top-5 right-5 w-7 h-7 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full flex items-center justify-center transition-colors"
              >
                <X size={14} strokeWidth={2.5} />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center shrink-0">
                  <Bot size={19} className="text-indigo-600" strokeWidth={2} />
                </div>
                <div className="min-w-0">
                  <h2 className="font-serif text-lg text-gray-900 leading-tight">AI Interview Coach</h2>
                  <p className="text-[13px] text-gray-500 mt-0.5 truncate">
                    {interviewStage === "setup" && "Set up your mock interview"}
                    {interviewStage === "preparing" && "Preparing tailored questions..."}
                    {interviewStage === "live" && `Question ${questionIndex + 1} of ${questions.length}`}
                    {interviewStage === "reviewing" && "Reviewing your answers..."}
                    {interviewStage === "complete" && "Session complete"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 mt-5">
                {(() => {
                  const stepIndex =
                    interviewStage === "setup" || interviewStage === "preparing" ? 0 :
                    interviewStage === "live" || interviewStage === "reviewing" ? 1 : 2;
                  return ["Setup", "Interview", "Feedback"].map((label, i) => (
                    <div key={label} className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className={`h-full bg-indigo-600 rounded-full transition-all duration-500 ${i <= stepIndex ? "w-full" : "w-0"}`}
                      />
                    </div>
                  ));
                })()}
              </div>
            </div>

            <div className="p-7 flex flex-col items-center overflow-y-auto">
              {interviewStage === "setup" && (
                <div className="w-full space-y-5">
                  {!hasResumes && !uploadedResumeData ? (
                    <div className="text-center py-6">
                      <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-4">
                        <FileText size={24} />
                      </div>
                      <p className="text-sm text-gray-600 mb-4 max-w-70 mx-auto leading-relaxed">You&rsquo;ll need a resume before practicing — the AI reads it to ask relevant questions.</p>
                      <Link href="/resume/new" onClick={closeAiInterview} className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-colors shadow-sm">
                        <Plus size={16} /> Create a resume
                      </Link>
                    </div>
                  ) : (
                    <>
                      {!uploadedResumeData && (
                        <div>
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                            <FileText size={12} /> Which resume are we prepping with?
                          </label>
                          <div className="relative">
                            <select
                              value={selectedResumeId}
                              onChange={(e) => {
                                const id = e.target.value;
                                setSelectedResumeId(id);
                                const r = resumes.find((x) => x.id === id);
                                setTargetJobTitle(r?.jobTitle || "");
                              }}
                              className="w-full p-3 pr-9 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-white appearance-none shadow-xs transition-all"
                            >
                              {resumes.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.title && r.title !== "My Resume" ? r.title : r.jobTitle || "Untitled resume"}
                                </option>
                              ))}
                            </select>
                            <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
                          </div>
                        </div>
                      )}

                      {uploadedResumeData && (
                        <div className="p-3 bg-indigo-50 text-indigo-700 text-sm rounded-xl border border-indigo-100 flex items-center gap-2 mb-2">
                           <FilePlus2 size={16} /> <span>Using uploaded PDF data</span>
                        </div>
                      )}

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <Briefcase size={12} /> Target job title
                        </label>
                        <input
                          value={targetJobTitle}
                          onChange={(e) => setTargetJobTitle(e.target.value)}
                          placeholder="e.g. Frontend Web Engineer"
                          className="w-full p-3 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs transition-all"
                        />
                      </div>

                      <label className="flex items-center justify-between gap-3 cursor-pointer bg-gray-50 border border-gray-200 rounded-xl p-3.5">
                        <span className="text-sm text-gray-700 flex items-center gap-2">
                          <Video size={15} className="text-gray-400 shrink-0" />
                          <span>Practice on camera <span className="text-gray-400 font-normal">— self-view only, never sent anywhere</span></span>
                        </span>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={cameraOn}
                          onClick={() => setCameraOn(!cameraOn)}
                          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors ${cameraOn ? "bg-indigo-600" : "bg-gray-300"}`}
                        >
                          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${cameraOn ? "translate-x-5" : "translate-x-0"}`} />
                        </button>
                      </label>

                      <button
                        onClick={beginInterview}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[14px] rounded-xl transition-colors active:scale-[0.99]"
                      >
                        <PlaySquare size={16} /> Start Mock Interview
                      </button>
                    </>
                  )}
                </div>
              )}

              {interviewStage === "preparing" && (
                <div className="py-14 flex flex-col items-center gap-4 text-gray-500">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-40" />
                    <div className="relative w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <Sparkles className="w-6 h-6 text-indigo-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-center max-w-60">Reading your resume and writing questions for {targetJobTitle}&hellip;</p>
                </div>
              )}

              {interviewStage === "live" && (
                <div className="w-full">
                  {cameraOn && (
                    <div className={`relative w-full aspect-video bg-gray-900 rounded-2xl overflow-hidden mb-6 border transition-all ${isListening ? "border-violet-300 ring-4 ring-violet-100" : "border-gray-200"}`}>
                      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover -scale-x-100" />
                      {cameraError && (
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 px-6">
                          <p className="text-white/70 text-xs text-center flex items-center gap-2"><VideoOff size={14} /> {cameraError}</p>
                        </div>
                      )}
                      {isListening && !cameraError && (
                        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-black/40 backdrop-blur-sm text-white text-[11px] font-semibold px-2.5 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" /> Listening
                        </div>
                      )}
                    </div>
                  )}

                  <div className="relative bg-gray-50 rounded-2xl p-5 pt-4 w-full mb-6 border border-gray-200">
                    <span className="inline-block bg-white px-2 py-0.5 mb-2 text-[10px] font-bold text-indigo-500 uppercase tracking-wide border border-gray-200 rounded-full">
                      Question {questionIndex + 1}
                    </span>
                    <p className="text-gray-800 font-medium text-[15px] leading-relaxed">
                      {questions[questionIndex]}
                    </p>
                  </div>

                  <div className="relative flex items-center justify-center w-20 h-20 mb-6 mx-auto">
                    {isListening && <span className="absolute inset-0 rounded-full bg-violet-400 animate-ping opacity-20"></span>}
                    <button
                      onClick={toggleInterview}
                      disabled={!speechSupported}
                      className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 outline-none disabled:opacity-40 disabled:cursor-not-allowed ${isListening ? 'bg-violet-50 scale-105 shadow-md ring-4 ring-violet-100' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}
                    >
                      <Mic size={28} strokeWidth={1.5} className={isListening ? "text-violet-600 animate-pulse" : "text-gray-400"} />
                    </button>
                  </div>
                  {!speechSupported && (
                    <p className="text-center text-xs text-gray-400 -mt-4 mb-6">Voice isn&rsquo;t supported in this browser — just type your answer below.</p>
                  )}

                  <textarea
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    placeholder={isListening ? "Listening to your answer..." : "Your answer will appear here — or just type it"}
                    rows={4}
                    className="w-full bg-white rounded-2xl p-5 border border-gray-200 mb-6 shadow-xs text-[14px] leading-relaxed text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none transition-all"
                  />

                  <div className="flex gap-3 w-full mb-3">
                    <button
                      onClick={toggleInterview}
                      disabled={!speechSupported}
                      className={`flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-[14px] text-white transition-colors outline-none active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed ${isInterviewActive ? 'bg-rose-500 hover:bg-rose-600' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                      {isInterviewActive ? <><Square size={16} fill="currentColor" /> Stop</> : <><PlaySquare size={16} /> Read Aloud</>}
                    </button>
                    <button
                      onClick={handleNextQuestion}
                      className="flex-1 flex items-center justify-center gap-1.5 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-[14px] rounded-xl transition-colors outline-none border border-gray-200"
                    >
                      {questionIndex === questions.length - 1 ? "Finish" : "Next Question"} <ChevronRight size={15} />
                    </button>
                  </div>
                  <div className="text-center">
                    <button onClick={finishEarly} className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
                      End interview now
                    </button>
                  </div>
                </div>
              )}

              {interviewStage === "reviewing" && (
                <div className="py-14 flex flex-col items-center gap-4 text-gray-500">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full bg-indigo-100 animate-ping opacity-40" />
                    <div className="relative w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center">
                      <Target className="w-6 h-6 text-indigo-500" />
                    </div>
                  </div>
                  <p className="text-sm font-medium">Analyzing your answers&hellip;</p>
                </div>
              )}

              {interviewStage === "complete" && (
                <div className="w-full">
                  {feedback && typeof feedback.score === "number" ? (
                    <>
                      <div className="flex items-center justify-center mb-6">
                        <div className="relative w-24 h-24">
                          <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
                            <circle cx="40" cy="40" r="34" fill="none" stroke="#EEF2FF" strokeWidth="8" />
                            <circle
                              cx="40" cy="40" r="34" fill="none"
                              stroke="url(#aiCoachScoreGradient)"
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={2 * Math.PI * 34}
                              strokeDashoffset={2 * Math.PI * 34 * (1 - Math.min(Math.max(feedback.score, 0), 100) / 100)}
                              className="transition-all duration-700 ease-out"
                            />
                            <defs>
                              <linearGradient id="aiCoachScoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#6366F1" />
                                <stop offset="100%" stopColor="#8B5CF6" />
                              </linearGradient>
                            </defs>
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-extrabold text-gray-900">{feedback.score}</span>
                            <span className="text-[10px] font-bold text-gray-400 -mt-1">/ 100</span>
                          </div>
                        </div>
                      </div>
                      {feedback.summary && (
                        <p className="text-sm text-gray-600 text-center mb-6 leading-relaxed">{feedback.summary}</p>
                      )}

                      {Array.isArray(feedback.strengths) && feedback.strengths.length > 0 && (
                        <div className="w-full bg-emerald-50/70 border border-emerald-100 rounded-2xl p-4 mb-3">
                          <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wide mb-2.5">
                            <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0"><ThumbsUp size={11} /></span> Strengths
                          </div>
                          <ul className="space-y-1.5">
                            {feedback.strengths.map((s, i) => (
                              <li key={i} className="text-sm text-emerald-800 flex gap-2 leading-relaxed"><span className="text-emerald-400 mt-0.5">•</span><span>{s}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {Array.isArray(feedback.improvements) && feedback.improvements.length > 0 && (
                        <div className="w-full bg-amber-50/70 border border-amber-100 rounded-2xl p-4 mb-6">
                          <div className="flex items-center gap-2 text-amber-700 font-bold text-xs uppercase tracking-wide mb-2.5">
                            <span className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center shrink-0"><TrendingUp size={11} /></span> Room to grow
                          </div>
                          <ul className="space-y-1.5">
                            {feedback.improvements.map((s, i) => (
                              <li key={i} className="text-sm text-amber-800 flex gap-2 leading-relaxed"><span className="text-amber-400 mt-0.5">•</span><span>{s}</span></li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                        <Target size={24} className="text-gray-300" />
                      </div>
                      <p className="text-sm text-gray-500">Nice work finishing the mock interview! We couldn&rsquo;t generate written feedback this time — but reviewing your own answers is a great next step.</p>
                    </div>
                  )}

                  <div className="flex gap-3 w-full">
                    <button onClick={restartInterview} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 hover:bg-gray-100 text-gray-700 font-bold text-[13px] rounded-xl transition-colors border border-gray-200">
                      <RotateCcw size={15} /> Practice Again
                    </button>
                    <button onClick={closeAiInterview} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[13px] rounded-xl transition-colors">
                      Done
                    </button>
                  </div>
                </div>
              )}

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