"use client";

import { useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Send, CheckCircle, Star, MessageSquareQuote, X } from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";

const FOOTER_LINKS: { href: string; label: string }[] = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/companies", label: "Companies" },
  { href: "/for-employers", label: "For Employers" },
];

export default function PublicFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);

  // Testimonial form state
  const [tName, setTName] = useState("");
  const [tRole, setTRole] = useState("");
  const [tCompany, setTCompany] = useState("");
  const [tQuote, setTQuote] = useState("");
  const [tRating, setTRating] = useState(5);
  const [tSubmitting, setTSubmitting] = useState(false);
  const [tSubmitted, setTSubmitted] = useState(false);
  const [tError, setTError] = useState<string | null>(null);

  function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    setSubscribed(true);
  }

  function openModal() {
    setModalOpen(true);
    setTSubmitted(false);
    setTError(null);
  }

  function closeModal() {
    setModalOpen(false);
  }

  async function handleTestimonial(e: FormEvent) {
    e.preventDefault();
    setTError(null);

    if (!tName.trim() || !tQuote.trim()) {
      setTError("Name and testimonial are required.");
      return;
    }
    if (tQuote.trim().length < 20) {
      setTError("Testimonial must be at least 20 characters.");
      return;
    }

    setTSubmitting(true);
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: tName,
          role: tRole,
          company: tCompany,
          quote: tQuote,
          rating: tRating,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || "Failed to submit");
      }

      setTSubmitted(true);
    } catch (err) {
      setTError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setTSubmitting(false);
    }
  }

  return (
    <>
      <footer className="relative z-10 bg-slate-900 dark:bg-slate-950 border-t border-white/10">
        {/* ── Section 1: Logo, Links & Newsletter ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-14">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10">
            <div>
              <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg text-white tracking-tight">
                <ResumiLogo className="w-7 h-7" />
                Resumi
              </Link>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-slate-400">
                {FOOTER_LINKS.map((link) => (
                  <Link key={link.href} href={link.href} className="hover:text-indigo-400 transition-colors">
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-start lg:items-end">
              <p className="text-sm font-semibold text-white mb-3">Job alerts, weekly</p>
              {subscribed ? (
                <p className="text-sm text-slate-400">You&apos;re on the list — we&apos;ll be in touch.</p>
              ) : (
                <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full max-w-sm">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="submit"
                    className="shrink-0 text-sm font-semibold bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* ── Section 2: Share Your Experience (button only) ── */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 flex flex-col sm:flex-row items-center justify-center gap-4 text-center">
            <div className="flex items-center gap-3">
              <MessageSquareQuote className="w-5 h-5 text-indigo-400" />
              <p className="text-sm sm:text-base text-slate-300">Got hired using Resumi? Share your story — it could inspire others.</p>
            </div>
            <button
              onClick={openModal}
              className="shrink-0 inline-flex items-center gap-2 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <MessageSquareQuote size={16} />
              Share Your Experience
            </button>
          </div>
        </div>

        {/* ── Section 3: Bottom bar ── */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm text-slate-400">
                © {new Date().getFullYear()} Resumi. All rights reserved.
              </p>
              <div className="flex items-center gap-5 text-sm">
                <Link href="/sign-in" className="font-medium text-slate-300 hover:text-white transition-colors">
                  Sign In
                </Link>
                <Link href="/sign-up" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
                  Get Started
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Testimonial Modal (portal to body for true viewport centering) ── */}
      {modalOpen && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg p-6 sm:p-8 relative overflow-hidden">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <X size={20} />
            </button>

            {tSubmitted ? (
              <div className="text-center py-6">
                <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Thank you!</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Your testimonial has been submitted and will appear after review.
                </p>
                <button
                  onClick={closeModal}
                  className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-5">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Share Your Experience</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Got hired using Resumi? Tell us about it.
                  </p>
                </div>

                <form onSubmit={handleTestimonial} className="space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      required
                      value={tName}
                      onChange={(e) => setTName(e.target.value)}
                      placeholder="Your name"
                      className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={tRole}
                      onChange={(e) => setTRole(e.target.value)}
                      placeholder="Role"
                      className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <input
                      type="text"
                      value={tCompany}
                      onChange={(e) => setTCompany(e.target.value)}
                      placeholder="Company"
                      className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  <textarea
                    required
                    value={tQuote}
                    onChange={(e) => setTQuote(e.target.value)}
                    placeholder="How did Resumi help you? (e.g. 'I went from zero callbacks to three interviews in one week.')"
                    rows={2}
                    className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setTRating(star)}
                          className="p-0.5 transition-colors"
                        >
                          <Star
                            size={18}
                            className={star <= tRating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-slate-600"}
                          />
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      {tError && (
                        <p className="text-xs text-red-500">{tError}</p>
                      )}
                      <button
                        type="submit"
                        disabled={tSubmitting}
                        className="flex items-center justify-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-5 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send size={14} />
                        {tSubmitting ? "Submitting…" : "Submit"}
                      </button>
                    </div>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
