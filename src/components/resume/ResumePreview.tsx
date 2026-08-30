import { forwardRef } from "react";
import {
  ResumeData,
  DEFAULT_THEME,
  getFontStack,
  ResumeFontSize,
  ResumeBlockKey,
  TextBlockStyle,
} from "@/types";

interface Props {
  data: ResumeData;
}

const SIZE_MAP: Record<
  ResumeFontSize,
  { name: string; title: string; meta: string; heading: string; body: string }
> = {
  sm: {
    name: "text-2xl",
    title: "text-base",
    meta: "text-xs",
    heading: "text-xs",
    body: "text-xs",
  },
  md: {
    name: "text-3xl",
    title: "text-lg",
    meta: "text-sm",
    heading: "text-sm",
    body: "text-sm",
  },
  lg: {
    name: "text-4xl",
    title: "text-xl",
    meta: "text-base",
    heading: "text-base",
    body: "text-base",
  },
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

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  const theme = data.theme ?? DEFAULT_THEME;
  const sizes = SIZE_MAP[theme.fontSize] ?? SIZE_MAP.md;
  const fontStack = getFontStack(theme.fontFamily);
  const accent = theme.primaryColor;

  const blockCss = (key: ResumeBlockKey) => styleToCss(data.blockStyles?.[key]);

  const contactLine = [data.email, data.phone, data.address].filter(Boolean);

  const wrapperStyle: React.CSSProperties = {
    fontFamily: fontStack,
  };

  if (theme.layout === "modern") {
    return (
      <div
        ref={ref}
        style={wrapperStyle}
        className="w-[210mm] min-h-[297mm] bg-white text-black shrink-0 overflow-hidden"
      >
        <div
          className="px-12 py-10 text-white"
          style={{ backgroundColor: accent }}
        >
          <h1 className={`${sizes.name} font-bold tracking-wide mb-1`} style={blockCss("name")}>
            {data.firstName} {data.lastName}
          </h1>
          <p className={`${sizes.title} opacity-90`} style={blockCss("jobTitle")}>
            {data.jobTitle}
          </p>
          {contactLine.length > 0 && (
            <div className={`${sizes.meta} opacity-80 flex flex-wrap gap-x-4 gap-y-1 mt-3`} style={blockCss("contact")}>
              {contactLine.map((c, i) => (
                <span key={i}>{c}</span>
              ))}
            </div>
          )}
        </div>

        <div className="px-12 py-8">
          <h2
            className={`${sizes.heading} font-bold uppercase tracking-widest mb-3`}
            style={{ color: accent }}
          >
            Summary
          </h2>
          <p className={`${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap`} style={blockCss("summaryBody")}>
            {data.summary}
          </p>
        </div>
      </div>
    );
  }

  if (theme.layout === "minimal") {
    return (
      <div
        ref={ref}
        style={wrapperStyle}
        className="w-[210mm] min-h-[297mm] bg-white text-black p-14 shrink-0"
      >
        <div className="mb-10">
          <h1 className={`${sizes.name} font-semibold tracking-tight mb-1 text-gray-900`} style={blockCss("name")}>
            {data.firstName} {data.lastName}
          </h1>
          <p className={`${sizes.title} font-medium mb-2`} style={{ color: accent, ...blockCss("jobTitle") }}>
            {data.jobTitle}
          </p>
          {contactLine.length > 0 && (
            <div className={`${sizes.meta} text-gray-500 flex flex-wrap gap-x-3 gap-y-1`} style={blockCss("contact")}>
              {contactLine.map((c, i) => (
                <span key={i}>
                  {i > 0 && <span className="mr-3 text-gray-300">·</span>}
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className={`${sizes.heading} font-semibold uppercase tracking-[0.2em] text-gray-400 mb-3`}>
            Summary
          </h2>
          <p className={`${sizes.body} leading-loose text-gray-700 whitespace-pre-wrap`} style={blockCss("summaryBody")}>
            {data.summary}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={ref}
      style={wrapperStyle}
      className="w-[210mm] min-h-[297mm] bg-white text-black p-12 shadow-lg shrink-0"
    >
      <div className="text-center border-b pb-6 mb-6" style={{ borderColor: accent }}>
        <h1 className={`${sizes.name} font-bold uppercase tracking-wider mb-1`} style={blockCss("name")}>
          {data.firstName} {data.lastName}
        </h1>
        <p className={`${sizes.title} text-gray-600 mb-3`} style={blockCss("jobTitle")}>{data.jobTitle}</p>
        {contactLine.length > 0 && (
          <div className={`${sizes.meta} text-gray-500 flex justify-center gap-4`} style={blockCss("contact")}>
            {contactLine.map((c, i) => (
              <span key={i} className="flex items-center gap-4">
                {i > 0 && <span>|</span>}
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <h2
          className={`${sizes.heading} font-bold uppercase tracking-widest mb-3 border-b pb-1`}
          style={{ color: accent, borderColor: accent }}
        >
          Summary
        </h2>
        <p className={`${sizes.body} leading-relaxed text-gray-700 whitespace-pre-wrap`} style={blockCss("summaryBody")}>
          {data.summary}
        </p>
      </div>
    </div>
  );
});

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;