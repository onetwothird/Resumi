"use client";

import { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { ResumeData } from "@/types";

interface PdfUploaderProps {
  onScanComplete: (data: Partial<ResumeData>) => void;
  pushToast: (message: string, variant: "success" | "error" | "info") => void;
}

export default function PdfUploader({ onScanComplete, pushToast }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  const processFile = async (file: File) => {
    if (file.type !== "application/pdf") {
      pushToast("Please upload a PDF file.", "error");
      return;
    }

    setIsScanning(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/ai/parse-pdf", {
        method: "POST",
        body: formData,
      });
      
      const parsedData = await res.json();

      if (!res.ok) {
        throw new Error(parsedData?.error || `Failed to scan PDF (status ${res.status})`);
      }

      pushToast("Resume imported successfully!", "success");
      onScanComplete(parsedData);
    } catch (error) {
      console.error("Scanning failed:", error);
      const message = error instanceof Error ? error.message : "Could not scan the PDF.";
      pushToast(message, "error");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <label
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); if (e.dataTransfer.files[0]) processFile(e.dataTransfer.files[0]); }}
      className={`group flex flex-col items-center justify-center h-80 bg-white border-2 border-dashed rounded-2xl transition-all duration-200 cursor-pointer shadow-xs ${
        isDragging ? "border-indigo-500 bg-indigo-50/50" : "border-indigo-200 hover:bg-indigo-50/40 hover:border-indigo-500"
      } ${isScanning ? "pointer-events-none" : ""}`}
    >
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
        className="hidden"
        disabled={isScanning}
      />
      
      {isScanning ? (
        <div className="flex flex-col items-center text-indigo-600">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          <p className="font-bold text-indigo-700 text-base">Reading PDF...</p>
          <p className="text-xs text-indigo-400 mt-0.5">Extracting your details</p>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 mb-3 group-hover:scale-105 group-hover:bg-indigo-600 group-hover:text-white transition-all">
            <UploadCloud size={24} strokeWidth={2.5} />
          </div>
          <p className="font-bold text-indigo-700 text-base">Upload Existing</p>
          <p className="text-xs text-indigo-400 mt-0.5">Import from PDF</p>
        </div>
      )}
    </label>
  );
}