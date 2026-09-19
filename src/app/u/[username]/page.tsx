import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { MapPin, Link as LinkIcon, Briefcase, Globe, Mail } from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";
import SendMessageClient from "@/components/features/employer/SendMessageClient";

// Custom GitHub Icon matching Lucide's style
const GithubIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </svg>
);

interface PageProps {
  params: Promise<{
    username: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const resolvedParams = await params;
  const user = await prisma.user.findFirst({
    where: { OR: [{ username: resolvedParams.username }, { id: resolvedParams.username }] },
  });

  return {
    title: user ? `${user.name || user.username} | Resumi` : "Profile | Resumi",
  };
}

export default async function PublicProfilePage({ params }: PageProps) {
  const resolvedParams = await params;
  const usernameOrId = resolvedParams.username;

  const { userId } = await auth();
  const client = await clerkClient();
  let imageUrl = null;
  
  // 1. Try to fetch user data from local database
  let dbUser = await prisma.user.findFirst({
    where: {
      OR: [{ username: usernameOrId }, { id: usernameOrId }],
    },
  });

  // 2. Fallback: If not in local DB yet, fetch basic info directly from Clerk
  if (!dbUser) {
    try {
      const clerkUser = await client.users.getUser(usernameOrId);
      imageUrl = clerkUser.imageUrl;
      
      dbUser = {
        id: clerkUser.id,
        email: clerkUser.primaryEmailAddress?.emailAddress || "",
        name: clerkUser.fullName || "New User",
        username: clerkUser.username || clerkUser.id.slice(0, 8),
        role: null,
        location: null,
        bio: null,
        website: null,
        social: null,
        github: null,
        settings: null,
        createdAt: new Date(),
      };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (error) {
      notFound();
    }
  } else {
    const clerkUser = await client.users.getUser(dbUser.id).catch(() => null);
    imageUrl = clerkUser?.imageUrl;
  }

  if (!dbUser) {
    notFound();
  }

  const initials = dbUser.name
    ?.split(" ")
    .map((n) => n.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2) || "U";

  return (
    <div className="min-h-screen bg-gray-50 font-sans flex flex-col">
      {/* Header */}
      <header className="h-14 bg-white/80 backdrop-blur-md border-b border-gray-200/60 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
          <ResumiLogo className="w-8 h-8" />
          <span className="hidden sm:inline">Resumi</span>
        </Link>
        <Link 
          href="/dashboard" 
          className="text-sm font-semibold text-gray-500 hover:text-indigo-600 transition-colors"
        >
          Go to Dashboard
        </Link>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 sm:px-6 lg:px-8 pb-16">
        {/* Profile Card */}
        <div className="relative -mt-8">
          {/* Cover Banner */}
          <div className="relative h-48 sm:h-56 rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 shadow-lg shadow-indigo-200/50">
            {/* Decorative pattern overlay */}
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-0 left-0 w-full h-full" style={{
                backgroundImage: `radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%), 
                                  radial-gradient(circle at 80% 20%, rgba(255,255,255,0.2) 0%, transparent 40%),
                                  radial-gradient(circle at 40% 80%, rgba(255,255,255,0.15) 0%, transparent 40%)`
              }} />
            </div>
            {/* Grid pattern */}
            <div className="absolute inset-0 opacity-[0.04]" style={{
              backgroundImage: `linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)`,
              backgroundSize: '40px 40px'
            }} />
          </div>

          {/* Profile Info Card */}
          <div className="relative bg-white rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-100 mx-4 sm:mx-6 -mt-20 p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              {/* Avatar */}
              <div className="shrink-0">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={imageUrl} 
                    alt={dbUser.name || "Profile"} 
                    className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-white" 
                  />
                ) : (
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-4xl border-4 border-white shadow-lg">
                    {initials}
                  </div>
                )}
              </div>

              {/* Name & Details */}
              <div className="flex-1 text-center sm:text-left pb-1">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {dbUser.name || "Anonymous User"}
                </h1>
                <p className="text-sm text-indigo-600 font-semibold mt-0.5">
                  @{dbUser.username || dbUser.id.slice(0, 8)}
                </p>
                
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  {dbUser.role && (
                    <span className="inline-flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-lg text-xs font-semibold border border-indigo-100">
                      <Briefcase size={13} /> {dbUser.role}
                    </span>
                  )}
                  {dbUser.location && (
                    <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-xs font-semibold border border-gray-200">
                      <MapPin size={13} /> {dbUser.location}
                    </span>
                  )}
                  {dbUser.email && (
                    <span className="inline-flex items-center gap-1.5 bg-gray-50 text-gray-600 px-3 py-1 rounded-lg text-xs font-semibold border border-gray-200">
                      <Mail size={13} /> {dbUser.email}
                    </span>
                  )}
                </div>
              </div>

              {/* Message Button */}
              {userId && userId !== dbUser.id && (
                <div className="shrink-0 w-full sm:w-auto">
                  <SendMessageClient receiverId={dbUser.id} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* About */}
          <div className="md:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">About</h2>
            </div>
            {dbUser.bio ? (
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-[15px]">
                {dbUser.bio}
              </p>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                  <Mail size={20} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">This user hasn&apos;t added a bio yet.</p>
              </div>
            )}
          </div>

          {/* Connect */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 h-fit">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-indigo-600 rounded-full" />
              <h2 className="text-lg font-bold text-gray-900">Connect</h2>
            </div>
            
            <div className="space-y-3">
              {dbUser.website && (
                <a 
                  href={dbUser.website.startsWith('http') ? dbUser.website : `https://${dbUser.website}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                    <Globe size={18} className="text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">Website</p>
                    <p className="text-xs text-gray-400 truncate">{dbUser.website}</p>
                  </div>
                </a>
              )}

              {dbUser.github && (
                <a 
                  href={`https://github.com/${dbUser.github.replace('github.com/', '')}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 group-hover:bg-gray-200 transition-colors">
                    <GithubIcon size={18} className="text-gray-700" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">GitHub</p>
                    <p className="text-xs text-gray-400 truncate">{dbUser.github}</p>
                  </div>
                </a>
              )}

              {dbUser.social && (
                <a 
                  href={dbUser.social.startsWith('http') ? dbUser.social : `https://${dbUser.social}`} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                >
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center shrink-0 group-hover:bg-purple-100 transition-colors">
                    <LinkIcon size={18} className="text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">Social</p>
                    <p className="text-xs text-gray-400 truncate">{dbUser.social}</p>
                  </div>
                </a>
              )}

              {!dbUser.website && !dbUser.github && !dbUser.social && (
                <div className="text-center py-6">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center mx-auto mb-3">
                    <LinkIcon size={20} className="text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-400">No links provided yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
