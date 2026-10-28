"use client";

import { useState, useEffect, useRef, useSyncExternalStore, type FormEvent } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { Send, CheckCircle, Star, MessageSquareQuote, X } from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";

const PRODUCT_LINKS: { href: string; label: string }[] = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/jobs", label: "Browse jobs" },
  { href: "/companies", label: "Companies" },
];

const LINK_CLASS = "text-sm text-slate-400 hover:text-white transition-colors";

export default function PublicFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  // Same reason as PublicHeader: this footer renders on /pricing, and telling
  // someone who already signed in to sign in is a dead end. False until Clerk
  // loads, so the server render and the first client render agree.
  const { isLoaded, isSignedIn } = useAuth();
  const signedIn = isLoaded && isSignedIn;

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // Testimonial form state
  const [tName, setTName] = useState("");
  const [tRole, setTRole] = useState("");
  const [tCompany, setTCompany] = useState("");
  const [tQuote, setTQuote] = useState("");
  const [tRating, setTRating] = useState(5);
  const [tSubmitting, setTSubmitting] = useState(false);
  const [tSubmitted, setTSubmitted] = useState(false);
  const [tError, setTError] = useState<string | null>(null);

  // "Am I running in the browser?" The testimonial dialog is portalled into
  // document.body, which does not exist on the server. This replaced a
  // setState-during-render guarded by a `typeof window` check — React only
  // tolerates that as a render-phase update, and moving it into an effect is
  // no better, since it just trades the mid-render re-run for a cascading one.
  // A store subscription answers the same question with no state at all: the
  // server snapshot is false, the browser snapshot is true.
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

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

  // Escape closes the dialog. A fixed overlay cannot be scrolled, so without
  // a height cap the form runs under the phone keyboard and the submit button
  // is simply unreachable.
  useEffect(() => {
    if (!modalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", onKeyDown);
    // Land focus inside the dialog so the next Tab is not behind the overlay.
    titleRef.current?.focus();
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [modalOpen]);

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
      <footer className="relative z-10 bg-slate-900 dark:bg-slate-950 border-t border-white/10 text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-10 sm:pt-16">
          <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Brand + share your story */}
            <div className="lg:col-span-4">
              <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg text-white tracking-tight group">
                <ResumiLogo className="w-7 h-7 transition-transform duration-300 group-hover:scale-110" />
                <span className="font-serif">Resumi</span>
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed">
                A resume builder and a live job board in one place. Free for job seekers.
              </p>

              <div className="mt-6 max-w-sm rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <MessageSquareQuote className="w-4 h-4 text-indigo-400 shrink-0" aria-hidden="true" />
                  Got hired using Resumi?
                </p>
                <p className="mt-1 text-xs leading-relaxed">Share your story. It could help someone else land theirs.</p>
                <button
                  type="button"
                  onClick={openModal}
                  aria-haspopup="dialog"
                  className="mt-3 text-sm font-semibold text-indigo-300 hover:text-indigo-200 transition-colors"
                >
                  Share your experience
                </button>
              </div>
            </div>

            {/* Link groups */}
            <nav aria-label="Footer" className="grid grid-cols-2 gap-8 lg:col-span-4">
              <div>
                <p className="text-sm font-semibold text-white">Product</p>
                <ul className="mt-4 space-y-3">
                  {PRODUCT_LINKS.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className={LINK_CLASS}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Get started</p>
                <ul className="mt-4 space-y-3">
                  <li>
                    <Link href="/for-employers" className={LINK_CLASS}>For employers</Link>
                  </li>
                  {signedIn ? (
                    <li>
                      <Link href="/dashboard" className={LINK_CLASS}>Your dashboard</Link>
                    </li>
                  ) : (
                    <>
                      <li>
                        <Link href="/sign-in" className={LINK_CLASS}>Sign in</Link>
                      </li>
                      <li>
                        <Link href="/sign-up" className={LINK_CLASS}>Create an account</Link>
                      </li>
                    </>
                  )}
                </ul>
              </div>
            </nav>

            {/* Job alerts */}
            <div className="lg:col-span-4">
              <p className="text-sm font-semibold text-white">Job alerts, weekly</p>
              <p className="mt-2 text-sm leading-relaxed">New openings from companies hiring on Resumi.</p>
              {subscribed ? (
                <p className="mt-4 text-sm text-slate-300 animate-fade-in">You&apos;re on the list — we&apos;ll be in touch.</p>
              ) : (
                <form onSubmit={handleSubscribe} className="mt-4 flex flex-col sm:flex-row gap-2 w-full max-w-sm">
                  <label htmlFor="footer-email" className="sr-only">Email address</label>
                  <input
                    id="footer-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-800/80 px-3.5 py-3 text-base sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                  />
                  <button
                    type="submit"
                    className="shrink-0 text-sm font-semibold bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-500 transition-colors active:scale-95"
                  >
                    Subscribe
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="mt-12 pt-6 border-t border-white/10 flex flex-col-reverse sm:flex-row items-center justify-between gap-3 text-sm">
            <p>© {new Date().getFullYear()} Resumi. All rights reserved.</p>
            <p className="text-slate-500">Built for job seekers and the teams hiring them.</p>
          </div>
        </div>
      </footer>

      {/* ── Testimonial Modal (portal to body) ── */}
      {isClient && createPortal(
        <AnimatePresence>
          {modalOpen && (
            <motion.div
              key="testimonial-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="testimonial-modal-title"
              className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 bg-slate-900/60 overflow-y-auto"
              onClick={closeModal}
            >
              <motion.div
                key="testimonial-card"
                initial={{ opacity: 0, scale: 0.95, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 16 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                /* my-auto + max-h + scroll: on a 667px phone the form is
                   taller than the screen once the keyboard is open, and a
                   centred fixed overlay cannot be scrolled — the heading and
                   the submit button used to be clipped away entirely. */
                className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[calc(100dvh-2rem)] overflow-y-auto overscroll-contain p-6 sm:p-8 relative my-auto"
              >
                {/* Close button */}
                <button
                  type="button"
                  aria-label="Close"
                  onClick={closeModal}
                  className="absolute top-3 right-3 p-2 -m-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
                >
                  <X size={20} />
                </button>

                <AnimatePresence mode="wait">
                  {tSubmitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="text-center py-6"
                    >
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      >
                        <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                      </motion.div>
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                      >
                        Thank you!
                      </motion.p>
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-sm text-gray-500 dark:text-gray-400 mb-6"
                      >
                        Your testimonial has been submitted and will appear after review.
                      </motion.p>
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.5 }}
                        onClick={closeModal}
                        className="px-4 py-2 text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition-colors duration-200"
                      >
                        Close
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="text-center mb-5">
                        <h3
                          ref={titleRef}
                          tabIndex={-1}
                          id="testimonial-modal-title"
                          className="text-xl font-bold text-gray-900 dark:text-white mb-1 outline-none"
                        >
                          Share Your Experience
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Got hired using Resumi? Tell us about it.
                        </p>
                      </div>

                      <form onSubmit={handleTestimonial} className="space-y-3">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <motion.input
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 }}
                            type="text"
                            required
                            value={tName}
                            onChange={(e) => setTName(e.target.value)}
                            placeholder="Your name"
                            className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                          />
                          <motion.input
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            type="text"
                            value={tRole}
                            onChange={(e) => setTRole(e.target.value)}
                            placeholder="Role"
                            className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                          />
                          <motion.input
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.15 }}
                            type="text"
                            value={tCompany}
                            onChange={(e) => setTCompany(e.target.value)}
                            placeholder="Company"
                            className="rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                          />
                        </div>

                        <motion.textarea
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          required
                          value={tQuote}
                          onChange={(e) => setTQuote(e.target.value)}
                          placeholder="How did Resumi help you? (e.g. 'I went from zero callbacks to three interviews in one week.')"
                          rows={3}
                          className="w-full rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3.5 py-2 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                        />

                        <motion.div
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.25 }}
                          className="flex flex-wrap items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-1" role="radiogroup" aria-label="Rating">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <motion.button
                                key={star}
                                type="button"
                                role="radio"
                                aria-checked={star === tRating}
                                aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                                onClick={() => setTRating(star)}
                                whileHover={{ scale: 1.2 }}
                                whileTap={{ scale: 0.9 }}
                                className="p-1.5 -m-0.5 transition-colors duration-150"
                              >
                                <Star
                                  size={18}
                                  className={star <= tRating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-slate-600"}
                                />
                              </motion.button>
                            ))}
                          </div>

                          <div className="flex items-center gap-3 ml-auto">
                            {tError && (
                              <p role="alert" className="text-xs text-red-500 min-w-0 flex-1 wrap-break-word text-right">
                                {tError}
                              </p>
                            )}
                            <motion.button
                              type="submit"
                              disabled={tSubmitting}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              className="shrink-0 flex items-center justify-center gap-2 text-sm font-semibold bg-indigo-600 text-white px-5 py-2.5 rounded-lg hover:bg-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-indigo-500/25"
                            >
                              <Send size={14} />
                              {tSubmitting ? "Submitting…" : "Submit"}
                            </motion.button>
                          </div>
                        </motion.div>
                      </form>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}
