import React from 'react';

interface ResumiLogoProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
}

export default function ResumiLogo({ className = "w-12 h-12", ...props }: ResumiLogoProps) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      <defs>
        {/* Deep purple gradient for the 3D background shadow layer */}
        <linearGradient id="backLayerGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3730A3" /> {/* indigo-800 */}
          <stop offset="100%" stopColor="#312E81" /> {/* indigo-900 */}
        </linearGradient>

        {/* Primary vibrant purple gradient for the main document matching text-indigo-600 */}
        <linearGradient id="mainDocGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6366F1" /> {/* indigo-500 */}
          <stop offset="100%" stopColor="#4F46E5" /> {/* indigo-600 (Target match) */}
        </linearGradient>
        
        {/* Lighter purple for the folded corner */}
        <linearGradient id="foldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#818CF8" /> {/* indigo-400 */}
          <stop offset="100%" stopColor="#4F46E5" /> {/* indigo-600 */}
        </linearGradient>

        {/* Gradient for the overlapping upward chart line */}
        <linearGradient id="chartGrad" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stopColor="#818CF8" opacity="0.9"/>
          <stop offset="100%" stopColor="#E0E7FF" opacity="1"/>
        </linearGradient>
      </defs>

      {/* 1. Offset Back Layer (creates the 3D depth effect) */}
      <path 
        d="M15 35 H 65 V 50 H 85 V 105 H 15 Z" 
        fill="url(#backLayerGrad)" 
        opacity="0.85" 
      />

      {/* 2. Main Document Base */}
      <path 
        d="M25 15 H 70 L 95 40 V 95 H 25 Z" 
        fill="url(#mainDocGrad)" 
      />

      {/* 3. Top-Right Folded Corner */}
      <path 
        d="M70 15 V 40 H 95 Z" 
        fill="url(#foldGrad)" 
        style={{ mixBlendMode: 'screen' }}
      />
      <path 
        d="M70 15 V 40 H 95 Z" 
        fill="#ffffff" 
        opacity="0.2" 
      />

      {/* 4. Horizontal Document Lines (representing text) */}
      <rect x="40" y="40" width="16" height="5" rx="2.5" fill="#E0E7FF" />
      <rect x="40" y="55" width="28" height="5" rx="2.5" fill="#E0E7FF" />
      <rect x="40" y="70" width="22" height="5" rx="2.5" fill="#E0E7FF" />

      {/* 5. The Upward Chart Overlay */}
      {/* Creates the jagged, upward-trending staircase arrow effect overlapping the doc */}
      <path 
        d="M 20 100 L 45 75 V 85 L 65 60 V 70 L 90 40 L 100 50 L 75 80 V 70 L 55 95 V 85 L 30 110 Z" 
        fill="url(#chartGrad)" 
        style={{ filter: 'drop-shadow(0px 4px 4px rgba(0,0,0,0.25))' }}
      />
    </svg>
  );
}