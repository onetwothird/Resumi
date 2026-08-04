import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { 
  ArrowRight, 
  Sparkles, 
  FileText, 
  CheckCircle, 
  Wand2, 
  Layout, 
  Download,
  Star
} from "lucide-react";

export default async function LandingPage() {
  const { userId } = await auth();
  
  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden relative">
      
      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] opacity-20 dark:opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 border-b border-gray-200/50 dark:border-gray-800/50 backdrop-blur-xl bg-white/70 dark:bg-gray-950/70 sticky top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900 dark:text-white group cursor-pointer">
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md shadow-indigo-200 dark:shadow-none">
              <FileText className="text-white w-5 h-5" />
            </div>
            Resumi
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/sign-in" 
              className="text-sm font-medium text-gray-600 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400 transition-colors"
            >
              Sign In
            </Link>
            <Link 
              href="/sign-up" 
              className="text-sm font-medium bg-gray-900 text-white dark:bg-white dark:text-gray-900 px-5 py-2.5 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 hover:scale-105 transition-all shadow-sm"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 text-center">
        
        {/* Rating Badge */}
        <div className="flex justify-center mb-6">
          <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm text-sm font-medium text-gray-600 dark:text-gray-300 hover:-translate-y-0.5 transition-transform cursor-default">
            <div className="flex gap-0.5 text-amber-400">
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
              <Star className="w-4 h-4 fill-current" />
            </div>
            <span className="ml-1">Trusted by 10,000+ Job Seekers</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-sm font-semibold mb-8 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
          <Sparkles className="w-4 h-4 animate-pulse" />
          Powered by Google Gemini AI
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
          Win the job with an <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            AI-powered
          </span> resume.
        </h1>
        
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Bypass ATS filters and impress recruiters. Resumi analyzes job descriptions, rewrites your bullet points, and generates beautiful PDFs in seconds.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/sign-up" 
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 w-full sm:w-auto justify-center group"
          >
            Build My Resume 
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a 
            href="#how-it-works"
            className="flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:scale-105 transition-all w-full sm:w-auto justify-center"
          >
            See How It Works
          </a>
        </div>

        {/* Interactive Feature Cards */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 text-left max-w-6xl mx-auto">
          {[
            {
              icon: CheckCircle,
              title: "ATS Optimization",
              desc: "Match your resume to the exact job description keywords seamlessly.",
              color: "text-blue-500",
              bg: "bg-blue-50 dark:bg-blue-500/10"
            },
            {
              icon: Wand2,
              title: "AI Rewriting",
              desc: "Transform weak summaries into powerful, action-driven statements.",
              color: "text-purple-500",
              bg: "bg-purple-50 dark:bg-purple-500/10"
            },
            {
              icon: Download,
              title: "1-Click PDF Export",
              desc: "Download pixel-perfect, printer-friendly PDFs instantly from your browser.",
              color: "text-indigo-500",
              bg: "bg-indigo-50 dark:bg-indigo-500/10"
            }
          ].map((feature, i) => (
            <div 
              key={i} 
              className="group p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-none hover:-translate-y-2 transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className={`w-6 h-6 ${feature.color}`} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-16">
            From blank page to hired in <span className="text-indigo-600 dark:text-indigo-400">3 steps</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center text-2xl font-black text-gray-400 dark:text-gray-500 mb-6 border-2 border-gray-200 dark:border-gray-700">1</div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Input Your Data</h4>
              <p className="text-gray-600 dark:text-gray-400">Add your experience, education, and skills. Don&apos;t worry about formatting yet.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-full flex items-center justify-center text-2xl font-black text-indigo-600 dark:text-indigo-400 mb-6 border-2 border-indigo-200 dark:border-indigo-800">2</div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Apply AI Magic</h4>
              <p className="text-gray-600 dark:text-gray-400">Let Gemini AI rewrite your bullets to sound professional and hit ATS keywords.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center text-2xl font-black text-green-600 dark:text-green-400 mb-6 border-2 border-green-200 dark:border-green-800">3</div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Export & Apply</h4>
              <p className="text-gray-600 dark:text-gray-400">Download a perfectly formatted PDF that&apos;s ready to send to recruiters.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-50 dark:bg-gray-950 py-12 border-t border-gray-200 dark:border-gray-900 text-center">
        <p className="text-gray-500 dark:text-gray-500 font-medium flex items-center justify-center gap-2">
          <FileText className="w-4 h-4" /> Resumi © {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}