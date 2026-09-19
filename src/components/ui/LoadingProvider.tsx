"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import RouteTopProgress from "./RouteTopProgress";

interface LoadingContextValue {
  /** Show the top progress bar (e.g. right before a programmatic router.push()). */
  startLoading: () => void;
  /** Fill the bar to 100% and hide it. Normally called automatically when the route commits. */
  stopLoading: () => void;
  /** True while the progress bar is visible. */
  isLoading: boolean;
}

const LoadingContext = createContext<LoadingContextValue | null>(null);

/** Safety net: never leave the bar crawling forever if the route never commits. */
const NAVIGATION_TIMEOUT = 8000;

export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a <LoadingProvider>.");
  }
  return context;
}

/**
 * Global navigation loading provider.
 *
 * - Listens for clicks on internal <a>/<Link> elements and starts the top
 *   progress bar the moment a navigation begins, so the UI never feels
 *   frozen after a click.
 * - Completes the bar as soon as `usePathname()` reflects the new route.
 * - Exposes `startLoading()` for programmatic `router.push()` callers.
 */
export default function LoadingProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  const [active, setActive] = useState(false);
  const [done, setDone] = useState(false);

  const activeRef = useRef(false);
  const doneRef = useRef(false);
  const pathnameRef = useRef(pathname);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const finish = useCallback(() => {
    if (!activeRef.current || doneRef.current) return;
    doneRef.current = true;
    setDone(true);
  }, []);

  const hide = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    activeRef.current = false;
    setActive(false);
  }, []);

  const startLoading = useCallback(() => {
    activeRef.current = true;
    doneRef.current = false;
    setActive(true);
    setDone(false);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(finish, NAVIGATION_TIMEOUT);
  }, [finish]);

  // Complete the bar whenever the router commits a new pathname.
  useEffect(() => {
    if (pathnameRef.current === pathname) return;
    pathnameRef.current = pathname;
    finish();
  }, [pathname, finish]);

  // Start the bar on any internal-link click. This covers <Link> and plain
  // <a> tags alike. External links, new-tab links, downloads, and same-page
  // hash links are left alone.
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return;
      if (event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as Element | null;
      const anchor = target?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      try {
        const href = new URL(anchor.href, window.location.href);
        const current = new URL(window.location.href);
        if (href.origin !== current.origin) return;
        // Same-page links (e.g. "/#features") scroll instead of loading.
        if (href.pathname === current.pathname) return;
        startLoading();
      } catch {
        // Ignore malformed hrefs.
      }
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [startLoading]);

  return (
    <LoadingContext.Provider value={{ startLoading, stopLoading: finish, isLoading: active }}>
      <RouteTopProgress active={active} done={done} onDone={hide} />
      {children}
    </LoadingContext.Provider>
  );
}