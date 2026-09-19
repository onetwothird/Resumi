"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Cookie } from "lucide-react";

type ConsentChoice = "accepted" | "essential" | null;

const STORAGE_KEY = "resumi_cookie_consent";

/**
 * Cookie consent banner shown on the landing page until the visitor makes a
 * choice. The verdict is remembered in localStorage so the banner doesn't
 * reappear on every visit. Rendering is gated on `mounted` so the server
 * markup is empty and there's no hydration mismatch.
 */
export default function CookieConsent() {
  const [choice, setChoice] = useState<ConsentChoice>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === "accepted" || stored === "essential") {
        setChoice(stored);
      }
    } catch {
      // localStorage unavailable (e.g. strict private browsing) — the banner
      // will simply stay visible for that session.
    }
  }, []);

  const dismiss = (value: Exclude<ConsentChoice, null>) => {
    setChoice(value);
    try {
      localStorage.setItem(STORAGE_KEY, value);
    } catch {
      // Ignore — banner choice just won't persist.
    }
  };

  return (
    <AnimatePresence>
      {mounted && choice === null && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          role="dialog"
          aria-label="Cookie consent"
          aria-live="polite"
          className="fixed bottom-4 left-4 right-4 sm:left-6 sm:right-auto sm:max-w-md z-[60] rounded-2xl bg-white shadow-2xl border border-slate-200 p-5"
        >
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 shrink-0 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Cookie size={20} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">We use cookies</h2>
              <p className="text-xs text-slate-500 leading-relaxed mt-0.5">
                Essential cookies keep you signed in and secure. We also use a
                few analytics cookies to understand how the app is used.
              </p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => dismiss("accepted")}
              className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Accept all
            </button>
            <button
              onClick={() => dismiss("essential")}
              className="flex-1 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
            >
              Essential only
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}