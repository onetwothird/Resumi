"use client";

import { useState, useEffect, useRef } from "react";
import { ResumeData } from "@/types";
import BuilderSidebar from "./BuilderSidebar";
import CanvasEditor from "./CanvasEditor";
import PropertiesSidebar from "./PropertiesSidebar";
import { Save, Loader2, CheckCircle2 } from "lucide-react";

interface Props {
  initialData: ResumeData;
  resumeId: string;
}

export default function BuilderClient({ initialData, resumeId }: Props) {
  const [data, setData] = useState<ResumeData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [toastMsg, setToastMsg] = useState<{msg: string, type: string} | null>(null);

  // Declared BEFORE saveResume to fix the ESLint hoisting error
  const pushToast = (msg: string, type: "success" | "error") => {
    setToastMsg({ msg, type });
    setTimeout(() => setToastMsg(null), 3000);
  };

  const saveResume = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/resumes/${resumeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error("Failed to save resume");
      
      const responseData = await res.json();
      
      if (resumeId === "new" && responseData.id) {
        window.history.replaceState(null, "", `/builder/${responseData.id}`);
      }

      setLastSaved(new Date());
    } catch (error) {
      console.error(error);
      pushToast("Failed to save resume", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    const timeoutId = setTimeout(() => {
      saveResume();
    }, 1500);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F7F9FC]">
      {toastMsg && (
        <div className={`fixed top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg text-sm font-medium text-white z-50 shadow-lg ${toastMsg.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>
          {toastMsg.msg}
        </div>
      )}

      <header className="h-14 border-b border-gray-200 bg-white flex items-center justify-between px-6 shrink-0">
        <h1 className="font-bold text-gray-800 text-lg">Resume Builder</h1>
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            {isSaving ? (
              <><Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-500" /> Saving...</>
            ) : lastSaved ? (
              <><CheckCircle2 className="w-3.5 h-3.5 text-green-500" /> Saved at {lastSaved.toLocaleTimeString()}</>
            ) : null}
          </span>
          <button
            onClick={saveResume}
            disabled={isSaving}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSaving ? "Saving..." : "Save Now"}
          </button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <aside className="w-[320px] border-r border-gray-200 bg-white flex flex-col overflow-hidden shrink-0">
          <BuilderSidebar data={data} onChange={setData} />
        </aside>

        <section className="flex-1 overflow-auto p-8 flex justify-center bg-gray-50">
          <CanvasEditor data={data} onChange={setData} />
        </section>

        <aside className="w-[320px] border-l border-gray-200 bg-white overflow-y-auto shrink-0 p-5">
          <PropertiesSidebar data={data} onChange={setData} pushToast={pushToast} />
        </aside>
      </main>
    </div>
  );
}