"use client";

import { useState, useEffect } from "react";
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

  // Prevent scrolling when the full-screen menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 backdrop-blur-xl bg-white/90 dark:bg-black/90 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-black dark:text-white tracking-tight shrink-0">
            <ResumiLogo className="w-7 h-7" />
            Resumi
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-gray-500 dark:text-gray-400">
            {NAV_LINKS.map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 transition-colors ${
                    isActive ? "text-black dark:text-white" : "hover:text-black dark:hover:text-white"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-black dark:bg-white" />
                  )}
                </Link>
              );
            })}
          </div>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center gap-4 shrink-0 ml-auto">
            <Link href="/sign-in" className="text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold bg-black text-white dark:bg-white dark:text-black px-4 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-sm"
            >
              Get Started
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="lg:hidden ml-auto -mr-2 flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 dark:text-gray-300 hover:text-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/80 focus:outline-none transition-colors"
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
      </nav>

      {/* Full-Screen Mobile Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 lg:hidden bg-white dark:bg-black flex flex-col pt-24 px-6 pb-6 overflow-y-auto"
          >
            <nav className="flex flex-col gap-6 mt-4">
              {NAV_LINKS.map((link, i) => {
                const isActive = active === link.href;
                return (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.2, ease: "easeOut" }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`group flex items-center justify-between text-2xl font-semibold tracking-tight transition-colors duration-200 ${
                        isActive
                          ? "text-black dark:text-white"
                          : "text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white"
                      }`}
                    >
                      {link.label}
                      <ChevronRight
                        className={`w-5 h-5 transition-all duration-200 ${
                          isActive
                            ? "opacity-100 translate-x-0 text-black dark:text-white"
                            : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                        }`}
                      />
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            {/* Mobile Auth Buttons Pinned to Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: 0.2, duration: 0.2, ease: "easeOut" }}
              className="mt-auto pt-8 flex flex-col gap-3"
            >
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="w-full text-center text-sm font-semibold text-black dark:text-white py-3.5 rounded-lg border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="w-full text-center text-sm font-semibold bg-black text-white dark:bg-white dark:text-black py-3.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-200 transition-all duration-200"
              >
                Get Started
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}