"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Calendar,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
} from "lucide-react";
import { ResumeListItem } from "../../types/dashboard";
import { formatRelativeDate } from "../../lib/format";

interface ResumeCardProps {
  resume: ResumeListItem;
  isBusy?: boolean;
  onRename: (id: string, title: string) => void;
  onDuplicate: (id: string) => void;
  onDeleteRequest: (id: string, title: string) => void;
}

export default function ResumeCard({
  resume,
  isBusy = false,
  onRename,
  onDuplicate,
  onDeleteRequest,
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
      className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl h-80 p-6 hover:shadow-xl hover:shadow-gray-200/50 dark:hover:shadow-black/50 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between group relative ${
        isBusy ? "opacity-60 pointer-events-none" : ""
      }`}
    >
      {/* Kebab menu trigger */}
      <div className="absolute top-4 right-4 z-10" ref={menuRef}>
        <button
          onClick={(e) => {
            e.preventDefault();
            setMenuOpen((v) => !v);
          }}
          aria-label="Resume actions"
          aria-expanded={menuOpen}
          className={`w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-200 transition-all ${
            menuOpen
              ? "opacity-100 bg-gray-100 dark:bg-gray-800"
              : "opacity-0 group-hover:opacity-100 focus:opacity-100"
          }`}
        >
          <MoreVertical size={16} />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-1 w-44 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-lg py-1.5 overflow-hidden">
            <button
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                setDraftTitle(resume.title);
                setIsEditingTitle(true);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Pencil size={14} /> Rename
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                onDuplicate(resume.id);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              <Copy size={14} /> Duplicate
            </button>
            <div className="h-px bg-gray-100 dark:bg-gray-800 my-1" />
            <button
              onClick={(e) => {
                e.preventDefault();
                setMenuOpen(false);
                onDeleteRequest(resume.id, displayTitle);
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        )}
      </div>

      <Link href={`/resume/${resume.id}`} className="flex flex-col h-full">
        <div>
          <div className="bg-gray-100 dark:bg-gray-800 w-12 h-12 rounded-xl flex items-center justify-center text-gray-500 dark:text-gray-400 mb-5 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
            <FileText size={24} />
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
              className="w-full font-bold text-xl text-gray-900 dark:text-white mb-2 bg-transparent border-b-2 border-indigo-500 outline-none pb-0.5"
            />
          ) : (
            <h3 className="font-bold text-xl text-gray-900 dark:text-white mb-2 line-clamp-1 pr-6">
              {displayTitle}
            </h3>
          )}

          <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-3 leading-relaxed">
            {resume.summary ||
              "No professional summary added yet. Open this resume to write one with AI."}
          </p>
        </div>

        <div className="flex items-center justify-between text-xs font-medium text-gray-400 dark:text-gray-500 border-t border-gray-100 dark:border-gray-800 pt-5 mt-4">
          <div className="flex items-center gap-1.5">
            <Calendar size={14} />
            <span>Edited {formatRelativeDate(resume.updatedAt)}</span>
          </div>
        </div>
      </Link>
    </div>
  );
}