/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { ResumeData, ResumeTheme, DEFAULT_THEME, THEME_COLOR_PRESETS, ResumeFontSize } from "@/types";
import { Sparkles, Activity, Palette, Type, Check, Image as ImageIcon, Upload, X } from "lucide-react";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  pushToast: (msg: string, variant: "success" | "error") => void;
}

const EXTENDED_FONTS = [
  { value: "inter", label: "Inter", stack: "'Inter', sans-serif" },
  { value: "roboto", label: "Roboto", stack: "'Roboto', sans-serif" },
  { value: "opensans", label: "Open Sans", stack: "'Open Sans', sans-serif" },
  { value: "lato", label: "Lato", stack: "'Lato', sans-serif" },
  { value: "montserrat", label: "Montserrat", stack: "'Montserrat', sans-serif" },
  { value: "poppins", label: "Poppins", stack: "'Poppins', sans-serif" },
  { value: "sourcesanspro", label: "Source Sans Pro", stack: "'Source Sans Pro', sans-serif" },
  { value: "raleway", label: "Raleway", stack: "'Raleway', sans-serif" },
  { value: "ubuntu", label: "Ubuntu", stack: "'Ubuntu', sans-serif" },
  { value: "merriweather", label: "Merriweather", stack: "'Merriweather', serif" },
  { value: "playfair", label: "Playfair Display", stack: "'Playfair Display', serif" },
  { value: "lora", label: "Lora", stack: "'Lora', serif" },
  { value: "ptserif", label: "PT Serif", stack: "'PT Serif', serif" },
  { value: "notosans", label: "Noto Sans", stack: "'Noto Sans', sans-serif" },
  { value: "nunito", label: "Nunito", stack: "'Nunito', sans-serif" },
  { value: "mukta", label: "Mukta", stack: "'Mukta', sans-serif" },
  { value: "firasans", label: "Fira Sans", stack: "'Fira Sans', sans-serif" },
  { value: "droidsans", label: "Droid Sans", stack: "'Droid Sans', sans-serif" },
  { value: "arial", label: "Arial", stack: "Arial, sans-serif" },
  { value: "helvetica", label: "Helvetica", stack: "Helvetica, sans-serif" },
  { value: "timesnewroman", label: "Times New Roman", stack: "'Times New Roman', serif" },
  { value: "couriernew", label: "Courier New", stack: "'Courier New', monospace" },
  { value: "georgia", label: "Georgia", stack: "Georgia, serif" },
  { value: "garamond", label: "Garamond", stack: "Garamond, serif" },
  { value: "trebuchetms", label: "Trebuchet MS", stack: "'Trebuchet MS', sans-serif" },
  { value: "verdana", label: "Verdana", stack: "Verdana, sans-serif" },
  { value: "tahoma", label: "Tahoma", stack: "Tahoma, sans-serif" },
  { value: "palatino", label: "Palatino", stack: "Palatino, serif" },
  { value: "lucidasans", label: "Lucida Sans", stack: "'Lucida Sans', sans-serif" },
  { value: "impact", label: "Impact", stack: "Impact, sans-serif" },
  { value: "josefinsans", label: "Josefin Sans", stack: "'Josefin Sans', sans-serif" },
  { value: "worksans", label: "Work Sans", stack: "'Work Sans', sans-serif" },
  { value: "quicksand", label: "Quicksand", stack: "'Quicksand', sans-serif" },
  { value: "rubik", label: "Rubik", stack: "'Rubik', sans-serif" },
  { value: "inconsolata", label: "Inconsolata", stack: "'Inconsolata', monospace" },
  { value: "oswald", label: "Oswald", stack: "'Oswald', sans-serif" },
  { value: "bebasneue", label: "Bebas Neue", stack: "'Bebas Neue', sans-serif" },
  { value: "anton", label: "Anton", stack: "'Anton', sans-serif" },
  { value: "dancingscript", label: "Dancing Script", stack: "'Dancing Script', cursive" },
  { value: "pacifico", label: "Pacifico", stack: "'Pacifico', cursive" },
  { value: "caveat", label: "Caveat", stack: "'Caveat', cursive" },
  { value: "satisfy", label: "Satisfy", stack: "'Satisfy', cursive" },
  { value: "amaticsc", label: "Amatic SC", stack: "'Amatic SC', cursive" },
  { value: "creepster", label: "Creepster", stack: "'Creepster', cursive" },
  { value: "righteous", label: "Righteous", stack: "'Righteous', cursive" },
  { value: "cinzel", label: "Cinzel", stack: "'Cinzel', serif" },
  { value: "exo2", label: "Exo 2", stack: "'Exo 2', sans-serif" },
  { value: "orbitron", label: "Orbitron", stack: "'Orbitron', sans-serif" },
  { value: "titilliumweb", label: "Titillium Web", stack: "'Titillium Web', sans-serif" },
  { value: "varelaround", label: "Varela Round", stack: "'Varela Round', sans-serif" },
  { value: "zillaslab", label: "Zilla Slab", stack: "'Zilla Slab', serif" },
  { value: "bitter", label: "Bitter", stack: "'Bitter', serif" },
  { value: "crimsontext", label: "Crimson Text", stack: "'Crimson Text', serif" }
];

type ExtendedTheme = ResumeTheme & { profileImage?: string | null };

export default function PropertiesSidebar({ data, onChange, pushToast }: Props) {
  const theme = data.theme ?? DEFAULT_THEME;
  const exTheme = theme as unknown as ExtendedTheme;
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [atsScore, setAtsScore] = useState<number | null>(null);

  const updateTheme = (field: string, value: unknown) => {
    onChange({ ...data, theme: { ...theme, [field]: value } as ResumeTheme });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        updateTheme("profileImage", reader.result);
      };
      reader.readAsDataURL(file);
    }
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

      <div className="space-y-6">
        <div>
          <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
            <ImageIcon size={16} className="text-gray-400" /> Photo (Draggable)
          </h3>
          {exTheme.profileImage ? (
            <div className="flex items-center justify-between p-3 border border-indigo-200 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-3">
                 <img src={exTheme.profileImage} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-sm border border-white" />
                 <span className="text-xs font-semibold text-indigo-700">Photo Attached</span>
              </div>
              <button onClick={() => updateTheme("profileImage", null)} className="text-indigo-400 hover:text-red-500 transition-colors p-1">
                 <X size={16} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors bg-white">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-5 h-5 text-gray-400 mb-2" />
                <p className="text-xs text-gray-500 font-medium">Click to upload photo</p>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          )}
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
             {EXTENDED_FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
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