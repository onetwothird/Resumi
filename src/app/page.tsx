import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Sparkles, FileText, CheckCircle } from "lucide-react";

export default async function LandingPage() {
  // If the user is already logged in, skip the landing page and go to the dashboard
  const { userId } = await auth();
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <nav className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900 dark:text-white">
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center">
              <FileText className="text-white w-5 h-5" />
            </div>
            Resumi
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in" 
              className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="text-sm font-medium bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-4 py-2 rounded-md hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 text-sm font-medium mb-8">
          <Sparkles className="w-4 h-4" />
          Powered by Google Gemini AI
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 max-w-4xl mx-auto">
          Win the job with an <span className="text-indigo-600">AI-powered</span> resume.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Bypass ATS filters and impress recruiters. Resumi analyzes job descriptions, rewrites your bullet points, and generates beautiful PDFs in seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/sign-up" 
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 w-full sm:w-auto justify-center"
          >
            Build My Resume <ArrowRight className="w-5 h-5" />
          </Link>
        </div>

        {/* Feature List */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 text-left max-w-5xl mx-auto border-t border-gray-100 dark:border-gray-800 pt-16">
          <div className="flex gap-4">
            <CheckCircle className="w-6 h-6 text-indigo-500 shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">ATS Optimization</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Match your resume to the exact job description keywords seamlessly.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <CheckCircle className="w-6 h-6 text-indigo-500 shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">AI Rewriting</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Transform weak summaries into powerful, action-driven statements.</p>
            </div>
          </div>
          <div className="flex gap-4">
            <CheckCircle className="w-6 h-6 text-indigo-500 shrink-0" />
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">1-Click PDF Export</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Download pixel-perfect, printer-friendly PDFs instantly from your browser.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}