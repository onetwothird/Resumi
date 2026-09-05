"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

const STATUSES = [
  { id: "pending", label: "Pending", dot: "bg-amber-500" },
  { id: "reviewing", label: "Reviewing", dot: "bg-blue-500" },
  { id: "interviewing", label: "Interviewing", dot: "bg-purple-500" },
  { id: "hired", label: "Hired", dot: "bg-emerald-500" },
  { id: "rejected", label: "Rejected", dot: "bg-red-500" },
];

export default function StatusSelector({ applicationId, initialStatus }: { applicationId: string, initialStatus: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const current = STATUSES.find((s) => s.id === status) || STATUSES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const updateStatus = async (newStatus: string) => {
    setIsOpen(false);
    if (newStatus === status) return;

    const previousStatus = status;
    setStatus(newStatus);
    setIsLoading(true);

    try {
      const res = await fetch(`/api/applications/${applicationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to update status");
      }
      
      router.refresh(); 
    } catch (error) {
      setStatus(previousStatus); 
      const msg = error instanceof Error ? error.message : "An error occurred";
      alert(`Error: ${msg}`);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative inline-block text-left w-48" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-bold shadow-sm transition-all hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:opacity-50"
      >
        <div className="flex items-center gap-2.5">
          {isLoading ? (
            <Loader2 size={14} className="animate-spin text-gray-400" />
          ) : (
            <span className={`w-2.5 h-2.5 rounded-full ${current.dot} shadow-sm`} />
          )}
          <span className="text-gray-700">{current.label}</span>
        </div>
        <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 w-full mt-2 origin-top-right bg-white border border-gray-100 rounded-xl shadow-lg ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
          <div className="py-1">
            {STATUSES.map((s) => (
              <button
                key={s.id}
                onClick={() => updateStatus(s.id)}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium transition-colors hover:bg-gray-50 ${status === s.id ? "bg-gray-50/50" : ""}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className={status === s.id ? "text-gray-900 font-bold" : "text-gray-600"}>{s.label}</span>
                </div>
                {status === s.id && <Check size={14} className="text-gray-400" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}