"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
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
  Briefcase,
  Users,
  Building2,
  Sparkles,
  Gauge,
} from "lucide-react";
import PublicHeader from "@/components/marketing/PublicHeader";
import PublicFooter from "@/components/marketing/PublicFooter";
import AuroraBackground from "@/components/landing/AuroraBackground";

const FEATURES = [
  {
    icon: CheckCircle,
    title: "ATS-Friendly Formatting",
    desc: "Every resume is structured so applicant tracking systems can parse it correctly, no hidden tables or graphics that get your resume rejected before a human sees it.",
  },
  {
    icon: Target,
    title: "Target Job Matching",
    desc: "Point your resume at a specific job posting and see how well your experience lines up with what it's asking for.",
  },
  {
    icon: Wand2,
    title: "Structured Experience",
    desc: "Work history, education, and skills live in a clean structured builder, so reordering or updating a section never means reformatting the whole page.",
  },
  {
    icon: Layout,
    title: "Recruiter-Ready Layout",
    desc: "One clean, minimalist layout designed for readability, not a wall of templates you have to pick between.",
  },
  {
    icon: Download,
    title: "Instant PDF Export",
    desc: "Download a properly formatted PDF the moment you're ready to apply.",
  },
  {
    icon: Gauge,
    title: "Real-Time Resume Score",
    desc: "Watch your ATS compatibility score update as you edit, so you know exactly how strong your resume is before you apply.",
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
  },
  {
    number: "2",
    title: "Refine Content",
    desc: "Tighten your phrasing and match your resume against a specific job you're targeting.",
  },
  {
    number: "3",
    title: "Export & Apply",
    desc: "Download a clean, ATS-optimized PDF, then browse open roles and apply straight from Resumi.",
  },
];

const STEP_ACCENT =
  "text-indigo-600 border-indigo-200 dark:text-indigo-400 dark:border-indigo-500/30";

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
    accent: "bg-slate-900 dark:bg-slate-700",
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
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const hasLiveStats = !!stats && stats.openRoles > 0;

  return (
    <div className="min-h-screen bg-background dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-500/30 dark:selection:text-indigo-100 overflow-hidden relative transition-colors duration-300">
      <PublicHeader active="/" />

      <div className="relative">
        <AuroraBackground />

        <motion.main
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 md:pt-28 md:pb-32"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-10 items-center">
            <div className="text-center lg:text-left flex flex-col items-center lg:items-start">
              <motion.div
                variants={fadeUp}
                className="inline-flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-full pl-3 pr-4 py-1.5 mb-7 text-xs font-medium text-slate-600 dark:text-slate-300 shadow-sm"
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${hasLiveStats ? "bg-emerald-500" : "bg-indigo-400"}`} />
                {hasLiveStats
                  ? `${stats!.openRoles} open role${stats!.openRoles === 1 ? "" : "s"} · ${stats!.companies} compan${stats!.companies === 1 ? "y" : "ies"} hiring now`
                  : "Free to build · No paywall to apply"}
              </motion.div>

              <motion.h1
                variants={fadeUp}
                className="font-serif text-4xl sm:text-5xl md:text-[3.25rem] leading-[1.12] text-slate-900 dark:text-white mb-6 max-w-xl"
              >
                <span className="block font-normal">Build a professional resume,</span>
                <span className="block font-bold">then go land the job.</span>
              </motion.h1>

              <motion.p variants={fadeUp} className="text-base md:text-lg text-slate-600 dark:text-slate-400 mb-10 max-w-md leading-relaxed">
                Resumi is a structured resume builder and a live job board in one place. Write a clean, ATS-friendly resume, then browse roles companies are hiring for right now.
              </motion.p>

              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <Link
                  href="/sign-up"
                  className="flex items-center gap-2 bg-indigo-600 text-white px-7 py-3.5 rounded-lg font-semibold text-sm hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md w-full sm:w-auto justify-center group"
                >
                  Start Building
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  href="/jobs"
                  className="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 px-7 py-3.5 rounded-lg font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-all w-full sm:w-auto justify-center"
                >
                  <Briefcase className="w-4 h-4" />
                  Browse Open Roles
                </Link>
              </motion.div>

              <motion.p variants={fadeUp} className="text-xs text-slate-400 dark:text-slate-500">
                Free to build. Free to browse. No paywall between you and your next job.
              </motion.p>
            </div>

            <motion.div variants={fadeUp} className="relative hidden lg:block max-w-md ml-auto w-full">
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl shadow-slate-900/6 dark:shadow-black/20 p-7">
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <span className="inline-block rounded-md ring-2 ring-indigo-500/60 px-2 py-0.5 font-serif text-xl font-semibold text-slate-900 dark:text-white">
                      Angelito P. Decatoria III
                    </span>
                    <p className="text-sm text-indigo-600 dark:text-indigo-400 font-medium mt-1.5">Full Stack Developer</p>
                  </div>
                  <Image
                    src="/icon/cover1.png"
                    alt=""
                    width={44}
                    height={44}
                    className="w-11 h-11 rounded-full object-cover object-top shrink-0 ring-2 ring-white dark:ring-slate-900"
                  />
                </div>

                <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-400 dark:text-slate-500 mb-5">
                  <span>angelitodecatoriaa@gmail.com</span>
                  <span>&middot;</span>
                  <span>Portfolio</span>
                  <span>&middot;</span>
                  <span>LinkedIn</span>
                </div>

                <p className="text-[12px] leading-relaxed text-slate-500 dark:text-slate-400 mb-5">
                  Full stack developer focused on clean, maintainable code &mdash; four years shipping features end to end.
                </p>

                <div className="h-px bg-slate-100 dark:bg-slate-800 mb-5" />

                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-3">
                  Work Experience
                </p>
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Full Stack Developer</p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mb-3">Northwind Studio &middot; 2022&ndash;Present</p>
                <ul className="space-y-2">
                  <li className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 w-full" />
                  <li className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 w-5/6" />
                  <li className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 w-3/4" />
                </ul>
              </div>

              <div className="absolute -left-22 bottom-52 w-28 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-3">
                <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mb-2 text-center">Resume Score</p>
                <div className="relative w-14 h-14 mx-auto">
                  <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                    <circle cx="28" cy="28" r="24" fill="none" strokeWidth="5" className="stroke-slate-100 dark:stroke-slate-800" />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      strokeWidth="5"
                      strokeLinecap="round"
                      strokeDasharray="150.8"
                      strokeDashoffset="9"
                      className="stroke-emerald-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    94%
                  </span>
                </div>
              </div>

              <div className="absolute -bottom-7 -right-4 w-60 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-4">
                <div className="flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-500/15 flex items-center justify-center shrink-0 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <p className="text-[12px] text-slate-600 dark:text-slate-300 leading-snug">
                    Tightened the wording on your last bullet and added a measurable result.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.main>
      </div>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        id="features"
        className="relative z-10 py-24 bg-background dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-3">Tools to strengthen your application</h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Everything you need to structure, refine, and export your resume.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                className="group p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-500/50 hover:shadow-sm transition-colors duration-300"
              >
                <div className="w-11 h-11 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-5">
                  <feature.icon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{feature.desc}</p>
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
        id="platform"
        className="relative z-10 py-24 bg-background dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-6xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-3">One platform, both sides of hiring</h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Job seekers build and apply. Employers post and manage. Same place.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {PLATFORM_SIDES.map((side) => (
              <motion.div
                key={side.title}
                variants={staggerItem}
                className="p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-500/40 transition-colors duration-300 flex flex-col"
              >
                <div className={`w-12 h-12 rounded-xl ${side.accent} flex items-center justify-center mb-5 shrink-0`}>
                  <side.icon className="w-6 h-6 text-white" />
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-2">{side.eyebrow}</span>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{side.title}</h3>
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
                  className="inline-flex items-center justify-center gap-2 bg-slate-900 dark:bg-indigo-600 text-white text-sm font-semibold py-3 rounded-lg hover:bg-slate-800 dark:hover:bg-indigo-500 transition-colors"
                >
                  {side.cta}
                  <ArrowRight className="w-4 h-4" />
                </Link>
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
        id="examples"
        className="relative z-10 py-24 bg-background dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-2xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="font-serif text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-3">Upgrade your experience with impact</h2>
            <p className="text-sm md:text-base text-slate-500 dark:text-slate-400 max-w-xl mx-auto">Illustrative examples of how sharper phrasing and measurable outcomes change a bullet point.</p>
          </motion.div>

          <div className="divide-y divide-slate-200/70 dark:divide-slate-800">
            {TRANSFORMATIONS.map((item) => (
              <motion.div key={item.tag} variants={staggerItem} className="py-8 first:pt-0 last:pb-0">
                <span className="inline-flex items-center rounded-full bg-indigo-50 dark:bg-indigo-500/10 px-3 py-1 text-xs font-medium text-indigo-700 dark:text-indigo-400 mb-4">
                  {item.tag}
                </span>
                <p className="pl-4 mb-3 border-l-2 border-slate-200 dark:border-slate-700 text-sm text-slate-400 dark:text-slate-500 leading-relaxed wrap-break-word">
                  {item.before}
                </p>
                <p className="pl-4 border-l-2 border-indigo-500 dark:border-indigo-400 text-base text-slate-900 dark:text-slate-100 font-medium leading-relaxed wrap-break-word">
                  {item.after}
                </p>
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
        id="how-it-works"
        className="relative z-10 py-24 bg-background dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h2 variants={fadeUp} className="font-serif text-3xl md:text-4xl font-semibold text-slate-900 dark:text-white mb-16">Built in three simple steps</motion.h2>

          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-10 max-w-5xl mx-auto">
            <div className="hidden md:block absolute top-8 left-[calc(16.66%+2rem)] right-[calc(16.66%+2rem)] h-0.5 bg-slate-200 dark:bg-slate-800" aria-hidden />
            {STEPS.map((step) => (
              <motion.div key={step.number} variants={staggerItem} className="relative flex flex-col items-center group">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-xl font-serif font-semibold mb-6 border-2 bg-background dark:bg-slate-950 transition-transform duration-300 group-hover:scale-110 ${STEP_ACCENT}`}>
                  {step.number}
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">{step.title}</h3>
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
        className="relative z-10 py-24 bg-background dark:bg-slate-950 border-t border-slate-200/80 dark:border-slate-800"
      >
        <div className="max-w-4xl mx-auto px-6 text-center">
          <motion.div
              variants={fadeUp}
              className="relative overflow-hidden rounded-3xl bg-slate-900 dark:bg-slate-950 dark:border dark:border-slate-800 px-8 py-16 sm:px-16 sm:py-20"
            >
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 w-125 h-125 rounded-full bg-indigo-500/20 blur-[110px]"
              />
              <div className="relative">
                <h2 className="font-serif text-3xl md:text-4xl font-semibold text-white mb-3">Free to build. Free to browse.</h2>
                <p className="text-sm md:text-base text-slate-300 max-w-lg mx-auto mb-8 leading-relaxed">
                  Create your resume and start applying to real, open roles today. No paywall between you and your next job.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link href="/sign-up" className="flex items-center justify-center gap-2 bg-white text-slate-900 px-8 py-3.5 rounded-lg font-semibold text-sm hover:bg-slate-100 transition-colors w-full sm:w-auto">
                    Start Building
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                  <Link href="/jobs" className="flex items-center justify-center gap-2 bg-transparent text-white px-8 py-3.5 rounded-lg font-semibold text-sm border border-slate-600 hover:bg-slate-800 transition-colors w-full sm:w-auto">
                    Browse Open Roles
                  </Link>
                </div>
              </div>
            </motion.div>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
}