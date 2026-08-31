/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { forwardRef } from "react";
import {
  ResumeData,
  DEFAULT_THEME,
  ResumeFontSize,
  ResumeBlockKey,
  TextBlockStyle,
  ResumeTheme
} from "@/types";

interface Props {
  data: ResumeData;
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

const getExtendedFontStack = (fontFamily: string) => {
  const font = EXTENDED_FONTS.find(f => f.value === fontFamily);
  return font ? font.stack : "'Inter', sans-serif";
};

function GoogleFontLoader({ fonts }: { fonts: string[] }) {
  const urls = fonts
    .map(f => EXTENDED_FONTS.find(ext => ext.value === f)?.label?.replace(/ /g, '+'))
    .filter(Boolean);
  
  const unique = Array.from(new Set(urls));
  if (unique.length === 0) return null;

  const urlString = unique.map(u => `family=${u}:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400;1,700`).join('&');
  
  return (
    <style dangerouslySetInnerHTML={{
      __html: `@import url('https://fonts.googleapis.com/css2?${urlString}&display=swap');`
    }} />
  );
}

const SIZE_MAP: Record<
  ResumeFontSize,
  { name: string; title: string; meta: string; heading: string; body: string }
> = {
  sm: { name: "text-2xl", title: "text-base", meta: "text-xs", heading: "text-xs", body: "text-xs" },
  md: { name: "text-3xl", title: "text-lg", meta: "text-sm", heading: "text-sm", body: "text-sm" },
  lg: { name: "text-4xl", title: "text-xl", meta: "text-base", heading: "text-base", body: "text-base" },
};

function styleToCss(s: TextBlockStyle | undefined): React.CSSProperties {
  if (!s) return {};
  return {
    textAlign: s.align,
    fontFamily: s.fontFamily,
    fontSize: s.fontSize ? `${s.fontSize}px` : undefined,
    lineHeight: s.lineHeight,
    letterSpacing: s.letterSpacing !== undefined ? `${s.letterSpacing}px` : undefined,
  };
}

interface TemplateConfig {
  containerStyle?: React.CSSProperties;
  headerClass: string;
  headerStyle?: React.CSSProperties;
  nameClass: string;
  titleClass: string;
  titleStyle?: React.CSSProperties;
  contactClass: string;
  contactSeparator: string;
  sectionHeadingClass: string;
  sectionHeadingStyle?: React.CSSProperties;
  secPrefix: string;
  splitHeader?: boolean;
}

const TEMPLATES_CONFIG: Record<string, TemplateConfig> = {
  classic: { headerClass: "px-12 pt-12 pb-6 mb-6 text-center border-b border-gray-300", nameClass: "font-bold uppercase tracking-wider mb-1", titleClass: "text-gray-600 mb-3", contactClass: "text-gray-500 flex justify-center flex-wrap gap-x-4 gap-y-1", contactSeparator: "|", sectionHeadingClass: "font-bold uppercase tracking-widest mb-3 border-b pb-1", secPrefix: "", sectionHeadingStyle: { color: "var(--accent)", borderColor: "var(--accent)" } },
  modern: { headerClass: "px-12 py-10 mb-8 text-white", nameClass: "font-bold tracking-wide mb-1", titleClass: "opacity-90", contactClass: "opacity-80 flex flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "", sectionHeadingClass: "font-bold uppercase tracking-widest mb-3", secPrefix: "", headerStyle: { backgroundColor: 'var(--accent)' }, sectionHeadingStyle: { color: "var(--accent)" } },
  minimal: { headerClass: "px-14 pt-14 pb-4 mb-4", nameClass: "font-semibold tracking-tight mb-1 text-gray-900", titleClass: "font-medium", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-500 flex flex-wrap items-center gap-x-3 gap-y-1 mt-2", contactSeparator: "·", sectionHeadingClass: "font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3", secPrefix: "", sectionHeadingStyle: { color: "var(--accent)" } },
  professional: { headerClass: "px-12 pt-12 pb-6 mb-6 flex justify-between items-end border-b-2", nameClass: "font-bold tracking-tight mb-1", titleClass: "", contactClass: "text-gray-600 flex flex-col items-end gap-1", contactSeparator: "", sectionHeadingClass: "font-bold uppercase tracking-wider mb-3 text-gray-900 border-b pb-1", secPrefix: "", splitHeader: true, headerStyle: { borderColor: 'var(--accent)' }, sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  executive: { headerClass: "px-12 pt-12 pb-6 mb-6 text-center border-t-4 border-b-4 mt-8 mx-12", nameClass: "font-bold uppercase tracking-widest mb-2 font-serif", titleClass: "", contactClass: "text-gray-600 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "•", sectionHeadingClass: "font-bold uppercase tracking-widest mb-3 text-center border-b-2 pb-1 mx-auto", secPrefix: "", headerStyle: { borderColor: 'var(--accent)' }, sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  bold: { headerClass: "px-12 pt-12 pb-8 mb-6", nameClass: "font-black uppercase tracking-tighter mb-1", titleClass: "font-bold uppercase mt-1", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "|", sectionHeadingClass: "font-black uppercase tracking-tight mb-3 border-l-8 pl-3", secPrefix: "", containerStyle: { borderLeft: '16px solid var(--accent)' }, sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  academic: { headerClass: "px-12 pt-10 pb-4 mb-6 border-b border-gray-300 text-center", nameClass: "font-bold mb-1", titleClass: "", contactClass: "text-gray-600 flex justify-center flex-wrap gap-x-3 gap-y-1 mt-2", contactSeparator: ",", sectionHeadingClass: "font-bold uppercase tracking-wider mb-3 py-1 px-3", secPrefix: "", sectionHeadingStyle: { color: '#ffffff', backgroundColor: 'var(--accent)' } },
  tech: { headerClass: "px-12 py-10 mb-8 bg-slate-900 text-slate-300", nameClass: "font-bold text-white mb-2 tracking-tight", titleClass: "font-mono", titleStyle: { color: 'var(--accent)' }, contactClass: "font-mono flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "•", sectionHeadingClass: "font-mono uppercase tracking-widest mb-3", secPrefix: "> ", sectionHeadingStyle: { color: 'var(--accent)' } },
  creative: { headerClass: "px-12 pt-12 pb-6 mb-6", nameClass: "font-bold tracking-tighter mb-1 text-5xl", titleClass: "italic text-xl", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-3 font-medium", contactSeparator: "/", sectionHeadingClass: "font-bold uppercase tracking-widest mb-3 border-b-4 pb-1 inline-block", secPrefix: "", containerStyle: { borderTop: '16px solid var(--accent)' }, sectionHeadingStyle: { borderColor: 'var(--accent)', color: 'var(--accent)' } },
  elegant: { headerClass: "px-12 pt-14 pb-8 mb-6 text-center", nameClass: "font-light tracking-[0.2em] mb-2 uppercase font-serif", titleClass: "text-gray-500 italic", contactClass: "text-gray-400 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "✧", sectionHeadingClass: "font-light italic text-center mb-4 text-gray-500 border-b pb-2", secPrefix: "", sectionHeadingStyle: { color: 'var(--accent)', borderColor: "var(--accent)" } },
  corporate: { headerClass: "px-12 pt-12 pb-6 mb-6 flex justify-between items-end border-b", nameClass: "font-semibold tracking-tight mb-1", titleClass: "text-gray-600", contactClass: "text-gray-500 flex flex-col items-end gap-0.5", contactSeparator: "", sectionHeadingClass: "font-semibold uppercase tracking-wider mb-3 text-gray-800 border-b pb-1", secPrefix: "", splitHeader: true, headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)" } },
  banking: { headerClass: "px-12 py-8 mb-8 text-center border-y-4 border-double", nameClass: "font-serif font-bold uppercase tracking-widest mb-2", titleClass: "text-gray-800", contactClass: "text-gray-600 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "•", sectionHeadingClass: "font-serif font-bold uppercase tracking-widest mb-3 border-b-2 pb-1", secPrefix: "", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)", color: "var(--accent)" } },
  legal: { headerClass: "px-12 pt-14 pb-6 mb-8 border-b-2", nameClass: "font-serif font-bold text-4xl mb-1", titleClass: "font-serif italic text-gray-700", contactClass: "text-gray-600 flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "|", sectionHeadingClass: "font-serif font-bold uppercase tracking-widest mb-3 border-b-2 pb-1", secPrefix: "", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)", color: "var(--accent)" } },
  consultant: { headerClass: "px-12 pt-12 pb-6 mb-6 flex justify-between items-center bg-gray-50", nameClass: "font-bold tracking-tight mb-1 text-gray-900", titleClass: "text-gray-500", contactClass: "text-gray-500 flex flex-col items-end text-right", contactSeparator: "", sectionHeadingClass: "font-bold uppercase tracking-wider mb-3 text-gray-800 border-l-4 pl-3", secPrefix: "", splitHeader: true, sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  enterprise: { headerClass: "px-12 py-10 mb-8 text-white text-center", nameClass: "font-bold tracking-wider mb-2", titleClass: "font-medium opacity-90 tracking-widest uppercase", contactClass: "opacity-80 flex justify-center flex-wrap gap-x-5 gap-y-2 mt-4", contactSeparator: "|", sectionHeadingClass: "font-bold uppercase tracking-widest mb-3 border-b-2 pb-1", secPrefix: "", headerStyle: { backgroundColor: 'var(--accent)' }, sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  management: { headerClass: "px-12 pt-12 pb-6 mb-6 text-center", nameClass: "font-bold uppercase tracking-widest mb-2 text-gray-900", titleClass: "font-bold uppercase tracking-wider", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-500 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "•", sectionHeadingClass: "font-bold uppercase tracking-widest mb-3 text-center py-1", secPrefix: "", sectionHeadingStyle: { backgroundColor: "var(--accent)", color: "#ffffff" } },
  finance: { headerClass: "px-12 pt-12 pb-6 mb-6 flex justify-between items-start border-b", nameClass: "font-bold tracking-tight mb-1 text-gray-900", titleClass: "text-gray-500", contactClass: "font-mono text-gray-600 flex flex-col items-end gap-1 text-right", contactSeparator: "", sectionHeadingClass: "font-bold uppercase tracking-widest mb-3 text-gray-800 border-b pb-1", secPrefix: "", splitHeader: true, headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)" } },
  director: { headerClass: "px-12 pt-12 pb-8 mb-6 text-center", nameClass: "font-light uppercase tracking-[0.3em] mb-2", titleClass: "font-serif italic", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-500 flex justify-center flex-wrap gap-x-6 gap-y-1 mt-6", contactSeparator: "—", sectionHeadingClass: "font-light uppercase tracking-[0.2em] mb-4 text-center border-t border-b py-2 mx-12", secPrefix: "", sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  official: { headerClass: "px-12 pt-10 pb-6 mb-6 text-center border-b-4", nameClass: "font-serif font-bold uppercase mb-1 text-gray-900", titleClass: "font-serif text-gray-800", contactClass: "font-serif text-gray-700 flex justify-center flex-wrap gap-x-3 gap-y-1 mt-2", contactSeparator: ",", sectionHeadingClass: "font-serif font-bold uppercase tracking-wider mb-3 text-gray-900 border-b pb-1", secPrefix: "", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)" } },
  traditional: { headerClass: "px-12 pt-12 pb-6 mb-6 border-b", nameClass: "font-bold uppercase tracking-wider mb-1 text-gray-900", titleClass: "text-gray-600", contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-2", contactSeparator: "|", sectionHeadingClass: "font-bold uppercase tracking-widest mb-3 border-b pb-1", secPrefix: "", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)" } },
  studio: { headerClass: "px-12 pt-16 pb-8 mb-8", nameClass: "font-black tracking-tighter mb-1 text-6xl text-gray-900", titleClass: "font-bold uppercase tracking-widest mt-2", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-400 flex flex-col gap-1 mt-6", contactSeparator: "", sectionHeadingClass: "font-black uppercase tracking-tighter mb-4 text-2xl", secPrefix: "", containerStyle: { borderLeft: '24px solid var(--accent)' } },
  portfolio: { headerClass: "px-12 pt-14 pb-8 mb-8 text-right", nameClass: "font-bold tracking-tight mb-1 text-gray-900", titleClass: "text-gray-500", contactClass: "text-gray-400 flex justify-end flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "/", sectionHeadingClass: "font-bold uppercase tracking-widest mb-4 text-right border-b-2 pb-1", secPrefix: "", containerStyle: { borderTop: '8px solid var(--accent)' }, sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  vibrant: { headerClass: "px-12 pt-14 pb-8 mb-6 text-center", nameClass: "font-black uppercase tracking-tight mb-2", titleClass: "font-bold", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-600 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-4 rounded-full bg-white py-2 px-6 shadow-sm inline-flex mx-auto border border-gray-100", contactSeparator: "•", sectionHeadingClass: "font-black uppercase tracking-tight mb-4 inline-block px-4 py-1 rounded-md text-white", secPrefix: "", containerStyle: { backgroundColor: '#f8fafc' }, sectionHeadingStyle: { backgroundColor: 'var(--accent)' } },
  pastel: { headerClass: "px-12 pt-14 pb-10 mb-8 text-center rounded-b-[3rem]", nameClass: "font-bold tracking-wide mb-2 text-gray-800", titleClass: "text-gray-600 font-medium", contactClass: "text-gray-500 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "·", sectionHeadingClass: "font-bold uppercase tracking-widest mb-4 text-center", secPrefix: "", headerStyle: { backgroundColor: '#fdf4ff' }, sectionHeadingStyle: { color: 'var(--accent)' } },
  geometric: { headerClass: "px-12 pt-14 pb-8 mb-8 border-b-8", nameClass: "font-black uppercase tracking-tighter mb-1", titleClass: "font-bold uppercase tracking-widest", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-500 flex flex-wrap gap-x-6 gap-y-2 mt-6", contactSeparator: "■", sectionHeadingClass: "font-black uppercase tracking-widest mb-4 border-l-8 pl-4", secPrefix: "", headerStyle: { borderColor: 'var(--accent)' }, sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  organic: { headerClass: "px-12 pt-16 pb-10 mb-8 text-center", nameClass: "font-serif font-medium tracking-wide mb-2 text-gray-800", titleClass: "italic text-gray-500", contactClass: "text-gray-400 flex justify-center flex-wrap gap-x-6 gap-y-1 mt-6", contactSeparator: "~", sectionHeadingClass: "font-serif font-medium italic text-center mb-4 text-gray-600", secPrefix: "", containerStyle: { backgroundColor: '#fafaf9' }, sectionHeadingStyle: { color: 'var(--accent)' } },
  artistic: { headerClass: "px-12 py-12 mb-8 flex flex-col items-end text-right", nameClass: "font-bold tracking-tighter mb-1", titleClass: "font-medium", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-400 flex flex-col items-end gap-1 mt-4", contactSeparator: "", sectionHeadingClass: "font-bold uppercase tracking-widest mb-4 text-right border-r-4 pr-3", secPrefix: "", sectionHeadingStyle: { borderColor: 'var(--accent)', color: 'var(--accent)' } },
  editorial: { headerClass: "px-12 pt-14 pb-6 mb-8 border-b-4 border-black", nameClass: "font-serif font-black uppercase tracking-tighter mb-2 text-5xl text-black", titleClass: "font-serif font-bold text-gray-600", contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-4 font-sans text-xs uppercase tracking-widest", contactSeparator: "|", sectionHeadingClass: "font-serif font-black uppercase tracking-tighter mb-4 text-black border-t-2 pt-2", secPrefix: "", sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  neon: { headerClass: "px-12 pt-14 pb-8 mb-8 border-b", nameClass: "font-black tracking-widest uppercase mb-2", titleClass: "font-bold uppercase tracking-widest", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "///", sectionHeadingClass: "font-black uppercase tracking-widest mb-4 border-l-2 pl-3", secPrefix: "", containerStyle: { backgroundColor: '#09090b', color: '#f4f4f5' }, headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: 'var(--accent)', color: 'var(--accent)' } },
  contemporary: { headerClass: "px-12 pt-16 pb-4 mb-10", nameClass: "font-light tracking-tight mb-1 text-gray-900", titleClass: "font-semibold tracking-widest uppercase text-xs mt-2", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-400 flex flex-wrap gap-x-6 gap-y-1 mt-6", contactSeparator: "", sectionHeadingClass: "font-semibold uppercase tracking-widest text-xs mb-6 text-gray-400", secPrefix: "— ", sectionHeadingStyle: { color: 'var(--accent)' } },
  startup: { headerClass: "px-10 py-8 m-6 mb-8 rounded-2xl text-white shadow-md", nameClass: "font-bold tracking-tight mb-1", titleClass: "font-medium opacity-90", contactClass: "opacity-80 flex flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "·", sectionHeadingClass: "font-bold tracking-tight mb-4", secPrefix: "", headerStyle: { backgroundColor: 'var(--accent)' }, sectionHeadingStyle: { color: 'var(--accent)' } },
  hacker: { headerClass: "px-12 pt-12 pb-6 mb-6 border-b border-gray-800", nameClass: "font-mono font-bold mb-2", titleClass: "font-mono opacity-80", contactClass: "font-mono opacity-60 flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: " ", sectionHeadingClass: "font-mono font-bold mb-4", secPrefix: ">_", containerStyle: { backgroundColor: '#111827', color: '#10b981' }, sectionHeadingStyle: { color: 'var(--accent)' } },
  cyber: { headerClass: "px-12 pt-12 pb-6 mb-6 border-b-2", nameClass: "font-mono font-black uppercase tracking-wider mb-1", titleClass: "font-mono font-bold", titleStyle: { color: 'var(--accent)' }, contactClass: "font-mono text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: " :: ", sectionHeadingClass: "font-mono font-bold uppercase tracking-widest mb-4", secPrefix: "root@~#", containerStyle: { backgroundColor: '#000000', color: '#e5e7eb' }, headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { color: 'var(--accent)' } },
  saas: { headerClass: "px-12 py-10 mb-8 text-center rounded-b-3xl", nameClass: "font-bold tracking-tight mb-1 text-gray-900", titleClass: "font-semibold", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-500 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "•", sectionHeadingClass: "font-bold tracking-tight mb-4", secPrefix: "", headerStyle: { backgroundColor: '#f1f5f9' }, sectionHeadingStyle: { color: 'var(--accent)' } },
  devops: { headerClass: "px-12 pt-12 pb-6 mb-8 bg-slate-100 border-l-8", nameClass: "font-mono font-bold tracking-tight mb-1 text-slate-900", titleClass: "font-mono font-semibold text-slate-600", contactClass: "font-mono text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "|", sectionHeadingClass: "font-mono font-bold uppercase tracking-widest mb-4 border-b-2 pb-1 text-slate-800", secPrefix: "$ ", headerStyle: { borderColor: 'var(--accent)' }, sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  fintech: { headerClass: "px-12 pt-12 pb-6 mb-6 flex justify-between items-end border-b", nameClass: "font-semibold tracking-tight mb-1 text-gray-900", titleClass: "font-medium", titleStyle: { color: 'var(--accent)' }, contactClass: "font-mono text-gray-500 flex flex-col items-end gap-1 text-xs", contactSeparator: "", sectionHeadingClass: "font-semibold uppercase tracking-wider mb-4 border-b pb-1 text-gray-900", secPrefix: "", splitHeader: true, headerStyle: { borderColor: 'var(--accent)' }, sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  crypto: { headerClass: "px-12 py-10 mb-8 text-center border-b border-gray-800", nameClass: "font-bold tracking-tighter mb-2", titleClass: "font-medium uppercase tracking-widest text-xs", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-400 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-4 font-mono text-xs", contactSeparator: "—", sectionHeadingClass: "font-bold uppercase tracking-widest mb-4 text-center", secPrefix: "///", containerStyle: { backgroundColor: '#0f172a', color: '#f8fafc' }, sectionHeadingStyle: { color: 'var(--accent)' } },
  cleancode: { headerClass: "px-12 pt-16 pb-4 mb-8", nameClass: "font-medium tracking-tight mb-1 text-gray-900", titleClass: "text-gray-500", contactClass: "text-gray-400 flex flex-wrap gap-x-6 gap-y-1 mt-4 text-sm", contactSeparator: "", sectionHeadingClass: "font-medium text-gray-400 mb-4", secPrefix: "// ", sectionHeadingStyle: { color: "var(--accent)" } },
  matrix: { headerClass: "px-12 pt-12 pb-6 mb-6", nameClass: "font-mono font-bold mb-1", titleClass: "font-mono", titleStyle: { color: 'var(--accent)' }, contactClass: "font-mono opacity-70 flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: " ", sectionHeadingClass: "font-mono font-bold border-b pb-1 mb-4", secPrefix: "0x", containerStyle: { backgroundColor: '#000000', color: '#22c55e' }, sectionHeadingStyle: { color: 'var(--accent)', borderColor: 'var(--accent)' } },
  agile: { headerClass: "px-12 pt-12 pb-6 mb-6 bg-gray-50 border-b border-gray-200", nameClass: "font-bold tracking-tight mb-1 text-gray-900", titleClass: "font-semibold text-gray-600", contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "•", sectionHeadingClass: "font-bold uppercase tracking-wider mb-4 px-3 py-1.5 rounded-md inline-block text-gray-800", secPrefix: "#", sectionHeadingStyle: { backgroundColor: 'var(--accent)', color: '#ffffff' } },
  crisp: { headerClass: "px-12 pt-12 pb-6 mb-6 border-b", nameClass: "font-medium tracking-tight mb-1 text-gray-900", titleClass: "text-gray-500", contactClass: "text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "|", sectionHeadingClass: "font-medium uppercase tracking-widest mb-4 border-b pb-1 text-gray-900", secPrefix: "", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)" } },
  breezy: { headerClass: "px-16 pt-16 pb-8 mb-8", nameClass: "font-light tracking-wide mb-2 text-gray-800", titleClass: "text-gray-400", contactClass: "text-gray-400 flex flex-wrap gap-x-6 gap-y-2 mt-6", contactSeparator: "", sectionHeadingClass: "font-light uppercase tracking-widest mb-6", secPrefix: "", sectionHeadingStyle: { color: "var(--accent)" } },
  sharp: { headerClass: "px-12 pt-12 pb-6 mb-8 border-b-2", nameClass: "font-black uppercase tracking-tighter mb-1 text-gray-900", titleClass: "font-bold uppercase tracking-widest text-gray-600", contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "/", sectionHeadingClass: "font-black uppercase tracking-tighter mb-4 text-gray-900", secPrefix: "", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { color: "var(--accent)" } },
  flat: { headerClass: "px-12 py-10 mb-8", nameClass: "font-bold tracking-tight mb-1 text-white", titleClass: "font-medium opacity-90 text-white", contactClass: "opacity-80 flex flex-wrap gap-x-4 gap-y-1 mt-3 text-white", contactSeparator: "·", sectionHeadingClass: "font-bold uppercase tracking-widest mb-4", secPrefix: "", headerStyle: { backgroundColor: 'var(--accent)' }, sectionHeadingStyle: { color: 'var(--accent)' } },
  material: { headerClass: "px-12 py-10 mb-8 shadow-md z-10 relative", nameClass: "font-medium tracking-tight mb-1 text-gray-900", titleClass: "text-gray-500", contactClass: "text-gray-400 flex flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "•", sectionHeadingClass: "font-medium uppercase tracking-wider mb-4 border-b-2 pb-1", secPrefix: "", containerStyle: { backgroundColor: '#f8fafc' }, headerStyle: { backgroundColor: "#ffffff" }, sectionHeadingStyle: { borderColor: 'var(--accent)', color: 'var(--accent)' } },
  glass: { headerClass: "px-12 py-10 mb-8 bg-white/60 backdrop-blur-md border-b border-white", nameClass: "font-semibold tracking-tight mb-1 text-gray-800", titleClass: "text-gray-600", contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "·", sectionHeadingClass: "font-semibold uppercase tracking-widest mb-4 text-gray-800", secPrefix: "", containerStyle: { backgroundColor: '#f1f5f9' }, sectionHeadingStyle: { color: "var(--accent)" } },
  monochrome: { headerClass: "px-12 pt-12 pb-6 mb-6 border-b", nameClass: "font-bold uppercase tracking-widest mb-1 text-black", titleClass: "text-gray-600 uppercase tracking-wider text-sm", contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "|", sectionHeadingClass: "font-bold uppercase tracking-widest mb-4 text-white inline-block px-3 py-1", secPrefix: "", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { backgroundColor: 'var(--accent)' } },
  duotone: { headerClass: "px-12 py-10 mb-8 text-white", nameClass: "font-bold tracking-tight mb-1", titleClass: "opacity-90", contactClass: "opacity-80 flex flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "·", sectionHeadingClass: "font-bold uppercase tracking-widest mb-4", secPrefix: "", headerStyle: { backgroundColor: 'var(--accent)' }, sectionHeadingStyle: { color: 'var(--accent)' } },
  spaced: { headerClass: "px-12 pt-14 pb-8 mb-8 text-center", nameClass: "font-light uppercase tracking-[0.4em] mb-3 text-gray-900", titleClass: "text-gray-400 uppercase tracking-[0.2em] text-xs", contactClass: "text-gray-400 flex justify-center flex-wrap gap-x-8 gap-y-2 mt-6 text-xs tracking-widest", contactSeparator: "", sectionHeadingClass: "font-light uppercase tracking-[0.3em] mb-6 text-center text-gray-500 border-b pb-2 mx-20", secPrefix: "", sectionHeadingStyle: { borderColor: "var(--accent)", color: "var(--accent)" } },
  compact: { headerClass: "px-8 pt-8 pb-4 mb-4 flex justify-between items-end border-b", nameClass: "font-semibold tracking-tight mb-0.5 text-gray-900 text-2xl", titleClass: "text-gray-600 text-sm", contactClass: "text-gray-500 flex flex-col items-end gap-0 text-xs", contactSeparator: "", sectionHeadingClass: "font-semibold uppercase tracking-wider mb-2 text-sm text-gray-800 py-0.5 px-2", secPrefix: "", splitHeader: true, headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { backgroundColor: "var(--accent)", color: "#ffffff" } },
  engineering: { headerClass: "px-12 pt-12 pb-6 mb-6 border-b-2", nameClass: "font-mono font-bold uppercase tracking-wider mb-1 text-slate-900", titleClass: "font-mono text-slate-600", contactClass: "font-mono text-slate-500 flex flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "|", sectionHeadingClass: "font-mono font-bold uppercase tracking-widest mb-4 border-b pb-1 text-slate-800", secPrefix: "SEC.", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)" } },
  researcher: { headerClass: "px-12 pt-12 pb-6 mb-6 text-center border-b", nameClass: "font-serif font-bold mb-1 text-gray-900", titleClass: "font-serif text-gray-600", contactClass: "font-serif text-gray-500 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "•", sectionHeadingClass: "font-serif font-bold uppercase tracking-wider mb-4 border-b pb-1 text-gray-800", secPrefix: "", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)", color: "var(--accent)" } },
  educator: { headerClass: "px-12 pt-12 pb-6 mb-6 rounded-b-2xl text-center", nameClass: "font-medium tracking-wide mb-1 text-gray-900", titleClass: "text-gray-600", contactClass: "text-gray-500 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-3", contactSeparator: "·", sectionHeadingClass: "font-medium uppercase tracking-widest mb-4 text-center", secPrefix: "✿ ", headerStyle: { backgroundColor: "#fffbeb" }, sectionHeadingStyle: { color: "var(--accent)" } },
  hospitality: { headerClass: "px-12 pt-14 pb-8 mb-8 text-center", nameClass: "font-serif font-light uppercase tracking-widest mb-2 text-gray-900", titleClass: "font-serif italic text-gray-500", contactClass: "text-gray-400 flex justify-center flex-wrap gap-x-6 gap-y-2 mt-5", contactSeparator: "—", sectionHeadingClass: "font-serif font-light uppercase tracking-widest mb-4 text-center border-y py-1 mx-16 text-gray-600", secPrefix: "", sectionHeadingStyle: { borderColor: "var(--accent)", color: "var(--accent)" } },
  retail: { headerClass: "px-12 py-10 mb-8 bg-gray-900 text-white text-center", nameClass: "font-bold tracking-wider mb-1 uppercase", titleClass: "text-gray-300", contactClass: "text-gray-400 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "•", sectionHeadingClass: "font-bold uppercase tracking-widest mb-4", secPrefix: "", sectionHeadingStyle: { color: 'var(--accent)' } },
  sales: { headerClass: "px-12 pt-12 pb-6 mb-6 flex justify-between items-center border-b-4", nameClass: "font-black uppercase tracking-tighter mb-1 text-gray-900", titleClass: "font-bold text-gray-600", contactClass: "text-gray-500 flex flex-col items-end gap-1 font-medium", contactSeparator: "", sectionHeadingClass: "font-black uppercase tracking-tight mb-4", secPrefix: "", splitHeader: true, headerStyle: { borderColor: 'var(--accent)' }, sectionHeadingStyle: { color: 'var(--accent)' } },
  marketing: { headerClass: "px-12 pt-14 pb-8 mb-8 text-center", nameClass: "font-black tracking-tighter mb-2 text-5xl", titleClass: "font-bold uppercase tracking-widest", titleStyle: { color: 'var(--accent)' }, contactClass: "text-gray-500 flex justify-center flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "/", sectionHeadingClass: "font-black uppercase tracking-widest mb-4 inline-block border-b-4 pb-1", secPrefix: "", sectionHeadingStyle: { borderColor: 'var(--accent)' } },
  pr: { headerClass: "px-12 pt-12 pb-6 mb-6 flex justify-between items-end", nameClass: "font-serif font-bold tracking-tight mb-1 text-gray-900", titleClass: "font-sans uppercase tracking-widest text-xs", titleStyle: { color: 'var(--accent)' }, contactClass: "font-sans text-gray-500 flex flex-col items-end gap-1 text-xs", contactSeparator: "", sectionHeadingClass: "font-sans font-bold uppercase tracking-widest text-xs mb-4 border-t border-b py-1 text-gray-800", secPrefix: "", splitHeader: true, sectionHeadingStyle: { borderColor: "var(--accent)", color: "var(--accent)" } },
  media: { headerClass: "px-12 pt-12 pb-8 mb-8 border-l-8 bg-gray-50", nameClass: "font-black uppercase tracking-tighter mb-1 text-gray-900", titleClass: "font-medium text-gray-600", contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-4", contactSeparator: "|", sectionHeadingClass: "font-black uppercase tracking-tight mb-4 text-gray-900", secPrefix: "", headerStyle: { borderColor: 'var(--accent)' }, sectionHeadingStyle: { color: "var(--accent)" } },
  medical: { headerClass: "px-12 pt-12 pb-6 mb-6 border-b", nameClass: "font-medium tracking-tight mb-1 text-gray-900", titleClass: "text-teal-700", contactClass: "text-gray-500 flex flex-wrap gap-x-4 gap-y-1 mt-3 text-sm", contactSeparator: "•", sectionHeadingClass: "font-medium uppercase tracking-wider mb-4 border-b pb-1 text-teal-800", secPrefix: "+", headerStyle: { borderColor: "var(--accent)" }, sectionHeadingStyle: { borderColor: "var(--accent)", color: "var(--accent)" } }
};

type ExtendedTheme = ResumeTheme & { profileImage?: string | null; imagePosX?: number; imagePosY?: number; imageWidth?: number };

const RenderBlock = ({ html, className, style, multiline }: { html?: string, className?: string, style?: React.CSSProperties, multiline?: boolean }) => {
  if (!html) return null;
  const Tag = multiline ? "div" : "span";
  return <Tag className={className} style={style} dangerouslySetInnerHTML={{ __html: html }} />;
};

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const theme = data.theme ?? DEFAULT_THEME;
  const exTheme = theme as unknown as ExtendedTheme;
  const sizes = SIZE_MAP[theme.fontSize] ?? SIZE_MAP.md;
  const fontStack = getExtendedFontStack(theme.fontFamily);
  const layoutKey = theme.layout || "classic";
  
  const blockCss = (key: ResumeBlockKey) => styleToCss(data.blockStyles?.[key]);
  const contactLine = [data.email, data.phone, data.address].filter(Boolean) as string[];

  let activeLayoutStr = layoutKey;

  const layoutMap: Record<string, string[]> = {
    professional: ["corporate", "banking", "legal", "consultant", "enterprise", "management"],
    executive: ["finance", "director", "official", "traditional"],
    creative: ["studio", "portfolio", "vibrant", "neon", "contemporary", "marketing", "pr", "media"],
    modern: ["pastel", "geometric", "organic", "artistic", "editorial", "hospitality"],
    tech: ["hacker", "cyber", "cleancode", "matrix"],
    bold: ["startup", "saas", "devops", "fintech", "crypto", "agile", "sales"],
    minimal: ["crisp", "breezy", "sharp", "flat", "spaced", "retail"],
    classic: ["material", "glass", "monochrome", "duotone", "compact"],
    academic: ["engineering", "researcher", "medical"],
    elegant: ["educator"]
  };

  for (const [base, extensions] of Object.entries(layoutMap)) {
    if (extensions.includes(activeLayoutStr)) {
      activeLayoutStr = base;
      break;
    }
  }

  const config = TEMPLATES_CONFIG[activeLayoutStr] || TEMPLATES_CONFIG["classic"];
  
  const applyAccent = (styleObj?: React.CSSProperties) => {
    if (!styleObj) return {};
    const processed: React.CSSProperties = { ...styleObj };
    Object.keys(processed).forEach(key => {
      const val = processed[key as keyof React.CSSProperties];
      if (typeof val === 'string' && val.includes('var(--accent)')) {
        (processed as any)[key] = val.replace(/var\(--accent\)/g, theme.primaryColor);
      }
    });
    return processed;
  };

  const containerStyle = { fontFamily: fontStack, ...applyAccent(config.containerStyle) };
  const headerStyle = applyAccent(config.headerStyle);
  const titleStyle = applyAccent(config.titleStyle);
  const sectionHeadingStyle = applyAccent(config.sectionHeadingStyle);

  const fontListToLoad = [theme.fontFamily];
  if (data.blockStyles) {
    Object.values(data.blockStyles).forEach(b => {
      if (b.fontFamily) fontListToLoad.push(b.fontFamily);
    });
  }

  return (
    <div ref={ref} style={containerStyle} className="w-[210mm] min-h-[297mm] bg-white text-black shrink-0 relative overflow-hidden">
      <GoogleFontLoader fonts={fontListToLoad} />

      {exTheme.profileImage && (
        <img 
          src={exTheme.profileImage}
          alt="Profile"
          style={{
            position: 'absolute',
            left: `${exTheme.imagePosX ?? 40}px`,
            top: `${exTheme.imagePosY ?? 40}px`,
            width: `${exTheme.imageWidth ?? 120}px`,
            height: `${exTheme.imageWidth ?? 120}px`,
            objectFit: 'cover',
            borderRadius: '50%',
            zIndex: 50
          }}
        />
      )}

      <div className={config.headerClass} style={headerStyle}>
        <div className={config.splitHeader ? 'text-left' : ''}>
          <h1 className={`${sizes.name} ${config.nameClass}`} style={blockCss("name")}>
            <RenderBlock html={data.firstName} className="inline-block min-w-8" />{" "}
            <RenderBlock html={data.lastName} className="inline-block min-w-8" />
          </h1>
          <p className={`${sizes.title} ${config.titleClass}`} style={{ ...titleStyle, ...blockCss("jobTitle") }}>
            <RenderBlock html={data.jobTitle} />
          </p>
          
          {!config.splitHeader && contactLine.length > 0 && (
            <div className={`${sizes.meta} ${config.contactClass}`} style={blockCss("contact")}>
              {contactLine.map((c, i) => (
                <span key={i} className="flex items-center gap-4">
                  <RenderBlock html={c} />
                  {i < contactLine.length - 1 && config.contactSeparator && <span className="opacity-50 select-none mx-2">{config.contactSeparator}</span>}
                </span>
              ))}
            </div>
          )}
        </div>
        
        {config.splitHeader && contactLine.length > 0 && (
          <div className={`${sizes.meta} ${config.contactClass}`} style={blockCss("contact")}>
            {contactLine.map((c, i) => <RenderBlock key={i} html={c} />)}
          </div>
        )}
      </div>

      <div className="px-12 pb-12 space-y-6">
        {data.summary && (
          <div>
            <h2 className={`${sizes.heading} ${config.sectionHeadingClass}`} style={{ ...sectionHeadingStyle, ...blockCss("sectionHeading") }}>
              {config.secPrefix && <span className="opacity-50 mr-2">{config.secPrefix}</span>}Summary
            </h2>
            <RenderBlock html={data.summary} multiline className={`block ${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap`} style={blockCss("summaryBody")} />
          </div>
        )}

        {data.experience && data.experience.length > 0 && (
          <div>
            <h2 className={`${sizes.heading} ${config.sectionHeadingClass}`} style={{ ...sectionHeadingStyle, ...blockCss("sectionHeading") }}>
              {config.secPrefix && <span className="opacity-50 mr-2">{config.secPrefix}</span>}Experience
            </h2>
            <div className="space-y-4">
              {data.experience.map((exp) => (
                <div key={exp.id}>
                  <div className="flex justify-between items-baseline mb-0.5" style={blockCss("itemTitle")}>
                    <h3 className={`${sizes.body} font-bold text-gray-900`}>
                      <RenderBlock html={exp.company} /> 
                      {exp.role && <span className="mx-1 font-normal">—</span>} 
                      <RenderBlock html={exp.role} className="font-normal italic" />
                    </h3>
                    <span className={`${sizes.meta} text-gray-500`} style={blockCss("itemMeta")}>
                      <RenderBlock html={exp.date} />
                    </span>
                  </div>
                  <RenderBlock html={exp.description} multiline className={`block ${sizes.body} leading-relaxed text-gray-600 whitespace-pre-wrap mt-1`} style={blockCss("itemBody")} />
                </div>
              ))}
            </div>
          </div>
        )}

        {data.education && data.education.length > 0 && (
          <div>
            <h2 className={`${sizes.heading} ${config.sectionHeadingClass}`} style={{ ...sectionHeadingStyle, ...blockCss("sectionHeading") }}>
              {config.secPrefix && <span className="opacity-50 mr-2">{config.secPrefix}</span>}Education
            </h2>
            <div className="space-y-4">
              {data.education.map((edu) => (
                <div key={edu.id}>
                  <div className="flex justify-between items-baseline mb-0.5">
                    <h3 className={`${sizes.body} font-bold text-gray-900`} style={blockCss("itemTitle")}>
                      <RenderBlock html={edu.school} />
                    </h3>
                    <span className={`${sizes.meta} text-gray-500`} style={blockCss("itemMeta")}>
                      <RenderBlock html={edu.date} />
                    </span>
                  </div>
                  <RenderBlock html={edu.degree} className={`${sizes.meta} text-gray-700 italic`} style={blockCss("itemSubtitle")} />
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-2 gap-6">
          {data.skills && (
            <div>
              <h2 className={`${sizes.heading} ${config.sectionHeadingClass}`} style={{ ...sectionHeadingStyle, ...blockCss("sectionHeading") }}>
                {config.secPrefix && <span className="opacity-50 mr-2">{config.secPrefix}</span>}Skills
              </h2>
              <RenderBlock html={data.skills} multiline className={`block ${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap`} style={blockCss("itemBody")} />
            </div>
          )}
          {data.certifications && (
            <div>
              <h2 className={`${sizes.heading} ${config.sectionHeadingClass}`} style={{ ...sectionHeadingStyle, ...blockCss("sectionHeading") }}>
                {config.secPrefix && <span className="opacity-50 mr-2">{config.secPrefix}</span>}Certifications
              </h2>
              <RenderBlock html={data.certifications} multiline className={`block ${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap`} style={blockCss("itemBody")} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;