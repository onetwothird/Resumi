// C:\resumi\src\components\dashboard\DashboardClient.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Plus, Search, FileX2, FilePlus2 } from "lucide-react";
import { ResumeListItem } from "@/types/dashboard";
import { formatRelativeDate } from "@/lib/format";
import ResumeCard from "@/components/dashboard/ResumeCard";
import HiringRoadmap from "@/components/dashboard/HiringRoadmap";
import ConfirmModal from "@/components/ui/ConfirmModal";
import { ToastStack, ToastItem } from "@/components/ui/Toast";

type SortOption = "updated" | "created" | "name";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "updated", label: "Last edited" },
  { value: "created", label: "Newest" },
  { value: "name", label: "Name A–Z" },
];

interface DashboardClientProps {
  initialResumes: ResumeListItem[];
}

export default function DashboardClient({ initialResumes }: DashboardClientProps) {
  const [resumes, setResumes] = useState<ResumeListItem[]>(initialResumes);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("updated");
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const pushToast = (message: string, variant: "success" | "error") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);
  };

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

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
        return (
          title.toLowerCase().includes(q) || (r.jobTitle || "").toLowerCase().includes(q)
        );
      });
    }

    return [...list].sort((a, b) => {
      if (sortBy === "name") {
        const an = (a.title !== "My Resume" ? a.title : a.jobTitle) || "";
        const bn = (b.title !== "My Resume" ? b.title : b.jobTitle) || "";
        return an.localeCompare(bn);
      }
      if (sortBy === "created") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [resumes, query, sortBy]);

  const mostRecentEdit = useMemo(() => {
    if (resumes.length === 0) return null;
    return resumes.reduce((latest, r) =>
      new Date(r.updatedAt) > new Date(latest.updatedAt) ? r : latest
    );
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

  const requestDelete = (id: string, title: string) => {
    setDeleteTarget({ id, title });
  };

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
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-1">
            My Resumes
          </h1>
          <p className="text-sm text-gray-500">
            {hasResumes ? (
              <>
                {resumes.length} resume{resumes.length === 1 ? "" : "s"}
                {mostRecentEdit && (
                  <> · last edited {formatRelativeDate(mostRecentEdit.updatedAt)}</>
                )}
              </>
            ) : (
              "Manage, edit, and export your tailored resumes."
            )}
          </p>
        </div>

        {hasResumes && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
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
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Empty State Redesign */}
      {!hasResumes && (
        <div className="bg-white flex flex-col items-center justify-center text-center py-20 px-6 border-2 border-dashed border-gray-200 rounded-2xl shadow-xs">
          <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 mb-4">
            <FilePlus2 size={26} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Start your first resume
          </h2>
          <p className="text-sm text-gray-500 max-w-sm mb-6 leading-relaxed">
            Build a tailored, ATS-friendly resume in minutes and export it as a polished PDF.
          </p>
          <Link
            href="/resume/new"
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md"
          >
            <Plus size={18} /> Create resume
          </Link>
        </div>
      )}

      {/* Search No Results */}
      {hasResumes && !hasResults && (
        <div className="bg-white flex flex-col items-center justify-center text-center py-20 rounded-2xl border border-gray-200 shadow-xs">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 mb-3">
            <FileX2 size={22} />
          </div>
          <h3 className="text-base font-semibold text-gray-900 mb-1">
            No resumes match &ldquo;{query}&rdquo;
          </h3>
          <p className="text-sm text-gray-500 mb-4">Try a different search term.</p>
          <button
            onClick={() => setQuery("")}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
          >
            Clear search
          </button>
        </div>
      )}

      {/* Grid View */}
      {hasResumes && hasResults && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <Link
            href="/resume/new"
            className="group flex flex-col items-center justify-center h-80 bg-white border-2 border-dashed border-indigo-200 rounded-2xl hover:bg-indigo-50/40 hover:border-indigo-500 transition-all duration-200 cursor-pointer shadow-xs"
          >
            <div className="w-12 h-12 rounded-full bg-indigo-600 flex items-center justify-center text-white mb-3 group-hover:scale-105 transition-transform">
              <Plus size={24} strokeWidth={2.5} />
            </div>
            <p className="font-bold text-indigo-700 text-base">Create New Resume</p>
            <p className="text-xs text-indigo-400 mt-0.5">Start from scratch</p>
          </Link>

          {filteredAndSorted.map((resume) => (
            <ResumeCard
              key={resume.id}
              resume={resume}
              isBusy={busyIds.has(resume.id)}
              onRename={handleRename}
              onDuplicate={handleDuplicate}
              onDeleteRequest={requestDelete}
            />
          ))}
        </div>
      )}

      {/* Hiring Roadmap Component */}
      <HiringRoadmap hasResumes={hasResumes} />

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