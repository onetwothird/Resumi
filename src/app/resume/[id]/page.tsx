"use client";

import { useState, useRef } from "react";
import { UserButton } from "@clerk/nextjs";
import ResumeForm from "@/components/resume/ResumeForm";
import ResumePreview from "@/components/resume/ResumePreview";
import { ResumeData } from "@/types";

export default function EditorPage({ params }: { params: { id: string } }) {
  const previewRef = useRef<HTMLDivElement>(null);
  
  // Master State
  const [data, setData] = useState<ResumeData>({
    firstName: "Noah",
    lastName: "Sebastian",
    jobTitle: "UI/UX Designer",
    email: "noah@gmail.com",
    phone: "+62 890 8002 2435",
    address: "Surakarta, Indonesia",
    summary: "UI/UX Designer with 5+ years of experience...",
  });

  const handleExport = async () => {
    if (!previewRef.current) return;
    const html2pdf = (await import("html2pdf.js")).default;
    html2pdf().from(previewRef.current).save(`${data.firstName}_Resume.pdf`);
  };

  const handleSave = async () => {
    await fetch(`/api/resume/${params.id}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    alert("Saved!");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-50">
      <header className="h-16 bg-white border-b flex justify-between items-center px-6">
        <h1 className="font-bold text-indigo-600">Resumi Editor</h1>
        <div className="flex gap-4 items-center">
          <button onClick={handleSave} className="px-4 py-2 border rounded-md text-sm font-medium">Save</button>
          <button onClick={handleExport} className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium">Export PDF</button>
          <UserButton />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Side: Form */}
        <div className="w-1/2 p-6 overflow-y-auto bg-white border-r">
          <ResumeForm data={data} onChange={setData} />
        </div>
        
        {/* Right Side: Preview */}
        <div className="w-1/2 p-8 bg-gray-200 overflow-y-auto flex justify-center">
          <ResumePreview data={data} ref={previewRef} />
        </div>
      </div>
    </div>
  );
}