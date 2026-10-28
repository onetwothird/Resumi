"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import {
  Bookmark,
  Briefcase,
  Building2,
  CalendarClock,
  Crown,
  FileText,
  Home,
  LayoutDashboard,
  PenTool,
  Plus,
  Settings,
  Sparkles,
  User as UserIcon,
  Users,
  type LucideIcon,
} from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";
import NotificationBell from "@/components/features/dashboard/NotificationBell";
import InboxDropdown from "@/components/features/dashboard/InboxDropdown";
import MobileNav, { type MobileNavItem } from "@/components/layout/MobileNav";

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Whether a pathname belongs to this item. */
  match: (pathname: string) => boolean;
}

const JOBSEEKER_NAV: NavItem[] = [
  { label: "Home", href: "/dashboard", icon: Home, match: (p) => p === "/dashboard" },
  { label: "Jobs", href: "/jobs", icon: Briefcase, match: (p) => p.startsWith("/jobs") },
  { label: "Companies", href: "/companies", icon: Building2, match: (p) => p.startsWith("/companies") },
  { label: "Builder", href: "/resume/new", icon: PenTool, match: (p) => p.startsWith("/resume") },
  { label: "Pricing", href: "/pricing", icon: Crown, match: (p) => p.startsWith("/pricing") },
];

const EMPLOYER_NAV: NavItem[] = [
  {
    label: "Dashboard",
    href: "/employer/dashboard",
    icon: LayoutDashboard,
    // A job's own page and the post-a-job form belong to the dashboard;
    // its applicant pages belong to Candidates.
    match: (p) =>
      p === "/employer/dashboard" ||
      p === "/for-employers/dashboard" ||
      p.startsWith("/employer/post-job") ||
      (p.startsWith("/employer/jobs/") && !p.includes("/applicants")),
  },
  { label: "Candidates", href: "/employer/candidates", icon: Users, match: (p) => p.includes("/candidates") || p.includes("/applicants") },
  { label: "Interviews", href: "/employer/interviews", icon: CalendarClock, match: (p) => p.includes("/interviews") },
  // /pricing used to be reachable only by typing the URL: the one link
  // inside the app pointed at /upgrade, and / redirects to /dashboard once
  // signed in, so the public header's Pricing link was never on screen.
  { label: "Pricing", href: "/pricing", icon: Crown, match: (p) => p.startsWith("/pricing") },
];

interface Props {
  /**
   * Opens the AI Coach in place. Only the dashboard hosts the coach, so it
   * passes this; every other page links to `/dashboard?coach=1`, which opens
   * the coach on arrival. Either way the button does the same thing.
   */
  onAiCoach?: () => void;
}

/**
 * The one signed-in header. Every jobseeker and employer page renders this,
 * so the same items sit in the same places on every page and every item is a
 * plain link to its own route. Pages used to carry their own copies, where
 * "Jobs" was an in-page tab on the dashboard but a page load elsewhere, some
 * pages had no Pricing, and Companies/Builder wore dropdown chevrons with no
 * dropdown.
 */
export default function AppHeader({ onAiCoach }: Props) {
  const { user } = useUser();
  const pathname = usePathname() ?? "";
  const role = user?.publicMetadata?.role as "employer" | "jobseeker" | undefined;
  const isEmployer = role === "employer";

  const homeHref = isEmployer ? "/employer/dashboard" : "/dashboard";
  const nav = isEmployer ? EMPLOYER_NAV : JOBSEEKER_NAV;

  const mobileItems: MobileNavItem[] = nav.map((item) => ({
    label: item.label,
    href: item.href,
    icon: item.icon,
    active: item.match(pathname),
  }));
  if (isEmployer) {
    mobileItems.push({ label: "Post a job", href: "/employer/post-job", icon: Plus, primary: true });
  } else {
    mobileItems.push(
      onAiCoach
        ? { label: "AI Coach", onClick: onAiCoach, icon: Sparkles, primary: true }
        : { label: "AI Coach", href: "/dashboard?coach=1", icon: Sparkles, primary: true }
    );
  }

  const coachClass =
    "flex items-center gap-1.5 pl-2.5 pr-3 py-1.5 rounded-full bg-indigo-50 text-indigo-700 font-semibold hover:bg-indigo-100 transition-colors";

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-4 lg:gap-8 h-full">
        <Link href={homeHref} className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
          <ResumiLogo className="w-8 h-8" />
          <span className="hidden sm:inline">Resumi</span>
        </Link>
        <nav aria-label="Main" className="hidden md:flex items-center gap-6 h-full text-sm font-medium text-gray-500">
          {nav.map((item) => {
            const active = item.match(pathname);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`relative flex items-center h-full transition-colors ${
                  active
                    ? "text-gray-900 font-semibold after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:rounded-full after:bg-indigo-600"
                    : "hover:text-gray-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
          {isEmployer && (
            <Link
              href="/employer/post-job"
              aria-current={pathname.startsWith("/employer/post-job") ? "page" : undefined}
              className={coachClass}
            >
              <Plus size={14} className="text-indigo-500" /> Post a job
            </Link>
          )}
          {!isEmployer &&
            (onAiCoach ? (
              <button type="button" onClick={onAiCoach} className={coachClass}>
                <Sparkles size={14} className="text-indigo-500" /> AI Coach
              </button>
            ) : (
              <Link href="/dashboard?coach=1" className={coachClass}>
                <Sparkles size={14} className="text-indigo-500" /> AI Coach
              </Link>
            ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <NotificationBell />
        <InboxDropdown />
        <div className="flex items-center gap-2 sm:ml-2">
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link label="Edit Profile" labelIcon={<UserIcon size={15} />} href="/profile" />
              {!isEmployer && <UserButton.Link label="Saved" labelIcon={<Bookmark size={15} />} href="/saved" />}
              <UserButton.Link label="Settings" labelIcon={<Settings size={15} />} href="/settings" />
              {isEmployer ? (
                <UserButton.Link label="Candidate Dashboard" labelIcon={<FileText size={15} />} href="/dashboard" />
              ) : (
                <UserButton.Link label="Employer Dashboard" labelIcon={<Briefcase size={15} />} href="/employer/dashboard" />
              )}
            </UserButton.MenuItems>
          </UserButton>
        </div>
        <MobileNav items={mobileItems} label="Open navigation" />
      </div>
    </header>
  );
}
