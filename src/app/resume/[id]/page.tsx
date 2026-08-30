"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  Undo, Redo, Share, Bell, Mail, ChevronDown, Save,
  PenTool, Eye, Settings
} from "lucide-react";
import { ToastStack, ToastItem } from "@/components/ui/Toast";
import { ResumeData, DEFAULT_THEME } from "@/types";

import BuilderSidebar from "../../../components/resume/BuilderSidebar";
import CanvasEditor from "../../../components/resume/CanvasEditor";
import PropertiesSidebar from "@/components/resume/PropertiesSidebar";
import ResumiLogo from "@/components/logo/ResumiLogo";

const emptyResume = (): ResumeData => ({
  title: "",
  titleIsCustom: false,
  firstName: "",
  lastName: "",
  jobTitle: "",
  email: "",
  phone: "",
  address: "",
  summary: "",
  theme: { ...DEFAULT_THEME },
});

const AUTOSAVE_DELAY_MS = 1500;

function CanvasSkeleton() {
  return (
    <div className="w-[210mm] min-h-[297mm] bg-white shadow-lg p-14 animate-pulse">
      <div className="h-8 w-2/3 bg-gray-200 rounded mb-3" />
      <div className="h-4 w-1/3 bg-gray-200 rounded mb-8" />
      <div className="h-3 w-1/4 bg-gray-200 rounded mb-3" />
      <div className="h-3 w-full bg-gray-100 rounded mb-2" />
      <div className="h-3 w-full bg-gray-100 rounded mb-2" />
      <div className="h-3 w-5/6 bg-gray-100 rounded mb-8" />
      <div className="h-3 w-1/4 bg-gray-200 rounded mb-3" />
      <div className="h-3 w-full bg-gray-100 rounded mb-2" />
      <div className="h-3 w-2/3 bg-gray-100 rounded" />
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <div className="p-4 space-y-4 animate-pulse w-full">
      <div className="h-4 w-1/2 bg-gray-200 rounded" />
      <div className="h-9 w-full bg-gray-100 rounded-md" />
      <div className="h-9 w-full bg-gray-100 rounded-md" />
      <div className="h-4 w-1/3 bg-gray-200 rounded mt-6" />
      <div className="h-20 w-full bg-gray-100 rounded-lg" />
    </div>
  );
}

export default function EditorPage() {
  const params = useParams<{ id: string }>();
  const resumeId = params.id as string;
  const router = useRouter();

  const [data, setData] = useState<ResumeData>(emptyResume());
  const [isLoading, setIsLoading] = useState(resumeId !== "new");
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const [activeTab, setActiveTab] = useState<"builder" | "preview" | "settings">("preview");

  const mainRef = useRef<HTMLElement>(null);
  const [scale, setScale] = useState(1);

  const pushToast = useCallback((message: string, variant: "success" | "error") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const effectiveIdRef = useRef(resumeId);

  const dataRef = useRef(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSavingRef = useRef(false);
  const pendingSaveRef = useRef(false);

  const skipNextAutosaveRef = useRef(true);

  const performSave = useCallback(
    async (opts?: { redirectAfter?: boolean }) => {
      if (isSavingRef.current) {
        pendingSaveRef.current = true;
        return;
      }

      isSavingRef.current = true;
      setIsSaving(true);

      let savedOk = true;
      try {
        do {
          pendingSaveRef.current = false;

          try {
            const payload = { ...dataRef.current } as Record<string, unknown>;
            delete payload.id;

            const res = await fetch(`/api/resume/${effectiveIdRef.current}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });

            if (!res.ok) {
              const body = await res.json().catch(() => null);
              throw new Error(body?.error || "Save failed");
            }

            const saved = await res.json();

            if (effectiveIdRef.current === "new" && saved?.id) {
              effectiveIdRef.current = saved.id;
              window.history.replaceState(null, "", `/resume/${saved.id}`);
            }

            setLastSaved(new Date());
          } catch (err) {
            savedOk = false;
            const detail = err instanceof Error ? err.message : "Unknown error";
            pushToast(`Couldn't save: ${detail}`, "error");
            break;
          }
        } while (pendingSaveRef.current);

        if (savedOk && opts?.redirectAfter) {
          pushToast("Resume saved", "success");
          router.push("/dashboard");
        }
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }
    },
    [pushToast, router]
  );

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

  useEffect(() => {
    if (isLoading) return;

    if (skipNextAutosaveRef.current) {
      skipNextAutosaveRef.current = false;
      return;
    }

    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data, isLoading, performSave]);

  useEffect(() => {
    const updateScale = () => {
      if (!mainRef.current) return;
      const padding = 32;
      const containerWidth = mainRef.current.clientWidth - padding;
      const A4_PIXELS = 794;

      if (containerWidth < A4_PIXELS) {
        setScale(containerWidth / A4_PIXELS);
      } else {
        setScale(1);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);

    if (activeTab === 'preview') {
      setTimeout(updateScale, 50);
    }

    return () => window.removeEventListener('resize', updateScale);
  }, [activeTab]);

  const derivedTitle =
    data.jobTitle?.trim() ||
    `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() ||
    "Untitled Resume";

  const titleValue = data.titleIsCustom ? data.title ?? "" : derivedTitle;

  const handleTitleChange = (value: string) => {
    setData((prev) => ({ ...prev, title: value, titleIsCustom: true }));
  };

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${data.firstName || "Resume"}_${data.lastName || ""}`.trim(),
  });

  const handleSave = () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    performSave({ redirectAfter: true });
  };

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSavingRef.current || saveTimeoutRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F7F9FC]">

      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl cursor-pointer" onClick={() => router.push('/dashboard')}>
            <ResumiLogo className="w-8 h-8" />
            <span className="hidden sm:inline">Resumi</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/ai-tools" className="flex items-center gap-1 text-gray-900 font-semibold transition-colors">AI Tools <ChevronDown size={14}/></Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <button className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors"><Bell size={16} /></button>
          <button className="hidden sm:block p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors"><Mail size={16} /></button>
          <div className="flex items-center gap-2 sm:ml-2">
            <UserButton />
          </div>
        </div>
      </header>

      <div className="min-h-14 py-2 bg-white border-b border-gray-200 flex flex-wrap items-center justify-between px-4 shrink-0 z-10 shadow-sm gap-3">
        <div className="flex items-center gap-4 text-gray-500 order-2 md:order-1 w-full md:w-auto justify-between md:justify-start">
          <div className="flex gap-1 border-r border-gray-200 pr-4">
            <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><Undo size={16} /></button>
            <button className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"><Redo size={16} /></button>
          </div>
          <span className="text-xs flex items-center gap-1 italic">
             {isSaving ? "Saving..." : lastSaved ? `Saved at ${lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}` : "Unsaved changes"}
          </span>
        </div>

        <input
          value={titleValue}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder="Untitled Resume"
          aria-label="Resume title"
          className="font-semibold text-gray-800 text-center bg-transparent border border-transparent hover:border-gray-200 focus:border-indigo-400 focus:bg-white rounded-md px-2 py-1 outline-none truncate order-1 md:order-2 w-full md:w-64 md:absolute md:left-1/2 md:-translate-x-1/2"
        />

        <div className="flex gap-2 order-3 md:order-3 w-full md:w-auto justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 lg:px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4 text-gray-500" /> Save
          </button>
          <button
            onClick={() => handlePrint()}
            disabled={isLoading}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-3 lg:px-4 py-2 text-sm font-medium bg-indigo-600 text-white rounded-lg shadow-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            <Share className="w-4 h-4" /> Export
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden relative">
        <aside className={`${activeTab === 'builder' ? 'flex' : 'hidden'} lg:flex w-full lg:w-85 bg-white border-r border-gray-200 overflow-y-auto flex-col shrink-0 absolute lg:relative z-10 h-full left-0`}>
          {isLoading ? <SidebarSkeleton /> : <BuilderSidebar data={data} onChange={setData} />}
        </aside>

        <main
          ref={mainRef}
          className={`${activeTab === 'preview' ? 'flex' : 'hidden'} lg:flex flex-1 overflow-y-auto overflow-x-hidden bg-gray-100/50 flex-col items-center relative w-full`}
        >
          <div
            className="transition-transform duration-200 ease-in-out mt-4 lg:mt-8 shrink-0"
            style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              marginBottom: `${297 * (scale - 1)}mm`
            }}
          >
            {isLoading ? (
              <CanvasSkeleton />
            ) : (
              <div className="animate-in fade-in duration-300">
                <CanvasEditor ref={printRef} data={data} onChange={setData} scale={scale} />
              </div>
            )}
          </div>

          <div className="h-8 lg:h-12 w-full shrink-0"></div>
        </main>

        <aside className={`${activeTab === 'settings' ? 'flex' : 'hidden'} lg:flex w-full lg:w-75 bg-white border-l border-gray-200 overflow-y-auto p-5 flex-col gap-6 shrink-0 absolute lg:relative z-10 h-full right-0`}>
          {isLoading ? <SidebarSkeleton /> : <PropertiesSidebar data={data} onChange={setData} pushToast={pushToast} />}
        </aside>
      </div>

      <div className="lg:hidden flex h-16 bg-white border-t border-gray-200 shrink-0 z-20 w-full justify-around items-center pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('builder')}
          className={`flex flex-col items-center p-2 w-full transition-colors ${activeTab === 'builder' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <PenTool size={20} />
          <span className="text-[10px] mt-1 font-semibold">Build</span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`flex flex-col items-center p-2 w-full transition-colors ${activeTab === 'preview' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Eye size={20} />
          <span className="text-[10px] mt-1 font-semibold">Preview</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center p-2 w-full transition-colors ${activeTab === 'settings' ? 'text-indigo-600' : 'text-gray-500 hover:text-gray-800'}`}
        >
          <Settings size={20} />
          <span className="text-[10px] mt-1 font-semibold">Settings</span>
        </button>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}