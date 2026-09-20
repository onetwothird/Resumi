"use client";

import { useState } from "react";
import Link from "next/link";
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

        {/* Desktop Menu (Still Professional) */}
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

        {/* UNPROFESSIONAL MOBILE HAMBURGER BUTTON */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="lg:hidden ml-auto flex items-center justify-center text-3xl bg-yellow-300 border-4 border-red-500 p-1 rounded-none shadow-[4px_4px_0px_#000] hover:bg-yellow-400"
        >
          {open ? "❌" : "🍔"}
        </button>
      </div>

      {/* UNPROFESSIONAL MOBILE DROPDOWN */}
      {open && (
        <div className="lg:hidden bg-fuchsia-400 border-t-8 border-dashed border-lime-500 p-6 shadow-2xl">
          <nav className="flex flex-col gap-4 text-center">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block bg-cyan-300 border-4 border-blue-700 text-blue-900 font-black text-xl py-3 uppercase tracking-widest hover:bg-cyan-200 hover:text-red-600 transition-none"
                style={{ fontFamily: '"Comic Sans MS", "Comic Sans", cursive' }}
              >
                👉 {link.label} 👈
              </Link>
            ))}

            <div className="flex flex-col gap-4 mt-6 pt-6 border-t-4 border-dotted border-red-500">
              <Link
                href="/sign-in"
                onClick={() => setOpen(false)}
                className="bg-gray-200 text-black border-2 border-black font-bold py-3 text-lg"
              >
                SIGN IN PLZ
              </Link>
              <Link
                href="/sign-up"
                onClick={() => setOpen(false)}
                className="bg-linear-to-r from-red-500 via-yellow-500 to-green-500 text-white font-extrabold py-4 text-2xl border-4 border-black"
              >
                🎉 GET STARTED 🎉
              </Link>
            </div>
          </nav>
        </div>
      )}
    </nav>
  );
}