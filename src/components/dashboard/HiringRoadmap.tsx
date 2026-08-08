// C:\resumi\src\components\dashboard\HiringRoadmap.tsx
"use client";

import { useEffect, useState } from "react";
import { FileText, Target, Send, MessagesSquare, Handshake, Check, Sparkles } from "lucide-react";

interface RoadmapStep {
  title: string;
  blurb: string;
  icon: React.ElementType;
  tips: string[];
}

const STEPS: RoadmapStep[] = [
  {
    title: "Build Your Resume",
    blurb: "Get your experience down in a format that reads well to humans and machines alike.",
    icon: FileText,
    tips: [
      "Lead every bullet with impact — a result or number, not just a duty",
      "Keep it to one page unless you have 10+ years of experience",
      "Write a summary that names your target role directly, not a vague objective",
    ],
  },
  {
    title: "Optimize for ATS",
    blurb: "Most applications are filtered by software before a human ever sees them.",
    icon: Target,
    tips: [
      "Mirror keywords from the job description into your skills and experience",
      "Avoid tables, columns, and graphics — some ATS parsers scramble them",
      "Use standard section headers like \"Experience\" and \"Education\"",
    ],
  },
  {
    title: "Apply With Purpose",
    blurb: "Where and how you apply matters more than how many places you apply to.",
    icon: Send,
    tips: [
      "10 tailored applications beat 50 generic ones",
      "Apply within the first 3–5 days of a posting going live",
      "A referral gets you seen 5–10x more often than a cold application",
    ],
  },
  {
    title: "Ace the Interview",
    blurb: "This is where preparation turns directly into a job offer.",
    icon: MessagesSquare,
    tips: [
      "Use the STAR method — Situation, Task, Action, Result",
      "Prepare a 60-second \"tell me about yourself\" that maps to the role",
      "Bring 2–3 thoughtful questions for the interviewer",
    ],
  },
  {
    title: "Negotiate & Get Hired",
    blurb: "The offer stage is still part of the process — don't leave value on the table.",
    icon: Handshake,
    tips: [
      "Let them name a number first when you can",
      "Negotiate the whole package — start date, PTO, remote days",
      "Get everything in writing before giving notice at your current job",
    ],
  },
];

const STORAGE_KEY = "resumi:roadmap-step";

export default function HiringRoadmap({ hasResumes }: { hasResumes: boolean }) {
  const [current, setCurrent] = useState(0);
  const [openStep, setOpenStep] = useState<number | null>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const initial = saved !== null ? Number(saved) : hasResumes ? 1 : 0;
    
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrent(initial);
     
    setOpenStep(initial);
  }, [hasResumes]);

  const markCurrent = (i: number) => {
    setCurrent(i);
    window.localStorage.setItem(STORAGE_KEY, String(i));
  };

  return (
    <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-xs">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-bold text-gray-900">Your Path to Getting Hired</h2>
      </div>
      <p className="text-xs text-gray-500 mb-8">
        A resume is step one. Here&rsquo;s the rest of the journey — tap a step for real tips.
      </p>

      {/* Stepper */}
      <div className="overflow-x-auto pb-2">
        <div className="flex items-start min-w-150">
          {STEPS.map((step, i) => {
            const isDone = i < current;
            const isCurrent = i === current;
            const Icon = step.icon;
            return (
              <div key={step.title} className="flex-1 flex items-start">
                <div className="flex flex-col items-center text-center flex-1">
                  <button
                    onClick={() => setOpenStep(openStep === i ? null : i)}
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all shrink-0 ${
                      isDone
                        ? "bg-indigo-600 border-indigo-600 text-white"
                        : isCurrent
                        ? "border-indigo-600 text-indigo-600 bg-indigo-50"
                        : "border-gray-200 text-gray-400 bg-white"
                    }`}
                  >
                    {isDone ? <Check className="w-5 h-5" strokeWidth={3} /> : <Icon className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setOpenStep(openStep === i ? null : i)} className="mt-2.5 max-w-27.5">
                    <p className={`text-xs font-semibold ${isCurrent ? "text-indigo-700" : "text-gray-800"}`}>
                      {step.title}
                    </p>
                    <p className="text-[10px] uppercase tracking-wide font-medium text-gray-400 mt-0.5">
                      {isDone ? "Done" : isCurrent ? "In progress" : "Pending"}
                    </p>
                  </button>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`h-0.5 mt-5 flex-1 ${isDone ? "bg-indigo-600" : "bg-gray-100"}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tips */}
      {openStep !== null && (
        <div className="mt-6 bg-gray-50 border border-gray-200/60 rounded-xl p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap mb-2">
            <div>
              <h3 className="font-bold text-gray-900 text-sm">{STEPS[openStep].title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{STEPS[openStep].blurb}</p>
            </div>
            {openStep !== current && (
              <button
                onClick={() => markCurrent(openStep)}
                className="text-xs font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                I&rsquo;m here now
              </button>
            )}
          </div>
          <ul className="space-y-2 mt-3">
            {STEPS[openStep].tips.map((tip, i) => (
              <li key={i} className="text-xs text-gray-700 flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}