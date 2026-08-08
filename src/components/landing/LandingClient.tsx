"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  CheckCircle,
  Wand2,
  Layout,
  Download,
  Target,
  Check,
} from "lucide-react";
import ResumiLogo from "@/components/logo/ResumiLogo";

const FEATURES = [
  {
    icon: CheckCircle,
    title: "ATS-Friendly Formatting",
    desc: "Ensure your resume can be accurately read by modern Applicant Tracking Systems.",
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  {
    icon: Wand2,
    title: "Smart Suggestions",
    desc: "Refine your experience bullet points for better clarity and professional impact.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: Target,
    title: "Keyword Alignment",
    desc: "Identify missing skills on your resume based on your target job descriptions.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: Layout,
    title: "Clean Templates",
    desc: "Use modern, minimalist layouts designed for readability and professionalism.",
    color: "text-rose-600",
    bg: "bg-rose-50",
  },
  {
    icon: Download,
    title: "Instant PDF Export",
    desc: "Download a high-quality, perfectly formatted PDF ready for your next application.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
];

const TRANSFORMATIONS = [
  {
    tag: "Marketing",
    before: "Responsible for managing social media accounts and posting updates.",
    after:
      "Grew social media engagement by 42% across four platforms using a data-driven content calendar.",
  },
  {
    tag: "Engineering",
    before: "Worked with the team to fix bugs in the software.",
    after:
      "Resolved 120+ pre-launch bugs, reducing QA turnaround time by 35% through a new triage workflow.",
  },
  {
    tag: "Customer Support",
    before: "Helped customers with their questions and issues.",
    after:
      "Maintained a 95% resolution rate within 24 hours while managing a queue of 200+ weekly tickets.",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Enter Your Details",
    desc: "Input your work experience, education, and skills into our structured builder.",
    accent: "bg-slate-100 text-slate-600 border-slate-200",
  },
  {
    number: "2",
    title: "Refine Content",
    desc: "Use our built-in tools to improve your phrasing and highlight key achievements.",
    accent: "bg-indigo-50 text-indigo-600 border-indigo-200",
  },
  {
    number: "3",
    title: "Export & Apply",
    desc: "Download a clean, ATS-optimized PDF and start applying with confidence.",
    accent: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "Standard PDF exports",
      "1 professional template",
      "Basic formatting tools",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/ month",
    features: [
      "Unlimited high-res exports",
      "All premium templates",
      "Advanced content refinement",
      "ATS compatibility checks",
      "Priority support",
    ],
    highlight: true,
  },
];

// --- Animation Variants (Typed to fix TS Error) ---
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

export default function LandingClient() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden relative">
      
      {/* Top Navigation - Instant Load */}
      <nav className="relative z-50 border-b border-slate-200/80 backdrop-blur-xl bg-white/80 top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Replaced generic icon with the custom SVG Logo */}
          <div className="flex items-center gap-2 font-bold text-xl text-indigo-600 tracking-tight cursor-pointer">
            <ResumiLogo className="w-8 h-8" />
            Resumi
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#examples" className="hover:text-indigo-600 transition-colors">Examples</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section - Page Load Animation */}
      <motion.main
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28 text-center flex flex-col items-center"
      >
        <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl mx-auto leading-[1.15]">
          Build a professional resume, <br className="hidden md:block" />
          <span className="text-indigo-600">without the hassle.</span>
        </motion.h1>

        <motion.p variants={fadeUp} className="text-base md:text-lg text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
          Create clean, ATS-friendly resumes in minutes. Resumi provides the structure and tools you need to highlight your experience and land your next role.
        </motion.p>

        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/sign-up" className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto justify-center group">
            Start Building
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a href="#examples" className="flex items-center gap-2 bg-white text-slate-700 px-8 py-4 rounded-xl font-semibold text-base hover:bg-slate-50 border border-slate-200 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto justify-center">
            View Examples
          </a>
        </motion.div>
      </motion.main>

      {/* Features Section - Scroll Animation */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="features"
        className="relative z-10 py-24 bg-white border-y border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Tools to strengthen your application</h2>
            <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto">Everything you need to format, refine, and export your resume.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                className="group p-8 rounded-2xl bg-[#F7F9FC] border border-slate-200/60 hover:border-indigo-300 hover:bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Before / After Examples - Scroll Animation */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="examples"
        className="relative z-10 py-24 bg-[#F7F9FC]"
      >
        <div className="max-w-5xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Upgrade your experience with impact</h2>
            <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto">See how minor adjustments to phrasing and adding measurable outcomes can transform your bullet points.</p>
          </motion.div>

          <div className="space-y-8">
            {TRANSFORMATIONS.map((item) => (
              <motion.div
                key={item.tag}
                variants={staggerItem}
                className="group rounded-2xl bg-white border border-slate-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-indigo-700">{item.tag}</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                  <div className="p-6 md:p-8 bg-slate-50/30">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 block">Before</span>
                    <p className="text-sm text-slate-500 line-through decoration-slate-300 leading-relaxed">{item.before}</p>
                  </div>
                  
                  <div className="p-6 md:p-8 bg-indigo-50/10 relative">
                    <div className="hidden md:flex absolute top-1/2 -translate-y-1/2 -left-4 w-8 h-8 bg-white border border-slate-200 rounded-full items-center justify-center shadow-sm z-10">
                      <ArrowRight className="w-4 h-4 text-indigo-500" />
                    </div>
                    <div className="md:hidden absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center shadow-sm z-10">
                      <ArrowRight className="w-4 h-4 text-indigo-500 rotate-90" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-3 block">After (ATS Optimized)</span>
                    <p className="text-sm text-slate-900 font-medium leading-relaxed">{item.after}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works Section - Scroll Animation */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="how-it-works"
        className="relative z-10 py-24 bg-white border-t border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-slate-900 mb-16">Built in three simple steps</motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            {STEPS.map((step) => (
              <motion.div key={step.number} variants={staggerItem} className="flex flex-col items-center group">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-6 border-2 transition-transform duration-300 group-hover:scale-110 ${step.accent}`}>
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 max-w-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Pricing - Scroll Animation */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="pricing"
        className="relative z-10 py-24 bg-[#F7F9FC] border-t border-slate-200/80"
      >
        <div className="max-w-4xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Simple, transparent pricing</h2>
            <p className="text-sm text-slate-500">Start building for free. Upgrade when you need premium templates and tools.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {PLANS.map((plan) => (
              <motion.div
                key={plan.name}
                variants={staggerItem}
                className={`rounded-2xl p-8 border transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight ? "bg-indigo-600 border-indigo-600 text-white shadow-lg relative" : "bg-white border-slate-200 text-slate-900 shadow-sm hover:shadow-md"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3.5 left-6 bg-white text-indigo-600 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">Recommended</span>
                )}
                <h3 className={`text-lg font-bold mb-2 ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-8">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-slate-900"}`}>{plan.price}</span>
                  <span className={`text-sm ${plan.highlight ? "text-indigo-200" : "text-slate-500"}`}>{plan.period}</span>
                </div>
                <ul className="space-y-4 mb-8 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3">
                      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-200" : "text-indigo-600"}`} />
                      <span className={plan.highlight ? "text-indigo-50" : "text-slate-600 leading-relaxed"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up" className={`block text-center font-bold text-sm py-3.5 rounded-xl transition-all ${plan.highlight ? "bg-white text-indigo-600 hover:bg-indigo-50 shadow-sm" : "bg-slate-900 text-white hover:bg-slate-800 shadow-sm"}`}>
                  {plan.highlight ? "Upgrade to Pro" : "Start for Free"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="relative z-10 bg-white py-12 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          
          {/* Replaced generic icon with the custom SVG Logo */}
          <div className="flex items-center gap-2 font-bold text-slate-900">
            <ResumiLogo className="w-6 h-6" />
            Resumi © {new Date().getFullYear()}
          </div>
          
          <div className="flex items-center gap-6 text-sm text-slate-500 font-medium">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 transition-colors">Pricing</a>
          </div>
        </div>
      </footer>
    </div>
  );
}