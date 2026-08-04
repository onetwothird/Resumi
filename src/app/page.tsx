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
  Star,
  Eye,
  Target,
  Quote,
  Check,
  Plus,
} from "lucide-react";

const STATS = [
  { value: "50K+", label: "Resumes built" },
  { value: "3.2x", label: "More interview callbacks" },
  { value: "98%", label: "ATS pass rate" },
  { value: "4.9/5", label: "Average rating" },
];

const FEATURES = [
  {
    icon: CheckCircle,
    title: "ATS Optimization",
    desc: "Match your resume to the exact keywords recruiters' scanners are looking for.",
    color: "text-blue-500",
    bg: "bg-blue-50 dark:bg-blue-500/10",
  },
  {
    icon: Wand2,
    title: "AI Rewriting",
    desc: "Turn flat, duty-based lines into specific, achievement-driven statements.",
    color: "text-purple-500",
    bg: "bg-purple-50 dark:bg-purple-500/10",
  },
  {
    icon: Target,
    title: "Job-Tailored Keywords",
    desc: "Paste in a job listing and Resumi flags the skills your resume is missing.",
    color: "text-amber-500",
    bg: "bg-amber-50 dark:bg-amber-500/10",
  },
  {
    icon: Layout,
    title: "Professional Templates",
    desc: "Designs built to read cleanly through an ATS parser and a hiring manager.",
    color: "text-rose-500",
    bg: "bg-rose-50 dark:bg-rose-500/10",
  },
  {
    icon: Eye,
    title: "Real-Time Preview",
    desc: "Every edit renders instantly, exactly as it will look on the printed page.",
    color: "text-teal-500",
    bg: "bg-teal-50 dark:bg-teal-500/10",
  },
  {
    icon: Download,
    title: "1-Click PDF Export",
    desc: "Download a pixel-perfect, printer-friendly PDF straight from your browser.",
    color: "text-indigo-500",
    bg: "bg-indigo-50 dark:bg-indigo-500/10",
  },
];

const TRANSFORMATIONS = [
  {
    tag: "Marketing",
    before: "Responsible for managing social media accounts",
    after:
      "Grew social engagement 42% across four platforms with a data-driven content calendar",
  },
  {
    tag: "Engineering",
    before: "Worked with team to fix bugs in software",
    after:
      "Resolved 120+ pre-launch bugs and cut QA turnaround time 35% with a new triage workflow",
  },
  {
    tag: "Customer Support",
    before: "Helped customers with their questions and issues",
    after:
      "Resolved 95% of support tickets within 24 hours across a 200+ ticket weekly queue",
  },
];

const STEPS = [
  {
    number: "1",
    title: "Input Your Data",
    desc: "Add your experience, education, and skills. Don't worry about formatting yet.",
    accent: "bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700",
  },
  {
    number: "2",
    title: "Apply AI Magic",
    desc: "Let Gemini AI rewrite your bullets to sound professional and hit ATS keywords.",
    accent: "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800",
  },
  {
    number: "3",
    title: "Export & Apply",
    desc: "Download a perfectly formatted PDF that's ready to send to recruiters.",
    accent: "bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 border-green-200 dark:border-green-800",
  },
];

const TESTIMONIALS = [
  {
    quote:
      "Resumi rewrote three bullet points and I started getting callbacks the same week.",
    name: "Maria S.",
    role: "Product Marketing Manager",
  },
  {
    quote:
      "I didn't realize how flat my old resume read until I saw the before and after side by side.",
    name: "James K.",
    role: "Software Engineer",
  },
  {
    quote:
      "The keyword matching alone is worth it. I finally understood why I wasn't hearing back.",
    name: "Priya R.",
    role: "Recent Graduate",
  },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    features: [
      "3 resume exports per month",
      "1 professional template",
      "Basic AI suggestions",
    ],
    highlight: false,
  },
  {
    name: "Pro",
    price: "$12",
    period: "/ month",
    features: [
      "Unlimited exports",
      "All templates",
      "Advanced AI rewriting & keyword tailoring",
      "ATS score checker",
      "Priority support",
    ],
    highlight: true,
  },
];

const FAQS = [
  {
    q: "Is Resumi free to use?",
    a: "Yes. The free plan includes three exports a month and basic AI suggestions, no credit card required.",
  },
  {
    q: "Will my resume actually pass ATS scanners?",
    a: "Resumi checks your resume against the same parsing rules most applicant tracking systems use, and flags formatting or keyword gaps before you apply.",
  },
  {
    q: "Can I edit what the AI writes?",
    a: "Every suggestion is fully editable. Accept it, tweak it, or write your own — Resumi never exports a resume without your review.",
  },
  {
    q: "Is my personal data secure?",
    a: "Your data is encrypted in transit and at rest, and it's never sold or used to train models without your permission.",
  },
  {
    q: "Can I export to Word, or only PDF?",
    a: "Pro plans support both PDF and Word (.docx) export, so you can format for job boards that require an editable file.",
  },
];

export default async function LandingPage() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden relative">

      {/* Background Decorative Blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-250 h-125 opacity-20 dark:opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Top Navigation */}
      <nav className="relative z-10 border-b border-gray-200/50 dark:border-gray-800/50 backdrop-blur-xl bg-white/70 dark:bg-gray-950/70 top-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-gray-900 dark:text-white group cursor-pointer shrink-0">
            <div className="w-8 h-8 bg-indigo-600 rounded-md flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-md shadow-indigo-200 dark:shadow-none">
              <FileText className="text-white w-5 h-5" />
            </div>
            Resumi
          </div>

          <div className="hidden lg:flex flex-1 items-center justify-center gap-8 text-sm font-medium text-gray-600 dark:text-gray-300">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
            <a href="#examples" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Examples</a>
            <a href="#how-it-works" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4 shrink-0">
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
      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-20 text-center">

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
            <span className="ml-1">Trusted by 50,000+ Job Seekers</span>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 text-sm font-semibold mb-8 border border-indigo-100 dark:border-indigo-900/50 shadow-sm">
          <Sparkles className="w-4 h-4 animate-pulse" />
          Powered by Google Gemini AI
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-6 max-w-4xl mx-auto leading-[1.1]">
          Win the job with an <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-linear-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
            AI-powered
          </span> resume.
        </h1>

        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
          Bypass ATS filters and impress recruiters. Resumi analyzes job descriptions, rewrites your bullet points, and generates beautiful PDFs in seconds.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
          <Link
            href="/sign-up"
            className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 hover:scale-105 transition-all shadow-xl shadow-indigo-200 dark:shadow-indigo-900/40 w-full sm:w-auto justify-center group"
          >
            Build My Resume
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#examples"
            className="flex items-center gap-2 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 px-8 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800 hover:scale-105 transition-all w-full sm:w-auto justify-center"
          >
            See a Real Example
          </a>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-3xl mx-auto border-t border-gray-200 dark:border-gray-800 pt-10">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="relative z-10 py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything your resume needs, nothing it doesn&apos;t
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Six tools that work together so you spend your time applying, not formatting.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => (
              <div
                key={feature.title}
                className="group p-8 rounded-3xl bg-gray-50 dark:bg-gray-950 border border-gray-100 dark:border-gray-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 dark:hover:shadow-none hover:-translate-y-2 transition-all duration-300"
              >
                <div className={`w-12 h-12 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-6 h-6 ${feature.color}`} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before / After Examples */}
      <section id="examples" className="relative z-10 py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Watch a bullet point become an interview
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
              Real rewrites from real resumes. Same experience, told with numbers and outcomes.
            </p>
          </div>

          <div className="space-y-6">
            {TRANSFORMATIONS.map((item) => (
              <div
                key={item.tag}
                className="rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm p-6 md:p-8"
              >
                <span className="inline-block text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/50 px-3 py-1 rounded-full mb-5">
                  {item.tag}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 md:gap-6 items-center">
                  <p className="text-gray-500 dark:text-gray-500 line-through decoration-2 decoration-gray-300 dark:decoration-gray-700 leading-relaxed">
                    {item.before}
                  </p>
                  <ArrowRight className="w-5 h-5 text-indigo-400 rotate-90 md:rotate-0 mx-auto shrink-0" />
                  <p className="text-gray-900 dark:text-white font-medium leading-relaxed">
                    {item.after}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative z-10 py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-16">
            From blank page to hired in <span className="text-indigo-600 dark:text-indigo-400">3 steps</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            {STEPS.map((step) => (
              <div key={step.number} className="flex flex-col items-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-black mb-6 border-2 ${step.accent}`}>
                  {step.number}
                </div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{step.title}</h4>
                <p className="text-gray-600 dark:text-gray-400">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative z-10 py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              People who rewrote their odds
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div
                key={t.name}
                className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col"
              >
                <Quote className="w-8 h-8 text-indigo-200 dark:text-indigo-900 mb-4" />
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{t.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{t.role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative z-10 py-24 bg-white dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Simple pricing, cancel anytime
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Start free. Upgrade only once you&apos;re applying to jobs every week.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 border ${
                  plan.highlight
                    ? "bg-indigo-600 border-indigo-600 shadow-xl shadow-indigo-200 dark:shadow-indigo-950/50 relative"
                    : "bg-gray-50 dark:bg-gray-950 border-gray-100 dark:border-gray-800"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-3 left-8 bg-white text-indigo-600 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
                    Most Popular
                  </span>
                )}
                <h3 className={`text-lg font-bold mb-1 ${plan.highlight ? "text-white" : "text-gray-900 dark:text-white"}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-6">
                  <span className={`text-4xl font-extrabold ${plan.highlight ? "text-white" : "text-gray-900 dark:text-white"}`}>
                    {plan.price}
                  </span>
                  <span className={plan.highlight ? "text-indigo-200" : "text-gray-500 dark:text-gray-400"}>
                    {plan.period}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${plan.highlight ? "text-indigo-200" : "text-indigo-600 dark:text-indigo-400"}`} />
                      <span className={plan.highlight ? "text-indigo-50" : "text-gray-600 dark:text-gray-400"}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/sign-up"
                  className={`block text-center font-bold py-3 rounded-xl transition-all hover:scale-105 ${
                    plan.highlight
                      ? "bg-white text-indigo-600 hover:bg-indigo-50"
                      : "bg-gray-900 text-white dark:bg-white dark:text-gray-900 hover:bg-gray-800 dark:hover:bg-gray-100"
                  }`}
                >
                  {plan.highlight ? "Start Pro" : "Start Free"}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="relative z-10 py-24 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Questions, answered
            </h2>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl px-6 [&::-webkit-details-marker]:hidden"
              >
                <summary className="flex items-center justify-between gap-4 cursor-pointer list-none py-5 font-semibold text-gray-900 dark:text-white">
                  {faq.q}
                  <Plus className="w-5 h-5 text-indigo-500 group-open:rotate-45 transition-transform duration-300 shrink-0" />
                </summary>
                <p className="text-gray-600 dark:text-gray-400 pb-5 leading-relaxed pr-8">
                  {faq.a}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative z-10 py-20 bg-linear-to-r from-indigo-600 to-purple-600">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Your next interview starts with your next resume.
          </h2>
          <p className="text-indigo-100 mb-8">
            Join 50,000+ job seekers who stopped guessing what recruiters want to see.
          </p>
          <Link
            href="/sign-up"
            className="inline-flex items-center gap-2 bg-white text-indigo-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-indigo-50 hover:scale-105 transition-all shadow-xl group"
          >
            Build My Resume Free
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-gray-50 dark:bg-gray-950 py-12 border-t border-gray-200 dark:border-gray-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-gray-500 dark:text-gray-500 font-medium flex items-center gap-2">
            <FileText className="w-4 h-4" /> Resumi © {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-500">
            <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</a>
            <a href="#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">FAQ</a>
          </div>
        </div>
      </footer>
    </div>
  );
}