// C:\resumi\src\app\jobs\[id]\page.tsx

import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Briefcase, MapPin, Calendar, ArrowLeft, Wallet } from "lucide-react";
import prisma from "@/lib/prisma";
import ApplyButton from "@/components/jobs/ApplyButton";

export default async function PublicJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // 1. Get the current user viewing the page
  const { userId } = await auth();

  const job = await prisma.job.findFirst({
    where: {
      id: id,
      status: "published", 
    },
  });

  if (!job) {
    redirect("/dashboard"); // Redirect back to job board if job doesn't exist
  }

  // 2. Check if the current user is the employer who posted it
  const isOwner = userId === job.userId;

  // 3. Fetch job seeker's resumes if they are logged in and not the owner
  let userResumes: { id: string; title: string }[] = [];
  if (userId && !isOwner) {
    userResumes = await prisma.resume.findMany({
      where: { userId },
      select: { id: true, title: true },
      orderBy: { updatedAt: "desc" },
    });
  }

  const client = await clerkClient();
  const poster = await client.users.getUser(job.userId).catch(() => null);

  const posterFullName = poster?.fullName || "Employer";
  const posterImage = poster?.imageUrl || job.posterImageUrl;

  const postDate = new Date(job.createdAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  let salaryText = "";
  if (job.salaryMin && job.salaryMax) {
    salaryText = `₱${job.salaryMin.toLocaleString()} – ₱${job.salaryMax.toLocaleString()}`;
  } else if (job.salaryMin) {
    salaryText = `From ₱${job.salaryMin.toLocaleString()}`;
  } else if (job.salaryMax) {
    salaryText = `Up to ₱${job.salaryMax.toLocaleString()}`;
  }

  const skills: string[] = Array.isArray(job.skills)
    ? (job.skills as unknown[]).filter((s): s is string => typeof s === "string")
    : [];

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-4 sm:p-8 lg:p-12 font-sans text-gray-900">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="text-sm font-medium text-gray-500 mb-6 flex items-center gap-2">
            <Link href="/dashboard" className="hover:text-indigo-600 transition-colors">
              Job Board
            </Link>
            <span>/</span>
            <span className="text-gray-900">{job.title}</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-6">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 flex items-center justify-center rounded-2xl shrink-0 shadow-sm border border-indigo-100">
              <Briefcase size={28} />
            </div>
            <div>
              <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase">
                {job.employmentType}
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1 mb-2 tracking-tight">
                {job.title}
              </h1>
              <p className="text-lg text-gray-600 font-medium">{job.company}</p>
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 mt-5 text-sm font-semibold text-gray-700">
                <span className="flex items-center gap-1.5">
                  <MapPin size={16} className="text-gray-500" /> 
                  {job.remote ? "Remote" : job.location || "Location not set"}
                </span>
                {salaryText && (
                  <span className="flex items-center gap-1.5">
                    <Wallet size={16} className="text-gray-500" /> 
                    {salaryText}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={16} className="text-gray-500" /> 
                  Posted {postDate}
                </span>
              </div>
            </div>
          </div>
        </div>

        <hr className="border-gray-200 mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-3 text-gray-900">Overview</h2>
              <p className="text-gray-700 leading-relaxed font-medium">
                {job.company} is hiring a {job.employmentType.toLowerCase()}{" "}
                {job.title}{job.remote ? ", fully remote" : job.location ? ` based in ${job.location}` : ""}.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-lg font-bold mb-4 text-gray-900">Details</h2>
              {job.description && (
                <div className="mb-8">
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {job.description}
                  </div>
                </div>
              )}
              {job.requirements && (
                <div>
                  <h3 className="text-sm font-bold text-gray-900 mb-2">Requirements</h3>
                  <div className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {job.requirements}
                  </div>
                </div>
              )}
              {!job.description && !job.requirements && (
                <p className="text-gray-400 italic">No detailed description provided.</p>
              )}
            </div>

            {skills.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
                <h2 className="text-lg font-bold mb-4 text-gray-900">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-semibold bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-full"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            
            {/* Direct Application Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold mb-5 text-gray-900">Application</h2>
              {isOwner ? (
                <div className="bg-gray-50 text-gray-600 p-4 rounded-xl text-center text-sm font-medium border border-gray-200">
                  You posted this job. You cannot apply to your own posting.
                </div>
              ) : (
                <ApplyButton 
                  jobId={job.id} 
                  resumes={userResumes} 
                  isLoggedIn={!!userId} 
                />
              )}
            </div>

            <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100">
              <h2 className="text-base font-bold mb-5 text-gray-900">Posted by</h2>
              <div className="flex items-center gap-4 mb-6">
                {posterImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={posterImage} alt={posterFullName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">
                    {posterFullName.charAt(0)}
                  </div>
                )}
                <div>
                  <div className="font-bold text-gray-900 text-sm">{posterFullName}</div>
                  <div className="text-xs font-semibold text-gray-500">{postDate}</div>
                </div>
              </div>
            </div>

            <Link 
              href="/dashboard"
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-gray-200/60 hover:bg-gray-300 text-gray-800 font-bold rounded-2xl transition-colors text-sm"
            >
              <ArrowLeft size={16} /> Back to Job Board
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}