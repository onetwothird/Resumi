"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, Variants, AnimatePresence } from "framer-motion";
import { Check, CheckCircle2, Sparkles, ChevronDown, LayoutDashboard } from "lucide-react";
import PublicHeader from "@/components/layout/PublicHeader";
import PublicFooter from "@/components/layout/PublicFooter";
import PlanCheckoutDialog from "@/components/billing/PlanCheckoutDialog";
import {
  PLANS,
  PLAN_ORDER,
  annualSavingPercent,
  billingNote,
  formatPeso,
  monthlyEquivalent,
  type BillingInterval,
  type PaidPlanId,
  type PlanId,
} from "@/lib/plans";

const FAQS = [
  {
    question: "Can I switch plans later?",
    answer:
      "Yes. Buy a different plan from this page at any time. If you are already on Pro and buy Premium, you keep the remaining time on your current period and it is added to the new one — you never lose days you paid for.",
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
    question: "How long does a paid plan last?",
    answer:
      "A monthly plan covers one month and an annual plan covers twelve — you are charged once, when you check out, and it does not renew on its own. When the period runs out you drop back to the Free plan, and you keep every resume and application you made.",
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
        aria-expanded={isOpen}
        className="w-full flex items-center justify-between gap-4 p-5 sm:p-6 text-left"
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
            <div className="px-5 sm:px-6 pb-5 sm:p-6 pt-0 text-sm text-slate-500 leading-relaxed">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export interface PricingClientProps {
  /**
   * Whether the visitor already has an account. Rendered server-side from the
   * session so the first paint is right; the client never re-guesses this,
   * which is what keeps a signed-in user from being sold the plan they own.
   */
  signedIn: boolean;
  /** Always a valid plan id; "free" when signed out. */
  currentPlan: PlanId;
  /** False once a paid plan has run out — the plan is then a lapsed label. */
  planActive: boolean;
  planExpiresAt: string | null;
  /** Where "Go to dashboard" goes, which depends on the account's role. */
  dashboardHref: string;
}

/**
 * Fixed timezone on every date formatted here.
 *
 * Without it the server renders in its own zone and the client re-renders in
 * the visitor's, and a date on the boundary disagrees — which React reports as
 * a hydration mismatch and resolves by throwing away the server markup. The
 * dates are billing deadlines, so "which day is this" has to be a property of
 * the product, not of whoever happens to be rendering.
 */
function formatExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString("en-PH", {
    dateStyle: "long",
    timeZone: "Asia/Manila",
  });
}

export default function PricingClient({
  signedIn,
  currentPlan,
  planActive,
  planExpiresAt,
  dashboardHref,
}: PricingClientProps) {
  const [annual, setAnnual] = useState(false);
  // Which paid plan the payment dialog is open for, or null when it is closed.
  const [checkoutFor, setCheckoutFor] = useState<PaidPlanId | null>(null);

  // A paid plan that has run out is not "the plan you have" any more — it is
  // history — so it must not suppress the buy button.
  const ownsPlan = (id: PlanId) => signedIn && currentPlan === id && planActive;
  const onPaidPlan = signedIn && currentPlan !== "free" && planActive;

  /**
   * What the button under a card does.
   *
   * The pricing page used to offer "Start free trial" on every paid plan to
   * everyone, including the person who already bought it — clicking it was a
   * guaranteed 409 from /api/billing/checkout. The grid now says what the
   * click would actually mean.
   */
  function ctaFor(id: PlanId): { label: string; kind: "current" | "upgrade" | "switch" | "join" } {
    if (ownsPlan(id)) return { label: "Your current plan", kind: "current" };
    if (id === "free") {
      // Free is never purchasable, so there is no checkout to send someone to.
      return signedIn
        ? { label: "Your current plan", kind: "current" }
        : { label: "Get started", kind: "join" };
    }
    if (!signedIn) return { label: "Start free trial", kind: "upgrade" };
    return onPaidPlan
      ? { label: `Switch to ${PLANS[id].name}`, kind: "switch" }
      : { label: "Upgrade now", kind: "upgrade" };
  }

  return (
    <div className="min-h-dvh bg-background text-slate-900">
      <PublicHeader active="/pricing" />

      <section className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-14 md:pt-24 md:pb-16 text-center">
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
            aria-pressed={!annual}
            className={`px-4 py-2.5 min-h-11 rounded-full text-xs font-semibold border transition-colors ${
              !annual
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setAnnual(true)}
            aria-pressed={annual}
            className={`flex items-center gap-2 px-4 py-2.5 min-h-11 rounded-full text-xs font-semibold border transition-colors ${
              annual
                ? "bg-indigo-600 border-indigo-600 text-white"
                : "bg-white border-slate-200 text-slate-600 hover:border-indigo-300"
            }`}
          >
            Annual
            <span
              className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                annual ? "bg-white/20 text-white" : "text-indigo-700 bg-indigo-50"
              }`}
            >
              Save {annualSavingPercent(PLANS.pro)}%
            </span>
          </button>
        </motion.div>
      </section>

      {/* A signed-in visitor came here from inside the app, so tell them what
          they already have before they read prices they may not need. */}
      {signedIn && (
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-200 bg-indigo-50/70 px-5 py-4 text-left">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
                Your current plan
              </p>
              <p className="mt-0.5 text-base font-extrabold text-slate-900">
                {PLANS[currentPlan].name}
                {planActive && planExpiresAt && currentPlan !== "free" && (
                  <span className="ml-2 text-sm font-medium text-slate-500">
                    Active until {formatExpiry(planExpiresAt)}
                  </span>
                )}
                {!planActive && currentPlan !== "free" && (
                  <span className="ml-2 text-sm font-medium text-slate-500">
                    Expired {planExpiresAt ? formatExpiry(planExpiresAt) : ""}
                  </span>
                )}
              </p>
            </div>
            <Link
              href={dashboardHref}
              className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
            >
              <LayoutDashboard size={16} aria-hidden />
              Back to your dashboard
            </Link>
          </div>
        </div>
      )}

      <section className="relative z-10 pb-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 items-start"
          >
            {PLAN_ORDER.map((id, index) => {
              const plan = PLANS[id];
              const interval: BillingInterval = annual ? "year" : "month";
              // What the customer sees next to "/mo". For the annual toggle
              // this is the per-month equivalent of the yearly price, which is
              // also the amount that gets charged once divided back out — there
              // is only one number in the system, not a display price and a
              // real price that can drift apart.
              const price = monthlyEquivalent(plan, interval);
              const cta = ctaFor(id);

              return (
                <motion.div
                  key={plan.id}
                  variants={fadeUp}
                  className={`group p-6 rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 flex flex-col ${
                    index === PLAN_ORDER.length - 1 ? "sm:col-span-2 lg:col-span-1" : ""
                  } ${
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
                    <span className="text-3xl font-extrabold tracking-tight">
                      {formatPeso(price)}
                    </span>
                    <span className="text-sm text-slate-500 mb-1">/mo</span>
                  </div>
                  <p className="text-xs text-slate-400 mb-4">
                    {billingNote(plan, interval)}
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

                  {cta.kind === "current" ? (
                    <div className="w-full flex items-center justify-center gap-2 py-3 rounded-xl min-h-11 border border-emerald-200 bg-emerald-50 text-sm font-semibold text-emerald-700">
                      <CheckCircle2 size={16} aria-hidden />
                      {cta.label}
                    </div>
                  ) : cta.kind === "join" ? (
                    <Link
                      href="/sign-up"
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors min-h-11 border border-slate-200 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600"
                    >
                      {cta.label}
                    </Link>
                  ) : (
                    // Both payment routes — QR transfer and card — live in one
                    // dialog. The card button used to sit directly on the card,
                    // which meant picking a payment method was the same click as
                    // committing to one, with no way to see the amount first.
                    <button
                      type="button"
                      onClick={() => setCheckoutFor(id as PaidPlanId)}
                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-colors min-h-11 ${
                        plan.highlighted
                          ? "bg-indigo-600 text-white hover:bg-indigo-700"
                          : "border border-slate-200 text-slate-700 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600"
                      }`}
                    >
                      {cta.label}
                    </button>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      <section className="relative z-10 pb-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
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

      {checkoutFor && (
        <PlanCheckoutDialog
          plan={checkoutFor}
          interval={annual ? "year" : "month"}
          signedIn={signedIn}
          onClose={() => setCheckoutFor(null)}
        />
      )}
    </div>
  );
}