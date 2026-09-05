"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { User, FileText, Users, Search } from "lucide-react";
import NotificationBell from "@/components/dashboard/NotificationBell";
import InboxDropdown from "@/components/dashboard/InboxDropdown";

export default function CandidatesClient() {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/employer/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon/icons.png" alt="Resumi Logo" className="w-8 h-8 object-contain drop-shadow-sm" />
            <span className="hidden sm:inline">Resumi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/employer/dashboard" className={`transition-colors ${pathname === '/employer/dashboard' ? 'text-gray-900 font-bold' : 'hover:text-gray-900'}`}>Dashboard</Link>
            <Link href="/employer/candidates" className={`transition-colors ${pathname?.includes('/candidates') ? 'text-gray-900 font-bold' : 'hover:text-gray-900'}`}>Candidates</Link>
            <Link href="/employer/interviews" className={`transition-colors ${pathname?.includes('/interviews') ? 'text-gray-900 font-bold' : 'hover:text-gray-900'}`}>Interviews</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:block"><NotificationBell /></div>
          <div className="hidden sm:block"><InboxDropdown /></div>
          <div className="flex items-center gap-2 sm:ml-2">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link label="Edit Profile" labelIcon={<User size={15} />} href="/profile" />
                <UserButton.Link label="Candidate Dashboard" labelIcon={<FileText size={15} />} href="/dashboard" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Global Candidate Pool</h1>
          <p className="text-sm text-gray-500 mt-1">Review and manage all applicants across your active job postings.</p>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-16 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
            <Users size={28} className="text-indigo-300" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">No candidates found</h3>
          <p className="text-sm text-gray-500 max-w-sm mb-6">You don&apos;t have any applicants yet. Once candidates apply to your job postings, they will appear here.</p>
          <Link href="/employer/dashboard" className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm">
            <Search size={16} /> View Active Jobs
          </Link>
        </div>
      </main>
    </div>
  );
}