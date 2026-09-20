/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  Check,
  Eye,
  Layers,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { ResumeData, DEFAULT_THEME } from "@/types";
import {
  CATEGORIES,
  CAREER_LEVELS,
  TEMPLATE_STYLES,
  ResumeTemplate,
  TemplateDef,
  CareerLevel,
  TemplateStyle,
  Category,
} from "./types";
import { TEMPLATES, getTemplateCount } from "./registry";
import { SAMPLE_RESUME } from "./sample-data";
import ResumeRenderer from "./renderer";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

type AtsFilter = "all" | "ats" | "creative";
type SortMode = "featured" | "name" | "ats";

const ATS_OPTIONS: { value: AtsFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "ats", label: "ATS-Friendly" },
  { value: "creative", label: "Creative" },
];

const SORT_OPTIONS: { value: SortMode; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "name", label: "Name A–Z" },
  { value: "ats", label: "ATS first" },
];

/* ── Schematic thumbnail ───────────────────────────────────────────── */

function TemplateThumb({ def }: { def: TemplateDef }) {
  const accent = def.accent;
  const isSplit = def.layout === "split";
  const sidebarBg =
    def.header === "sideColored"
      ? accent
      : def.header === "sideDark"
        ? "#1f2937"
        : def.header === "sideSoft"
          ? "#f3f4f6"
          : undefined;

  const colorBandHeader = ["band", "dark", "card", "pastel"].includes(def.header);

  return (
    <div className="relative w-full aspect-210/297 bg-white rounded-md overflow-hidden border border-gray-200">
      {/* accent edge */}
      {def.accentEdge === "left" && <div className="absolute left-0 top-0 bottom-0 w-0.75" style={{ backgroundColor: accent }} />}
      {def.accentEdge === "top" && <div className="absolute left-0 right-0 top-0 h-0.75" style={{ backgroundColor: accent }} />}

      {isSplit ? (
        <div className="flex h-full">
          <div
            className="h-full px-1.5 pt-2 pb-2"
            style={{ width: `${def.sidebarWidth ?? 33}%`, backgroundColor: sidebarBg }}
          >
            <div className="h-1.5 w-[80%] rounded-sm" style={{ backgroundColor: def.header === "sideColored" || def.header === "sideDark" ? "#ffffff" : accent }} />
            <div className="h-1 w-[55%] rounded-sm mt-1" style={{ backgroundColor: def.header === "sideColored" || def.header === "sideDark" ? "rgba(255,255,255,0.7)" : "#cbd5e1" }} />
            <div className="h-px w-full bg-gray-300 my-1.5" style={def.header === "sideColored" || def.header === "sideDark" ? { backgroundColor: "rgba(255,255,255,0.3)" } : undefined} />
            <div className="h-1 w-full rounded-sm bg-gray-200 mb-1" />
            <div className="h-1 w-full rounded-sm bg-gray-200 mb-1" />
            <div className="h-1 w-[70%] rounded-sm bg-gray-200" />
          </div>
          <div className="flex-1 px-1.5 pt-2">
            <div className="h-1 w-[65%] rounded-sm mb-1.5" style={{ backgroundColor: accent }} />
            <div className="h-1 w-full rounded-sm bg-gray-100 mb-1" />
            <div className="h-1 w-full rounded-sm bg-gray-100 mb-1" />
            <div className="h-1 w-[80%] rounded-sm bg-gray-100 mb-2" />
            <div className="h-1 w-[60%] rounded-sm mb-1.5" style={{ backgroundColor: accent }} />
            <div className="h-1 w-full rounded-sm bg-gray-100 mb-1" />
            <div className="h-1 w-full rounded-sm bg-gray-100" />
          </div>
        </div>
      ) : (
        <>
          {colorBandHeader ? (
            <div className="px-2 pt-2 pb-1.5" style={{ backgroundColor: def.header === "dark" ? "#1f2937" : def.header === "pastel" ? "#fdf4ff" : accent }}>
              <div className="h-1.5 w-[60%] rounded-sm" style={{ backgroundColor: def.header === "dark" ? "#ffffff" : def.header === "pastel" ? "#334155" : "#ffffff" }} />
              <div className="h-1 w-[40%] rounded-sm mt-1" style={{ backgroundColor: def.header === "dark" ? "rgba(255,255,255,0.6)" : def.header === "pastel" ? "#94a3b8" : "rgba(255,255,255,0.75)" }} />
            </div>
          ) : (
            <div className="px-2 pt-2 pb-1 text-center">
              <div className="h-1.5 w-[62%] rounded-sm mx-auto" style={{ backgroundColor: accent }} />
              <div className="h-1 w-[38%] rounded-sm mx-auto mt-1 bg-gray-300" />
              <div className="h-0.75 w-[70%] mx-auto mt-1.5" style={{ backgroundColor: "#e5e7eb" }} />
            </div>
          )}
          <div className="px-2">
            <div className="h-1 w-[35%] rounded-sm mb-1.5 mt-1" style={{ backgroundColor: accent }} />
            <div className="h-1 w-full rounded-sm bg-gray-100 mb-1" />
            <div className="h-1 w-full rounded-sm bg-gray-100 mb-1" />
            <div className="h-1 w-[85%] rounded-sm bg-gray-100 mb-2" />
            <div className="h-1 w-[35%] rounded-sm mb-1.5" style={{ backgroundColor: accent }} />
            <div className="h-1 w-full rounded-sm bg-gray-100 mb-1" />
            <div className="h-1 w-[70%] rounded-sm bg-gray-100" />
          </div>
        </>
      )}
    </div>
  );
}

/* ── Preview modal ─────────────────────────────────────────────────── */

function PreviewModal({
  template,
  current,
  data,
  onClose,
  onUse,
}: {
  template: ResumeTemplate;
  current: boolean;
  data: ResumeData;
  onClose: () => void;
  onUse: () => void;
}) {
  const [useSample, setUseSample] = useState(true);
  const holderRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);

  useEffect(() => {
    const el = holderRef.current;
    if (!el) return;
    const measure = () => {
      setScale(Math.min((el.clientWidth - 16) / 794, 1));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const basePreview: ResumeData = useSample
    ? SAMPLE_RESUME
    : data.firstName || data.summary || data.experience?.length
      ? data
      : SAMPLE_RESUME;

  /* Show the template's recommended colour + font so the preview is
     representative even when the current theme differs. */
  const previewData: ResumeData = {
    ...basePreview,
    theme: {
      ...(basePreview.theme ?? DEFAULT_THEME),
      primaryColor: template.def.accent,
      fontFamily: template.def.font,
    },
  };

  const inView = !!previewData.experience?.length;

  return (
    <div className="fixed inset-0 z-90 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-gray-100">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-gray-900 truncate">{template.name}</h3>
            <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{template.category}</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{template.style}</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{template.layoutLabel}</span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{template.careerLevel.join(" · ")}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
            aria-label="Close preview"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview body */}
        <div ref={holderRef} className="flex-1 overflow-auto px-6 py-5 bg-gray-100">
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <button
              onClick={() => setUseSample(true)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${useSample ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              Sample data
            </button>
            <button
              onClick={() => setUseSample(false)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${!useSample ? "bg-gray-900 text-white" : "bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"}`}
            >
              My data
            </button>
            {!useSample && !inView && (
              <span className="text-[11px] text-amber-600 font-medium">Your resume is empty — showing sample</span>
            )}
          </div>
          <div style={{ height: 1123 * scale + 40, position: "relative" }}>
            <div
              style={{
                transform: `scale(${scale})`,
                transformOrigin: "top center",
                position: "absolute",
                top: 0,
                left: "50%",
                marginLeft: -397,
                boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              }}
            >
              <ResumeRenderer data={previewData} editMode={false} templateId={template.id} />
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 bg-white">
          <p className="text-[11px] text-gray-400 max-w-[46%]">
            Using a template only changes the design, colour and font — your content is never touched.
          </p>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onUse}
              className={`px-4 py-2 text-sm font-semibold rounded-lg text-white transition-colors flex items-center gap-1.5 ${current ? "bg-green-600 hover:bg-green-700" : "bg-indigo-600 hover:bg-indigo-700"}`}
            >
              {current ? <><Check size={15} /> Currently in use</> : "Use this template"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Main library ──────────────────────────────────────────────────── */

export default function TemplateLibrary({ data, onChange }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [style, setStyle] = useState<TemplateStyle | "all">("all");
  const [careerLevel, setCareerLevel] = useState<CareerLevel | "all">("all");
  const [ats, setAts] = useState<AtsFilter>("all");
  const [sort, setSort] = useState<SortMode>("featured");
  const [preview, setPreview] = useState<ResumeTemplate | null>(null);

  const currentId = data.theme?.layout ?? DEFAULT_THEME.layout;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = TEMPLATES.filter((tpl) => {
      if (category !== "all" && tpl.category !== category) return false;
      if (style !== "all" && tpl.style !== style) return false;
      if (careerLevel !== "all" && !tpl.careerLevel.includes(careerLevel)) return false;
      if (ats === "ats" && !tpl.atsFriendly) return false;
      if (ats === "creative" && tpl.atsFriendly) return false;
      if (q) {
        const haystack = [tpl.name, tpl.useCase, tpl.category, tpl.industry, tpl.description, tpl.style, ...tpl.professions]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sort === "name") {
      return [...list].sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === "ats") {
      return [...list].sort((a, b) => Number(b.atsFriendly) - Number(a.atsFriendly));
    }
    return list;
  }, [query, category, style, careerLevel, ats, sort]);

  const applyTemplate = (tpl: ResumeTemplate) => {
    const theme = data.theme ?? DEFAULT_THEME;
    onChange({
      ...data,
      theme: {
        ...theme,
        layout: tpl.id,
        fontFamily: tpl.def.font,
        primaryColor: tpl.def.accent,
      },
    });
  };

  const hasContent = !!(data.firstName || data.summary || data.experience?.length || data.skills);

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates, industries, roles…"
          className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 text-gray-800 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-2 gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as Category | "all")}
            className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="all">All Industries</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            value={careerLevel}
            onChange={(e) => setCareerLevel(e.target.value as CareerLevel | "all")}
            className="px-2 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
          >
            <option value="all">All Career Levels</option>
            {CAREER_LEVELS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Style chips */}
        <div className="flex gap-1.5 flex-wrap">
          <FilterChip active={style === "all"} onClick={() => setStyle("all")}>All Styles</FilterChip>
          {TEMPLATE_STYLES.map((s) => (
            <FilterChip key={s} active={style === s} onClick={() => setStyle(style === s ? "all" : s)}>{s}</FilterChip>
          ))}
        </div>

        {/* ATS toggle */}
        <div className="flex items-center gap-1">
          {ATS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setAts(opt.value)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
                ats === opt.value ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
              }`}
            >
              {opt.value === "ats" && <ShieldCheck size={11} className="inline mr-1 -mt-0.5" />}
              {opt.value === "creative" && <Sparkles size={11} className="inline mr-1 -mt-0.5" />}
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Sort + count */}
      <div className="flex items-center justify-between">
        <p className="text-[11px] text-gray-400">
          Showing <span className="font-semibold text-gray-600">{filtered.length}</span> of {getTemplateCount()} templates
        </p>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="px-2 py-1 text-[11px] rounded-lg border border-gray-200 text-gray-600 bg-white focus:outline-none"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-10 text-sm text-gray-400">No templates match your filters.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {filtered.map((tpl) => {
            const active = tpl.id === currentId;
            return (
              <button
                key={tpl.id}
                onClick={() => setPreview(tpl)}
                className={`group text-left rounded-xl border bg-white p-2 transition-all hover:shadow-md hover:-translate-y-0.5 ${
                  active ? "border-indigo-500 ring-2 ring-indigo-500/30" : "border-gray-200"
                }`}
              >
                <TemplateThumb def={tpl.def} />
                <div className="mt-2 px-0.5">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-semibold text-gray-800 truncate">{tpl.name}</p>
                    {active && <Check size={13} className="text-indigo-600 shrink-0" />}
                  </div>
                  <p className="text-[10px] text-gray-400 truncate">{tpl.industry}</p>
                  <div className="flex items-center gap-1 mt-1">
                    {tpl.atsFriendly ? (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700">
                        <ShieldCheck size={9} /> ATS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700">
                        <Sparkles size={9} /> Creative
                      </span>
                    )}
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">{tpl.style}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-center gap-1 text-[10px] font-medium text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye size={11} /> Preview
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Footer hint */}
      <div className="flex items-start gap-2 text-[11px] text-gray-400 border-t border-gray-100 pt-3">
        <Layers size={13} className="mt-0.5 shrink-0" />
        <p>
          {hasContent
            ? "Your resume content is kept safe — templates only change the design."
            : "Tip: enter some resume details first, then preview templates with the “My data” toggle."}
        </p>
      </div>

      {preview && (
        <PreviewModal
          template={preview}
          current={preview.id === currentId}
          data={data}
          onClose={() => setPreview(null)}
          onUse={() => {
            applyTemplate(preview);
            setPreview(null);
          }}
        />
      )}
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-colors ${
        active ? "bg-indigo-600 text-white" : "bg-white text-gray-500 border border-gray-200 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}