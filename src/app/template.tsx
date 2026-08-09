"use client";

import { motion } from "framer-motion";

export default function RootTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{
        duration: 0.3,
        ease: [0.25, 1, 0.5, 1],
      }}
      className="h-full w-full"
    >
      {children}
    </motion.div>
  );
}