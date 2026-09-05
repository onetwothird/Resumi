"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Rocket,
  Users,
  BarChart3,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

const FEATURES = [
  {
    icon: Rocket,
    title: "Post Jobs in Minutes",
    desc: "Publish a role with a guided template and get it in front of candidates the same day.",
    color: "text-indigo-600",
    bg: "bg-indigo-50",
  },
  {
    icon: Users,
    title: "Smart Candidate Matching",
    desc: "See applicants ranked by fit against the skills and experience your role actually needs.",
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  {
    icon: BarChart3,
    title: "Pipeline Insights",
    desc: "Track time-to-hire, drop-off points, and source quality across every open role.",
    color: "text-amber-600",
    bg: "bg-amber-50",
  },
  {
    icon: ShieldCheck,
    title: "Verified Applicants",
    desc: "Every applicant builds their resume on Resumi, so what you see is consistent and complete.",
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Create Your Job Post",
    desc: "Describe the role, required skills, and team using our structured job builder.",
    accent: "bg-slate-100 text-slate-600 border-slate-200",
  },
  {
    number: "2",
    title: "Review Matched Candidates",
    desc: "Candidates are ranked by fit, with resumes formatted consistently for fast screening.",
    accent: "bg-indigo-50 text-indigo-600 border-indigo-200",
  },
  {
    number: "3",
    title: "Hire With Confidence",
    desc: "Message candidates directly and track every stage of your pipeline in one place.",
    accent: "bg-emerald-50 text-emerald-600 border-emerald-200",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

type PlatformStats = {
  companiesHiring: number;
  activeCandidates: number;
  openRoles: number;
  jobsPostedThisMonth: number;
};

const STAT_ITEMS: { key: keyof PlatformStats; label: string }[] = [
  { key: "companiesHiring", label: "Companies hiring" },
  { key: "activeCandidates", label: "Active candidates" },
  { key: "openRoles", label: "Open roles" },
  { key: "jobsPostedThisMonth", label: "Jobs posted this month" },
];

function usePlatformStats() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;

    fetch("/api/public/stats")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load stats");
        return res.json();
      })
      .then((data: PlatformStats) => {
        if (!cancelled) {
          setStats(data);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { stats, status };
}

export default function ForEmployersPage() {
  const { stats, status } = usePlatformStats();

  return (
    <div className="min-h-screen bg-background text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      <PublicHeader active="/for-employers" />

      <motion.main
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-20 text-center flex flex-col items-center"
      >
        <motion.h1 variants={fadeUp} className="font-serif text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl mx-auto leading-[1.15]">
          Find your next great hire, <br className="hidden md:block" />
          faster than job boards allow
        </motion.h1>
        <motion.p variants={fadeUp} className="text-base md:text-lg text-slate-500 max-w-2xl mx-auto mb-10">
          Post roles, get matched to qualified candidates, and manage your whole pipeline without
          leaving Resumi.
        </motion.p>
        <motion.div variants={fadeUp} className="flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/employer/post-job"
            className="flex items-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-6 py-3.5 rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            Post a Job <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      </motion.main>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="relative z-10 py-12 bg-white border-y border-slate-200/80"
      >
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {STAT_ITEMS.map((item) => (
            <motion.div key={item.key} variants={staggerItem}>
              {status === "loading" ? (
                <div className="h-8 md:h-9 w-16 mx-auto mb-1 rounded-md bg-slate-100 animate-pulse" />
              ) : status === "error" || !stats ? (
                <div className="text-2xl md:text-3xl font-extrabold text-slate-300 mb-1">—</div>
              ) : (
                <div className="text-2xl md:text-3xl font-extrabold text-indigo-600 mb-1">
                  {stats[item.key].toLocaleString()}
                </div>
              )}
              <div className="text-xs md:text-sm text-slate-500">{item.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="relative z-10 py-24 bg-background"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-3">Everything you need to hire well</h2>
            <p className="text-sm md:text-base text-slate-500 max-w-xl mx-auto">Built for lean teams who don&apos;t have time to sift through unformatted resumes.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((feature) => (
              <motion.div
                key={feature.title}
                variants={staggerItem}
                className="group p-8 rounded-2xl bg-white border border-slate-200/60 hover:border-indigo-300 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1"
              >
                <div className={`w-12 h-12 rounded-xl ${feature.bg} flex items-center justify-center mb-5 group-hover:scale-105 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-base font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
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
        className="relative z-10 py-24 bg-white border-t border-slate-200/80"
      >
        <div className="max-w-7xl mx-auto px-6 text-center">
          <motion.h2 variants={fadeUp} className="font-serif text-2xl md:text-3xl font-bold text-slate-900 mb-16">
            Hiring in three simple steps
          </motion.h2>

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

      <PublicFooter />
    </div>
  );
}