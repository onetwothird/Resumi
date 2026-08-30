"use client";
import { useState } from "react";
import {
  ResumeData,
  ResumeTheme,
  DEFAULT_THEME,
  THEME_COLOR_PRESETS,
  THEME_FONT_OPTIONS,
  ResumeLayout,
  ResumeFontSize,
} from "@/types";
import {
  Target,
  Activity,
  CheckCircle,
  AlertTriangle,
  Palette,
  LayoutTemplate,
  Type,
  Check,
} from "lucide-react";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

interface AtsResult {
  score: number;
  recommendations: string[];
}

type Tab = "content" | "design";

const LAYOUTS: { value: ResumeLayout; label: string; description: string }[] = [
  { value: "classic", label: "Classic", description: "Centered header, single column" },
  { value: "modern", label: "Modern", description: "Bold color header band" },
  { value: "minimal", label: "Minimal", description: "Left-aligned, understated" },
];

const FONT_SIZES: { value: ResumeFontSize; label: string }[] = [
  { value: "sm", label: "Compact" },
  { value: "md", label: "Normal" },
  { value: "lg", label: "Large" },
];

export default function ResumeForm({ data, onChange }: Props) {
  const [tab, setTab] = useState<Tab>("content");
  const [isRewriting, setIsRewriting] = useState(false);
  const [rewriteError, setRewriteError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsResult, setAtsResult] = useState<AtsResult | null>(null);
  const [atsError, setAtsError] = useState<string | null>(null);

  const theme = data.theme ?? DEFAULT_THEME;

  const update = (field: keyof ResumeData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const updateTheme = <K extends keyof ResumeTheme>(field: K, value: ResumeTheme[K]) => {
    onChange({ ...data, theme: { ...theme, [field]: value } });
  };

  const rewriteWithAI = async () => {
    if (!data.summary?.trim()) {
      setRewriteError("Write a short summary first, then rewrite it with AI.");
      return;
    }
    setIsRewriting(true);
    setRewriteError(null);
    try {
      const res = await fetch("/api/ai/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: data.summary, jobTitle: data.jobTitle }),
      });
      if (!res.ok) throw new Error("Failed to rewrite");
      const { text } = await res.json();
      if (!text) throw new Error("Empty response");
      update("summary", text);
    } catch {
      setRewriteError("Couldn't rewrite your summary. Please try again.");
    } finally {
      setIsRewriting(false);
    }
  };

  const analyzeATS = async () => {
    setIsAnalyzing(true);
    setAtsError(null);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to analyze");
      const result = await res.json();
      if (typeof result.score !== "number" || !Array.isArray(result.recommendations)) {
        throw new Error("Malformed response");
      }
      setAtsResult(result);
    } catch {
      setAtsError("Could not connect to the ATS analyzer. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-700 bg-green-100 border-green-200";
    if (score >= 60) return "text-yellow-700 bg-yellow-100 border-yellow-200";
    return "text-red-700 bg-red-100 border-red-200";
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit sticky top-0 z-10">
        <button
          onClick={() => setTab("content")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === "content"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Content
        </button>
        <button
          onClick={() => setTab("design")}
          className={`flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
            tab === "design"
              ? "bg-white text-indigo-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          Design
        </button>
      </div>

      {tab === "content" && (
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">First Name</label>
                <input
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={data.firstName}
                  onChange={(e) => update("firstName", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Last Name</label>
                <input
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={data.lastName}
                  onChange={(e) => update("lastName", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Job Title</label>
              <input
                className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                value={data.jobTitle}
                onChange={(e) => update("jobTitle", e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Email</label>
                <input
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={data.email}
                  onChange={(e) => update("email", e.target.value)}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 mb-1 block">Phone</label>
                <input
                  className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                  value={data.phone}
                  onChange={(e) => update("phone", e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Address</label>
              <input
                className="w-full p-2.5 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                value={data.address}
                onChange={(e) => update("address", e.target.value)}
              />
            </div>

            <div className="relative">
              <label className="text-sm font-semibold text-gray-700 mb-1 block">Professional Summary</label>
              <textarea
                rows={6}
                className="w-full p-3 border border-gray-300 rounded-lg text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all shadow-sm"
                value={data.summary}
                onChange={(e) => update("summary", e.target.value)}
              />
              <button
                onClick={rewriteWithAI}
                disabled={isRewriting}
                className="absolute bottom-4 right-4 bg-indigo-600 text-white px-4 py-1.5 text-sm font-medium rounded-md shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                {isRewriting ? "Rewriting..." : "Rewrite with AI ✨"}
              </button>
            </div>
            {rewriteError && (
              <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{rewriteError}</p>
              </div>
            )}
          </div>

          <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-indigo-600" />
                  ATS Optimizer
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Check how well your resume matches ATS algorithms.
                </p>
              </div>
              <button
                onClick={analyzeATS}
                disabled={isAnalyzing}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Activity className="w-4 h-4 animate-spin" /> Analyzing...
                  </>
                ) : (
                  "Scan Resume"
                )}
              </button>
            </div>

            {atsError && (
              <div className="mt-4 p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start gap-2 border border-red-100">
                <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                <p>{atsError}</p>
              </div>
            )}

            {atsResult && !atsError && (
              <div className="mt-6 bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4 mb-5">
                  <div className={`text-2xl font-black px-4 py-2 rounded-xl border ${getScoreColor(atsResult.score)}`}>
                    {atsResult.score}/100
                  </div>
                  <p className="text-sm font-medium text-gray-700">
                    {atsResult.score >= 80
                      ? "Great job! Your resume is highly readable by ATS."
                      : "There's room for improvement to pass ATS filters."}
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Recommendations</h4>
                  <ul className="space-y-2.5">
                    {atsResult.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-start gap-2.5 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <CheckCircle className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        <span className="leading-relaxed">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "design" && (
        <div className="space-y-8">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
              <LayoutTemplate className="w-5 h-5 text-indigo-600" />
              Layout
            </h2>
            <p className="text-sm text-gray-500 mb-4">Choose how your resume is structured.</p>
            <div className="grid grid-cols-3 gap-3">
              {LAYOUTS.map((l) => (
                <button
                  key={l.value}
                  onClick={() => updateTheme("layout", l.value)}
                  className={`relative text-left p-3 rounded-xl border-2 transition-all ${
                    theme.layout === l.value
                      ? "border-indigo-500 bg-indigo-50/60"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  {theme.layout === l.value && (
                    <div className="absolute top-2 right-2 w-4 h-4 rounded-full bg-indigo-600 flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <LayoutSwatch layout={l.value} color={theme.primaryColor} />
                  <p className="text-sm font-semibold text-gray-900 mt-2">{l.label}</p>
                  <p className="text-xs text-gray-500">{l.description}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
              <Palette className="w-5 h-5 text-indigo-600" />
              Accent Color
            </h2>
            <p className="text-sm text-gray-500 mb-4">Used for headings, the name, and section dividers.</p>
            <div className="flex flex-wrap items-center gap-2.5">
              {THEME_COLOR_PRESETS.map((color) => (
                <button
                  key={color}
                  aria-label={color}
                  onClick={() => updateTheme("primaryColor", color)}
                  className="w-8 h-8 rounded-full shadow-sm ring-offset-2 transition-all flex items-center justify-center"
                  style={{
                    backgroundColor: color,
                    boxShadow:
                      theme.primaryColor.toLowerCase() === color.toLowerCase()
                        ? `0 0 0 2px white, 0 0 0 4px ${color}`
                        : undefined,
                  }}
                >
                  {theme.primaryColor.toLowerCase() === color.toLowerCase() && (
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  )}
                </button>
              ))}

              <label className="relative w-8 h-8 rounded-full shadow-sm border border-gray-200 cursor-pointer overflow-hidden flex items-center justify-center bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)]">
                <input
                  type="color"
                  value={theme.primaryColor}
                  onChange={(e) => updateTheme("primaryColor", e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  aria-label="Custom color"
                />
              </label>

              <span className="text-xs font-mono text-gray-500 ml-1">{theme.primaryColor}</span>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-1">
              <Type className="w-5 h-5 text-indigo-600" />
              Font
            </h2>
            <p className="text-sm text-gray-500 mb-4">Applied across the whole resume.</p>
            <div className="grid grid-cols-2 gap-2.5">
              {THEME_FONT_OPTIONS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => updateTheme("fontFamily", f.value)}
                  style={{ fontFamily: f.stack }}
                  className={`text-left px-3.5 py-2.5 rounded-lg border-2 text-sm transition-all ${
                    theme.fontFamily === f.value
                      ? "border-indigo-500 bg-indigo-50/60 text-indigo-900"
                      : "border-gray-200 hover:border-gray-300 text-gray-700"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Text Size</h2>
            <p className="text-sm text-gray-500 mb-4">Fine-tune density and readability.</p>
            <div className="inline-flex bg-gray-100 p-1 rounded-xl">
              {FONT_SIZES.map((s) => (
                <button
                  key={s.value}
                  onClick={() => updateTheme("fontSize", s.value)}
                  className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                    theme.fontSize === s.value
                      ? "bg-white text-indigo-700 shadow-sm"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LayoutSwatch({ layout, color }: { layout: ResumeLayout; color: string }) {
  if (layout === "modern") {
    return (
      <div className="w-full h-16 rounded-md border border-gray-200 overflow-hidden bg-white flex flex-col">
        <div className="h-5 shrink-0" style={{ backgroundColor: color }} />
        <div className="flex-1 p-1.5 space-y-1">
          <div className="h-1 w-3/4 bg-gray-200 rounded-full" />
          <div className="h-1 w-1/2 bg-gray-200 rounded-full" />
        </div>
      </div>
    );
  }
  if (layout === "minimal") {
    return (
      <div className="w-full h-16 rounded-md border border-gray-200 overflow-hidden bg-white p-2 space-y-1.5">
        <div className="h-1.5 w-1/2 bg-gray-800 rounded-full" />
        <div className="h-1 w-1/3 rounded-full" style={{ backgroundColor: color }} />
        <div className="h-1 w-full bg-gray-100 rounded-full mt-2" />
        <div className="h-1 w-full bg-gray-100 rounded-full" />
      </div>
    );
  }
  return (
    <div className="w-full h-16 rounded-md border border-gray-200 overflow-hidden bg-white p-2 flex flex-col items-center">
      <div className="h-1.5 w-1/2 bg-gray-800 rounded-full mt-1" />
      <div className="h-1 w-1/3 bg-gray-300 rounded-full mt-1" />
      <div className="h-px w-full mt-2" style={{ backgroundColor: color }} />
      <div className="h-1 w-full bg-gray-100 rounded-full mt-1.5" />
    </div>
  );
}