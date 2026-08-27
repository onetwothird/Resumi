"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  ArrowRight,
  ArrowDown,
  CheckCircle,
  Wand2,
  Layout,
  Download,
  Target,
  Check,
  Briefcase,
  Users,
  Building2,
} from "lucide-react";
import PublicHeader from "@/components/marketing/PublicHeader";
import PublicFooter from "@/components/marketing/PublicFooter";
import AuroraBackground from "@/components/landing/AuroraBackground";

const FEATURES = [
  {
    icon: CheckCircle,
    title: "ATS-Friendly Formatting",
    desc: "Every resume is structured so applicant tracking systems can parse it correctly, no hidden tables or graphics that get your resume rejected before a human sees it.",
    color: "text-blue-600 dark:text-blue-400",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    icon: Target,
    title: "Target Job Matching",
    desc: "Point your resume at a specific job posting and see how well your experience lines up with what it's asking for.",
    color: "text-amber-600 dark:text-amber-400",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    icon: Wand2,
    title: "Structured Experience",
    desc: "Work history, education, and skills live in a clean structured builder, so reordering or updating a section never means reformatting the whole page.",
    color: "text-purple-600 dark:text-purple-400",
    bg: "bg-purple-50 dark:bg-purple-500/10",
  },
  {
    icon: Layout,
    title: "Recruiter-Ready Layout",
    desc: "One clean, minimalist layout designed for readability, not a wall of templates you have to pick between.",
    color: "text-rose-600 dark:text-rose-400",
    bg: "bg-rose-50 dark:bg-rose-500/10",
  },
  {
    icon: Download,
    title: "Instant PDF Export",
    desc: "Download a properly formatted PDF the moment you're ready to apply.",
    color: "text-indigo-600 dark:text-indigo-400",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
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
    accent:
      "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  },
  {
    number: "2",
    title: "Refine Content",
    desc: "Tighten your phrasing and match your resume against a specific job you're targeting.",
    accent:
      "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30",
  },
  {
    number: "3",
    title: "Export & Apply",
    desc: "Download a clean, ATS-optimized PDF, then browse open roles and apply straight from Resumi.",
    accent:
      "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  },
];

interface PlatformSide {
  icon: typeof Users;
  eyebrow: string;
  title: string;
  desc: string;
  bullets: string[];
  cta: string;
  href: string;
  accent: string;
}

const PLATFORM_SIDES: PlatformSide[] = [
  {
    icon: Users,
    eyebrow: "For job seekers",
    title: "Build your resume, then go apply",
    desc: "Once your resume is ready, browse real open roles from companies actively hiring, right inside Resumi.",
    bullets: ["Structured resume builder with ATS scoring", "Live job board, filterable by type, location, and skills", "Browse companies and see everything they're hiring for"],
    cta: "Browse open roles",
    href: "/jobs",
    accent: "bg-indigo-600",
  },
  {
    icon: Building2,
    eyebrow: "For employers",
    title: "Post a role in minutes",
    desc: "Publish an opening with salary range, requirements, and skills, and it shows up on the job board and your company page immediately.",
    bullets: ["Free to post, no listing limits", "Draft and publish on your own timeline", "Manage every posting from one dashboard"],
    cta: "Post a job",
    href: "/employer/post-job",
    accent: "bg-slate-800 dark:bg-slate-700",
  },
];

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

interface BoardStats {
  openRoles: number;
  companies: number;
}

export default function LandingClient() {
  const [stats, setStats] = useState<BoardStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/jobs/public", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((jobs: { company: string }[]) => {
        if (cancelled) return;
        const companies = new Set(jobs.map((j) => j.company.trim())).size;
        setStats({ openRoles: jobs.length, companies });
      })
      .catch(() => {
        /* silently omit the stat pill if the board can't be reached */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F9FC] dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-100 overflow-hidden relative transition-colors duration-300">
      <PublicHeader active="/" />

      {/* Hero Section — the aurora background lives behind this section only */}
      <div className="relative">
        <AuroraBackground />

        <motion.main
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-20 md:pt-32 md:pb-28 text-center flex flex-col items-center"
        >
          {stats && stats.openRoles > 0 && (
            <motion.div
              variants={fadeUp}
              className="flex items-center gap-2 bg-white/90 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 shadow-sm rounded-full pl-2 pr-4 py-1.5 mb-8 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              {stats.openRoles} open role{stats.openRoles === 1 ? "" : "s"} from {stats.companies} compan{stats.companies === 1 ? "y" : "ies"} right now
            </motion.div>
          )}

          <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-6 max-w-4xl mx-auto leading-[1.15]">
            Build a professional resume, <br className="hidden md:block" />
            <span className="text-indigo-600 dark:text-indigo-400">then go land the job.</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Resumi is a structured resume builder and a live job board in one place. Write a clean, ATS-friendly resume, then browse roles companies are hiring for right now.
          </motion.p>

          <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up" className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-base hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 w-full sm:w-auto justify-center group">
              Start Building
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/jobs" className="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-8 py-4 rounded-xl font-semibold text-base hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5 w-full sm:w-auto justify-center">
              <Briefcase className="w-4 h-4" />
              Browse Open Roles
            </Link>
          </motion.div>
        </motion.main>
      </div>

      {/* Features Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="features"
        className="relative z-10 py-24 bg-white dark:bg-slate-900 border-y border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Tools to strengthen your application</h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Everything you need to structure, refine, and export your resume.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                className="group p-8 rounded-2xl bg-[#F7F9FC] dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* One platform, two sides */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="platform"
        className="relative z-10 py-24 bg-[#F7F9FC] dark:bg-slate-950"
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">One platform, both sides of hiring</h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Job seekers build and apply. Employers post and manage. Same place.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {PLATFORM_SIDES.map((side) => (
              <motion.div
                key={side.title}
                variants={staggerItem}
                className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow duration-300 flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl ${side.accent} flex items-center justify-center mb-5 shrink-0`}>
                  <side.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">{side.eyebrow}</span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{side.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6">{side.desc}</p>

                <ul className="space-y-3 mb-8 flex-1">
                  {side.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-400">
                      <Check className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed wrap-break-word">{b}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href={side.href}
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white text-sm font-semibold py-3 rounded-xl hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors"
                >
                  {side.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Before / After Examples */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="examples"
        className="relative z-10 py-24 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-5xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-3">Upgrade your experience with impact</h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Illustrative examples of how sharper phrasing and measurable outcomes change a bullet point.</p>
          </motion.div>

          <div className="space-y-10 md:space-y-8">
            {TRANSFORMATIONS.map((item) => (
              <motion.div
                key={item.tag}
                variants={staggerItem}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300"
              >
                <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                  <span className="inline-block text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400">{item.tag}</span>
                </div>

                {/* Mobile: stacked panels with an in-flow connector between them */}
                <div className="md:hidden">
                  <div className="p-6 bg-slate-50/30 dark:bg-slate-800/30">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 block">Before</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600 leading-relaxed wrap-break-word">{item.before}</p>
                  </div>
                  <div className="flex justify-center py-1">
                    <div className="w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm">
                      <ArrowDown className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                    </div>
                  </div>
                  <div className="p-6 bg-indigo-50/10 dark:bg-indigo-500/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 block">After (ATS Optimized)</span>
                    <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed wrap-break-word">{item.after}</p>
                  </div>
                </div>

                {/* Desktop: side-by-side panels, connector centered exactly on the divider */}
                <div className="hidden md:grid md:grid-cols-2 md:divide-x divide-slate-100 dark:divide-slate-800 relative">
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center shadow-sm z-10">
                    <ArrowRight className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                  </div>
                  <div className="p-8 bg-slate-50/30 dark:bg-slate-800/30">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-3 block">Before</span>
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-through decoration-slate-300 dark:decoration-slate-600 leading-relaxed wrap-break-word">{item.before}</p>
                  </div>
                  <div className="p-8 bg-indigo-50/10 dark:bg-indigo-500/5">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-3 block">After (ATS Optimized)</span>
                    <p className="text-sm text-slate-900 dark:text-slate-100 font-medium leading-relaxed wrap-break-word">{item.after}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* How It Works */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="how-it-works"
        className="relative z-10 py-24 bg-[#F7F9FC] dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-16">Built in three simple steps</motion.h2>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="hidden md:block absolute top-8 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden />
            {STEPS.map((step) => (
              <motion.div key={step.number} variants={staggerItem} className="relative flex flex-col items-center group">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold mb-6 border-2 bg-[#F7F9FC] dark:bg-slate-950 transition-transform duration-300 group-hover:scale-110 ${step.accent}`}>
                  {step.number}
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="get-started"
        className="relative z-10 py-24 bg-white dark:bg-slate-900 border-t border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-3xl mx-auto px-6 text-center">
          <motion.div
              variants={fadeUp}
              className="rounded-3xl bg-slate-800 dark:bg-slate-900 dark:border dark:border-slate-800 px-8 py-14 sm:px-14"
            >
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">Free to build. Free to browse.</h2>
              <p className="text-sm md:text-base text-slate-300 max-w-lg mx-auto mb-8 leading-relaxed">
                Create your resume and start applying to real, open roles today. No paywall between you and your next job.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/sign-up" className="flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-3.5 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-colors w-full sm:w-auto">
                  Start Building
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link href="/jobs" className="flex items-center justify-center gap-2 bg-transparent text-white px-8 py-3.5 rounded-xl font-semibold text-sm border border-slate-600 hover:bg-slate-700 transition-colors w-full sm:w-auto">
                  Browse Open Roles
                </Link>
              </div>
            </motion.div>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
}