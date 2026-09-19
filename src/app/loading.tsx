"use client";

import { motion, useReducedMotion } from "framer-motion";
import ResumiLogo from "@/components/ui/ResumiLogo";

/**
 * Branded preloader displayed during hard page loads and client-side navigations.
 * Provides a seamless transition using application background colors to avoid
 * jarring flashes, ensuring a polished user experience.
 */
export default function Loading() {
  const reduceMotion = useReducedMotion();

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-0 z-100 flex min-h-dvh w-full flex-col items-center justify-center gap-8 bg-background dark:bg-slate-950"
    >
      <motion.div
        initial={{ opacity: 0, y: reduceMotion ? 0 : 8, scale: reduceMotion ? 1 : 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
        className="flex flex-col items-center gap-4 text-center"
      >
        <ResumiLogo className="h-16 w-16" />

        <div className="space-y-1.5">
          <h1 className="font-serif text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-50">
            Resumi
          </h1>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
            Crafting your career story&hellip;
          </p>
        </div>
      </motion.div>

      {reduceMotion ? (
        <div
          role="progressbar"
          aria-label="Loading Resumi"
          className="h-1 w-48 rounded-full bg-indigo-600 dark:bg-indigo-500"
        />
      ) : (
        <div
          role="progressbar"
          aria-label="Loading Resumi"
          className="relative h-1 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        >
          <motion.span
            className="absolute inset-y-0 left-0 w-1/3 rounded-full bg-indigo-600 dark:bg-indigo-500"
            initial={{ x: "-100%" }}
            animate={{ x: "300%" }}
            transition={{
              repeat: Infinity,
              duration: 1.2,
              ease: "easeInOut",
              repeatDelay: 0.1,
            }}
          />
        </div>
      )}
    </div>
  );
}