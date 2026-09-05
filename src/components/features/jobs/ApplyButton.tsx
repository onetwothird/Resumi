"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Send } from "lucide-react";

interface ResumeOption {
  id: string;
  title: string;
}

interface Props {
  jobId: string;
  resumes: ResumeOption[];
  isLoggedIn: boolean;
}

export default function ApplyButton({ jobId, resumes, isLoggedIn }: Props) {
  const router = useRouter();
  const [selectedResume, setSelectedResume] = useState(resumes[0]?.id || "");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleApply = async () => {
    if (!isLoggedIn) {
      router.push("/sign-in");
      return;
    }

    setIsLoading(true);
    setStatus("idle");
    setErrorMsg("");

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeId: selectedResume || null }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to submit application.");
      }

      setStatus("success");
    } catch (err: unknown) {
      setStatus("error");
      if (err instanceof Error) {
        setErrorMsg(err.message);
      } else {
        setErrorMsg("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "success") {
    return (
      <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-4 rounded-2xl flex flex-col items-center justify-center gap-2 text-center">
        <CheckCircle size={24} className="text-emerald-500 mb-1" />
        <div className="font-bold text-sm">Application Submitted!</div>
        <div className="text-xs font-medium text-emerald-600">The employer will review your profile shortly.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {resumes.length > 0 ? (
        <div>
          <label className="text-xs font-bold text-gray-700 mb-1.5 block">Select Resume to Attach</label>
          <select
            value={selectedResume}
            onChange={(e) => setSelectedResume(e.target.value)}
            className="w-full text-sm border-gray-200 rounded-xl focus:ring-indigo-500 focus:border-indigo-500 p-3 bg-gray-50"
          >
            <option value="">Don&apos;t attach a resume</option>
            {resumes.map(r => (
              <option key={r.id} value={r.id}>{r.title}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="text-xs text-amber-600 bg-amber-50 p-3 rounded-xl font-medium">
          You don&apos;t have any resumes built yet. You can apply without one, but creating one is recommended.
        </div>
      )}

      <button
        onClick={handleApply}
        disabled={isLoading}
        className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-sm hover:shadow-md text-sm flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
      >
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {isLoading ? "Submitting..." : "Apply Now"}
      </button>

      {status === "error" && (
        <p className="text-red-600 text-xs font-semibold text-center bg-red-50 p-2 rounded-lg">{errorMsg}</p>
      )}
    </div>
  );
}