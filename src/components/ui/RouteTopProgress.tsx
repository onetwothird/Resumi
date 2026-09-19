"use client";

import { AnimatePresence, motion } from "framer-motion";

interface RouteTopProgressProps {
  active: boolean;
  done: boolean;
  onDone: () => void;
}

/**
 * Slim, indigo-gradient progress bar pinned to the top of the viewport.
 * It appears instantly when a navigation starts, crawls to ~72% while the
 * next route loads, then fills to 100% and fades out once the router
 * commits the new URL. Non-blocking and pointer-events-free, so the user
 * can keep interacting while a page loads.
 */
export default function RouteTopProgress({ active, done, onDone }: RouteTopProgressProps) {
  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="route-top-progress"
          role="progressbar"
          aria-label="Loading page"
          aria-valuemin={0}
          aria-valuemax={100}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.18, ease: "easeOut" } }}
          className="fixed inset-x-0 top-0 z-[100] pointer-events-none"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: done ? "100%" : "72%" }}
            transition={
              done
                ? { duration: 0.25, ease: "easeOut" }
                : { duration: 0.45, ease: [0.25, 1, 0.5, 1] }
            }
            onAnimationComplete={() => {
              if (done) onDone();
            }}
            className="relative h-[3px] overflow-hidden rounded-r-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-500 shadow-[0_0_14px_rgba(99,102,241,0.55)]"
          >
            {/* Light sweep that travels across the bar while it crawls. */}
            <span className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-[preloader-sweep_1.2s_ease-in-out_infinite] motion-reduce:animate-none" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}