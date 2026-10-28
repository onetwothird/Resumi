"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";

type ConsentChoice = "accepted" | "essential" | null;

const STORAGE_KEY = "resumi_cookie_consent";

export default function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "accepted" || stored === "essential") {
        setChoice(stored as ConsentChoice);
      }
    } catch {}
  }, []);

  const dismiss = (value: Exclude<ConsentChoice, null>) => {
    setChoice(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {}
  };

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {choice === null && (
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          role="dialog"
          aria-labelledby="cookie-consent-title"
          /* Deliberately below the mobile menu's z-40 overlay: the banner is
             277px tall on a phone and its old z-9999 sat on top of the menu's
             Sign In / Get Started buttons, making both of them untappable. */
          /* Phones: a compact strip pinned 12px from the edges, kept clear of
             the home indicator (`pb-safe` is not a Tailwind utility, so it
             compiled to nothing). sm and up: the original corner card. */
          style={{ bottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
          className="fixed inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6! sm:w-100 z-30 max-h-[calc(100dvh-1.5rem)] overflow-y-auto rounded-2xl bg-white dark:bg-slate-900 shadow-2xl shadow-black/10 border border-slate-200 dark:border-slate-800 p-4 sm:p-6"
        >
          <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-5">
            <div className="hidden sm:flex w-12 h-12 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 items-center justify-center">
              <Cookie size={24} />
            </div>
            <div className="sm:pt-1 min-w-0">
              <h2 id="cookie-consent-title" className="flex items-center gap-2 text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                <Cookie size={16} className="sm:hidden shrink-0 text-indigo-600 dark:text-indigo-400" aria-hidden />
                We use cookies
              </h2>
              <p className="text-[13px] sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Essential cookies keep you signed in and secure. We also use a
                few analytics cookies to understand how the app is used.
              </p>
            </div>
          </div>
          <div className="flex flex-row gap-2 sm:gap-2.5">
            <button
              type="button"
              onClick={() => dismiss("accepted")}
              className="flex-1 min-w-0 py-2.5 sm:py-3 px-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Accept all
            </button>
            <button
              type="button"
              onClick={() => dismiss("essential")}
              className="flex-1 min-w-0 py-2.5 sm:py-3 px-3 whitespace-nowrap bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors"
            >
              Essential only
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}