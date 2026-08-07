// Shared types for the frontend state

export type ResumeLayout = "classic" | "modern" | "minimal";
export type ResumeFontSize = "sm" | "md" | "lg";

export interface ResumeTheme {
  primaryColor: string;
  fontFamily: string;
  layout: ResumeLayout;
  fontSize: ResumeFontSize;
}

export const DEFAULT_THEME: ResumeTheme = {
  primaryColor: "#4f46e5", // indigo-600, matches the app's existing accent
  fontFamily: "inter",
  layout: "classic",
  fontSize: "md",
};

// Curated preset accent colors shown as swatches in the Design panel
export const THEME_COLOR_PRESETS: string[] = [
  "#4f46e5", // indigo
  "#2563eb", // blue
  "#0891b2", // cyan
  "#059669", // emerald
  "#65a30d", // lime
  "#d97706", // amber
  "#dc2626", // red
  "#db2777", // pink
  "#7c3aed", // violet
  "#334155", // slate
];

// Web-safe font stacks — no extra font loading required, so these always render
export const THEME_FONT_OPTIONS: { value: string; label: string; stack: string }[] = [
  { value: "inter", label: "Inter (Sans)", stack: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif" },
  { value: "arial", label: "Arial (Sans)", stack: "Arial, Helvetica, ui-sans-serif, sans-serif" },
  { value: "georgia", label: "Georgia (Serif)", stack: "Georgia, 'Times New Roman', serif" },
  { value: "times", label: "Times New Roman (Serif)", stack: "'Times New Roman', Times, serif" },
  { value: "garamond", label: "Garamond (Serif)", stack: "'EB Garamond', Garamond, 'Times New Roman', serif" },
  { value: "courier", label: "Courier (Mono)", stack: "'Courier New', Courier, monospace" },
];

export function getFontStack(value: string): string {
  return (
    THEME_FONT_OPTIONS.find((f) => f.value === value)?.stack ??
    THEME_FONT_OPTIONS[0].stack
  );
}

export interface ResumeData {
  id?: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  address: string;
  summary: string;
  theme?: ResumeTheme;
}