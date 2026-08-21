"use client";

import Link from "next/link";
import ResumiLogo from "@/components/logo/ResumiLogo";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/companies", label: "Companies" },
  { href: "/for-employers", label: "For Employers" },
];

interface Props {
  active?: string;
}

export default function PublicHeader({ active }: Props) {
  return (
    <nav className="relative z-50 border-b border-slate-200/80 backdrop-blur-xl bg-white/80 top-0">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 tracking-tight">
          <ResumiLogo className="w-8 h-8" />
          Resumi
        </Link>

        <div className="hidden lg:flex flex-1 items-center justify-center gap-8 text-sm font-medium text-slate-600">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                active === link.href ? "text-indigo-600 font-semibold" : "hover:text-indigo-600"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Link href="/sign-in" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="text-sm font-semibold bg-indigo-600 text-white px-5 py-2 rounded-xl hover:bg-indigo-700 transition-all shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}