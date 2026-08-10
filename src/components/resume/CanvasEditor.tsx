// src/components/resume/CanvasEditor.tsx
"use client";

import { forwardRef, useEffect, useRef, useState } from "react";
import {
  ResumeData,
  DEFAULT_THEME,
  getFontStack,
  ResumeFontSize,
  THEME_FONT_OPTIONS,
  ResumeBlockKey,
  TextBlockStyle,
  ExperienceItem,
  EducationItem
} from "@/types";
import {
  Bold, Italic, Underline, Strikethrough,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
} from "lucide-react";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
}

const SIZE_MAP: Record<ResumeFontSize, { name: string; title: string; meta: string; heading: string; body: string }> = {
  sm: { name: "text-2xl", title: "text-base", meta: "text-xs", heading: "text-xs", body: "text-xs" },
  md: { name: "text-3xl", title: "text-lg", meta: "text-sm", heading: "text-sm", body: "text-sm" },
  lg: { name: "text-4xl", title: "text-xl", meta: "text-base", heading: "text-base", body: "text-base" },
};

function styleToCss(s: TextBlockStyle | undefined): React.CSSProperties {
  if (!s) return {};
  const decoration = [s.underline && "underline", s.strike && "line-through"].filter(Boolean).join(" ");
  return {
    fontWeight: s.bold ? 700 : undefined,
    fontStyle: s.italic ? "italic" : undefined,
    textDecoration: decoration || undefined,
    textAlign: s.align,
    fontFamily: s.fontFamily,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing !== undefined ? `${s.letterSpacing}px` : undefined,
  };
}

/* --- Editable Component --- */
interface EditableProps {
  value: string;
  placeholder: string;
  onCommit: (value: string) => void;
  onFocusBlock: (el: HTMLElement) => void;
  // UPDATE: Now accepts the focus event to track where focus is going
  onBlurBlock: (e: React.FocusEvent<HTMLElement>) => void;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}

function Editable({ value, placeholder, onCommit, onFocusBlock, onBlurBlock, className, style, multiline }: EditableProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement !== el && el.innerText !== (value || "")) {
      el.innerText = value || "";
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
        const text = el.innerText.replace(/\n$/, "");
        if (text.trim() === "" && el.innerHTML !== "") el.innerHTML = "";
        onCommit(text);
      }}
      className={`outline-none cursor-text rounded-sm focus:ring-2 focus:ring-indigo-400/50 focus:ring-offset-2 empty:before:content-[attr(data-placeholder)] empty:before:text-current empty:before:opacity-40 empty:before:pointer-events-none ${className ?? ""}`}
      style={style}
    />
  );
}

/* --- Floating Toolbar --- */
interface ToolbarProps {
  style: React.CSSProperties;
  value: TextBlockStyle;
  onPatch: (patch: Partial<TextBlockStyle>) => void;
}

const stopMouseDown = (e: React.MouseEvent) => e.preventDefault();
// UPDATE: Added allowFocus to prevent the container's preventDefault from breaking inputs
const allowFocus = (e: React.MouseEvent) => e.stopPropagation();

function ToggleButton({ active, onClick, Icon, label }: { active: boolean; onClick: () => void; Icon: React.ElementType; label: string }) {
  return (
    <button type="button" title={label} onMouseDown={stopMouseDown} onClick={onClick} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${active ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
      <Icon size={14} strokeWidth={2.25} />
    </button>
  );
}

function FloatingToolbar({ style, value, onPatch }: ToolbarProps) {
  return (
    <div 
      style={style} 
      onMouseDown={stopMouseDown} 
      // Added flex-wrap, w-max, and max-w constraints to allow wrapping on small screens
      className="absolute z-50 bg-white border border-gray-200 shadow-xl rounded-xl p-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1.5 w-max max-w-[90vw] sm:max-w-150"
    >
      {/* Group 1: Typography Options */}
      <div className="flex items-center gap-1">
        <select 
          value={value.fontFamily ?? ""} 
          onMouseDown={allowFocus} 
          onChange={(e) => onPatch({ fontFamily: e.target.value || undefined })} 
          // Increased width to w-24 and added truncate
          className="text-xs border border-gray-200 rounded-md pl-1.5 pr-1 py-1 outline-none w-24 bg-white text-gray-700 truncate"
        >
          <option value="">Theme</option>
          {THEME_FONT_OPTIONS.map((f) => (<option key={f.value} value={f.stack}>{f.label}</option>))}
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

      {/* Group 2: Text Formatting */}
      <div className="flex items-center gap-1">
        <ToggleButton active={!!value.bold} onClick={() => onPatch({ bold: !value.bold })} Icon={Bold} label="Bold" />
        <ToggleButton active={!!value.italic} onClick={() => onPatch({ italic: !value.italic })} Icon={Italic} label="Italic" />
        <ToggleButton active={!!value.underline} onClick={() => onPatch({ underline: !value.underline })} Icon={Underline} label="Underline" />
        <ToggleButton active={!!value.strike} onClick={() => onPatch({ strike: !value.strike })} Icon={Strikethrough} label="Strikethrough" />
      </div>

      <div className="hidden sm:block w-px h-5 bg-gray-200 shrink-0" />

      {/* Group 3: Alignment */}
      <div className="flex items-center gap-1">
        <ToggleButton active={!value.align || value.align === "left"} onClick={() => onPatch({ align: "left" })} Icon={AlignLeft} label="Align left" />
        <ToggleButton active={value.align === "center"} onClick={() => onPatch({ align: "center" })} Icon={AlignCenter} label="Align center" />
        <ToggleButton active={value.align === "right"} onClick={() => onPatch({ align: "right" })} Icon={AlignRight} label="Align right" />
        <ToggleButton active={value.align === "justify"} onClick={() => onPatch({ align: "justify" })} Icon={AlignJustify} label="Justify" />
      </div>
      
      {/* Hidden on small screens so the pointer doesn't misalign when wrapped */}
      <div className="absolute left-1/2 -bottom-1.25 -translate-x-1/2 w-2.5 h-2.5 bg-white border-b border-r border-gray-200 rotate-45 hidden sm:block" />
    </div>
  );
}

/* --- Canvas Editor --- */
const CanvasEditor = forwardRef<HTMLDivElement, Props>(({ data, onChange }, ref) => {
  const theme = data.theme ?? DEFAULT_THEME;
  const sizes = SIZE_MAP[theme.fontSize] ?? SIZE_MAP.md;
  const fontStack = getFontStack(theme.fontFamily);
  const accent = theme.primaryColor;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const [activeBlock, setActiveBlock] = useState<ResumeBlockKey | null>(null);
  const [toolbarStyle, setToolbarStyle] = useState<React.CSSProperties>({});

  const positionToolbar = (el: HTMLElement) => {
    const wrap = wrapperRef.current;
    if (!wrap) return;
    const elRect = el.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const rawLeft = elRect.left - wrapRect.left + elRect.width / 2;
    setToolbarStyle({
      top: elRect.top - wrapRect.top - 10,
      left: Math.min(Math.max(rawLeft, 200), wrapRect.width - 20),
      transform: "translate(-50%, -100%)",
    });
  };

  const handleFocusBlock = (key: ResumeBlockKey) => (el: HTMLElement) => {
    setActiveBlock(key);
    positionToolbar(el);
  };
  
  // UPDATE: Check if the new focus target is inside our wrapper (e.g., clicking a toolbar dropdown)
  // If it is, we prevent the toolbar from closing.
  const handleBlurBlock = (e: React.FocusEvent<HTMLElement>) => {
    if (wrapperRef.current?.contains(e.relatedTarget as Node)) {
      return;
    }
    setActiveBlock(null);
  };

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
  }, [activeBlock]);

  const patchBlockStyle = (patch: Partial<TextBlockStyle>) => {
    if (!activeBlock) return;
    const current = data.blockStyles ?? {};
    const currentBlock = current[activeBlock] ?? {};
    onChange({ ...data, blockStyles: { ...current, [activeBlock]: { ...currentBlock, ...patch } } });
  };

  const blockCss = (key: ResumeBlockKey) => styleToCss(data.blockStyles?.[key]);
  const update = (field: keyof ResumeData, value: string) => onChange({ ...data, [field]: value });
  
  const updateExp = (index: number, field: keyof ExperienceItem, val: string) => {
    const newArr = [...(data.experience || [])];
    newArr[index] = { ...newArr[index], [field]: val };
    onChange({ ...data, experience: newArr });
  };

  const updateEdu = (index: number, field: keyof EducationItem, val: string) => {
    const newArr = [...(data.education || [])];
    newArr[index] = { ...newArr[index], [field]: val };
    onChange({ ...data, education: newArr });
  };

  const editableCommon = (key: ResumeBlockKey) => ({
    onFocusBlock: handleFocusBlock(key),
    // eslint-disable-next-line react-hooks/refs
    onBlurBlock: handleBlurBlock,
  });

  return (
    <div className="relative group" ref={wrapperRef}>
      {activeBlock && (
        <FloatingToolbar style={toolbarStyle} value={data.blockStyles?.[activeBlock] ?? {}} onPatch={patchBlockStyle} />
      )}

      <div ref={ref} style={{ fontFamily: fontStack }} className="w-[210mm] min-h-[297mm] bg-white text-black shadow-lg ring-1 ring-gray-200/50 shrink-0">
        
        {/* --- MODERN LAYOUT --- */}
        {theme.layout === "modern" && (
          <>
            <div className="px-12 py-10 text-white" style={{ backgroundColor: accent }}>
              <h1 className={`${sizes.name} font-bold tracking-wide mb-1`} style={blockCss("name")}>
                <Editable value={data.firstName} placeholder="First" onCommit={(v) => update("firstName", v)} {...editableCommon("name")} className="inline-block min-w-8" />{" "}
                <Editable value={data.lastName} placeholder="Last" onCommit={(v) => update("lastName", v)} {...editableCommon("name")} className="inline-block min-w-8" />
              </h1>
              <p className={`${sizes.title} opacity-90`} style={blockCss("jobTitle")}>
                <Editable value={data.jobTitle} placeholder="Job Title" onCommit={(v) => update("jobTitle", v)} {...editableCommon("jobTitle")} className="inline-block min-w-16" />
              </p>
              <div className={`${sizes.meta} opacity-80 flex flex-wrap gap-x-4 gap-y-1 mt-3`} style={blockCss("contact")}>
                <Editable value={data.email} placeholder="email@example.com" onCommit={(v) => update("email", v)} {...editableCommon("contact")} />
                <Editable value={data.phone} placeholder="Phone" onCommit={(v) => update("phone", v)} {...editableCommon("contact")} />
                <Editable value={data.address} placeholder="Location" onCommit={(v) => update("address", v)} {...editableCommon("contact")} />
              </div>
            </div>

            <div className="px-12 py-8 space-y-6">
              {/* Summary */}
              <div>
                <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-3`} style={{ color: accent, ...blockCss("sectionHeading") }}>Summary</h2>
                <Editable value={data.summary} placeholder="Your professional summary will appear here." onCommit={(v) => update("summary", v)} {...editableCommon("summaryBody")} multiline className={`block ${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap min-h-6`} style={blockCss("summaryBody")} />
              </div>

              {/* Experience */}
              {data.experience && data.experience.length > 0 && (
                <div>
                  <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-3`} style={{ color: accent, ...blockCss("sectionHeading") }}>Experience</h2>
                  <div className="space-y-4">
                    {data.experience.map((exp, i) => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={`${sizes.body} font-bold text-gray-900`} style={blockCss("itemTitle")}>
                            <Editable value={exp.role} placeholder="Role" onCommit={v => updateExp(i, 'role', v)} {...editableCommon("itemTitle")} />
                          </h3>
                          <span className={`${sizes.meta} text-gray-500`} style={blockCss("itemMeta")}>
                            <Editable value={exp.date} placeholder="Dates" onCommit={v => updateExp(i, 'date', v)} {...editableCommon("itemMeta")} />
                          </span>
                        </div>
                        <div className={`${sizes.meta} font-medium text-gray-700 mb-1.5`} style={blockCss("itemSubtitle")}>
                          <Editable value={exp.company} placeholder="Company Name" onCommit={v => updateExp(i, 'company', v)} {...editableCommon("itemSubtitle")} />
                        </div>
                        <Editable multiline value={exp.description} placeholder="Describe your achievements..." onCommit={v => updateExp(i, 'description', v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed text-gray-600 whitespace-pre-wrap min-h-4`} style={blockCss("itemBody")} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {data.education && data.education.length > 0 && (
                <div>
                  <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-3`} style={{ color: accent, ...blockCss("sectionHeading") }}>Education</h2>
                  <div className="space-y-4">
                    {data.education.map((edu, i) => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={`${sizes.body} font-bold text-gray-900`} style={blockCss("itemTitle")}>
                            <Editable value={edu.degree} placeholder="Degree" onCommit={v => updateEdu(i, 'degree', v)} {...editableCommon("itemTitle")} />
                          </h3>
                          <span className={`${sizes.meta} text-gray-500`} style={blockCss("itemMeta")}>
                            <Editable value={edu.date} placeholder="Dates" onCommit={v => updateEdu(i, 'date', v)} {...editableCommon("itemMeta")} />
                          </span>
                        </div>
                        <div className={`${sizes.meta} text-gray-700`} style={blockCss("itemSubtitle")}>
                          <Editable value={edu.school} placeholder="School Name" onCommit={v => updateEdu(i, 'school', v)} {...editableCommon("itemSubtitle")} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skills & Certs */}
              <div className="grid grid-cols-2 gap-6">
                {data.skills && (
                  <div>
                    <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-2`} style={{ color: accent, ...blockCss("sectionHeading") }}>Skills</h2>
                    <Editable multiline value={data.skills} placeholder="List your skills..." onCommit={(v) => update("skills", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap min-h-6`} style={blockCss("itemBody")} />
                  </div>
                )}
                {data.certifications && (
                  <div>
                    <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-2`} style={{ color: accent, ...blockCss("sectionHeading") }}>Certifications</h2>
                    <Editable multiline value={data.certifications} placeholder="List your certifications..." onCommit={(v) => update("certifications", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap min-h-6`} style={blockCss("itemBody")} />
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* --- CLASSIC LAYOUT --- */}
        {theme.layout === "classic" && (
           <div className="p-12">
            <div className="text-center border-b pb-6 mb-6" style={{ borderColor: accent }}>
              <h1 className={`${sizes.name} font-bold uppercase tracking-wider mb-1`} style={blockCss("name")}>
                <Editable value={data.firstName} placeholder="First" onCommit={(v) => update("firstName", v)} {...editableCommon("name")} className="inline-block min-w-8" />{" "}
                <Editable value={data.lastName} placeholder="Last" onCommit={(v) => update("lastName", v)} {...editableCommon("name")} className="inline-block min-w-8" />
              </h1>
              <p className={`${sizes.title} text-gray-600 mb-3`} style={blockCss("jobTitle")}>
                <Editable value={data.jobTitle} placeholder="Job Title" onCommit={(v) => update("jobTitle", v)} {...editableCommon("jobTitle")} />
              </p>
              <div className={`${sizes.meta} text-gray-500 flex justify-center flex-wrap gap-x-2 gap-y-1`} style={blockCss("contact")}>
                <Editable value={data.email} placeholder="Email" onCommit={(v) => update("email", v)} {...editableCommon("contact")} /><span>|</span>
                <Editable value={data.phone} placeholder="Phone" onCommit={(v) => update("phone", v)} {...editableCommon("contact")} /><span>|</span>
                <Editable value={data.address} placeholder="Location" onCommit={(v) => update("address", v)} {...editableCommon("contact")} />
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Summary */}
              <div>
                <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-3 border-b pb-1`} style={{ color: accent, borderColor: accent, ...blockCss("sectionHeading") }}>Summary</h2>
                <Editable value={data.summary} placeholder="Professional summary..." onCommit={(v) => update("summary", v)} {...editableCommon("summaryBody")} multiline className={`block ${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap min-h-6`} style={blockCss("summaryBody")} />
              </div>

              {/* Experience */}
              {data.experience && data.experience.length > 0 && (
                <div>
                  <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-3 border-b pb-1`} style={{ color: accent, borderColor: accent, ...blockCss("sectionHeading") }}>Experience</h2>
                  <div className="space-y-4">
                    {data.experience.map((exp, i) => (
                      <div key={exp.id}>
                        <div className="flex justify-between items-baseline mb-0.5">
                          <h3 className={`${sizes.body} font-bold text-gray-900`} style={blockCss("itemTitle")}>
                            <Editable value={exp.company} placeholder="Company" onCommit={v => updateExp(i, 'company', v)} {...editableCommon("itemTitle")} /> — <Editable value={exp.role} placeholder="Role" onCommit={v => updateExp(i, 'role', v)} {...editableCommon("itemTitle")} className="font-normal italic" />
                          </h3>
                          <span className={`${sizes.meta} text-gray-500`} style={blockCss("itemMeta")}>
                            <Editable value={exp.date} placeholder="Dates" onCommit={v => updateExp(i, 'date', v)} {...editableCommon("itemMeta")} />
                          </span>
                        </div>
                        <Editable multiline value={exp.description} placeholder="Describe your achievements..." onCommit={v => updateExp(i, 'description', v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed text-gray-600 whitespace-pre-wrap mt-1.5`} style={blockCss("itemBody")} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {data.education && data.education.length > 0 && (
                <div>
                  <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-3 border-b pb-1`} style={{ color: accent, borderColor: accent, ...blockCss("sectionHeading") }}>Education</h2>
                  <div className="space-y-4">
                    {data.education.map((edu, i) => (
                      <div key={edu.id}>
                        <div className="flex justify-between items-baseline">
                          <h3 className={`${sizes.body} font-bold text-gray-900`} style={blockCss("itemTitle")}>
                            <Editable value={edu.school} placeholder="School" onCommit={v => updateEdu(i, 'school', v)} {...editableCommon("itemTitle")} />
                          </h3>
                          <span className={`${sizes.meta} text-gray-500`} style={blockCss("itemMeta")}>
                            <Editable value={edu.date} placeholder="Dates" onCommit={v => updateEdu(i, 'date', v)} {...editableCommon("itemMeta")} />
                          </span>
                        </div>
                        <div className={`${sizes.meta} text-gray-700 italic`} style={blockCss("itemSubtitle")}>
                          <Editable value={edu.degree} placeholder="Degree" onCommit={v => updateEdu(i, 'degree', v)} {...editableCommon("itemSubtitle")} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Skills & Certs */}
              <div className="grid grid-cols-2 gap-6">
                {data.skills && (
                  <div>
                    <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-2 border-b pb-1`} style={{ color: accent, borderColor: accent, ...blockCss("sectionHeading") }}>Skills</h2>
                    <Editable multiline value={data.skills} placeholder="Skills..." onCommit={(v) => update("skills", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap`} style={blockCss("itemBody")} />
                  </div>
                )}
                {data.certifications && (
                  <div>
                    <h2 className={`${sizes.heading} font-bold uppercase tracking-widest mb-2 border-b pb-1`} style={{ color: accent, borderColor: accent, ...blockCss("sectionHeading") }}>Certifications</h2>
                    <Editable multiline value={data.certifications} placeholder="Certifications..." onCommit={(v) => update("certifications", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap`} style={blockCss("itemBody")} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- MINIMAL LAYOUT --- */}
        {theme.layout === "minimal" && (
          <div className="p-14">
            <div className="mb-10">
              <h1 className={`${sizes.name} font-semibold tracking-tight mb-1 text-gray-900`} style={blockCss("name")}>
                <Editable value={data.firstName} placeholder="First" onCommit={(v) => update("firstName", v)} {...editableCommon("name")} />{" "}
                <Editable value={data.lastName} placeholder="Last" onCommit={(v) => update("lastName", v)} {...editableCommon("name")} />
              </h1>
              <p className={`${sizes.title} font-medium mb-2`} style={{ color: accent, ...blockCss("jobTitle") }}>
                <Editable value={data.jobTitle} placeholder="Job Title" onCommit={(v) => update("jobTitle", v)} {...editableCommon("jobTitle")} />
              </p>
              <div className={`${sizes.meta} text-gray-500 flex flex-wrap items-center gap-x-1 gap-y-1`} style={blockCss("contact")}>
                <Editable value={data.email} placeholder="Email" onCommit={(v) => update("email", v)} {...editableCommon("contact")} /><span className="mx-2 text-gray-300">·</span>
                <Editable value={data.phone} placeholder="Phone" onCommit={(v) => update("phone", v)} {...editableCommon("contact")} /><span className="mx-2 text-gray-300">·</span>
                <Editable value={data.address} placeholder="Location" onCommit={(v) => update("address", v)} {...editableCommon("contact")} />
              </div>
            </div>

            <div className="space-y-8">
              {/* Summary */}
              <div>
                <h2 className={`${sizes.heading} font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3`} style={blockCss("sectionHeading")}>Summary</h2>
                <Editable value={data.summary} placeholder="Professional summary..." onCommit={(v) => update("summary", v)} {...editableCommon("summaryBody")} multiline className={`block ${sizes.body} leading-loose text-gray-700 whitespace-pre-wrap`} style={blockCss("summaryBody")} />
              </div>

              {/* Experience */}
              {data.experience && data.experience.length > 0 && (
                <div>
                  <h2 className={`${sizes.heading} font-semibold uppercase tracking-[0.2em] text-gray-400 mb-4`} style={blockCss("sectionHeading")}>Experience</h2>
                  <div className="space-y-6">
                    {data.experience.map((exp, i) => (
                      <div key={exp.id} className="grid grid-cols-[1fr_3fr] gap-4">
                        <div className={`${sizes.meta} text-gray-500 mt-1`} style={blockCss("itemMeta")}>
                          <Editable value={exp.date} placeholder="Dates" onCommit={v => updateExp(i, 'date', v)} {...editableCommon("itemMeta")} />
                        </div>
                        <div>
                          <h3 className={`${sizes.body} font-semibold text-gray-900`} style={blockCss("itemTitle")}>
                            <Editable value={exp.role} placeholder="Role" onCommit={v => updateExp(i, 'role', v)} {...editableCommon("itemTitle")} />
                          </h3>
                          <div className={`${sizes.meta} text-gray-500 mb-2`} style={{ color: accent, ...blockCss("itemSubtitle") }}>
                            <Editable value={exp.company} placeholder="Company" onCommit={v => updateExp(i, 'company', v)} {...editableCommon("itemSubtitle")} />
                          </div>
                          <Editable multiline value={exp.description} placeholder="Description..." onCommit={v => updateExp(i, 'description', v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-loose text-gray-700 whitespace-pre-wrap`} style={blockCss("itemBody")} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Education */}
              {data.education && data.education.length > 0 && (
                <div>
                  <h2 className={`${sizes.heading} font-semibold uppercase tracking-[0.2em] text-gray-400 mb-4`} style={blockCss("sectionHeading")}>Education</h2>
                  <div className="space-y-4">
                    {data.education.map((edu, i) => (
                      <div key={edu.id} className="grid grid-cols-[1fr_3fr] gap-4">
                        <div className={`${sizes.meta} text-gray-500 mt-1`} style={blockCss("itemMeta")}>
                          <Editable value={edu.date} placeholder="Dates" onCommit={v => updateEdu(i, 'date', v)} {...editableCommon("itemMeta")} />
                        </div>
                        <div>
                          <h3 className={`${sizes.body} font-semibold text-gray-900`} style={blockCss("itemTitle")}>
                            <Editable value={edu.degree} placeholder="Degree" onCommit={v => updateEdu(i, 'degree', v)} {...editableCommon("itemTitle")} />
                          </h3>
                          <div className={`${sizes.meta} text-gray-500`} style={blockCss("itemSubtitle")}>
                            <Editable value={edu.school} placeholder="School" onCommit={v => updateEdu(i, 'school', v)} {...editableCommon("itemSubtitle")} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Skills & Certs */}
              {(data.skills || data.certifications) && (
                <div className="grid grid-cols-[1fr_3fr] gap-4">
                  <div className="space-y-6">
                    {data.skills && <h2 className={`${sizes.heading} font-semibold uppercase tracking-[0.2em] text-gray-400`} style={blockCss("sectionHeading")}>Skills</h2>}
                    {data.certifications && <h2 className={`${sizes.heading} font-semibold uppercase tracking-[0.2em] text-gray-400`} style={blockCss("sectionHeading")}>Certifications</h2>}
                  </div>
                  <div className="space-y-6">
                    {data.skills && <Editable multiline value={data.skills} placeholder="Skills..." onCommit={(v) => update("skills", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-loose text-gray-700 whitespace-pre-wrap`} style={blockCss("itemBody")} />}
                    {data.certifications && <Editable multiline value={data.certifications} placeholder="Certifications..." onCommit={(v) => update("certifications", v)} {...editableCommon("itemBody")} className={`block ${sizes.body} leading-loose text-gray-700 whitespace-pre-wrap`} style={blockCss("itemBody")} />}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
});

CanvasEditor.displayName = "CanvasEditor";
export default CanvasEditor;