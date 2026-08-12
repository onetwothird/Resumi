// src/app/resume/[id]/page.tsx
"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { Loader2, Undo, Redo, Share, Bell, Mail, ChevronDown, Save } from "lucide-react";
import { ToastStack, ToastItem } from "@/components/ui/Toast";
import { ResumeData, DEFAULT_THEME } from "@/types";

import BuilderSidebar from "../../../components/resume/BuilderSidebar";
import CanvasEditor from "../../../components/resume/CanvasEditor";
import PropertiesSidebar from "@/components/resume/PropertiesSidebar";
import ResumiLogo from "@/components/logo/ResumiLogo"; 

const emptyResume = (): ResumeData => ({
  firstName: "",
  lastName: "",
  jobTitle: "",
  email: "",
  phone: "",
  address: "",
  summary: "",
  theme: { ...DEFAULT_THEME },
});

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const resumeId = params.id as string;
  const router = useRouter();

  const [data, setData] = useState<ResumeData>(emptyResume());
  const [isLoading, setIsLoading] = useState(resumeId !== "new");
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const pushToast = useCallback((message: string, variant: "success" | "error") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  useEffect(() => {
    if (resumeId === "new") return;
    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/resume/${resumeId}`);
        if (!res.ok) throw new Error("Failed to load resume");
        const saved = await res.json();
        if (!cancelled && saved) {
          setData({
            ...emptyResume(),
            ...saved,
            theme: saved.theme ?? { ...DEFAULT_THEME },
          });
          setLastSaved(new Date());
        }
      } catch {
        if (!cancelled) pushToast("Couldn't load this resume.", "error");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [resumeId, pushToast]);

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${data.firstName || "Resume"}_${data.lastName || ""}`.trim(),
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = { ...data } as Record<string, unknown>;
      delete payload.id;

      const res = await fetch(`/api/resume/${resumeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      pushToast("Resume saved", "success");
      setLastSaved(new Date());

      if (resumeId === "new" && saved?.id) {
        router.replace(`/resume/${saved.id}`);
      }
    } catch {
      pushToast("Couldn't save your resume. Try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F7F9FC]">
      
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-8">
          
          <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl cursor-pointer" onClick={() => router.push('/dashboard')}>
            <ResumiLogo className="w-8 h-8" />
            Resumi
          </div>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <a href="/dashboard" className="hover:text-gray-900 transition-colors">Home</a>
            <a href="/jobs" className="hover:text-gray-900 transition-colors">Jobs</a>
            <a href="/companies" className="flex items-center gap-1 hover:text-gray-900 transition-colors">Companies <ChevronDown size={14}/></a>
            <a href="/ai-tools" className="flex items-center gap-1 text-gray-900 font-semibold transition-colors">AI Tools <ChevronDown size={14}/></a>
            <a href="/for-employers" className="hover:text-gray-900 transition-colors">For Employers</a>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors"><Bell size={16} /></button>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors"><Mail size={16} /></button>
          <div className="flex items-center gap-2 ml-2">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                {data.firstName?.charAt(0) || "U"}
             </div>
          </div>
        </div>
      </header>

      <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10 shadow-sm">
        <div className="flex items-center gap-4 text-gray-500">
          <div className="flex gap-1 border-r border-gray-200 pr-4">
            <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><Undo size={16} /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><Redo size={16} /></button>
          </div>
          <span className="text-xs flex items-center gap-1 italic">
             {isSaving ? "Saving..." : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Unsaved changes"}
          </span>
        </div>
        
        <div className="font-semibold text-gray-800 absolute left-1/2 -translate-x-1/2 flex items-center gap-2">
          {data.firstName || "Untitled"} {data.lastName || "Resume"}
        </div>

        <div className="flex gap-3">
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-gray-500" /> Save
          </button>
          <button 
            onClick={() => handlePrint()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors"
          >
            <Share className="w-4 h-4" /> Export PDF
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-85 bg-white border-r border-gray-200 overflow-y-auto flex flex-col shrink-0">
          <BuilderSidebar data={data} onChange={setData} />
        </aside>

        <main className="flex-1 overflow-y-auto bg-gray-100/50 flex flex-col items-center py-8 px-4 relative">
          <CanvasEditor ref={printRef} data={data} onChange={setData} />
        </main>

        <aside className="w-75 bg-white border-l border-gray-200 overflow-y-auto p-5 flex flex-col gap-6 shrink-0">
          <PropertiesSidebar data={data} onChange={setData} pushToast={pushToast} />
        </aside>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}