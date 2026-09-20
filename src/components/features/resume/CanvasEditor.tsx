"use client";

import { forwardRef } from "react";
import { ResumeData } from "@/types";
import ResumeRenderer from "./templates/renderer";

interface Props {
  data: ResumeData;
  onChange: (data: ResumeData) => void;
  scale?: number;
}

/**
 * Interactive resume canvas. All template/layout rendering, inline editing,
 * toolbar and profile-image dragging now lives in `templates/renderer.tsx`;
 * this component keeps its previous public API so existing consumers
 * (resume/[id]/page.tsx, BuilderClient.tsx) are unaffected.
 */
const CanvasEditor = forwardRef<HTMLDivElement, Props>(({ data, onChange, scale = 1 }, ref) => {
  return <ResumeRenderer ref={ref} data={data} onChange={onChange} editMode scale={scale} />;
});

CanvasEditor.displayName = "CanvasEditor";
export default CanvasEditor;