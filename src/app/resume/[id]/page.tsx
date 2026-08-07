"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useReactToPrint } from "react-to-print";
import { Loader2 } from "lucide-react";
import ResumeForm from "@/components/resume/ResumeForm";
import ResumePreview from "@/components/resume/ResumePreview";
import { ToastStack, ToastItem } from "@/components/ui/Toast";
import { ResumeData, DEFAULT_THEME } from "@/types";

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
  const resumeId = params.id;
  const router = useRouter();

  const [data, setData] = useState<ResumeData>(emptyResume());
  const [isLoading, setIsLoading] = useState(resumeId !== "new");
  const [isSaving, setIsSaving] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const pushToast = useCallback((message: string, variant: "success" | "error") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load an existing resume when editing (not needed for a brand new one)
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

  // Create a reference to the preview component
  const printRef = useRef<HTMLDivElement>(null);

  // Configure the print action
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${data.firstName || "Resume"}_${data.lastName || ""}`.trim(),
  });

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, ...payload } = data;
      const res = await fetch(`/api/resume/${resumeId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      pushToast("Resume saved", "success");

      // First save of a brand-new resume: move to its real URL so future
      // saves and reloads target the right record.
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
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-100">
      {/* Top Navbar */}
      <header className="h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
        <h1 className="font-bold text-indigo-600">Resumi Editor</h1>
        <div className="flex gap-3">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm border rounded hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isSaving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={() => handlePrint()}
            className="px-4 py-2 text-sm bg-indigo-600 text-white rounded shadow hover:bg-indigo-700 transition-colors"
          >
            Export PDF
          </button>
        </div>
      </header>

      {/* Editor Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Form Panel */}
        <div className="flex-1 overflow-y-auto p-8 bg-white border-r">
          <ResumeForm data={data} onChange={setData} />
        </div>

        {/* Right Preview Panel */}
        <div className="flex-1 overflow-y-auto p-8 flex justify-center bg-gray-200">
          <ResumePreview ref={printRef} data={data} />
        </div>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}