"use client";

import { useState } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { ResumeData } from "@/types";

interface PdfUploaderProps {
  /**
   * Called with the parsed resume once the PDF has been read.
   *
   * May return a promise: the parent creates the resume and navigates, and
   * this component awaits it so the scanning state covers the whole import
   * and any failure is reported through `pushToast` rather than swallowed.
   */
  onScanComplete: (data: Partial<ResumeData>) => void | Promise<void>;
  pushToast: (message: string, variant: "success" | "error" | "info") => void;
  /** Set while the parent is still turning the parsed data into a resume. */
  disabled?: boolean;
}

export default function PdfUploader({ onScanComplete, pushToast, disabled = false }: PdfUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Stay in the scanning visual until the parent has finished creating the
  // resume, so the tile does not look idle while the POST is in flight.
  const isBusy = isScanning || disabled;

  const processFile = async (file: File) => {
    if (isBusy) return;

    if (file.type !== "application/pdf") {
      pushToast("Please upload a PDF file.", "error");
      return;
    }

    // Mirrors the server-side limit in /api/ai/parse-pdf so the user gets an
    // instant message instead of uploading 40MB before being rejected.
    if (file.size > 10 * 1024 * 1024) {
      pushToast("That PDF is larger than 10 MB.", "error");
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
        // TEMP DEBUG: include full response for diagnosis
        const detail = typeof parsedData === "object" && parsedData !== null
          ? JSON.stringify(parsedData)
          : String(parsedData);
        throw new Error(`Server ${res.status}: ${parsedData?.error || detail}`);
      }

      // The parent creates the resume and navigates, and rethrows on failure.
      // Awaiting it means a create error surfaces here as one toast rather
      // than an unhandled rejection, and the spinner covers the whole import.
      await onScanComplete(parsedData);
    } catch (error) {
      console.error("PDF import failed:", error);
      const message = error instanceof Error ? error.message : "Could not import that PDF.";
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
      } ${isBusy ? "pointer-events-none opacity-70" : ""}`}
    >
      <input
        type="file"
        accept="application/pdf"
        onChange={(e) => {
          const file = e.target.files?.[0];
          // Reset so re-picking the same file fires change again.
          e.target.value = "";
          if (file) processFile(file);
        }}
        className="hidden"
        disabled={isBusy}
      />

      {isBusy ? (
        <div className="flex flex-col items-center text-indigo-600">
          <Loader2 className="w-10 h-10 animate-spin mb-3" />
          <p className="font-bold text-indigo-700 text-base">Importing…</p>
          <p className="text-xs text-indigo-400 mt-0.5">
            {isScanning ? "Reading your PDF" : "Creating your resume"}
          </p>
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