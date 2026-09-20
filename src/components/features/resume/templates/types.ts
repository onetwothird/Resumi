/**
 * Template library types.
 *
 * The resume keeps a single source of truth for its content: `ResumeData`.
 * A template only drives *presentation* — it picks the layout, typography,
 * section order and visual elements through a `TemplateDef`. Switching
 * templates only changes `data.theme.layout`, so all resume content is
 * preserved.
 */

import type { CSSProperties } from "react";

export const CATEGORIES = [
  "Business & Management",
  "Education",
  "Government & Public Service",
  "Engineering",
  "Information Technology & Software",
  "Healthcare",
  "Legal",
  "Administrative",
  "Retail",
  "Sales",
  "Marketing",
  "Real Estate",
  "Production & Manufacturing",
  "Finance & Accounting",
  "Human Resources",
  "Architecture & Design",
  "Hospitality & Tourism",
  "Media & Creative",
  "Science & Research",
  "Logistics & Transportation",
  "Engineering / Technical Trades",
  "Entry-Level / Fresh Graduate",
  "Executive / Senior-Level",
  "General / Universal",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const CAREER_LEVELS = [
  "Student",
  "Fresh Graduate",
  "Entry Level",
  "Mid Level",
  "Senior",
  "Executive",
] as const;

export type CareerLevel = (typeof CAREER_LEVELS)[number];

export const TEMPLATE_STYLES = [
  "Classic",
  "Modern",
  "Minimal",
  "Corporate",
  "Creative",
  "Executive",
  "Academic",
] as const;

export type TemplateStyle = (typeof TEMPLATE_STYLES)[number];

export type SectionKey = "summary" | "experience" | "education" | "skills" | "certifications";

/* ── Render variants ─────────────────────────────────────────────────── */

export type HeaderVariant =
  | "centered" // classic centered
  | "left" // minimal left
  | "split" // name left / contact right
  | "band" // full accent band
  | "serifCentered" // elegant serif centered
  | "rules" // name framed by rules
  | "boxed" // boxed centered
  | "uppercaseSplit" // heavy uppercase split
  | "mono" // terminal / tech
  | "creativeRight" // big display right aligned
  | "spacious" // airy letter-spaced centered
  | "compactLeft" // tight left
  | "bottomRule" // left with bottom rule
  | "government" // serif double-rule official
  | "card" // rounded accent card
  | "editorial" // large serif editorial
  | "dark" // dark full band
  | "pills" // contact in a pill
  | "pastel" // soft tinted band
  | "decorative" // creative accents
  // Sidebar headers (name/contact live inside the coloured sidebar)
  | "sideColored" // accent sidebar, white text
  | "sideDark" // dark sidebar
  | "sidePlain" // white sidebar, accent name
  | "sideSoft" // tinted sidebar
  | "sideMono"; // mono sidebar

export type HeadingVariant =
  | "bordered" // uppercase + bottom border
  | "rule" // text + full rule
  | "letterspaced" // tracked caps, no line
  | "pill" // filled pill
  | "accentBar" // left accent bar
  | "number" // indexed sections
  | "serif" // serif small caps
  | "centerRules" // centered with side rules
  | "doubleRule" // double bottom rule
  | "icon" // small lucide icon
  | "bare" // faint gray caps
  | "block" // filled accent strip
  | "mono" // mono uppercase
  | "boxed" // outlined box
  | "overline"; // accent overline above text

export type ExpVariant =
  | "standard" // company — role | dates
  | "roleFirst" // role bold, company muted
  | "timeline" // left rail + dots
  | "columns" // dates in narrow column
  | "cards" // bordered cards
  | "minimal" // compact lines
  | "banded"; // company emphasised with rule

export type EduVariant = "standard" | "degreeFirst" | "compactRow" | "cards";

export type SkillsVariant = "text" | "chips" | "columns" | "rules" | "monoList";

export type ContactVariant = "inline" | "column" | "splitCol" | "iconed" | "mono" | "centered" | "right";

export type DocSpacing = "compact" | "normal" | "spacious";

/* ── Template definition ─────────────────────────────────────────────── */

export interface TemplateDef {
  /** "single" = everything stacked vertically. "split" = sidebar + main. */
  layout: "single" | "split";
  /** Which side the sidebar is on (split layouts). */
  sidebar?: "left" | "right";
  /** Sidebar width as a percentage (split layouts). */
  sidebarWidth?: number;
  /** Split layouts only — put the name/title/contact into the sidebar top. */
  sidebarHeader?: boolean;
  header: HeaderVariant;
  heading: HeadingVariant;
  exp: ExpVariant;
  edu: EduVariant;
  skills: SkillsVariant;
  contact: ContactVariant;
  /** Section order for single-column layouts. */
  sections: SectionKey[];
  /** Section order for the sidebar of split layouts. */
  sidebarSections?: SectionKey[];
  /** Section order for the main column of split layouts. */
  mainSections?: SectionKey[];
  spacing: DocSpacing;
  /** Recommended accent colour — applied when the user picks the template. */
  accent: string;
  /** Recommended font family value (see EXTENDED_FONTS). */
  font: string;
  nameCase?: "uppercase" | "as-is";
  /** Base text colour for body copy. */
  bodyColor?: string;
  /** Colour for dividers / rules. */
  dividerColor?: string;
  /** Side accent bar placement (single column). */
  accentEdge?: "left" | "top" | "none";
  /** Background tint / decorative container styling. */
  container?: CSSProperties;
  /** Font scale — smaller numbers pack text tighter for dense templates. */
  scale?: 0.9 | 1 | 1.1;
}

/* ── Full template record ────────────────────────────────────────────── */

export interface ResumeTemplate {
  /** Unique id — this is stored in `data.theme.layout`. */
  id: string;
  name: string;
  category: Category;
  /** Short industry label used for filtering (Business, IT, Healthcare…). */
  industry: string;
  /** The specific profession / use case this template targets. */
  useCase: string;
  description: string;
  careerLevel: CareerLevel[];
  professions: string[];
  atsFriendly: boolean;
  style: TemplateStyle;
  layoutLabel: "One Column" | "Two Column";
  def: TemplateDef;
}