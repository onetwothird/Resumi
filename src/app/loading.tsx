"use client";

import { motion, useReducedMotion } from "framer-motion";
import ResumiLogo from "@/components/ui/ResumiLogo";

/**
 * Branded preloader rendered by Next.js while a route's content streams in.
 *
 * Shown on hard page loads (covers the first paint with no flash) and as the
 * "instant loading state" during client-side navigations that aren't
 * prefetched. Because it uses the same background as the app and fades in
 * gently, it reads as a deliberate brand moment rather than a jarring
 * takeover.
 */
export default function Loading() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-7 bg-background dark:bg-slate-950">
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 6, scale: reduceMotion ? 1 : 0.92 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.35, ease: [0.25, 1, 0.5, 1] }}
        className="flex flex-col items-center gap-5"
      >
        <ResumiLogo className="w-14 h-14" />
        <div className="text-center">
          <p className="font-serif text-[1.6rem] font-semibold tracking-tight text-slate-900 dark:text-white">
            Resumi
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1.5">
            Crafting your career story&hellip;
          </p>
        </div>
      </motion.div>

      {reduceMotion ? (
        <div
          role="progressbar"
          aria-label="Loading Resumi"
          className="w-44 h-[3px] rounded-full bg-indigo-600/70"
        />
      ) : (
        <div
          role="progressbar"
          aria-label="Loading Resumi"
          className="relative w-44 h-[3px] overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        >
          <motion.span
            className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-500 shadow-[0_0_10px_rgba(99,102,241,0.6)]"
            initial={{ x: "-120%" }}
            animate={{ x: "420%" }}
            transition={{ repeat: Infinity, duration: 1.1, ease: "easeInOut", repeatDelay: 0.25 }}
          />
        </div>
      )}
    </div>
  );
}