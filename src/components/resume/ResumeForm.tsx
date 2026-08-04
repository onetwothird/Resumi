"use client";
import { useState } from "react";
import { ResumeData } from "@/types";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

export default function ResumeForm({ data, onChange }: Props) {
  const [isRewriting, setIsRewriting] = useState(false);

  const update = (field: keyof ResumeData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const rewriteWithAI = async () => {
    setIsRewriting(true);
    const res = await fetch("/api/ai/rewrite", {
      method: "POST",
      body: JSON.stringify({ text: data.summary, jobTitle: data.jobTitle }),
    });
    const { text } = await res.json();
    update("summary", text);
    setIsRewriting(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-bold">Personal Information</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm text-gray-500 mb-1 block">First Name</label>
          <input className="w-full p-2 border rounded" value={data.firstName} onChange={(e) => update("firstName", e.target.value)} />
        </div>
        <div>
          <label className="text-sm text-gray-500 mb-1 block">Last Name</label>
          <input className="w-full p-2 border rounded" value={data.lastName} onChange={(e) => update("lastName", e.target.value)} />
        </div>
      </div>

      <div>
        <label className="text-sm text-gray-500 mb-1 block">Job Title</label>
        <input className="w-full p-2 border rounded" value={data.jobTitle} onChange={(e) => update("jobTitle", e.target.value)} />
      </div>

      <div className="relative">
        <label className="text-sm text-gray-500 mb-1 block">Professional Summary</label>
        <textarea rows={6} className="w-full p-3 border rounded" value={data.summary} onChange={(e) => update("summary", e.target.value)} />
        <button 
          onClick={rewriteWithAI}
          disabled={isRewriting}
          className="absolute bottom-4 right-4 bg-indigo-500 text-white px-3 py-1 text-sm rounded shadow hover:bg-indigo-600 disabled:opacity-50"
        >
          {isRewriting ? "Rewriting..." : "Rewrite with AI ✨"}
        </button>
      </div>
    </div>
  );
}