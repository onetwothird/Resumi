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
      <nav className="font-sans sticky top-0 z-50 border-b border-foreground/10 backdrop-blur-xl bg-background/90 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-foreground tracking-tight shrink-0">
            <ResumiLogo className="w-7 h-7" />
            <span className="font-serif">Resumi</span>
          </Link>

          <div className="hidden lg:flex items-center gap-7 text-sm font-medium text-foreground/60">
            {NAV_LINKS.map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative py-1 transition-colors ${
                    isActive ? "text-foreground" : "hover:text-foreground"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-foreground animate-scale-in" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden lg:flex items-center gap-4 shrink-0 ml-auto">
            <Link href="/sign-in" className="text-sm font-medium text-foreground/60 hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link
              href="/sign-up"
              className="text-sm font-semibold bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition-opacity shadow-sm"
            >
              Get Started
            </Link>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="lg:hidden ml-auto -mr-2 flex items-center justify-center w-10 h-10 rounded-lg text-foreground/70 hover:text-foreground hover:bg-foreground/5 focus:outline-none transition-colors"
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

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 lg:hidden bg-background flex flex-col pt-24 px-6 pb-6 overflow-y-auto font-sans"
          >
            <nav className="flex flex-col gap-6 mt-4 stagger-children">
              {NAV_LINKS.map((link) => {
                const isActive = active === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`group flex items-center justify-between text-2xl font-semibold tracking-tight transition-colors duration-200 ${
                      isActive
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                    <ChevronRight
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive
                          ? "opacity-100 translate-x-0 text-foreground"
                          : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div 
              className="mt-auto pt-8 flex flex-col gap-3 animate-fade-in-up" 
              style={{ animationDelay: '0.4s' }}
            >
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="w-full text-center text-sm font-semibold text-foreground py-3.5 rounded-lg border border-foreground/20 hover:bg-foreground/5 transition-colors duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="w-full text-center text-sm font-semibold bg-foreground text-background py-3.5 rounded-lg hover:opacity-90 transition-opacity duration-200"
              >
                Get Started
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}