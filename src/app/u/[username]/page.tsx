import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { clerkClient } from "@clerk/nextjs/server";
import { MapPin, Link as LinkIcon, Briefcase, Globe } from "lucide-react";
import ResumiLogo from "@/components/ui/ResumiLogo";

// Custom GitHub Icon matching Lucide's style
const GithubIcon = ({ size = 24, className = "" }) => (
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

  return (
    <div className="min-h-screen bg-[#F4F6F8] font-sans flex flex-col">
      <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-20">
        <Link href="/" className="flex items-center gap-2 font-bold text-indigo-600 text-xl">
          <ResumiLogo className="w-8 h-8" />
          <span className="hidden sm:inline">Resumi</span>
        </Link>
        <Link 
          href="/dashboard" 
          className="text-sm font-bold text-gray-600 hover:text-indigo-600 transition-colors"
        >
          Go to Dashboard
        </Link>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-8 mt-4 sm:mt-8">
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 sm:p-12 mb-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-linear-to-r from-indigo-500 to-purple-600 opacity-10"></div>
          
          <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8 mt-10 sm:mt-12">
            <div className="shrink-0">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={imageUrl} 
                  alt={dbUser.name || "Profile"} 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-md bg-white" 
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-4xl border-4 border-white shadow-md">
                  {dbUser.name?.charAt(0) || dbUser.username?.charAt(0) || "U"}
                </div>
              )}
            </div>

            <div className="flex-1 text-center sm:text-left mt-2">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                {dbUser.name || "Anonymous User"}
              </h1>
              <p className="text-lg text-indigo-600 font-semibold mt-1">
                @{dbUser.username || dbUser.id.slice(0, 8)}
              </p>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mt-4 text-sm font-medium text-gray-500">
                {dbUser.role && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <Briefcase size={16} className="text-gray-400" /> {dbUser.role}
                  </span>
                )}
                {dbUser.location && (
                  <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                    <MapPin size={16} className="text-gray-400" /> {dbUser.location}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
            {dbUser.bio ? (
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                {dbUser.bio}
              </p>
            ) : (
              <p className="text-gray-400 italic">This user hasn&apos;t added a bio yet.</p>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-5">Connect</h2>
            
            <div className="space-y-4">
              {dbUser.website && (
                <a href={dbUser.website.startsWith('http') ? dbUser.website : `https://${dbUser.website}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                  <Globe size={20} className="text-gray-400" />
                  <span className="truncate">Website</span>
                </a>
              )}

              {dbUser.github && (
                <a href={`https://github.com/${dbUser.github.replace('github.com/', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                  <GithubIcon size={20} className="text-gray-400" />
                  <span className="truncate">GitHub</span>
                </a>
              )}

              {dbUser.social && (
                <a href={dbUser.social.startsWith('http') ? dbUser.social : `https://${dbUser.social}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-indigo-600 transition-colors font-medium">
                  <LinkIcon size={20} className="text-gray-400" />
                  <span className="truncate">Social Profile</span>
                </a>
              )}
              {!dbUser.website && !dbUser.github && !dbUser.social && (
                <p className="text-sm text-gray-400 italic">No links provided.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}