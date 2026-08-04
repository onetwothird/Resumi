import { forwardRef } from "react";
import { ResumeData } from "@/types";

interface Props {
  data: ResumeData;
}

const ResumePreview = forwardRef<HTMLDivElement, Props>(({ data }, ref) => {
  return (
    <div 
      ref={ref} 
      className="w-[210mm] min-h-[297mm] bg-white text-black p-12 shadow-lg shrink-0"
    >
      <div className="text-center border-b pb-6 mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-wider mb-1">
          {data.firstName} {data.lastName}
        </h1>
        <p className="text-lg text-gray-600 mb-3">{data.jobTitle}</p>
        <div className="text-sm text-gray-500 flex justify-center gap-4">
          <span>{data.email}</span>
          <span>|</span>
          <span>{data.phone}</span>
          <span>|</span>
          <span>{data.address}</span>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-600 mb-3 border-b pb-1">
          Summary
        </h2>
        <p className="text-sm leading-relaxed text-gray-700 whitespace-pre-wrap">
          {data.summary}
        </p>
      </div>
    </div>
  );
});

ResumePreview.displayName = "ResumePreview";
export default ResumePreview;