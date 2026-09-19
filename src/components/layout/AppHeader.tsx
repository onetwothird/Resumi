"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, UserButton } from "@clerk/nextjs";
import { Briefcase, FileText, Settings, User as UserIcon } from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";
import NotificationBell from "@/components/features/dashboard/NotificationBell";
import InboxDropdown from "@/components/features/dashboard/InboxDropdown";

/**
 * Shared authenticated header used on the Messages, Notifications, and Settings
 * pages. It adapts its navigation for jobseekers vs employers and keeps the
 * notification bell + inbox dropdown + user menu consistent across pages.
 */
export default function AppHeader() {
  const { user } = useUser();
  const pathname = usePathname();
  const role = user?.publicMetadata?.role as "employer" | "jobseeker" | undefined;
  const isEmployer = role === "employer";

  const homeHref = isEmployer ? "/employer/dashboard" : "/dashboard";

  const navItems = isEmployer
    ? [
        { label: "Dashboard", href: "/employer/dashboard", active: pathname === "/employer/dashboard" },
        { label: "Candidates", href: "/employer/candidates", active: pathname?.includes("/candidates") },
        { label: "Interviews", href: "/employer/interviews", active: pathname?.includes("/interviews") },
      ]
    : [
        { label: "Home", href: "/dashboard", active: pathname === "/dashboard" },
        { label: "Jobs", href: "/jobs", active: pathname === "/jobs" },
        { label: "Companies", href: "/companies", active: pathname === "/companies" },
      ];

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
      <div className="flex items-center gap-4 lg:gap-8">
        <Link href={homeHref} className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
          <ResumiLogo className="w-8 h-8" />
          <span className="hidden sm:inline">Resumi</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`transition-colors ${item.active ? "text-gray-900 font-bold" : "hover:text-gray-900"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="hidden sm:block">
          <NotificationBell />
        </div>
        <div className="hidden sm:block">
          <InboxDropdown />
        </div>
        <div className="flex items-center gap-2 sm:ml-2">
          <UserButton>
            <UserButton.MenuItems>
              <UserButton.Link label="Edit Profile" labelIcon={<UserIcon size={15} />} href="/profile" />
              <UserButton.Link label="Settings" labelIcon={<Settings size={15} />} href="/settings" />
              {isEmployer ? (
                <UserButton.Link label="Candidate Dashboard" labelIcon={<FileText size={15} />} href="/dashboard" />
              ) : (
                <UserButton.Link label="Employer Dashboard" labelIcon={<Briefcase size={15} />} href="/employer/dashboard" />
              )}
            </UserButton.MenuItems>
          </UserButton>
        </div>
      </div>
    </header>
  );
}