import { auth, clerkClient } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Calendar, FileText, Briefcase, GraduationCap, Award, Phone, MapPin } from "lucide-react";
import prisma from "@/lib/prisma";
import StatusSelector from "@/components/employer/StatusSelector";

type ExperienceItem = {
  role?: string;
  company?: string;
  date?: string;
  description?: string;
};

type EducationItem = {
  school?: string;
  degree?: string;
  date?: string;
};

export default async function ApplicantProfilePage({
  params,
}: {
  params: Promise<{ id: string; applicantId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id: jobId, applicantId } = await params;

  const application = await prisma.application.findUnique({
    where: { id: applicantId },
    include: {
      job: true,
      user: {
        include: {
          resumes: true, 
        }
      }
    },
  });

  if (!application || application.job.userId !== userId) {
    redirect(`/employer/jobs/${jobId}/applicants`);
  }

  const attachedResume = application.resumeId 
    ? application.user.resumes.find(r => r.id === application.resumeId)
    : application.user.resumes[0];

  const client = await clerkClient();
  const applicantClerk = await client.users.getUser(application.userId).catch(() => null);
  
  const fullName = applicantClerk?.fullName || attachedResume?.firstName || "Candidate";
  const email = applicantClerk?.primaryEmailAddress?.emailAddress || attachedResume?.email;
  const phone = attachedResume?.phone;
  const location = attachedResume?.address;

  // --- Safe JSON Parsing ---
  // Ensure skills is always an array of strings
  let parsedSkills: string[] = [];
  if (Array.isArray(attachedResume?.skills)) {
    parsedSkills = attachedResume?.skills as string[];
  } else if (typeof attachedResume?.skills === "string") {
    parsedSkills = (attachedResume?.skills as string).split(",").map(s => s.trim()).filter(Boolean);
  }

  // Ensure experience and education are always arrays
  const experience = Array.isArray(attachedResume?.experience) ? (attachedResume.experience as ExperienceItem[]) : [];
  const education = Array.isArray(attachedResume?.education) ? (attachedResume.education as EducationItem[]) : [];

  return (
    <div className="min-h-screen bg-[#F4F6F8] p-4 sm:p-8 font-sans text-gray-900">
      <div className="max-w-5xl mx-auto">
        
        {/* Navigation */}
        <Link 
          href={`/employer/jobs/${jobId}/applicants`}
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-indigo-600 mb-6 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Applicants
        </Link>

        {/* Main Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Left Column: Profile Card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden sticky top-6">
              <div className="p-8 text-center border-b border-gray-50">
                {applicantClerk?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={applicantClerk.imageUrl} alt="" className="w-24 h-24 rounded-full object-cover shadow-sm mx-auto mb-4 border-4 border-white ring-1 ring-gray-100" />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-600 text-3xl font-extrabold flex items-center justify-center shadow-sm mx-auto mb-4 border-4 border-white ring-1 ring-gray-100">
                    {fullName.charAt(0)}
                  </div>
                )}
                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">{fullName}</h1>
                <p className="text-sm font-medium text-gray-500 mt-1">{attachedResume?.jobTitle || "Applicant"}</p>
                
                <div className="mt-5 inline-block">
                  <StatusSelector applicationId={application.id} initialStatus={application.status} />
                </div>
              </div>

              <div className="p-6 space-y-4 bg-gray-50/30">
                {email && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Email</span>
                    <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm font-semibold text-indigo-600 hover:text-indigo-800 break-all">
                      <Mail size={14} className="shrink-0" /> {email}
                    </a>
                  </div>
                )}
                {phone && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Phone</span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <Phone size={14} className="text-gray-400 shrink-0" /> {phone}
                    </span>
                  </div>
                )}
                {location && (
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Location</span>
                    <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                      <MapPin size={14} className="text-gray-400 shrink-0" /> {location}
                    </span>
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">Applied</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
                    <Calendar size={14} className="text-gray-400 shrink-0" /> {new Date(application.createdAt).toLocaleDateString("en-US", { year: 'numeric', month: 'long', day: 'numeric' })}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Resume Data */}
          <div className="lg:col-span-2 space-y-6">
            {!attachedResume ? (
              <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-12 text-center flex flex-col items-center">
                <FileText className="w-12 h-12 text-gray-300 mb-4" />
                <h3 className="text-lg font-bold text-gray-900 mb-1">No Resume Attached</h3>
                <p className="text-sm text-gray-500 max-w-sm">This candidate applied without attaching a structured resume profile.</p>
              </div>
            ) : (
              <>
                {/* Summary Section */}
                {attachedResume.summary && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-4">
                      <Award className="text-indigo-500" size={18} /> Professional Summary
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{attachedResume.summary}</p>
                  </div>
                )}

                {/* Experience Section */}
                {experience.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-6">
                      <Briefcase className="text-indigo-500" size={18} /> Work Experience
                    </h3>
                    <div className="space-y-8">
                      {experience.map((exp, idx) => (
                        <div key={idx} className="relative pl-6 before:absolute before:left-0 before:top-2 before:bottom-0 before:w-px before:bg-gray-100 last:before:hidden">
                          <div className="absolute -left-1 top-1.5 w-2 h-2 rounded-full bg-indigo-200 ring-4 ring-white" />
                          <h4 className="text-base font-bold text-gray-900 leading-tight">{exp.role}</h4>
                          <div className="flex flex-wrap items-center gap-2 text-sm font-medium mt-1 mb-3">
                            <span className="text-indigo-600">{exp.company}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500">{exp.date}</span>
                          </div>
                          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{exp.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Section */}
                {education.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h3 className="flex items-center gap-2 text-base font-bold text-gray-900 mb-6">
                      <GraduationCap className="text-indigo-500" size={18} /> Education
                    </h3>
                    <div className="space-y-6">
                      {education.map((edu, idx) => (
                        <div key={idx} className="flex gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                            <GraduationCap className="text-gray-400" size={20} />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-gray-900">{edu.school}</h4>
                            <p className="text-sm font-medium text-gray-600 mt-0.5">{edu.degree}</p>
                            <p className="text-xs text-gray-400 mt-1">{edu.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Skills Section */}
                {parsedSkills.length > 0 && (
                  <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8">
                    <h3 className="text-base font-bold text-gray-900 mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {parsedSkills.map((skill: string, idx: number) => (
                        <span key={idx} className="bg-gray-50 border border-gray-100 text-gray-700 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors hover:bg-gray-100">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}