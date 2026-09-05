"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import ResumiLogo from "@/components/ui/ResumiLogo";

const FOOTER_LINKS: { href: string; label: string }[] = [
  { href: "/#features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/companies", label: "Companies" },
  { href: "/for-employers", label: "For Employers" },
];

export default function PublicFooter() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);

  function handleSubscribe(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    // TODO: wire this up to your email provider (e.g. Resend, Mailchimp) once ready.
    setSubscribed(true);
  }

  return (
    <footer className="relative z-10 bg-slate-900 dark:bg-slate-950 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 py-14">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 pb-8">
          <div>
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-lg text-white tracking-tight">
              <ResumiLogo className="w-7 h-7" />
              Resumi
            </Link>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-sm text-slate-400">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-indigo-400 transition-colors">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-start lg:items-end">
            <p className="text-sm font-semibold text-white mb-3">Job alerts, weekly</p>
            {subscribed ? (
              <p className="text-sm text-slate-400">You&apos;re on the list — we&apos;ll be in touch.</p>
            ) : (
              <form onSubmit={handleSubscribe} className="flex items-center gap-2 w-full max-w-sm">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@email.com"
                  className="flex-1 min-w-0 rounded-lg border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="shrink-0 text-sm font-semibold bg-indigo-600 text-white px-4 py-2.5 rounded-lg hover:bg-indigo-700 transition-colors"
                >
                  Subscribe
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} Resumi. All rights reserved.
          </p>
          <div className="flex items-center gap-5 text-sm">
            <Link href="/sign-in" className="font-medium text-slate-300 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/sign-up" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}