"use client";

import { forwardRef } from "react";
import { ResumeData } from "@/types";
import ResumeRenderer from "./templates/renderer";

interface Props {
  data: ResumeData;
}

/**
 * Static (non-editable) resume preview. Delegates rendering to the shared
 * `templates/renderer.tsx` so templates look identical in preview and edit.
 */
const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  return <ResumeRenderer ref={ref} data={data} editMode={false} />;
});

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;