"use client";

import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import ResumiLogo from "@/components/ui/ResumiLogo";

/**
 * Branded preloader displayed during hard page loads and client-side navigations.
 * Simulates a loading progress from 1 to 100 for a polished user experience.
 */
export default function Loading() {
  const reduceMotion = useReducedMotion();
  const [progress, setProgress] = useState(0);

  // Simulate realistic loading progress
  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prevProgress) => {
        if (prevProgress >= 100) {
          clearInterval(timer);
          return 100;
        }
        // Random increment between 2 and 15 to make it feel organic
        const increment = Math.floor(Math.random() * 14) + 2;
        return Math.min(prevProgress + increment, 100);
      });
    }, 150); // Updates every 150ms

    return () => clearInterval(timer);
  }, []);

  const displayProgress = Math.round(progress);

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

      <div className="flex flex-col items-center gap-2.5">
        <div
          role="progressbar"
          aria-label="Loading Resumi"
          aria-valuenow={displayProgress}
          aria-valuemin={0}
          aria-valuemax={100}
          className="relative h-1 w-48 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        >
          {reduceMotion ? (
            <div
              className="absolute inset-y-0 left-0 h-full rounded-full bg-indigo-600 dark:bg-indigo-500 transition-all duration-150 ease-out"
              style={{ width: `${displayProgress}%` }}
            />
          ) : (
            <motion.span
              className="absolute inset-y-0 left-0 rounded-full bg-indigo-600 dark:bg-indigo-500"
              initial={{ width: "0%" }}
              animate={{ width: `${displayProgress}%` }}
              transition={{ ease: "easeOut", duration: 0.2 }}
            />
          )}
        </div>
        
        {/* Percentage indicator */}
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.3 }}
          className="text-xs font-semibold tabular-nums text-slate-500 dark:text-slate-400"
        >
          {displayProgress}%
        </motion.span>
      </div>
    </div>
  );
}