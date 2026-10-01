"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, LayoutDashboard, Menu, X } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";
import ResumiLogo from "@/components/ui/ResumiLogo";

type Role = "employer" | "jobseeker";

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/#features", label: "Features" },
  { href: "/companies", label: "Companies" },
  { href: "/pricing", label: "Pricing" },
  { href: "/for-employers", label: "For Employers" },
];

interface Props {
  active?: string;
}

export default function PublicHeader({ active }: Props) {
  const [open, setOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const role = user?.publicMetadata?.role as Role | undefined;

  // This header renders on pages a signed-in visitor can reach — most
  // importantly /pricing, which used to greet them with "Sign In" and "Get
  // Started" while they already had an account. Swap the actions once Clerk has
  // actually reported the session rather than guessing from a cookie.
  //
  // `isSignedIn` is false until Clerk loads, so the server render and the first
  // client render agree on the signed-out markup and there is no hydration
  // mismatch; the swap happens right after.
  const signedIn = isLoaded && isSignedIn;
  const appHref = role === "employer" ? "/employer/dashboard" : "/dashboard";

  // Escape closes the panel, and so does growing past `lg` — the overlay is
  // `lg:hidden`, so on an iPad rotation from portrait to landscape the nav
  // links reappear while `open` is still true. Without this the body stays
  // scroll-locked with no visible control left to release it.
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const close = () => setOpen(false);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    const query = window.matchMedia("(min-width: 64rem)");
    const onWide = (e: MediaQueryListEvent) => {
      if (e.matches) close();
    };

    window.addEventListener("keydown", onKeyDown);
    query.addEventListener("change", onWide);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      query.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <>
      <nav className="font-sans sticky top-0 z-50 border-b border-foreground/10 bg-background/90 backdrop-blur-lg md:backdrop-blur-xl transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-4 sm:gap-6 lg:gap-8">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-foreground tracking-tight shrink-0"
          >
            <ResumiLogo className="w-7 h-7 shrink-0" />
            <span className="font-serif">Resumi</span>
          </Link>

          {/* `md`, not `lg`: at 768px (iPad portrait) the full nav plus the
              actions fit inside the 720px container, and an iPad should not
              have to open a hamburger for four links. */}
          <div className="hidden md:flex items-center gap-5 lg:gap-7 text-sm font-medium text-foreground/60">
            {NAV_LINKS.map((link) => {
              const isActive = active === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative py-2 transition-colors ${
                    isActive ? "text-foreground" : "hover:text-foreground"
                  }`}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-foreground animate-scale-in" />
                  )}
                </Link>
              );
            })}
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0 ml-auto">
            {signedIn ? (
              <Link
                href={appHref}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity shadow-sm"
              >
                <LayoutDashboard size={15} aria-hidden />
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="hidden lg:inline-block px-2 py-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/sign-up"
                  className="px-4 py-2 rounded-lg text-sm font-semibold bg-foreground text-background hover:opacity-90 transition-opacity shadow-sm"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="public-mobile-menu"
            className="md:hidden ml-auto -mr-2 flex items-center justify-center w-11 h-11 rounded-lg text-foreground/70 hover:text-foreground hover:bg-foreground/5 focus-visible:outline-none transition-colors"
          >
            <span className="relative w-5 h-5" aria-hidden="true">
              <Menu
                className={`absolute inset-0 w-5 h-5 transition-all duration-200 ease-out ${
                  open ? "opacity-0 scale-75" : "opacity-100 scale-100"
                }`}
              />
              <X
                className={`absolute inset-0 w-5 h-5 transition-all duration-200 ease-out ${
                  open ? "opacity-100 scale-100" : "opacity-0 scale-75"
                }`}
              />
            </span>
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="public-mobile-menu"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed inset-0 z-40 md:hidden bg-background flex flex-col pt-20 px-4 sm:px-6 pb-6 pb-safe overflow-y-auto overscroll-contain font-sans"
          >
            <nav className="flex flex-col gap-2 mt-2 stagger-children">
              {NAV_LINKS.map((link) => {
                const isActive = active === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    aria-current={isActive ? "page" : undefined}
                    className={`group flex items-center justify-between py-3 text-2xl font-semibold tracking-tight transition-colors duration-200 ${
                      isActive
                        ? "text-foreground"
                        : "text-foreground/60 hover:text-foreground"
                    }`}
                  >
                    {link.label}
                    <ChevronRight
                      className={`w-5 h-5 transition-all duration-200 ${
                        isActive
                          ? "opacity-100 translate-x-0 text-foreground"
                          : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                      }`}
                    />
                  </Link>
                );
              })}
            </nav>

            <div
              className="mt-auto pt-8 flex flex-col gap-3 animate-fade-in-up"
              style={{ animationDelay: '0.4s' }}
            >
              {signedIn ? (
                <Link
                  href={appHref}
                  onClick={() => setOpen(false)}
                  className="w-full flex items-center justify-center gap-2 text-sm font-semibold bg-foreground text-background py-3.5 rounded-lg hover:opacity-90 transition-opacity duration-200"
                >
                  <LayoutDashboard size={16} aria-hidden />
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    href="/sign-in"
                    onClick={() => setOpen(false)}
                    className="w-full text-center text-sm font-semibold text-foreground py-3.5 rounded-lg border border-foreground/20 hover:bg-foreground/5 transition-colors duration-200"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/sign-up"
                    onClick={() => setOpen(false)}
                    className="w-full text-center text-sm font-semibold bg-foreground text-background py-3.5 rounded-lg hover:opacity-90 transition-opacity duration-200"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}