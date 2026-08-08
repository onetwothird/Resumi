// src/components/resume/PropertiesSidebar.tsx
import { useState } from "react";
import { ResumeData, ResumeTheme, DEFAULT_THEME, THEME_COLOR_PRESETS, THEME_FONT_OPTIONS, ResumeLayout, ResumeFontSize } from "@/types";
import { Sparkles, Activity, LayoutTemplate, Palette, Type, Check } from "lucide-react";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  pushToast: (msg: string, variant: "success" | "error") => void;
}

const LAYOUTS: { value: ResumeLayout; label: string; }[] = [
  { value: "classic", label: "Classic" },
  { value: "modern", label: "Modern" },
  { value: "minimal", label: "Minimal" },
];

export default function PropertiesSidebar({ data, onChange, pushToast }: Props) {
  const theme = data.theme ?? DEFAULT_THEME;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);

  const updateTheme = <K extends keyof ResumeTheme>(field: K, value: ResumeTheme[K]) => {
    onChange({ ...data, theme: { ...theme, [field]: value } });
  };

  const analyzeATS = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to analyze");
      const result = await res.json();
      setAtsScore(result.score);
      pushToast("ATS Analysis complete!", "success");
    } catch {
      pushToast("Could not connect to ATS analyzer.", "error");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <>
      {/* AI Skill Alignment Card */}
      <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-2">
           <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
             <Sparkles size={16}/> AI Alignment
           </div>
           {atsScore && <span className="text-xs font-bold bg-white px-2 py-1 rounded text-indigo-700">{atsScore}/100</span>}
        </div>
        <p className="text-xs text-gray-600 mb-4 leading-relaxed">
          {atsScore ? "Your resume is analyzed. Check suggestions below." : "Check how well your resume matches ATS algorithms."}
        </p>
        <button 
          onClick={analyzeATS} 
          disabled={isAnalyzing}
          className="w-full py-2 bg-indigo-600 rounded-xl text-sm font-medium text-white shadow-sm hover:bg-indigo-700 disabled:opacity-50 flex justify-center items-center gap-2"
        >
          {isAnalyzing ? <><Activity className="w-4 h-4 animate-spin"/> Scanning...</> : "Scan Resume"}
        </button>
      </div>

      <hr className="border-gray-100" />

      {/* Theme Controls */}
      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <LayoutTemplate size={16} className="text-gray-400" /> Layout
          </h3>
          <div className="grid grid-cols-3 gap-2">
            {LAYOUTS.map((l) => (
              <button
                key={l.value}
                onClick={() => updateTheme("layout", l.value)}
                className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all ${
                  theme.layout === l.value
                    ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Type size={16} className="text-gray-400" /> Typography
          </h3>
          <select 
            value={theme.fontFamily} 
            onChange={(e) => updateTheme("fontFamily", e.target.value)}
            className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-white mb-2 outline-none focus:border-indigo-500"
          >
             {THEME_FONT_OPTIONS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
          </select>
          <div className="flex bg-gray-100 p-1 rounded-lg">
             {(['sm', 'md', 'lg'] as ResumeFontSize[]).map(size => (
                <button
                  key={size}
                  onClick={() => updateTheme("fontSize", size)}
                  className={`flex-1 py-1 text-xs font-medium rounded-md capitalize ${theme.fontSize === size ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}
                >
                  {size}
                </button>
             ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Palette size={16} className="text-gray-400" /> Colors
          </h3>
          <div className="flex flex-wrap gap-2">
            {THEME_COLOR_PRESETS.map((color) => (
              <button
                key={color}
                onClick={() => updateTheme("primaryColor", color)}
                className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center transition-all"
                style={{ backgroundColor: color }}
              >
                {theme.primaryColor.toLowerCase() === color.toLowerCase() && <Check className="w-4 h-4 text-white drop-shadow-md" />}
              </button>
            ))}
            <label className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center bg-[conic-gradient(red,yellow,lime,cyan,blue,magenta,red)] cursor-pointer">
              <input type="color" value={theme.primaryColor} onChange={(e) => updateTheme("primaryColor", e.target.value)} className="opacity-0 w-0 h-0" />
            </label>
          </div>
        </div>
      </div>
    </>
  );
}