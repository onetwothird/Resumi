import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { ArrowLeft, FileText, Mail, Calendar } from "lucide-react";

export default async function JobApplicantsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id: jobId } = await params;

  // Fetch the job and its applications, including the user and resume data
  const job = await prisma.job.findUnique({
    where: { id: jobId, userId },
    include: {
      applications: {
        orderBy: { createdAt: "desc" },
        include: {
          user: true,
          // If you linked the application to a specific resume model, fetch it here
          // resume: true 
        },
      },
    },
  });

  if (!job) redirect("/employer/dashboard");

  // Fetch Clerk user details to get applicant names and emails
  const client = await clerkClient();
  const applicationsWithDetails = await Promise.all(
    job.applications.map(async (app) => {
      const applicantClerk = await client.users.getUser(app.userId).catch(() => null);
      return {
        ...app,
        fullName: applicantClerk?.fullName || "Unknown Candidate",
        email: applicantClerk?.primaryEmailAddress?.emailAddress || "No email",
        imageUrl: applicantClerk?.imageUrl,
      };
    })
  );

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <Link 
            href="/employer/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-4 transition-colors"
          >
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-extrabold text-gray-900">Applicants</h1>
          <p className="text-gray-500 font-medium mt-1">Reviewing candidates for {job.title}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          {applicationsWithDetails.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No applications received yet.
            </div>
          ) : (
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs uppercase font-bold text-gray-500">
                <tr>
                  <th className="px-6 py-4">Candidate</th>
                  <th className="px-6 py-4">Applied On</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {applicationsWithDetails.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 flex items-center gap-4">
                      {app.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={app.imageUrl} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center">
                          {app.fullName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div className="font-bold text-gray-900">{app.fullName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                          <Mail size={12} /> {app.email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-gray-400" />
                        {new Date(app.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider
                        ${app.status === 'pending' ? 'bg-amber-50 text-amber-600' : ''}
                        ${app.status === 'reviewing' ? 'bg-blue-50 text-blue-600' : ''}
                        ${app.status === 'interviewing' ? 'bg-purple-50 text-purple-600' : ''}
                        ${app.status === 'rejected' ? 'bg-red-50 text-red-600' : ''}
                        ${app.status === 'hired' ? 'bg-emerald-50 text-emerald-600' : ''}
                      `}>
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link 
                        href={`/employer/jobs/${job.id}/applicants/${app.id}`}
                        className="inline-flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 font-semibold"
                      >
                        <FileText size={16} /> View Profile
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}