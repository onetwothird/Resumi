"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { UserButton, useUser, useClerk } from "@clerk/nextjs";
import { 
  LayoutDashboard, Bookmark, Crown, User as UserIcon, 
  Settings, Eye, Upload, Camera, Loader2, Check
} from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";
import NotificationBell from "@/components/features/dashboard/NotificationBell";
import InboxDropdown from "@/components/features/dashboard/InboxDropdown";

interface UserProfileData {
  name: string | null;
  username: string | null;
  role: string | null;
  location: string | null;
  bio: string | null;
  website: string | null;
  social: string | null;
  github: string | null;
  email: string | null;
}

export default function ProfileClient({ initialData }: { initialData: UserProfileData }) {
  const { user } = useUser();
  const { openUserProfile } = useClerk(); // Access Clerk's native account manager
  const router = useRouter();
  const pathname = usePathname(); // Get current URL path to highlight active sidebar links
  
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "success" | "error">("idle");

  const [formData, setFormData] = useState({
    fullName: initialData.name || "",
    username: initialData.username || "",
    role: initialData.role || "",
    location: initialData.location || "",
    bio: initialData.bio || "",
    website: initialData.website || "",
    social: initialData.social || "",
    github: initialData.github || "",
    email: initialData.email || "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setSaveStatus("idle");
  };

  const handleSave = async () => {
    setIsLoading(true);
    setSaveStatus("idle");
    
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to save profile");
      
      setSaveStatus("success");
      router.refresh(); 
      
      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      console.error(error);
      setSaveStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

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
        
        {/* Left Sidebar (Now dynamic and accurate) */}
        <aside className="md:col-span-3 space-y-8">
          <div className="flex items-center gap-3 px-2">
            {user?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.imageUrl} alt="Profile" className="w-12 h-12 rounded-full object-cover border border-gray-200 shadow-sm" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-lg shadow-sm">
                {formData.fullName?.charAt(0) || "U"}
              </div>
            )}
            <div className="min-w-0">
              <h3 className="font-bold text-gray-900 truncate">{formData.fullName || "User"}</h3>
              <p className="text-xs text-gray-500 truncate">@{formData.username || "username"}</p>
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
              <Crown size={18} className={pathname === '/upgrade' ? 'text-indigo-600' : 'text-indigo-400'} /> VIP plan
            </Link>
            <Link href="/profile" className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-colors ${pathname === '/profile' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'}`}>
              <UserIcon size={18} className={pathname === '/profile' ? 'text-indigo-600' : 'text-gray-400'} /> Edit profile
            </Link>
            
            {/* Account Button triggers Clerk's Secure Profile Manager */}
            <button onClick={() => openUserProfile()} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors">
              <Settings size={18} className="text-gray-400" /> Account
            </button>
          </nav>
        </aside>

        {/* Right Content Area */}
        <main className="md:col-span-9 space-y-6 pb-20">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
            <div>
              <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Edit profile</h1>
              <p className="text-sm text-gray-500 mt-1">This is how you appear across the platform.</p>
            </div>
            <Link 
              href={`/u/${formData.username || user?.id}`}
              className="inline-flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-bold px-4 py-2 rounded-xl text-sm transition-colors shadow-sm"
            >
              <Eye size={16} /> View public profile
            </Link>
          </div>

          {/* Form Card 1: Basic Info */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex flex-col xl:flex-row gap-8">
              
              <div className="shrink-0 flex flex-col gap-3">
                <span className="text-sm font-bold text-gray-900">Profile photo</span>
                <button 
                  onClick={() => openUserProfile()} 
                  className="relative group cursor-pointer w-24 h-24 outline-none focus:ring-4 focus:ring-indigo-500/20 rounded-full"
                >
                  {user?.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.imageUrl} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center border-4 border-gray-50 shadow-sm">
                      <Camera className="text-indigo-300" size={32} />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Upload className="text-white" size={20} />
                  </div>
                </button>
                <p className="text-[11px] text-gray-500 max-w-30 leading-relaxed">
                  Click to update image via account manager.
                </p>
              </div>

              <div className="flex-1 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-900">Full name</label>
                    <input 
                      type="text" name="fullName" value={formData.fullName} onChange={handleChange}
                      className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-900">Username</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                      <input 
                        type="text" name="username" value={formData.username} onChange={handleChange}
                        className="w-full p-3 pl-8 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-1">Role / title <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input 
                      type="text" name="role" value={formData.role} onChange={handleChange} placeholder="e.g. Full Stack Developer"
                      className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-900 flex items-center gap-1">Location <span className="text-gray-400 font-normal">(optional)</span></label>
                    <input 
                      type="text" name="location" value={formData.location} onChange={handleChange} placeholder="City, PH"
                      className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-900 flex items-center gap-1">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
                  <textarea 
                    name="bio" value={formData.bio} onChange={handleChange} rows={4} maxLength={200}
                    className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800 resize-none"
                  />
                  <div className="flex justify-between items-center text-[11px] text-gray-500">
                    <span>A short intro.</span>
                    <span className={formData.bio.length >= 200 ? "text-red-500 font-bold" : ""}>{formData.bio.length} / 200</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form Card 2: Links */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-5">Links</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-1">Website <span className="text-gray-400 font-normal">(optional)</span></label>
                <input 
                  type="url" name="website" value={formData.website} onChange={handleChange} placeholder="https://"
                  className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-1">Social media <span className="text-gray-400 font-normal">(optional)</span></label>
                <input 
                  type="url" name="social" value={formData.social} onChange={handleChange} placeholder="https://linkedin.com/in/yourhandle"
                  className="w-full p-3 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-sm font-bold text-gray-900 flex items-center gap-1">GitHub <span className="text-gray-400 font-normal">(optional)</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">github.com/</span>
                  <input 
                    type="text" name="github" value={formData.github} onChange={handleChange}
                    className="w-full p-3 pl-24 bg-gray-50/50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-gray-800"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4">
            <span className="text-sm font-bold">
              {saveStatus === "success" && <span className="text-emerald-600 flex items-center gap-1"><Check size={16}/> Profile updated successfully!</span>}
              {saveStatus === "error" && <span className="text-red-600">Failed to save profile.</span>}
            </span>
            <button 
              onClick={handleSave}
              disabled={isLoading}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm disabled:opacity-70 active:scale-95"
            >
              {isLoading && <Loader2 size={16} className="animate-spin" />}
              {isLoading ? "Saving..." : "Save changes"}
            </button>
          </div>

        </main>
      </div>
    </div>
  );
}