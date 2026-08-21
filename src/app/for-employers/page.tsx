"use client";

import Link from "next/link";
import { motion, Variants } from "framer-motion";
import {
  Rocket,
  Users,
  BarChart3,
  ShieldCheck,
  Check,
  ArrowRight,
} from "lucide-react";
import PublicHeader from "@/components/marketing/PublicHeader";
import PublicFooter from "@/components/marketing/PublicFooter";

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

const STATS = [
  { value: "500+", label: "Companies hiring" },
  { value: "10k+", label: "Active candidates" },
  { value: "48 hrs", label: "Avg. time to first applicant" },
  { value: "4.8/5", label: "Employer satisfaction" },
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

const PLANS = [
  {
    name: "Starter",
    price: "$0",
    period: "forever",
    features: [
      "1 active job post",
      "Basic candidate matching",
      "Standard support",
    ],
    highlight: false,
  },
  {
    name: "Growth",
    price: "$99",
    period: "/ month",
    features: [
      "Unlimited active job posts",
      "Advanced candidate matching",
      "Pipeline analytics dashboard",
      "Team collaboration tools",
      "Priority support",
    ],
    highlight: true,
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

export default function ForEmployersPage() {
  return (
    <div className="min-h-screen bg-[#F7F9FC] text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      <PublicHeader active="/for-employers" />

      <motion.main
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
        className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-20 text-center flex flex-col items-center"
      >
        <motion.h1 variants={fadeUp} className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight mb-6 max-w-4xl mx-auto leading-[1.15]">
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
          <a href="#pricing" className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors px-6 py-3.5">
            View Pricing
          </a>
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
          {STATS.map((s) => (
            <motion.div key={s.label} variants={staggerItem}>
              <div className="text-2xl md:text-3xl font-extrabold text-indigo-600 mb-1">{s.value}</div>
              <div className="text-xs md:text-sm text-slate-500">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={staggerContainer}
        className="relative z-10 py-24 bg-[#F7F9FC]"
      >
        <div className="max-w-7xl mx-auto px-6">
          <motion.div variants={fadeUp} className="text-center mb-16">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Everything you need to hire well</h2>
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
          <motion.h2 variants={fadeUp} className="text-2xl md:text-3xl font-bold text-slate-900 mb-16">
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
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">Plans for teams of any size</h2>
            <p className="text-sm text-slate-500">Start free. Upgrade when you&apos;re posting more than one role at a time.</p>
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
                  {plan.highlight ? "Upgrade to Growth" : "Start for Free"}
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <PublicFooter />
    </div>
  );
}