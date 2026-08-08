"use client";

import { motion } from "framer-motion";

export default function RootTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      // Very subtle drop and light blur
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      // Snaps cleanly into focus
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.3, // Faster duration so it doesn't slow the user down
        ease: [0.25, 1, 0.5, 1], // A highly polished, quick deceleration curve
      }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}