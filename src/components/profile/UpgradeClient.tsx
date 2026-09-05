"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUser, useClerk, UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Bookmark, Crown, User as UserIcon, Settings, Check } from "lucide-react";
import ResumiLogo from "@/components/logo/ResumiLogo";
import NotificationBell from "@/components/dashboard/NotificationBell";
import InboxDropdown from "@/components/dashboard/InboxDropdown";

export default function UpgradeClient() {
  const { user } = useUser();
  const { openUserProfile } = useClerk(); 
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F4F6F8] flex flex-col font-sans">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6 sticky top-0 z-20 shadow-xs">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/dashboard" className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
            <ResumiLogo className="w-8 h-8" />
            <span className="hidden sm:inline">Resumi</span>
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
            <Link href="/dashboard" className="hover:text-gray-900 transition-colors">Home</Link>
            <Link href="/jobs" className="hover:text-gray-900 transition-colors">Jobs</Link>
            <Link href="/companies" className="hover:text-gray-900 transition-colors">Companies</Link>
          </nav>
        </div>
        <div className="flex items-center gap-2 lg:gap-4">
          <div className="hidden sm:block"><NotificationBell /></div>
          <div className="hidden sm:block"><InboxDropdown /></div>
          <div className="flex items-center gap-2 sm:ml-2">
            <UserButton>
              <UserButton.MenuItems>
                <UserButton.Link label="Edit Profile" labelIcon={<UserIcon size={15} />} href="/profile" />
                <UserButton.Link label="Employer Dashboard" labelIcon={<Crown size={15} />} href="/employer/dashboard" />
              </UserButton.MenuItems>
            </UserButton>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Synchronized Sidebar */}
        <aside className="md:col-span-3 space-y-8">
          <div className="flex items-center gap-3 px-2">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-sm">
                {user?.fullName?.charAt(0) || "U"}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{user?.fullName || "User"}</h3>
              <p className="text-xs text-gray-500 truncate">@{user?.username || "username"}</p>
            </div>
          </div>

          <nav className="space-y-1.5">
            <Link href="/dashboard" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/dashboard' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <LayoutDashboard size={18} className={pathname === '/dashboard' ? 'text-indigo-600' : 'text-gray-400'} /> Dashboard
            </Link>
            <Link href="/saved" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/saved' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Bookmark size={18} className={pathname === '/saved' ? 'text-indigo-600' : 'text-gray-400'} /> Bookmarks
            </Link>
            <Link href="/upgrade" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/upgrade' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <Crown size={18} className={pathname === '/upgrade' ? 'text-indigo-600' : 'text-gray-400'} /> VIP plan
            </Link>
            <Link href="/profile" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/profile' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <UserIcon size={18} className={pathname === '/profile' ? 'text-indigo-600' : 'text-gray-400'} /> Edit profile
            </Link>
            
            <button onClick={() => openUserProfile()} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors">
              <Settings size={18} className="text-gray-400" /> Account
            </button>
          </nav>
        </aside>

        {/* Upgrade Content */}
        <main className="md:col-span-9 space-y-6">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Upgrade to VIP</h1>
            <p className="text-sm text-gray-500 mt-1">Unlock premium AI features and stand out to employers.</p>
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 max-w-lg border-t-4 border-t-indigo-500">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-extrabold text-gray-900">Resumi Pro</h2>
              <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Most Popular</span>
            </div>
            
            <div className="mb-6">
              <span className="text-4xl font-black text-gray-900">₱499</span>
              <span className="text-gray-500 font-medium"> / month</span>
            </div>

            <ul className="space-y-4 mb-8">
              {['Unlimited AI Mock Interviews', 'Priority Application Routing', 'Advanced Resume Analytics', 'Verified VIP Badge on Profile'].map((feature, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-gray-700">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                    <Check size={12} className="text-emerald-700" />
                  </span>
                  {feature}
                </li>
              ))}
            </ul>

            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition-all shadow-sm">
              Upgrade Now
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}