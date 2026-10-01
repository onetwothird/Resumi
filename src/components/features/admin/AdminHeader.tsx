"use client";

import Link from "next/link";
import { ArrowUpRight, CreditCard, Shield, Users } from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";
import type { Tab } from "@/components/features/admin/types";

/**
 * The panel's sticky chrome: brand, tab switcher, exit.
 *
 * Its own file because it is the one part of the panel that must render on every
 * tab and must never remount as the tab changes. Keeping it separate makes that
 * obvious; folded into the shell it would have been a few hundred lines of
 * markup in the same file as the data fetching.
 *
 * "Back to app" points at /dashboard rather than at the admin's actual role home.
 * Admins reach this panel from anywhere, and /dashboard is the one route the
 * proxy will not bounce a jobseeker off; sending an employer-admin to a
 * jobseeker dashboard on exit would be a confusing last impression.
 */
export default function AdminHeader({
  tab,
  onTab,
}: {
  tab: Tab;
  onTab: (t: Tab) => void;
}) {
  const tabs: { id: Tab; label: string; icon: typeof Users }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "payments", label: "Payments", icon: CreditCard },
    { id: "audit", label: "Audit log", icon: Shield },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-xs">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2.5">
          <Link href="/dashboard" className="flex items-center gap-2 text-xl font-bold text-indigo-600">
            <ResumiLogo className="h-7 w-7" />
            <span className="hidden sm:inline">Resumi</span>
          </Link>
          <span className="ml-1 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200 ring-inset">
            <Shield size={12} aria-hidden />
            Admin
          </span>
        </div>

        <nav className="hidden items-center gap-1 text-sm font-medium text-gray-500 md:flex">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => onTab(id)}
              aria-current={tab === id ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 transition-colors ${
                tab === id
                  ? "bg-indigo-50 font-semibold text-indigo-700"
                  : "hover:bg-gray-100 hover:text-gray-900"
              }`}
            >
              <Icon size={15} aria-hidden />
              {label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
          >
            Back to app
            <ArrowUpRight size={14} aria-hidden />
          </Link>
          {/* Mobile tab switcher. The desktop nav is hidden below md, so without
              this the other two tabs would be unreachable on a phone -- and an
              admin checking a plan from a phone is the normal case, not the edge
              case. */}
          <div className="flex items-center gap-0.5 md:hidden">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => onTab(id)}
                aria-label={label}
                aria-current={tab === id ? "page" : undefined}
                className={`rounded-lg p-2 transition-colors ${
                  tab === id ? "bg-indigo-50 text-indigo-700" : "text-gray-500"
                }`}
              >
                <Icon size={18} aria-hidden />
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}