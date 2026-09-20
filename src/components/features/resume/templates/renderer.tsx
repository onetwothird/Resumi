/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client";

import { forwardRef, useCallback, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Briefcase,
  GraduationCap,
  Wrench,
  Award,
  User,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import {
  ResumeData,
  DEFAULT_THEME,
  ResumeFontSize,
  ResumeBlockKey,
  TextBlockStyle,
  ExperienceItem,
  EducationItem,
  ResumeTheme,
} from "@/types";
import { EXTENDED_FONTS, getExtendedFontStack, GoogleFontLoader } from "./fonts";
import {
  TemplateDef,
  HeaderVariant,
  HeadingVariant,
  ExpVariant,
  EduVariant,
  ContactVariant,
  SectionKey,
  DocSpacing,
} from "./types";
import { resolveTemplate } from "./registry";

/* ── Sizes & block styles ───────────────────────────────────────────── */

const SIZE_MAP: Record<ResumeFontSize, { name: string; title: string; meta: string; heading: string; body: string }> = {
  sm: { name: "text-2xl", title: "text-base", meta: "text-xs", heading: "text-xs", body: "text-xs" },
  md: { name: "text-3xl", title: "text-lg", meta: "text-sm", heading: "text-sm", body: "text-sm" },
  lg: { name: "text-4xl", title: "text-xl", meta: "text-base", heading: "text-base", body: "text-base" },
};

function styleToCss(s: TextBlockStyle | undefined): CSSProperties {
  if (!s) return {};
  return {
    textAlign: s.align,
    fontFamily: s.fontFamily,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing !== undefined ? `${s.letterSpacing}px` : undefined,
  };
}

/* ── Editable primitives (edit mode) ────────────────────────────────── */

interface EditableProps {
  value: string;
  placeholder: string;
  onCommit: (value: string) => void;
  onFocusBlock: (el: HTMLElement) => void;
  onBlurBlock: (e: React.FocusEvent<HTMLElement>) => void;
  className?: string;
  style?: CSSProperties;
  multiline?: boolean;
}

function Editable({ value, placeholder, onCommit, onFocusBlock, onBlurBlock, className, style, multiline }: EditableProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.innerHTML !== (value || "")) {
      el.innerHTML = value || "";
    }
  }, [value]);

  const Tag = (multiline ? "div" : "span") as "div";

  return (
    <Tag
      ref={ref as React.Ref<HTMLDivElement>}
      contentEditable
      suppressContentEditableWarning
      data-placeholder={placeholder}
      onFocus={(e) => onFocusBlock(e.currentTarget)}
      onBlur={onBlurBlock}
      onInput={(e) => {
        const el = e.currentTarget;
        let html = el.innerHTML;
        if (el.innerText.trim() === "") html = "";
        onCommit(html);
      }}
      className={`outline-none cursor-text rounded-sm focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 empty:before:content-[attr(data-placeholder)] empty:before:text-current empty:before:opacity-40 empty:before:pointer-events-none ${className ?? ""}`}
      style={style}
    />
  );
}

/* Plain text renderer (preview mode + printed output) */
const RenderBlock = ({ html, className, style, multiline }: { html?: string; className?: string; style?: CSSProperties; multiline?: boolean }) => {
  if (!html) return null;
  const Tag = multiline ? "div" : "span";
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
};

/* ── Floating toolbar (edit mode) ───────────────────────────────────── */

const stopMouseDown = (e: React.MouseEvent) => e.preventDefault();
const allowFocus = (e: React.MouseEvent) => e.stopPropagation();

function ToggleButton({ active, onClick, Icon, label }: { active: boolean; onClick: () => void; Icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      title={label}
      onMouseDown={stopMouseDown}
      onClick={onClick}
      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
        active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"
      }`}
    >
      <Icon size={14} strokeWidth={2.25} />
    </button>
  );
}

function FloatingToolbar({ style, value, onPatch }: { style: CSSProperties; value: TextBlockStyle; onPatch: (patch: Partial<TextBlockStyle>) => void }) {
  const [format, setFormat] = useState({ bold: false, italic: false, underline: false, strike: false });

  useEffect(() => {
    const handleSelection = () => {
      setFormat({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        strike: document.queryCommandState("strikeThrough"),
      });
    };
    document.addEventListener("selectionchange", handleSelection);
    handleSelection();
    return () => document.removeEventListener("selectionchange", handleSelection);
  }, []);

  const exec = (cmd: string) => {
    document.execCommand(cmd, false, undefined);
    const activeEl = document.activeElement;
    if (activeEl && activeEl.getAttribute("contenteditable") === "true") {
      activeEl.dispatchEvent(new Event("input", { bubbles: true }));
    }
  };

  return (
    <div
      style={style}
      onMouseDown={stopMouseDown}
      className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-xl p-1.5 flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1.5 w-max max-w-[calc(100vw-2rem)] sm:max-w-[90vw]"
    >
      <div className="flex items-center gap-1">
        <select
          value={value.fontFamily ?? ""}
          onMouseDown={allowFocus}
          onChange={(e) => onPatch({ fontFamily: e.target.value || undefined })}
          className="text-xs border border-gray-200 rounded-md pl-1.5 pr-1 py-1 outline-none w-24 bg-white text-gray-700 truncate"
        >
          <option value="">Theme</option>
          {EXTENDED_FONTS.map((f) => (
            <option key={f.value} value={f.stack}>
              {f.label}
            </option>
          ))}
        </select>
        <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />
        <input
          type="number"
          min={8}
          max={72}
          value={value.fontSize ?? ""}
          placeholder="Size"
          onMouseDown={allowFocus}
          onChange={(e) => onPatch({ fontSize: e.target.value ? Number(e.target.value) : undefined })}
          className="text-xs border border-gray-200 rounded-md w-12 px-1.5 py-1 outline-none text-gray-700"
        />
        <select
          value={value.lineHeight ?? ""}
          onMouseDown={allowFocus}
          onChange={(e) => onPatch({ lineHeight: e.target.value || undefined })}
          className="text-xs border border-gray-200 rounded-md px-1 py-1 outline-none bg-white text-gray-700"
        >
          <option value="">Auto</option>
          <option value="1">1</option>
          <option value="1.15">1.15</option>
          <option value="1.5">1.5</option>
          <option value="2">2</option>
        </select>
        <div className="w-px h-5 bg-gray-200 mx-0.5 shrink-0" />
        <input
          type="number"
          step={0.1}
          value={value.letterSpacing ?? ""}
          placeholder="±0"
          onMouseDown={allowFocus}
          onChange={(e) => onPatch({ letterSpacing: e.target.value ? Number(e.target.value) : undefined })}
          className="text-xs border border-gray-200 rounded-md w-12 px-1.5 py-1 outline-none text-gray-700"
        />
      </div>
      <div className="hidden sm:block w-px h-5 bg-gray-200 shrink-0" />
      <div className="flex items-center gap-1">
        <ToggleButton active={format.bold} onClick={() => exec("bold")} Icon={Bold} label="Bold" />
        <ToggleButton active={format.italic} onClick={() => exec("italic")} Icon={Italic} label="Italic" />
        <ToggleButton active={format.underline} onClick={() => exec("underline")} Icon={Underline} label="Underline" />
        <ToggleButton active={format.strike} onClick={() => exec("strikeThrough")} Icon={Strikethrough} label="Strikethrough" />
      </div>
      <div className="hidden sm:block w-px h-5 bg-gray-200 shrink-0" />
      <div className="flex items-center gap-1">
        <ToggleButton active={!value.align || value.align === "left"} onClick={() => onPatch({ align: "left" })} Icon={AlignLeft} label="Align left" />
        <ToggleButton active={value.align === "center"} onClick={() => onPatch({ align: "center" })} Icon={AlignCenter} label="Align center" />
        <ToggleButton active={value.align === "right"} onClick={() => onPatch({ align: "right" })} Icon={AlignRight} label="Align right" />
        <ToggleButton active={value.align === "justify"} onClick={() => onPatch({ align: "justify" })} Icon={AlignJustify} label="Justify" />
      </div>
      <div className="absolute left-1/2 -bottom-1.25 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-gray-200 rotate-45 hidden sm:block" />
    </div>
  );
}

/* ── Variant configuration maps ─────────────────────────────────────── */

const SPACING: Record<DocSpacing, { px: number; py: number; sectionGap: number; itemGap: number }> = {
  compact: { px: 34, py: 26, sectionGap: 18, itemGap: 10 },
  normal: { px: 44, py: 40, sectionGap: 24, itemGap: 14 },
  spacious: { px: 56, py: 52, sectionGap: 32, itemGap: 18 },
};

interface HeaderCfg {
  wrap: string;
  align: "center" | "left" | "right" | "split";
  nameClass: string;
  titleClass: string;
  contactSep: string;
  headerStyle?: CSSProperties;
  nameStyle?: CSSProperties;
  titleStyle?: CSSProperties;
  big?: boolean;
}

const HEADER_CONFIG: Record<HeaderVariant, HeaderCfg> = {
  centered: { wrap: "text-center border-b", align: "center", nameClass: "font-bold uppercase tracking-wider mb-1", titleClass: "text-gray-600 mb-3", contactSep: "|", headerStyle: { borderColor: "var(--accent)" } },
  left: { wrap: "", align: "left", nameClass: "font-semibold tracking-tight mb-1 text-gray-900", titleClass: "font-medium mb-2", titleStyle: { color: "var(--accent)" }, contactSep: "·" },
  split: { wrap: "flex justify-between items-end border-b-2 pb-0", align: "split", nameClass: "font-bold tracking-tight mb-1", titleClass: "", contactSep: "", headerStyle: { borderColor: "var(--accent)" } },
  band: { wrap: "text-white", align: "center", nameClass: "font-bold tracking-wide mb-1", titleClass: "opacity-90 mb-2", contactSep: "", headerStyle: { backgroundColor: "var(--accent)" }, nameStyle: { color: "#ffffff" } },
  serifCentered: { wrap: "text-center", align: "center", nameClass: "font-light tracking-[0.2em] mb-2 uppercase font-serif", titleClass: "text-gray-500 italic mb-3", contactSep: "✧" },
  rules: { wrap: "text-center", align: "center", nameClass: "font-bold uppercase tracking-widest mb-1", titleClass: "text-gray-600 mb-3", contactSep: "•", headerStyle: { borderTop: "2px solid var(--accent)", borderBottom: "2px solid var(--accent)" }, nameStyle: { paddingTop: 14, paddingBottom: 14 } },
  boxed: { wrap: "border-2 mx-auto", align: "center", nameClass: "font-bold uppercase tracking-wider mb-1", titleClass: "text-gray-600 mb-3", contactSep: "•", headerStyle: { borderColor: "var(--accent)" } },
  uppercaseSplit: { wrap: "flex justify-between items-end border-b-4", align: "split", nameClass: "font-black uppercase tracking-tighter mb-1", titleClass: "font-bold uppercase", titleStyle: { color: "var(--accent)" }, contactSep: "", headerStyle: { borderColor: "var(--accent)" } },
  mono: { wrap: "", align: "left", nameClass: "font-mono font-bold mb-1", titleClass: "font-mono mb-2", titleStyle: { color: "var(--accent)" }, contactSep: "•" },
  creativeRight: { wrap: "text-right", align: "right", nameClass: "font-bold tracking-tighter mb-1 text-5xl", titleClass: "italic text-xl", titleStyle: { color: "var(--accent)" }, contactSep: "/", big: true },
  spacious: { wrap: "text-center", align: "center", nameClass: "font-light uppercase tracking-[0.35em] mb-3 text-gray-900", titleClass: "text-gray-400 uppercase tracking-[0.2em] text-xs", contactSep: "" },
  compactLeft: { wrap: "", align: "left", nameClass: "font-semibold tracking-tight mb-0.5 text-gray-900", titleClass: "text-gray-600 text-sm", contactSep: "|" },
  bottomRule: { wrap: "border-b", align: "left", nameClass: "font-bold uppercase tracking-wider mb-1 text-gray-900", titleClass: "text-gray-600 mb-3", contactSep: "|", headerStyle: { borderColor: "var(--accent)" } },
  government: { wrap: "text-center border-b-4", align: "center", nameClass: "font-serif font-bold uppercase mb-1 text-gray-900", titleClass: "font-serif text-gray-800 mb-2", contactSep: ",", headerStyle: { borderColor: "var(--accent)" } },
  card: { wrap: "rounded-2xl text-white", align: "center", nameClass: "font-bold tracking-tight mb-1", titleClass: "font-medium opacity-90 mb-2", contactSep: "·", headerStyle: { backgroundColor: "var(--accent)" } },
  editorial: { wrap: "border-b-4 border-black", align: "left", nameClass: "font-serif font-black uppercase tracking-tighter mb-1 text-5xl text-black", titleClass: "font-serif font-bold text-gray-600 mb-2", contactSep: "|", big: true },
  dark: { wrap: "text-white", align: "center", nameClass: "font-bold tracking-wider mb-1 uppercase", titleClass: "text-gray-300 mb-2", contactSep: "•", headerStyle: { backgroundColor: "#111827" } },
  pills: { wrap: "text-center", align: "center", nameClass: "font-black uppercase tracking-tight mb-2", titleClass: "font-bold mb-3", titleStyle: { color: "var(--accent)" }, contactSep: "•" },
  pastel: { wrap: "text-center rounded-b-[2rem]", align: "center", nameClass: "font-bold tracking-wide mb-2 text-gray-800", titleClass: "text-gray-600 font-medium mb-3", contactSep: "·", headerStyle: { backgroundColor: "#fdf4ff" } },
  decorative: { wrap: "border-b-8", align: "left", nameClass: "font-black uppercase tracking-tighter mb-1", titleClass: "font-bold uppercase tracking-widest", titleStyle: { color: "var(--accent)" }, contactSep: "■", headerStyle: { borderColor: "var(--accent)" } },
  sideColored: { wrap: "text-white", align: "left", nameClass: "font-bold tracking-wide mb-1", titleClass: "opacity-85 mb-3", contactSep: "", headerStyle: { backgroundColor: "var(--accent)" }, nameStyle: { color: "#ffffff" } },
  sideDark: { wrap: "text-white", align: "left", nameClass: "font-bold tracking-wide mb-1", titleClass: "opacity-80 mb-3", contactSep: "", headerStyle: { backgroundColor: "#1f2937" }, nameStyle: { color: "#ffffff" } },
  sidePlain: { wrap: "", align: "left", nameClass: "font-bold tracking-tight mb-1", titleClass: "text-gray-500 mb-3", titleStyle: { color: "var(--accent)" }, contactSep: "" },
  sideSoft: { wrap: "", align: "left", nameClass: "font-semibold tracking-tight mb-1 text-gray-900", titleClass: "text-gray-500 mb-3", titleStyle: { color: "var(--accent)" }, contactSep: "" },
  sideMono: { wrap: "", align: "left", nameClass: "font-mono font-bold mb-1", titleClass: "font-mono text-gray-500 mb-3", titleStyle: { color: "var(--accent)" }, contactSep: "" },
};

const CONTACT_CONFIG: Record<ContactVariant, { wrap: string; separator: string; icons?: boolean; mono?: boolean; column?: boolean; right?: boolean; centered?: boolean }> = {
  inline: { wrap: "flex flex-wrap gap-x-3 gap-y-1 items-center", separator: "•" },
  column: { wrap: "flex flex-col gap-1", separator: "" },
  splitCol: { wrap: "flex flex-col items-end gap-1 text-right", separator: "" },
  iconed: { wrap: "flex flex-wrap gap-x-4 gap-y-1.5 items-center", separator: "", icons: true },
  mono: { wrap: "font-mono flex flex-wrap gap-x-4 gap-y-1 items-center", separator: "::" },
  centered: { wrap: "flex justify-center flex-wrap gap-x-4 gap-y-1 items-center", separator: "·" },
  right: { wrap: "flex justify-end flex-wrap gap-x-4 gap-y-1 items-center", separator: "•" },
};

interface HeadingCfg {
  className: string;
  style?: CSSProperties;
  inline?: boolean;
  prefix?: string;
}

const HEADING_CONFIG: Record<HeadingVariant, HeadingCfg> = {
  bordered: { className: "font-bold uppercase tracking-widest border-b pb-1", style: { borderColor: "var(--accent)" } },
  rule: { className: "font-bold uppercase tracking-widest", style: { color: "var(--accent)" }, inline: true },
  letterspaced: { className: "font-semibold uppercase tracking-[0.2em] text-gray-500" },
  pill: { className: "font-bold uppercase tracking-widest", style: { color: "#ffffff", backgroundColor: "var(--accent)", borderRadius: 9999, padding: "3px 14px" }, inline: true },
  accentBar: { className: "font-bold uppercase tracking-widest pl-3", style: { borderLeft: "4px solid var(--accent)" } },
  number: { className: "font-bold uppercase tracking-wider", style: { color: "var(--accent)" } },
  serif: { className: "font-serif font-bold uppercase tracking-wider", style: { color: "var(--accent)" } },
  centerRules: { className: "font-semibold uppercase tracking-[0.2em] text-gray-600", inline: true },
  doubleRule: { className: "font-bold uppercase tracking-widest pb-1", style: { borderBottom: "3px double var(--accent)" } },
  icon: { className: "font-bold uppercase tracking-widest", style: { color: "var(--accent)" } },
  bare: { className: "font-medium uppercase tracking-[0.25em] text-gray-400" },
  block: { className: "font-bold uppercase tracking-widest text-white", style: { backgroundColor: "var(--accent)", padding: "4px 12px" } },
  mono: { className: "font-mono font-bold uppercase tracking-widest", style: { color: "var(--accent)" } },
  boxed: { className: "font-bold uppercase tracking-widest", style: { border: "1.5px solid var(--accent)", color: "var(--accent)", padding: "3px 12px" }, inline: true },
  overline: { className: "font-bold uppercase tracking-widest pt-1.5", style: { borderTop: "2px solid var(--accent)" } },
};

interface ExpCfg {
  titleOrder: "companyRole" | "roleCompany";
  itemClass?: string;
  titleClass: string;
  metaClass?: string;
  descClass?: string;
  timeline?: boolean;
  columns?: boolean;
  dividerColor?: string;
}

const EXP_CONFIG: Record<ExpVariant, ExpCfg> = {
  standard: { titleOrder: "companyRole", titleClass: "font-bold text-gray-900", metaClass: "text-gray-500", descClass: "text-gray-600" },
  roleFirst: { titleOrder: "roleCompany", titleClass: "font-bold text-gray-900", metaClass: "text-gray-500", descClass: "text-gray-600" },
  timeline: { titleOrder: "roleCompany", titleClass: "font-bold text-gray-900", metaClass: "text-gray-500", descClass: "text-gray-600", timeline: true },
  columns: { titleOrder: "companyRole", titleClass: "font-bold text-gray-900", metaClass: "text-gray-600", descClass: "text-gray-600", columns: true },
  cards: { titleOrder: "companyRole", titleClass: "font-bold text-gray-900", itemClass: "border rounded-lg p-3", metaClass: "text-gray-500", descClass: "text-gray-600" },
  minimal: { titleOrder: "roleCompany", titleClass: "font-semibold text-gray-900", metaClass: "text-gray-400", descClass: "text-gray-600" },
  banded: { titleOrder: "companyRole", titleClass: "font-black uppercase tracking-tight text-gray-900 pb-1", metaClass: "text-gray-500", descClass: "text-gray-600", dividerColor: "var(--accent)" },
};

interface EduCfg {
  order: "school" | "degree";
  itemClass?: string;
}

const EDU_CONFIG: Record<EduVariant, EduCfg> = {
  standard: { order: "school" },
  degreeFirst: { order: "degree" },
  compactRow: { order: "school" },
  cards: { order: "school", itemClass: "border rounded-lg p-3" },
};

const SECTION_ICONS: Record<SectionKey, React.ElementType> = {
  summary: User,
  experience: Briefcase,
  education: GraduationCap,
  skills: Wrench,
  certifications: Award,
};

type ContactKey = "email" | "phone" | "address";

const CONTACT_ICONS: Record<ContactKey, React.ElementType> = {
  email: Mail,
  phone: Phone,
  address: MapPin,
};

/* ── Helpers ────────────────────────────────────────────────────────── */

const applyAccent = (styleObj: CSSProperties | undefined, primaryColor: string): CSSProperties => {
  if (!styleObj) return {};
  const processed: CSSProperties = { ...styleObj };
  Object.keys(processed).forEach((key) => {
    const val = processed[key as keyof CSSProperties];
    if (typeof val === "string" && val.includes("var(--accent)")) {
      (processed as any)[key] = val.replace(/var\(--accent\)/g, primaryColor);
    }
  });
  return processed;
};

type ExtendedTheme = ResumeTheme & { profileImage?: string | null; imagePosX?: number; imagePosY?: number; imageWidth?: number };

export interface ResumeRendererProps {
  data: ResumeData;
  onChange?: (data: ResumeData) => void;
  /** `true` renders interactive contentEditable blocks + toolbar. */
  editMode?: boolean;
  scale?: number;
  /** Template id override (defaults to data.theme.layout). */
  templateId?: string;
}

/* ── The renderer ───────────────────────────────────────────────────── */

const DEFAULT_DEF: TemplateDef = {
  layout: "single",
  header: "centered",
  heading: "bordered",
  exp: "standard",
  edu: "standard",
  skills: "text",
  contact: "inline",
  sections: ["summary", "experience", "education", "skills", "certifications"],
  spacing: "normal",
  accent: "#4f46e5",
  font: "inter",
  dividerColor: "#d1d5db",
};

export const ResumeRenderer = forwardRef<HTMLDivElement, ResumeRendererProps>(
  ({ data, onChange, editMode = false, scale = 1, templateId }, ref) => {
    const theme = data.theme ?? DEFAULT_THEME;
    const exTheme = theme as unknown as ExtendedTheme;
    const sizes = SIZE_MAP[theme.fontSize] ?? SIZE_MAP.md;
    const fontStack = getExtendedFontStack(theme.fontFamily);

    const template = resolveTemplate(templateId ?? theme.layout) ?? resolveTemplate(theme.layout);
    const def: TemplateDef = template ? template.def : DEFAULT_DEF;
    const primaryColor = theme.primaryColor || def.accent || "#4f46e5";

    const wrapperRef = useRef<HTMLDivElement>(null);
    const [activeBlock, setActiveBlock] = useState<ResumeBlockKey | null>(null);
    const [toolbarStyle, setToolbarStyle] = useState<CSSProperties>({});
    const [imgPos, setImgPos] = useState({ x: exTheme.imagePosX ?? 40, y: exTheme.imagePosY ?? 40 });
    const dragRef = useRef<{ startX: number; startY: number; initX: number; initY: number } | null>(null);
    const isInitialMount = useRef(true);

    useEffect(() => {
      if (!isInitialMount.current && exTheme.imagePosX !== undefined && exTheme.imagePosY !== undefined) {
        setImgPos({ x: exTheme.imagePosX, y: exTheme.imagePosY });
      }
      isInitialMount.current = false;
    }, [exTheme.imagePosX, exTheme.imagePosY]);

    const handleImgMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current = { startX: e.clientX, startY: e.clientY, initX: imgPos.x, initY: imgPos.y };
    }, [imgPos.x, imgPos.y]);

    useEffect(() => {
      if (!editMode) return;
      const handleMouseMove = (e: MouseEvent) => {
        if (!dragRef.current) return;
        const dx = (e.clientX - dragRef.current.startX) / (scale || 1);
        const dy = (e.clientY - dragRef.current.startY) / (scale || 1);
        setImgPos({ x: dragRef.current.initX + dx, y: dragRef.current.initY + dy });
      };
      const handleMouseUp = () => {
        if (dragRef.current) {
          setImgPos((currentPos) => {
            const currentTheme = data.theme ?? DEFAULT_THEME;
            if (onChange) {
              onChange({
                ...data,
                theme: { ...currentTheme, imagePosX: currentPos.x, imagePosY: currentPos.y } as unknown as ResumeTheme,
              });
            }
            return currentPos;
          });
          dragRef.current = null;
        }
      };
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      return () => {
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("mouseup", handleMouseUp);
      };
    }, [editMode, scale, data, onChange]);

    const positionToolbar = useCallback(
      (el: HTMLElement) => {
        const wrap = wrapperRef.current;
        if (!wrap) return;
        const elRect = el.getBoundingClientRect();
        const wrapRect = wrap.getBoundingClientRect();
        const rawTop = (elRect.top - wrapRect.top) / scale;
        const rawLeft = (elRect.left - wrapRect.left + elRect.width / 2) / scale;
        setToolbarStyle({ top: rawTop - 10, left: rawLeft, transform: `translate(-50%, -100%) scale(${1 / scale})`, transformOrigin: "bottom center" });
      },
      [scale]
    );

    const handleFocusBlock = useCallback(
      (key: ResumeBlockKey) => (el: HTMLElement) => {
        setActiveBlock(key);
        positionToolbar(el);
      },
      [positionToolbar]
    );

    const handleBlurBlock = useCallback((e: React.FocusEvent<HTMLElement>) => {
      if (wrapperRef.current?.contains(e.relatedTarget as Node)) return;
      setActiveBlock(null);
    }, []);

    useEffect(() => {
      if (!activeBlock) return;
      const reposition = () => {
        const el = document.activeElement as HTMLElement | null;
        if (el && wrapperRef.current?.contains(el)) positionToolbar(el);
      };
      window.addEventListener("resize", reposition);
      window.addEventListener("scroll", reposition, true);
      return () => {
        window.removeEventListener("resize", reposition);
        window.removeEventListener("scroll", reposition, true);
      };
    }, [activeBlock, positionToolbar]);

    const patchBlockStyle = useCallback(
      (patch: Partial<TextBlockStyle>) => {
        if (!activeBlock || !onChange) return;
        const current = data.blockStyles ?? {};
        const currentBlock = current[activeBlock] ?? {};
        onChange({ ...data, blockStyles: { ...current, [activeBlock]: { ...currentBlock, ...patch } } });
      },
      [activeBlock, data, onChange]
    );

    const blockCss = (key: ResumeBlockKey) => styleToCss(data.blockStyles?.[key]);

    const update = (field: keyof ResumeData, value: unknown) => {
      if (onChange) onChange({ ...data, [field]: value });
    };

    const updateExp = (index: number, field: keyof ExperienceItem, val: string) => {
      const newArr = [...(data.experience || [])];
      newArr[index] = { ...newArr[index], [field]: val };
      update("experience", newArr);
    };

    const updateEdu = (index: number, field: keyof EducationItem, val: string) => {
      const newArr = [...(data.education || [])];
      newArr[index] = { ...newArr[index], [field]: val };
      update("education", newArr);
    };

    const editableCommon = (key: ResumeBlockKey) => ({
      onFocusBlock: editMode ? handleFocusBlock(key) : () => {},
      onBlurBlock: editMode ? handleBlurBlock : () => {},
    });

    const sp = SPACING[def.spacing] ?? SPACING.normal;
    const scaleFactor = def.scale ?? 1;
    const padX = Math.round(sp.px * scaleFactor);
    const padY = Math.round(sp.py * scaleFactor);
    const sectionGap = Math.round(sp.sectionGap * scaleFactor);
    const itemGap = Math.round(sp.itemGap * scaleFactor);

    /* Dark paper detection — legacy terminal-style templates render on a dark
       container, so body copy is brightened and text-grays are replaced. */
    const rawContainerBg = def.container?.backgroundColor;
    const isDark =
      typeof rawContainerBg === "string" &&
      /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(rawContainerBg) &&
      parseInt(rawContainerBg.replace("#", "").slice(0, 6), 16) < 0x555555;

    const bodyColor = def.bodyColor ?? (isDark ? "#e5e7eb" : "#374151");
    const expBodyColor = isDark ? "#cbd5e1" : "#4b5563";
    const expTitleColor = isDark ? "#f8fafc" : undefined;
    const expMetaColor = isDark ? "#94a3b8" : undefined;
    const dividerColor = def.dividerColor ?? (isDark ? "#334155" : "#d1d5db");

    /* Sections rendered inside a coloured sidebar flip to light-on-dark copy.
       `mode` is threaded explicitly (never reassigned) so ESLint's
       react-hooks/immutability rule stays satisfied. */
    const bodyColorFor = (mode: boolean) => (mode ? "#f8fafc" : bodyColor);
    const expBodyFor = (mode: boolean) => (mode ? "#e2e8f0" : expBodyColor);
    const expTitleFor = (mode: boolean) => (mode ? "#ffffff" : expTitleColor);
    const expMetaFor = (mode: boolean) => (mode ? "#cbd5e1" : expMetaColor);
    const secondaryFor = (mode: boolean) => (mode ? "#cbd5e1" : expMetaColor ?? "#6b7280");
    const dividerFor = (mode: boolean) => (mode ? "rgba(255,255,255,0.3)" : dividerColor);
    const chipStyleFor = (mode: boolean) =>
      mode ? { backgroundColor: "rgba(255,255,255,0.95)", color: "#111827" } : { backgroundColor: primaryColor, color: "#ffffff" };
    const nameCase = def.nameCase === "uppercase" ? "uppercase" : "";
    const hcfg = HEADER_CONFIG[def.header] ?? HEADER_CONFIG.centered;
    const ccfg = CONTACT_CONFIG[def.contact] ?? CONTACT_CONFIG.inline;
    const headerStyle = applyAccent(hcfg.headerStyle, primaryColor);
    const headerNameStyle = applyAccent(hcfg.nameStyle, primaryColor);
    const headerTitleStyle = applyAccent(hcfg.titleStyle, primaryColor);

    const contactLine: { key: ContactKey; value: string }[] = (
      [
        { key: "email", value: data.email },
        { key: "phone", value: data.phone },
        { key: "address", value: data.address },
      ] as { key: ContactKey; value: string }[]
    ).filter((c) => c.value);

    const renderContact = (style?: CSSProperties, overrideWrap?: string) => (
      <div className={`${sizes.meta} ${ccfg.wrap} ${overrideWrap ?? ""}`} style={{ ...style, ...blockCss("contact") }}>
        {contactLine.map((c, i) => {
          const Icon = CONTACT_ICONS[c.key];
          return (
            <span key={`${c.key}-${i}`} className="flex items-center gap-1.5 min-w-0">
              {ccfg.icons && <Icon className="w-3 h-3 opacity-60 shrink-0" style={{ color: "var(--accent)" }} />}
            {editMode ? (
              <Editable
                value={c.value}
                placeholder={c.key}
                onCommit={(v) => update(c.key, v)}
                {...editableCommon("contact")}
              />
            ) : (
              <RenderBlock html={c.value} />
            )}
            {i < contactLine.length - 1 && ccfg.separator && <span className="opacity-50 select-none mx-1 shrink-0">{ccfg.separator}</span>}
            </span>
          );
        })}
      </div>
    );

    const renderHeaderInner = (splitSide: boolean) => {
      const alignClass = hcfg.align === "center" ? "text-center" : hcfg.align === "right" ? "text-right" : "text-left";
      const nameWrapperClass = hcfg.align === "split" && !splitSide ? "text-left" : "";
      return (
        <>
          <div className={nameWrapperClass}>
            <h1
              className={`${sizes.name} ${hcfg.big ? "text-5xl" : ""} ${nameCase} ${hcfg.nameClass} wrap-break-word`}
              style={{ ...headerNameStyle, ...blockCss("name") }}
            >
              {editMode ? (
                <>
                  <Editable value={data.firstName || ""} placeholder="First" onCommit={(v) => update("firstName", v)} {...editableCommon("name")} className="inline-block min-w-8" />{" "}
                  <Editable value={data.lastName || ""} placeholder="Last" onCommit={(v) => update("lastName", v)} {...editableCommon("name")} className="inline-block min-w-8" />
                </>
              ) : (
                <>
                  <RenderBlock html={data.firstName} className="inline-block min-w-8" /> <RenderBlock html={data.lastName} className="inline-block min-w-8" />
                </>
              )}
            </h1>
            <p className={`${sizes.title} ${hcfg.titleClass} wrap-break-word`} style={{ ...headerTitleStyle, ...blockCss("jobTitle") }}>
              {editMode ? (
                <Editable value={data.jobTitle || ""} placeholder="Job Title" onCommit={(v) => update("jobTitle", v)} {...editableCommon("jobTitle")} />
              ) : (
                <RenderBlock html={data.jobTitle} />
              )}
            </p>
            {hcfg.align === "split" ? (
              <div className={alignClass}>
                {contactLine.length > 0 && renderContact(undefined, "flex-col items-end gap-1 text-right")}
              </div>
            ) : (
              <div className={alignClass}>{contactLine.length > 0 && renderContact()}</div>
            )}
          </div>
        </>
      );
    };

    const headerTextColor = hcfg.headerStyle?.backgroundColor ? "#ffffff" : undefined;

    const renderHeaderBlock = () => {
      const isSidebarHeader = def.layout === "split" && def.sidebarHeader;
      if (isSidebarHeader) {
        // Name/contact live in the sidebar (handled by split layout below)
        const sideHeaderStyle: CSSProperties = {
          ...headerStyle,
          color: headerTextColor,
          padding: `${padX}px ${padX * 0.9}px`,
        };
        if (def.header === "sideColored" || def.header === "sideDark") {
          // ensure text contrast
        }
        return (
          <div style={sideHeaderStyle}>
            <div className="text-left">
              <h1
                className={`${sizes.name} ${nameCase} ${hcfg.nameClass} wrap-break-word`}
                style={{ ...headerNameStyle, ...blockCss("name") }}
              >
                {editMode ? (
                  <>
                    <Editable value={data.firstName || ""} placeholder="First" onCommit={(v) => update("firstName", v)} {...editableCommon("name")} className="inline-block min-w-8" />{" "}
                    <Editable value={data.lastName || ""} placeholder="Last" onCommit={(v) => update("lastName", v)} {...editableCommon("name")} className="inline-block min-w-8" />
                  </>
                ) : (
                  <>
                    <RenderBlock html={data.firstName} className="inline-block min-w-8" /> <RenderBlock html={data.lastName} className="inline-block min-w-8" />
                  </>
                )}
              </h1>
              <p className={`${sizes.title} ${hcfg.titleClass} wrap-break-word`} style={{ ...headerTitleStyle, ...blockCss("jobTitle") }}>
                {editMode ? (
                  <Editable value={data.jobTitle || ""} placeholder="Job Title" onCommit={(v) => update("jobTitle", v)} {...editableCommon("jobTitle")} />
                ) : (
                  <RenderBlock html={data.jobTitle} />
                )}
              </p>
              {contactLine.length > 0 && renderContact({ color: headerTextColor ?? undefined }, "flex-col gap-1.5 mt-3 items-start")}
            </div>
          </div>
        );
      }
      return (
        <div
          className={`${hcfg.wrap} ${hcfg.align === "center" ? "text-center" : hcfg.align === "right" ? "text-right" : hcfg.align === "split" ? "flex justify-between items-end" : "text-left"}`}
          style={{ ...headerStyle, paddingTop: padY, paddingBottom: hcfg.align === "split" ? Math.round(padY * 0.8) : Math.round(padY * 0.6), paddingLeft: padX, paddingRight: padX, color: headerTextColor }}
        >
          {hcfg.align === "split" ? (
            <>
              <div className="text-left min-w-0 pr-4">
                <h1 className={`${sizes.name} ${hcfg.big ? "text-5xl" : ""} ${nameCase} ${hcfg.nameClass} wrap-break-word`} style={{ ...headerNameStyle, ...blockCss("name") }}>
                  {editMode ? (
                    <>
                      <Editable value={data.firstName || ""} placeholder="First" onCommit={(v) => update("firstName", v)} {...editableCommon("name")} className="inline-block min-w-8" />{" "}
                      <Editable value={data.lastName || ""} placeholder="Last" onCommit={(v) => update("lastName", v)} {...editableCommon("name")} className="inline-block min-w-8" />
                    </>
                  ) : (
                    <>
                      <RenderBlock html={data.firstName} className="inline-block min-w-8" /> <RenderBlock html={data.lastName} className="inline-block min-w-8" />
                    </>
                  )}
                </h1>
                <p className={`${sizes.title} ${hcfg.titleClass} wrap-break-word`} style={{ ...headerTitleStyle, ...blockCss("jobTitle") }}>
                  {editMode ? (
                    <Editable value={data.jobTitle || ""} placeholder="Job Title" onCommit={(v) => update("jobTitle", v)} {...editableCommon("jobTitle")} />
                  ) : (
                    <RenderBlock html={data.jobTitle} />
                  )}
                </p>
              </div>
              {contactLine.length > 0 && (
                <div className={`${sizes.meta} flex flex-col items-end gap-1 text-right shrink-0 max-w-[45%]`} style={blockCss("contact")}>
                  {contactLine.map((c, i) => {
                    const Icon = CONTACT_ICONS[c.key];
                    return (
                      <span key={i} className="flex items-center gap-1.5 justify-end min-w-0">
                        {ccfg.icons && <Icon className="w-3 h-3 opacity-60 shrink-0" style={{ color: "var(--accent)" }} />}
                        {editMode ? (
                          <Editable value={c.value} placeholder={c.key} onCommit={(v) => update(c.key, v)} {...editableCommon("contact")} className="text-right" />
                        ) : (
                          <RenderBlock html={c.value} className="text-right" />
                        )}
                      </span>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            renderHeaderInner(false)
          )}
        </div>
      );
    };

    /* ── Section building blocks ── */

    const renderHeading = (section: SectionKey, index: number, inSidebar = false) => {
      const cfg = HEADING_CONFIG[def.heading] ?? HEADING_CONFIG.bordered;
      const Icon = SECTION_ICONS[section];
      const style = applyAccent(cfg.style, primaryColor);
      const label = section === "certifications" ? "Certifications" : section[0].toUpperCase() + section.slice(1);
      const headingStyle: CSSProperties = {
        ...style,
        ...(inSidebar ? { color: "#ffffff" } : isDark && !style.color ? { color: "#f3f4f6" } : {}),
        ...blockCss("sectionHeading"),
      };
      const cls = `${sizes.heading} ${cfg.className}`;

      if (def.heading === "rule" || def.heading === "centerRules") {
        const centered = def.heading === "centerRules";
        return (
          <div className={`flex items-center gap-3 ${centered ? "justify-center" : ""}`}>
            <h2 className={`${cls} whitespace-nowrap`} style={headingStyle}>
              {cfg.prefix && <span className="opacity-60 mr-2">{cfg.prefix}</span>}
              {Icon && <Icon className="w-3.5 h-3.5 inline mr-1.5 opacity-70" style={{ color: inSidebar ? "#ffffff" : primaryColor }} />}
              {label}
            </h2>
            <span className="flex-1" style={{ borderBottom: `1px solid ${dividerFor(inSidebar)}` }} />
          </div>
        );
      }

      if (def.heading === "number") {
        return (
          <h2 className={`${cls} flex items-center gap-2`} style={headingStyle}>
            <span className="font-mono text-xs opacity-70">{String(index + 1).padStart(2, "0")}.</span>
            {label}
          </h2>
        );
      }

      if (def.heading === "icon") {
        return (
          <h2 className={`${cls} flex items-center gap-2`} style={headingStyle}>
            <Icon className="w-4 h-4" style={{ color: inSidebar ? "#ffffff" : primaryColor }} />
            {label}
          </h2>
        );
      }

      if (cfg.inline) {
        return (
          <h2 className={`${cls} inline-block`} style={headingStyle}>
            {cfg.prefix && <span className="opacity-60 mr-2">{cfg.prefix}</span>}
            {label}
          </h2>
        );
      }

      return (
        <h2 className={cls} style={headingStyle}>
          {cfg.prefix && <span className="opacity-60 mr-2">{cfg.prefix}</span>}
          {label}
        </h2>
      );
    };

    const renderSummary = (inSidebar = false) => {
      if (!data.summary) return null;
      return (
        <section>
          {renderHeading("summary", 0, inSidebar)}
          {editMode ? (
            <Editable
              multiline
              value={data.summary}
              placeholder="Professional summary..."
              onCommit={(v) => update("summary", v)}
              {...editableCommon("summaryBody")}
              className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap min-h-6 w-full`}
              style={{ color: bodyColorFor(inSidebar), ...blockCss("summaryBody") }}
            />
          ) : (
            <RenderBlock html={data.summary} multiline className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap`} style={{ color: bodyColorFor(inSidebar), ...blockCss("summaryBody") }} />
          )}
        </section>
      );
    };

    const renderExperience = (inSidebar = false) => {
      const list = data.experience ?? [];
      if (list.length === 0) return null;
      const cfg = EXP_CONFIG[def.exp] ?? EXP_CONFIG.standard;

      const renderItem = (exp: ExperienceItem, i: number) => {
        const meta = (
          <span className={`${sizes.meta} ${cfg.metaClass ?? "text-gray-500"} shrink-0 whitespace-nowrap`} style={{ ...(expMetaFor(inSidebar) ? { color: expMetaFor(inSidebar) } : {}), ...blockCss("itemMeta") }}>
            {editMode ? (
              <Editable value={exp.date || ""} placeholder="Dates" onCommit={(v) => updateExp(i, "date", v)} {...editableCommon("itemMeta")} />
            ) : (
              <RenderBlock html={exp.date} />
            )}
          </span>
        );
        const title = (
          <h3 className={`${sizes.body} ${cfg.titleClass} wrap-break-word`} style={{ ...(expTitleFor(inSidebar) ? { color: expTitleFor(inSidebar) } : {}), ...blockCss("itemTitle") }}>
            {cfg.titleOrder === "companyRole" ? (
              <>
                {editMode ? (
                  <Editable value={exp.company || ""} placeholder="Company" onCommit={(v) => updateExp(i, "company", v)} {...editableCommon("itemTitle")} />
                ) : (
                  <RenderBlock html={exp.company} />
                )}
                {exp.role && (
                  <>
                    {" — "}
                    {editMode ? (
                      <Editable value={exp.role || ""} placeholder="Role" onCommit={(v) => updateExp(i, "role", v)} {...editableCommon("itemTitle")} className="font-normal italic" />
                    ) : (
                      <RenderBlock html={exp.role} className="font-normal italic" />
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {editMode ? (
                  <Editable value={exp.role || ""} placeholder="Role" onCommit={(v) => updateExp(i, "role", v)} {...editableCommon("itemTitle")} />
                ) : (
                  <RenderBlock html={exp.role} />
                )}
                {exp.company && (
                  <>
                    {" · "}
                    {editMode ? (
                      <Editable value={exp.company || ""} placeholder="Company" onCommit={(v) => updateExp(i, "company", v)} {...editableCommon("itemTitle")} className="font-normal" style={{ color: secondaryFor(inSidebar) }} />
                    ) : (
                      <RenderBlock html={exp.company} className="font-normal" style={{ color: secondaryFor(inSidebar) }} />
                    )}
                  </>
                )}
              </>
            )}
          </h3>
        );
        const body = (
          <>
            {editMode ? (
              <Editable
                multiline
                value={exp.description || ""}
                placeholder="Describe your achievements..."
                onCommit={(v) => updateExp(i, "description", v)}
                {...editableCommon("itemBody")}
                className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap mt-1 min-h-4 w-full`}
                style={{ color: expBodyFor(inSidebar), ...blockCss("itemBody") }}
              />
            ) : (
              <RenderBlock html={exp.description} multiline className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap mt-1`} style={{ color: expBodyFor(inSidebar), ...blockCss("itemBody") }} />
            )}
          </>
        );

        if (cfg.timeline) {
          return (
            <div key={exp.id} className="flex gap-3">
              <div className="flex flex-col items-center shrink-0 pt-1">
                <span className="w-2.5 h-2.5 rounded-full border-2 shrink-0" style={{ borderColor: primaryColor, backgroundColor: "#fff" }} />
                <span className="w-px flex-1 my-1" style={{ backgroundColor: dividerFor(inSidebar) }} />
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <div className="flex justify-between items-baseline gap-3">
                  {title}
                  {meta}
                </div>
                {body}
              </div>
            </div>
          );
        }
        if (cfg.columns) {
          return (
            <div key={exp.id} className="grid grid-cols-[112px_1fr] gap-4">
              <div className="pt-0.5">{meta}</div>
              <div className="min-w-0">
                {title}
                {body}
              </div>
            </div>
          );
        }
        if (cfg.itemClass) {
          return (
            <div key={exp.id} className={cfg.itemClass} style={{ borderColor: dividerFor(inSidebar) }}>
              <div className="flex justify-between items-baseline gap-3">
                {title}
                {meta}
              </div>
              {body}
            </div>
          );
        }
        return (
          <div key={exp.id}>
            <div className="flex justify-between items-baseline gap-3">{title}
              {meta}
            </div>
            {body}
          </div>
        );
      };

      return (
        <section>
          {renderHeading("experience", 1, inSidebar)}
          <div className="flex flex-col" style={{ gap: itemGap * 1.15 }}>
            {list.map(renderItem)}
          </div>
        </section>
      );
    };

    const renderEducation = (inSidebar = false) => {
      const list = data.education ?? [];
      if (list.length === 0) return null;
      const cfg = EDU_CONFIG[def.edu] ?? EDU_CONFIG.standard;

      return (
        <section>
          {renderHeading("education", 2, inSidebar)}
          <div className="flex flex-col" style={{ gap: itemGap }}>
            {list.map((edu, i) => {
              const school = editMode ? (
                <Editable value={edu.school || ""} placeholder="School" onCommit={(v) => updateEdu(i, "school", v)} {...editableCommon("itemTitle")} />
              ) : (
                <RenderBlock html={edu.school} />
              );
              const degree = editMode ? (
                <Editable value={edu.degree || ""} placeholder="Degree" onCommit={(v) => updateEdu(i, "degree", v)} {...editableCommon("itemSubtitle")} />
              ) : (
                <RenderBlock html={edu.degree} />
              );
              const date = editMode ? (
                <Editable value={edu.date || ""} placeholder="Dates" onCommit={(v) => updateEdu(i, "date", v)} {...editableCommon("itemMeta")} />
              ) : (
                <RenderBlock html={edu.date} />
              );

              const titleLine =
                cfg.order === "degree" ? (
                  <>
                    <span className="font-bold">{degree}</span>
                    <span className="italic" style={{ color: secondaryFor(inSidebar) }}> · {school}</span>
                  </>
                ) : (
                  <>
                    <span className="font-bold">{school}</span>
                    <span className="italic" style={{ color: secondaryFor(inSidebar) }}> · {degree}</span>
                  </>
                );

              const inner = (
                <>
                  <div className="flex justify-between items-baseline gap-3">
                    <h3 className={`${sizes.body} font-bold text-gray-900 wrap-break-word`} style={{ ...(expTitleFor(inSidebar) ? { color: expTitleFor(inSidebar) } : {}), ...blockCss("itemTitle") }}>
                      {titleLine}
                    </h3>
                    <span className={`${sizes.meta} text-gray-500 shrink-0 whitespace-nowrap`} style={{ ...(expMetaFor(inSidebar) ? { color: expMetaFor(inSidebar) } : {}), ...blockCss("itemMeta") }}>
                      {date}
                    </span>
                  </div>
                </>
              );

              return cfg.itemClass ? (
                <div key={edu.id} className={cfg.itemClass} style={{ borderColor: dividerFor(inSidebar) }}>
                  {inner}
                </div>
              ) : (
                <div key={edu.id}>{inner}</div>
              );
            })}
          </div>
        </section>
      );
    };

    const splitSkillLines = (value: string): string[] => {
      const lines = value.split(/\n/).map((l) => l.trim()).filter(Boolean);
      if (lines.length > 1) return lines;
      return value.split(/,\s*/).map((l) => l.trim()).filter(Boolean);
    };

    const renderSkills = (inSidebar = false) => {
      if (!data.skills) return null;
      const variant = def.skills;

      const heading = renderHeading("skills", 3, inSidebar);

      if (variant === "chips") {
        const lines = splitSkillLines(data.skills);
        return (
          <section>
            {heading}
            <div className="flex flex-wrap gap-1.5">
              {lines.map((line, i) => {
                if (editMode) {
                  return (
                    <Editable
                      key={`${i}-${line.slice(0, 4)}`}
                      value={line}
                      placeholder="Skill"
                      onCommit={(v) => {
                        const all = splitSkillLines(data.skills || "");
                        const sep = /,\s*/.test(data.skills || "") && all.length <= 1 ? ", " : "\n";
                        const next = [...all];
                        next[i] = v.trim();
                        update("skills", next.join(sep));
                      }}
                      {...editableCommon("itemBody")}
                      className="px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap max-w-full overflow-hidden"
                      style={{ ...chipStyleFor(inSidebar), lineHeight: 1.4 }}
                    />
                  );
                }
                return (
                  <span key={`${i}-${line.slice(0, 4)}`} className="px-2.5 py-1 rounded-md text-xs font-medium wrap-break-word" style={chipStyleFor(inSidebar)}>
                    {line}
                  </span>
                );
              })}
            </div>
            {editMode && (
              <p className="text-[10px] text-gray-400 mt-1.5 italic">Each line (or comma-separated value) becomes a chip.</p>
            )}
          </section>
        );
      }

      if (variant === "columns") {
        return (
          <section>
            {heading}
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {editMode ? (
                <Editable multiline value={data.skills} placeholder="Skills..." onCommit={(v) => update("skills", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap min-h-6 w-full`} style={{ color: bodyColorFor(inSidebar), ...blockCss("itemBody") }} />
              ) : (
                <RenderBlock html={data.skills} multiline className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap col-span-2`} style={{ color: bodyColorFor(inSidebar), ...blockCss("itemBody") }} />
              )}
            </div>
          </section>
        );
      }

      if (variant === "rules" || variant === "monoList") {
        const isMono = variant === "monoList";
        return (
          <section>
            {heading}
            {editMode ? (
              <Editable multiline value={data.skills} placeholder="Skills..." onCommit={(v) => update("skills", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap min-h-6 w-full ${isMono ? "font-mono" : ""}`} style={{ color: bodyColorFor(inSidebar), ...blockCss("itemBody") }} />
            ) : (
              <RenderBlock html={data.skills} multiline className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap ${isMono ? "font-mono" : ""}`} style={{ color: bodyColorFor(inSidebar), ...blockCss("itemBody") }} />
            )}
          </section>
        );
      }

      // text (default)
      return (
        <section>
          {heading}
          {editMode ? (
            <Editable multiline value={data.skills} placeholder="Skills..." onCommit={(v) => update("skills", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap min-h-6 w-full`} style={{ color: bodyColorFor(inSidebar), ...blockCss("itemBody") }} />
          ) : (
            <RenderBlock html={data.skills} multiline className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap`} style={{ color: bodyColorFor(inSidebar), ...blockCss("itemBody") }} />
          )}
        </section>
      );
    };

    const renderCertifications = (inSidebar = false) => {
      if (!data.certifications) return null;
      return (
        <section>
          {renderHeading("certifications", 4, inSidebar)}
          {editMode ? (
            <Editable multiline value={data.certifications} placeholder="Certifications..." onCommit={(v) => update("certifications", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap min-h-6 w-full`} style={{ color: bodyColorFor(inSidebar), ...blockCss("itemBody") }} />
          ) : (
            <RenderBlock html={data.certifications} multiline className={`block ${sizes.body} leading-relaxed whitespace-pre-wrap`} style={{ color: bodyColorFor(inSidebar), ...blockCss("itemBody") }} />
          )}
        </section>
      );
    };

    const sectionRenderers: Record<SectionKey, (inSidebar?: boolean) => ReactNode | null> = {
      summary: renderSummary,
      experience: renderExperience,
      education: renderEducation,
      skills: renderSkills,
      certifications: renderCertifications,
    };

    const renderSections = (keys: SectionKey[], gap: number, tone: "normal" | "sidebar" = "normal") => {
      const inSidebar = tone === "sidebar";
      return (
        <div className="flex flex-col" style={{ gap }}>
          {keys.map((key) => sectionRenderers[key]?.(inSidebar) ?? null)}
        </div>
      );
    };

    /* ── Assemble the page ── */

    const fontListToLoad = [theme.fontFamily, def.font];
    if (data.blockStyles) {
      Object.values(data.blockStyles).forEach((b) => {
        if (b.fontFamily) fontListToLoad.push(b.fontFamily);
      });
    }

    const containerStyle: CSSProperties = {
      fontFamily: fontStack,
      ...applyAccent(def.container, primaryColor),
    };

    const isSplit = def.layout === "split";
    const sidebarWidth = def.sidebarWidth ?? 33;
    const sidebarLeft = def.sidebar !== "right";
    const basePadding: CSSProperties = {
      paddingLeft: padX,
      paddingRight: padX,
      paddingBottom: padY,
    };

    /* Sidebar chrome for split layouts */
    const sidebarBg = (() => {
      switch (def.header) {
        case "sideColored":
          return primaryColor;
        case "sideDark":
          return "#1f2937";
        case "sideSoft":
          return applyAccent({ backgroundColor: "var(--accent)" }, primaryColor).backgroundColor ?? "#f3f4f6";
        default:
          return undefined;
      }
    })();
    const sidebarTextColor = sidebarBg ? "#ffffff" : undefined;

    const accentEdge = def.accentEdge ?? "none";

    return (
      <div ref={wrapperRef} className="relative group">
        <GoogleFontLoader fonts={Array.from(new Set(fontListToLoad))} />

        {editMode && activeBlock && onChange && (
          <FloatingToolbar style={toolbarStyle} value={data.blockStyles?.[activeBlock] ?? {}} onPatch={patchBlockStyle} />
        )}

        <div ref={ref} style={containerStyle} className="w-[210mm] min-h-[297mm] bg-white text-black shrink-0 relative overflow-hidden">
          {editMode && exTheme.profileImage && (
            <img
              src={exTheme.profileImage}
              alt="Profile"
              onMouseDown={handleImgMouseDown}
              style={{
                position: "absolute",
                left: `${imgPos.x}px`,
                top: `${imgPos.y}px`,
                width: `${exTheme.imageWidth ?? 120}px`,
                height: `${exTheme.imageWidth ?? 120}px`,
                objectFit: "cover",
                borderRadius: "50%",
                cursor: "grab",
                zIndex: 50,
                boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
              }}
            />
          )}
          {!editMode && exTheme.profileImage && (
            <img
              src={exTheme.profileImage}
              alt="Profile"
              style={{
                position: "absolute",
                left: `${exTheme.imagePosX ?? 40}px`,
                top: `${exTheme.imagePosY ?? 40}px`,
                width: `${exTheme.imageWidth ?? 120}px`,
                height: `${exTheme.imageWidth ?? 120}px`,
                objectFit: "cover",
                borderRadius: "50%",
                zIndex: 50,
              }}
            />
          )}

          {!isSplit &&
            accentEdge === "left" && (
              <div className="absolute left-0 top-0 bottom-0 w-2" style={{ backgroundColor: primaryColor }} />
            )}
          {!isSplit &&
            accentEdge === "top" && (
              <div className="absolute left-0 right-0 top-0 h-2" style={{ backgroundColor: primaryColor }} />
            )}

          {isSplit && def.sidebarHeader ? (
            /* Split layout: name/contact inside sidebar */
            <div className="flex min-h-[297mm]" style={{ paddingLeft: accentEdge === "left" ? 8 : 0 }}>
              {sidebarLeft && (
                <aside className="shrink-0" style={{ width: `${sidebarWidth}%`, backgroundColor: sidebarBg, color: sidebarTextColor }}>
                  {renderHeaderBlock()}
                  <div className="px-5 pb-6" style={{ paddingLeft: padX * 0.85, paddingRight: padX * 0.85, paddingTop: 16, display: "flex", flexDirection: "column", gap: 22, color: sidebarTextColor }}>
                    {renderSections(def.sidebarSections ?? ["skills", "certifications"], 22, "sidebar")}
                  </div>
                </aside>
              )}
              <main className="flex-1 min-w-0" style={basePadding}>
                <div className="flex flex-col" style={{ gap: sectionGap }}>
                  <div className="flex flex-col" style={{ gap: sectionGap }}>
                    {(def.mainSections ?? def.sections ?? []).slice(0, 1).map((key) => sectionRenderers[key]?.() ?? null)}
                  </div>
                  {renderSections((def.mainSections ?? def.sections ?? []).slice(1), sectionGap)}
                </div>
              </main>
              {!sidebarLeft && (
                <aside className="shrink-0" style={{ width: `${sidebarWidth}%`, backgroundColor: sidebarBg, color: sidebarTextColor }}>
                  {renderHeaderBlock()}
                  <div className="px-5 pb-6" style={{ paddingLeft: padX * 0.85, paddingRight: padX * 0.85, paddingTop: 16, display: "flex", flexDirection: "column", gap: 22, color: sidebarTextColor }}>
                    {renderSections(def.sidebarSections ?? ["skills", "certifications"], 22, "sidebar")}
                  </div>
                </aside>
              )}
            </div>
          ) : isSplit ? (
            /* Split layout with full-width header above */
            <>
              {renderHeaderBlock()}
              <div className="flex" style={{ ...basePadding, paddingTop: Math.round(padY * 0.5) }}>
                {sidebarLeft ? (
                  <>
                    <aside className="shrink-0 pr-5" style={{ width: `${sidebarWidth}%` }}>
                      <div className="flex flex-col" style={{ gap: sectionGap }}>
                        {renderSections(def.sidebarSections ?? ["skills", "certifications"], sectionGap)}
                      </div>
                    </aside>
                    <main className="flex-1 min-w-0">
                      <div className="flex flex-col" style={{ gap: sectionGap }}>
                        {renderSections(def.mainSections ?? def.sections ?? [], sectionGap)}
                      </div>
                    </main>
                  </>
                ) : (
                  <>
                    <main className="flex-1 min-w-0 pr-5">
                      <div className="flex flex-col" style={{ gap: sectionGap }}>
                        {renderSections(def.mainSections ?? def.sections ?? [], sectionGap)}
                      </div>
                    </main>
                    <aside className="shrink-0" style={{ width: `${sidebarWidth}%` }}>
                      <div className="flex flex-col" style={{ gap: sectionGap }}>
                        {renderSections(def.sidebarSections ?? ["skills", "certifications"], sectionGap)}
                      </div>
                    </aside>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Single column */
            <>
              {renderHeaderBlock()}
              <div style={{ ...basePadding, paddingTop: Math.round(padY * 0.55) }}>
                {renderSections(def.sections, sectionGap)}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }
);

ResumeRenderer.displayName = "ResumeRenderer";

export default ResumeRenderer;