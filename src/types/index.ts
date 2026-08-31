// src/types/index.ts

export type ResumeLayout = string;
export type ResumeFontSize = "sm" | "md" | "lg";
// Added keys for the new section headers and list items
export type ResumeBlockKey = "name" | "jobTitle" | "contact" | "summaryBody" | "sectionHeading" | "itemTitle" | "itemSubtitle" | "itemMeta" | "itemBody";

export interface TextBlockStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  align?: "left" | "center" | "right" | "justify";
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: string;
  letterSpacing?: number;
}

export interface ResumeTheme {
  primaryColor: string;
  fontFamily: string;
  layout: ResumeLayout;
  fontSize: ResumeFontSize;
}

export const DEFAULT_THEME: ResumeTheme = {
  primaryColor: "#4f46e5", 
  fontFamily: "inter",
  layout: "classic",
  fontSize: "md",
};

export const THEME_COLOR_PRESETS: string[] = [
  "#4f46e5", "#2563eb", "#0891b2", "#059669", "#65a30d", 
  "#d97706", "#dc2626", "#db2777", "#7c3aed", "#334155",
];

export const THEME_FONT_OPTIONS: { value: string; label: string; stack: string }[] = [
  { value: "inter", label: "Inter (Sans)", stack: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif" },
  { value: "arial", label: "Arial (Sans)", stack: "Arial, Helvetica, ui-sans-serif, sans-serif" },
  { value: "georgia", label: "Georgia (Serif)", stack: "Georgia, 'Times New Roman', serif" },
  { value: "times", label: "Times New Roman (Serif)", stack: "'Times New Roman', Times, serif" },
  { value: "garamond", label: "Garamond (Serif)", stack: "'EB Garamond', Garamond, 'Times New Roman', serif" },
  { value: "courier", label: "Courier (Mono)", stack: "'Courier New', Courier, monospace" },
];

export function getFontStack(value: string): string {
  return THEME_FONT_OPTIONS.find((f) => f.value === value)?.stack ?? THEME_FONT_OPTIONS[0].stack;
}

export interface ExperienceItem {
  id: string;
  company: string;
  role: string;
  date: string;
  description: string;
}

export interface EducationItem {
  id: string;
  school: string;
  degree: string;
  date: string;
}

export interface ResumeData {
  id?: string;
  title?: string;
  titleIsCustom?: boolean;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  
  phone: string;
  address: string;
  summary: string;
  experience?: ExperienceItem[];
  education?: EducationItem[];
  skills?: string;
  certifications?: string;
  theme?: ResumeTheme;
  blockStyles?: Partial<Record<ResumeBlockKey, TextBlockStyle>>;
}