"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Check, Sparkles, ChevronDown } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";

interface PricingPlan {
  name: string;
  monthlyPrice: number;
  annualPrice: number;
  description: string;
  features: string[];
  cta: string;
  href: string;
  highlighted?: boolean;
}

const PLANS: PricingPlan[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    annualPrice: 0,
    description: "Get your resume out there and start applying.",
    features: [
      "Build 1 resume",
      "Apply to unlimited jobs",
      "Basic job matching",
      "Community support",
    ],
    cta: "Get started",
    href: "/sign-up",
  },
  {
    name: "Pro",
    monthlyPrice: 15,
    annualPrice: 12,
    description: "For active job seekers who want every edge.",
    features: [
      "Unlimited AI-tailored resumes",
      "AI cover letter generator",
      "Job match scoring",
      "Application tracker",
      "Priority email support",
    ],
    cta: "Start free trial",
    href: "/sign-up?plan=pro",
    highlighted: true,
  },
  {
    name: "Premium",
    monthlyPrice: 35,
    annualPrice: 28,
    description: "Full support from search to signed offer.",
    features: [
      "Everything in Pro",
      "1:1 resume review from a career coach",
      "LinkedIn profile optimization",
      "AI interview prep",
      "Early access to new roles",
    ],
    cta: "Start free trial",
    href: "/sign-up?plan=premium",
  },
];

const FAQS = [
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. Upgrade or downgrade anytime from your account settings — changes apply to your next billing cycle.",
  },
  {
    question: "What happens to my applications if I downgrade?",
    answer:
      "Nothing is lost. Your application history stays intact and you keep read access to past AI-tailored resumes.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "Reach out within 14 days of your first payment for a full refund, no questions asked.",
  },
  {
    question: "How does the AI resume matching work?",
    answer:
      "Our AI compares your resume to a target job description, scoring your match based on skills and keywords, then suggests specific improvements to help you pass Applicant Tracking Systems (ATS).",
  },
  {
    question: "Can I cancel my subscription anytime?",
    answer:
      "Absolutely. There are no long-term contracts. You can cancel your subscription at any time from your billing dashboard.",
  },
  {
    question: "Do you offer discounts for students or non-profits?",
    answer:
      "Yes! Reach out to our support team with a valid student or organization email, and we'll provide a 50% discount on any paid plan.",
  },
];

const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="rounded-2xl bg-white border border-slate-200/60 overflow-hidden transition-colors hover:border-slate-300">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-6 text-left outline-none"
      >
        <span className="text-sm font-semibold text-slate-900">{question}</span>
        <ChevronDown
          size={18}
          className={`text-slate-400 shrink-0 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-6 pb-6 pt-0 text-sm text-slate-500 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PricingPage() {
  const [annual, setAnnual] = useState(false);

  return (
    <div className="min-h-screen bg-background text-slate-900">
      <PublicHeader active="/pricing" />

      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-14 md:pt-24 md:pb-16 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="font-serif text-3xl md:text-5xl font-extrabold tracking-tight mb-4 max-w-3xl mx-auto leading-[1.15]"
        >
          Plans that grow with your job search
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="text-sm md:text-base text-slate-500 max-w-xl mx-auto mb-8"
        >
          Start free, upgrade when you&apos;re ready to move faster. Cancel anytime.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          className="flex items-center justify-center gap-2"
        >
          <button
            onClick={() => setAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              !annual
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
              annual
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            Annual
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                annual ? "bg-white/20 text-white" : "text-indigo-700 bg-indigo-50"
              }`}
            >
              Save 20%
            </span>
          </button>
        </motion.div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start"
          >
            {PLANS.map((plan) => {
              const price = annual ? plan.annualPrice : plan.monthlyPrice;
              return (
                <motion.div
                  key={plan.name}
                  variants={fadeUp}
                  className={`group p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                    plan.highlighted
                      ? "border-2 border-indigo-600"
                      : "border border-slate-200/60 hover:border-indigo-300"
                  }`}
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <h3 className="text-base font-bold text-slate-900">{plan.name}</h3>
                    {plan.highlighted && (
                      <span className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-white bg-indigo-600 px-2.5 py-1 rounded-full shrink-0">
                        <Sparkles size={11} /> Popular
                      </span>
                    )}
                  </div>

                  <div className="flex items-end gap-1 mb-1">
                    <span className="text-3xl font-extrabold tracking-tight">₱{price}</span>
                    <span className="text-sm text-slate-500 mb-1">/mo</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    {price === 0
                      ? "Free forever"
                      : annual
                      ? `Billed ₱${price * 12} annually`
                      : "Billed monthly"}
                  </p>

                  <p className="text-sm text-slate-500 leading-relaxed mb-5">{plan.description}</p>

                  <ul className="flex flex-col gap-2.5 mb-6 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-slate-600">
                        <Check size={15} className="text-indigo-600 mt-0.5 shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.href}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                      plan.highlighted
                        ? "bg-indigo-600 text-white hover:bg-indigo-700"
                        : "border border-slate-200 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600"
                    }`}
                  >
                    {plan.cta}
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="font-serif text-xl font-bold text-slate-900 mb-6 text-center">
            Questions about pricing
          </h2>
          <div className="flex flex-col gap-3">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
            ))}
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}