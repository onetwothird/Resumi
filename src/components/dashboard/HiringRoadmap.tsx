"use client";

import { useEffect, useState } from "react";
import { FileText, Target, Send, MessagesSquare, Handshake, Check, Sparkles, Bot } from "lucide-react";

interface RoadmapStep {
  title: string;
  blurb: string;
  icon: React.ElementType;
  tips: string[];
  action?: { label: string, trigger: 'ai_coach' };
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
    // New action linked to our Voice AI
    action: { label: "Practice with AI Voice Coach", trigger: 'ai_coach' }
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

export default function HiringRoadmap({ hasResumes, onStartAiInterview }: { hasResumes: boolean, onStartAiInterview?: () => void }) {
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
    <div className="mt-10 bg-white border border-gray-200 rounded-2xl p-6 md:p-10 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-5 h-5 text-indigo-600" />
        <h2 className="text-xl font-bold text-gray-900 tracking-tight">Your Path to Getting Hired</h2>
      </div>
      <p className="text-sm text-gray-500 mb-10">
        A resume is step one. Here&rsquo;s the rest of the journey — tap a step for real tips.
      </p>

      {/* Stepper Grid */}
      <div className="overflow-x-auto pb-4">
        <div className="flex w-full min-w-162.5">
          {STEPS.map((step, i) => {
            const isDone = i < current;
            const isCurrent = i === current;
            const isOpen = openStep === i;
            const Icon = step.icon;
            
            return (
              <div key={step.title} className="flex-1 relative flex flex-col items-center text-center group">
                {i < STEPS.length - 1 && (
                  <div 
                    className={`absolute top-5 h-0.5 rounded-full transition-colors duration-500 ease-out left-[calc(50%+1.75rem)] w-[calc(100%-3.5rem)] ${isDone ? "bg-indigo-600" : "bg-gray-200"}`} 
                  />
                )}
                
                {/* Circle Icon */}
                <button
                  onClick={() => setOpenStep(isOpen ? null : i)}
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ease-out outline-none
                    ${isDone ? "bg-indigo-600 border-indigo-600 text-white shadow-sm hover:bg-indigo-700" : 
                      isCurrent ? "bg-white border-indigo-600 text-indigo-600 shadow-sm ring-4 ring-indigo-50" : 
                      "bg-white border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-500"}
                  `}
                >
                  {isDone ? <Check className="w-5 h-5" strokeWidth={3} /> : <Icon className="w-4 h-4" strokeWidth={2.5} />}
                </button>

                {/* Step Labels */}
                <button 
                  onClick={() => setOpenStep(isOpen ? null : i)} 
                  className="mt-4 flex flex-col items-center outline-none px-2"
                >
                  <p className={`text-sm font-bold transition-colors ${isOpen ? "text-indigo-700" : isCurrent ? "text-gray-900" : "text-gray-600 hover:text-gray-900"}`}>
                    {step.title}
                  </p>
                  <p className={`text-[10px] uppercase tracking-widest font-bold mt-1.5 ${isDone ? "text-gray-400" : isCurrent ? "text-indigo-500" : "text-gray-300"}`}>
                    {isDone ? "Done" : isCurrent ? "In progress" : "Pending"}
                  </p>
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Tips Box */}
      {openStep !== null && (
        <div className="mt-8 bg-gray-50/50 border border-gray-200 rounded-xl p-6 md:p-8 transition-all animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900">{STEPS[openStep].title}</h3>
              <p className="text-sm text-gray-500 mt-1">{STEPS[openStep].blurb}</p>
            </div>
            
            {openStep !== current && (
              <button
                onClick={() => markCurrent(openStep)}
                className="shrink-0 text-sm font-semibold text-indigo-600 border border-indigo-200 bg-indigo-50 px-5 py-2 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
              >
                I&rsquo;m here now
              </button>
            )}
          </div>
          
          <ul className="space-y-3.5 mb-2">
            {STEPS[openStep].tips.map((tip, i) => (
              <li key={i} className="text-sm text-gray-700 flex items-start gap-3">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 shrink-0" />
                <span className="leading-relaxed">{tip}</span>
              </li>
            ))}
          </ul>
          
          {/* AI Interactive Button inside Roadmap */}
          {STEPS[openStep].action && (
            <div className="mt-6 pt-6 border-t border-gray-200/60">
              <button 
                onClick={onStartAiInterview}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-bold px-5 py-2.5 rounded-xl shadow-sm transition-all hover:shadow"
              >
                <Bot size={18} /> {STEPS[openStep].action.label}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}