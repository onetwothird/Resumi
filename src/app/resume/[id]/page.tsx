"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
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

/** Modal shown when the user tries to leave with unsaved edits. */
function UnsavedChangesModal({
  open,
  isSaving,
  onSaveAndLeave,
  onDiscard,
  onCancel,
}: {
  open: boolean;
  isSaving: boolean;
  onSaveAndLeave: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-150">
        <h2 className="text-base font-bold text-gray-900 mb-1.5">You have unsaved changes</h2>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          If you leave now, the changes you made won&rsquo;t be saved. Do you want to save before leaving?
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onSaveAndLeave}
            disabled={isSaving}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save & leave"}
          </button>
          <button
            onClick={onDiscard}
            disabled={isSaving}
            className="w-full py-2.5 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            Discard changes
          </button>
          <button
            onClick={onCancel}
            disabled={isSaving}
            className="w-full py-2 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
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

  // Manual save only — no autosave. This flag is the single source of
  // truth for "does the user have edits that haven't been persisted yet".
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const hasUnsavedChangesRef = useRef(false);
  useEffect(() => {
    hasUnsavedChangesRef.current = hasUnsavedChanges;
  }, [hasUnsavedChanges]);

  // Where the "leave anyway?" modal should send the user once they've
  // either saved or explicitly discarded their changes.
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const pendingNavigationRef = useRef<(() => void) | null>(null);

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

  const isSavingRef = useRef(false);

  // Every place that used to hand off a plain `setData` to a child now goes
  // through this instead, so editing anything automatically marks the
  // resume dirty. The initial fetch below calls `setData` directly (not
  // this), so loading a resume from the server never itself counts as an
  // "unsaved change".
  const updateData = useCallback((next: ResumeData) => {
    setData(next);
    setHasUnsavedChanges(true);
  }, []);

  const performSave = useCallback(
    async (opts?: { redirectAfter?: boolean }): Promise<boolean> => {
      if (isSavingRef.current) return false;

      isSavingRef.current = true;
      setIsSaving(true);

      let savedOk = true;
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
        setHasUnsavedChanges(false);

        if (opts?.redirectAfter) {
          pushToast("Resume saved", "success");
          router.push("/dashboard");
        }
      } catch (err) {
        savedOk = false;
        const detail = err instanceof Error ? err.message : "Unknown error";
        pushToast(`Couldn't save: ${detail}`, "error");
      } finally {
        isSavingRef.current = false;
        setIsSaving(false);
      }

      return savedOk;
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
    updateData({ ...dataRef.current, title: value, titleIsCustom: true });
  };

  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${data.firstName || "Resume"}_${data.lastName || ""}`.trim(),
  });

  const handleSave = () => {
    performSave({ redirectAfter: true });
  };

  // Native browser warning for hard exits (tab close, refresh, typing a
  // new URL) — this is the one case a custom modal can't cover, since the
  // browser tears the page down before any of our own code can run.
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChangesRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  // Routes through the "unsaved changes" modal when there's something to
  // lose; otherwise just runs the navigation immediately. Every in-app
  // exit point (logo, nav links, browser back button) should call this
  // instead of navigating directly.
  const attemptNavigation = useCallback((navigate: () => void) => {
    if (!hasUnsavedChangesRef.current) {
      navigate();
      return;
    }
    pendingNavigationRef.current = navigate;
    setIsLeaveModalOpen(true);
  }, []);

  const handleSaveAndLeave = async () => {
    const ok = await performSave();
    if (ok) {
      setIsLeaveModalOpen(false);
      pendingNavigationRef.current?.();
      pendingNavigationRef.current = null;
    }
    // If the save failed, performSave already surfaced a toast — leave the
    // modal open so the user doesn't lose their only warning that the
    // save didn't go through.
  };

  const handleDiscardAndLeave = () => {
    setHasUnsavedChanges(false);
    setIsLeaveModalOpen(false);
    pendingNavigationRef.current?.();
    pendingNavigationRef.current = null;
  };

  const handleCancelLeave = () => {
    setIsLeaveModalOpen(false);
    pendingNavigationRef.current = null;
  };

  // Best-effort interception of the browser's own Back/Forward buttons.
  // The browser has already changed the URL by the time `popstate` fires,
  // so we immediately re-push the current URL to cancel that navigation,
  // then route the real "go back" action through the same confirmation
  // flow as everything else.
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    window.history.pushState(null, "", window.location.href);

    const handlePopState = () => {
      window.history.pushState(null, "", window.location.href);
      attemptNavigation(() => router.back());
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [hasUnsavedChanges, attemptNavigation, router]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#F7F9FC]">

      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 shrink-0 z-20">
        <div className="flex items-center gap-4 lg:gap-8">
          <div
            className="flex items-center gap-2 font-bold text-indigo-600 text-xl cursor-pointer"
            onClick={() => attemptNavigation(() => router.push('/dashboard'))}
          >
            <ResumiLogo className="w-8 h-8" />
            <span className="hidden sm:inline">Resumi</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <button
              onClick={() => attemptNavigation(() => router.push('/dashboard'))}
              className="hover:text-gray-900 transition-colors"
            >
              Home
            </button>
            <button
              onClick={() => attemptNavigation(() => router.push('/ai-tools'))}
              className="flex items-center gap-1 text-gray-900 font-semibold transition-colors"
            >
              AI Tools <ChevronDown size={14}/>
            </button>
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
             {isSaving
               ? "Saving..."
               : hasUnsavedChanges
               ? "Unsaved changes"
               : lastSaved
               ? `Saved at ${lastSaved.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`
               : "Unsaved changes"}
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
          {isLoading ? <SidebarSkeleton /> : <BuilderSidebar data={data} onChange={updateData} />}
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
                <CanvasEditor ref={printRef} data={data} onChange={updateData} scale={scale} />
              </div>
            )}
          </div>

          <div className="h-8 lg:h-12 w-full shrink-0"></div>
        </main>

        <aside className={`${activeTab === 'settings' ? 'flex' : 'hidden'} lg:flex w-full lg:w-75 bg-white border-l border-gray-200 overflow-y-auto p-5 flex-col gap-6 shrink-0 absolute lg:relative z-10 h-full right-0`}>
          {isLoading ? <SidebarSkeleton /> : <PropertiesSidebar data={data} onChange={updateData} pushToast={pushToast} />}
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

      <UnsavedChangesModal
        open={isLeaveModalOpen}
        isSaving={isSaving}
        onSaveAndLeave={handleSaveAndLeave}
        onDiscard={handleDiscardAndLeave}
        onCancel={handleCancelLeave}
      />

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}