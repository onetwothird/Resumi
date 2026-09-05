"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Briefcase, FileText, Loader2, ArrowRight } from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";
import { ToastStack, ToastItem } from "@/components/ui/Toast";

type Role = "jobseeker" | "employer";

interface RoleOption {
  role: Role;
  title: string;
  desc: string;
  icon: typeof Briefcase;
  redirectTo: string;
}

const ROLE_OPTIONS: RoleOption[] = [
  {
    role: "jobseeker",
    title: "I'm looking for a job",
    desc: "Build a resume, tailor it to postings, and track your applications.",
    icon: FileText,
    redirectTo: "/dashboard",
  },
  {
    role: "employer",
    title: "I'm hiring",
    desc: "Post open roles and manage your job listings.",
    icon: Briefcase,
    redirectTo: "/employer/dashboard",
  },
];

export default function OnboardingClient() {
  const { getToken } = useAuth();
  const [selecting, setSelecting] = useState<Role | null>(null);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [pendingRedirect, setPendingRedirect] = useState<string | null>(null);

  const nextToastId = useRef(0);

  const pushToast = (message: string, variant: "success" | "error") => {
    nextToastId.current += 1;
    const id = nextToastId.current;
    setToasts((prev) => [...prev, { id, message, variant }]);
  };
  const dismissToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  useEffect(() => {
    if (pendingRedirect) {
      window.location.href = pendingRedirect;
    }
  }, [pendingRedirect]);

  const chooseRole = async (option: RoleOption) => {
    if (selecting) return; 
    setSelecting(option.role);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    try {
      const res = await fetch("/api/user/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: option.role }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`Request failed (${res.status}): ${detail || "no response body"}`);
      }

      await getToken({ skipCache: true });

      setPendingRedirect(option.redirectTo);
    } catch (err) {
      clearTimeout(timeoutId);
      const isTimeout = err instanceof Error && err.name === "AbortError";
      console.error("Role save failed:", err);
      pushToast(
        isTimeout
          ? "Timed out after 15s waiting for the server. Check your terminal — something is likely hanging on the Clerk API call."
          : `Couldn't save your choice: ${err instanceof Error ? err.message : "unknown error"}`,
        "error"
      );
      setSelecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col items-center justify-center px-6 py-16">
      <div className="flex items-center gap-2 font-bold text-indigo-600 text-xl mb-10">
        <ResumiLogo className="w-8 h-8" />
        Resumi
      </div>

      <div className="text-center mb-10 max-w-md">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
          What brings you to Resumi?
        </h1>
        <p className="text-sm text-slate-500">
          This decides which dashboard you land on. Pick the one that fits what you need today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-2xl">
        {ROLE_OPTIONS.map((option) => {
          const isSelecting = selecting === option.role;
          const disabled = selecting !== null;
          return (
            <button
              key={option.role}
              onClick={() => chooseRole(option)}
              disabled={disabled}
              className={`group relative text-left bg-white border rounded-2xl p-6 shadow-sm transition-all duration-200 ${
                disabled
                  ? "opacity-60 cursor-not-allowed border-slate-200"
                  : "border-slate-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5"
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-5">
                <option.icon className="w-6 h-6 text-indigo-600" />
              </div>
              <h3 className="text-base font-bold text-slate-900 mb-1.5">{option.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mb-4">{option.desc}</p>
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600">
                {isSelecting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Setting up...
                  </>
                ) : (
                  <>
                    Continue{" "}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </span>
            </button>
          );
        })}
      </div>

      <ToastStack toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}