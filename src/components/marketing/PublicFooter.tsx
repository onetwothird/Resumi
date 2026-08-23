import Link from "next/link";
import ResumiLogo from "@/components/logo/ResumiLogo";

export default function PublicFooter() {
  return (
    <footer className="relative z-10 bg-white dark:bg-slate-950 py-12 border-t border-slate-200 dark:border-slate-800 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
          <ResumiLogo className="w-6 h-6" />
          Resumi © {new Date().getFullYear()}
        </div>

        <div className="flex items-center gap-6 text-sm text-slate-500 dark:text-slate-400 font-medium">
          <Link href="/#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Features</Link>
          <Link href="/#pricing" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Pricing</Link>
          <Link href="/companies" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">Companies</Link>
          <Link href="/for-employers" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">For Employers</Link>
        </div>
      </div>
    </footer>
  );
}