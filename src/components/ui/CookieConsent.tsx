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
          aria-label="Cookie consent"
          aria-live="polite"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[calc(100%-2rem)] sm:w-100 z-9999 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl shadow-black/10 border border-slate-200 dark:border-slate-800 p-5 sm:p-6"
        >
          <div className="flex items-start gap-4 mb-5">
            <div className="w-12 h-12 shrink-0 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Cookie size={24} />
            </div>
            <div className="pt-1">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">We use cookies</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mt-1">
                Essential cookies keep you signed in and secure. We also use a
                few analytics cookies to understand how the app is used.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={() => dismiss("accepted")}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Accept all
            </button>
            <button
              onClick={() => dismiss("essential")}
              className="flex-1 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl transition-colors"
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