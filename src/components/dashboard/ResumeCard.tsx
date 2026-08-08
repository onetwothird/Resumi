// C:\resumi\src\components\dashboard\ResumeCard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FileText, Calendar, MoreVertical, Pencil, Copy, Trash2, Share2, Sparkles } from "lucide-react";
import { ResumeListItem } from "@/types/dashboard";
import { formatRelativeDate } from "@/lib/format";

interface ResumeCardProps {
  resume: ResumeListItem;
  isBusy?: boolean;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string, title: string) => void;
  pushToast: (msg: string, v: "success"|"info") => void;
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
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayTitle =
    resume.title && resume.title !== "My Resume"
      ? resume.title
      : resume.jobTitle || "Untitled resume";

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

  return (
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
            <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); pushToast("Shareable link copied to clipboard!", "success"); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-indigo-600 transition-colors">
              <Share2 size={14} /> Share Link
            </button>
            <button onClick={(e) => { e.preventDefault(); setMenuOpen(false); pushToast("AI Analysis started in the background...", "info"); }} className="w-full flex items-center gap-3 px-4 py-2 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 transition-colors">
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

        <div className="flex items-center justify-between text-xs font-medium text-gray-400 border-t border-gray-100 pt-4">
          <div className="flex items-center gap-1.5">
            <Calendar size={13} />
            <span>Edited {formatRelativeDate(resume.updatedAt)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}