"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, Menu, X } from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/#features", label: "Features" },
  { href: "/companies", label: "Companies" },
  { href: "/pricing", label: "Pricing" },
  { href: "/for-employers", label: "For Employers" },
];

interface Props {
  active?: string;
}

export default function PublicHeader({ active }: Props) {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200/80 dark:border-slate-800 backdrop-blur-xl bg-white/80 dark:bg-slate-950/80 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-900 dark:text-white tracking-tight shrink-0">
          <ResumiLogo className="w-7 h-7" />
          Resumi
        </Link>

        <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-500 dark:text-slate-400">
          {NAV_LINKS.map((link) => {
            const isActive = active === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative py-1 transition-colors ${
                  isActive ? "text-slate-900 dark:text-white" : "hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                {link.label}
                {isActive && (
                  <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="hidden lg:flex items-center gap-4 shrink-0 ml-auto">
          <Link href="/sign-in" className="text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-semibold bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm hover:shadow-md"
          >
            Get Started
          </Link>
        </div>

        {/* Animated hamburger — fixed-size button, icons absolutely centered */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="lg:hidden ml-auto -mr-2 flex items-center justify-center w-10 h-10 rounded-lg text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 transition-colors"
        >
          <span className="relative w-5 h-5" aria-hidden="true">
            <Menu
              className={`absolute inset-0 w-5 h-5 transition-all duration-200 ease-out ${
                open ? "opacity-0 scale-75" : "opacity-100 scale-100"
              }`}
            />
            <X
              className={`absolute inset-0 w-5 h-5 transition-all duration-200 ease-out ${
                open ? "opacity-100 scale-100" : "opacity-0 scale-75"
              }`}
            />
          </span>
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="lg:hidden overflow-hidden border-t border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl"
          >
            <div className="px-4 py-5">
              <nav className="flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => {
                  const isActive = active === link.href;
                  return (
                    <motion.div
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.05 * i, duration: 0.25, ease: "easeOut" }}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`group flex items-center justify-between rounded-lg px-4 py-3 text-sm font-medium transition-colors duration-200 ${
                          isActive
                            ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
                            : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white"
                        }`}
                      >
                        {link.label}
                        <ChevronRight
                          className={`w-4 h-4 transition-all duration-200 ${
                            isActive
                              ? "opacity-100 translate-x-0 text-indigo-500 dark:text-indigo-400"
                              : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                          }`}
                        />
                      </Link>
                    </motion.div>
                  );
                })}
              </nav>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.2, duration: 0.25, ease: "easeOut" }}
                className="flex items-center gap-3 pt-5 mt-4 border-t border-slate-200/80 dark:border-slate-800"
              >
                <Link
                  href="/sign-in"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center text-sm font-semibold text-slate-700 dark:text-slate-200 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors duration-200"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  onClick={() => setOpen(false)}
                  className="flex-1 text-center text-sm font-semibold bg-indigo-600 text-white py-2.5 rounded-lg shadow-sm shadow-indigo-500/30 hover:bg-indigo-700 hover:shadow-md hover:shadow-indigo-500/30 transition-all duration-200"
                >
                  Get Started
                </Link>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}