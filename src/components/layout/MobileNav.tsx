"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, type LucideIcon } from "lucide-react";

export interface MobileNavItem {
  label: string;
  /** Renders as a router link. Mutually exclusive with onClick. */
  href?: string;
  /** Renders as a button. Use for in-page tab switches. */
  onClick?: () => void;
  icon?: LucideIcon;
  /** Filled indigo button pinned below the list (primary actions). */
  primary?: boolean;
  /** Currently active destination. */
  active?: boolean;
}

interface MobileNavProps {
  items: MobileNavItem[];
  /** Aria label for the collapsed trigger. */
  label?: string;
}

/**
 * Hamburger menu for small screens.
 *
 * Every authenticated header in this app hides its nav behind
 * `hidden md:flex` with no mobile fallback, which left phones with no
 * navigation, no notification bell and no inbox at all. Rather than patch
 * that in a dozen places, each header keeps its desktop markup untouched and
 * renders this alongside it.
 *
 * Render it as the last child of the header's right-hand action cluster. The
 * panel is positioned against the header (which is `sticky`, and therefore a
 * containing block for absolutely positioned descendants), so it needs no
 * portal and cannot be clipped by a stacking context.
 */
export default function MobileNav({ items, label = "Open menu" }: MobileNavProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A tap that navigates should not leave the panel covering the new page.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: close menu on navigation
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const primary = items.filter((i) => i.primary);
  const rest = items.filter((i) => !i.primary);

  const renderItem = (item: MobileNavItem) => {
    const Icon = item.icon;
    const inner = (
      <>
        {Icon ? <Icon size={18} className="shrink-0" aria-hidden /> : null}
        <span className="truncate">{item.label}</span>
      </>
    );

    const className = `flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-colors ${
      item.active
        ? "bg-indigo-50 text-indigo-700"
        : "text-gray-700 hover:bg-gray-100 active:bg-gray-100"
    }`;

    if (item.href) {
      return (
        <Link
          key={item.label}
          href={item.href}
          onClick={() => setOpen(false)}
          className={className}
        >
          {inner}
        </Link>
      );
    }

    return (
      <button
        key={item.label}
        type="button"
        onClick={() => {
          item.onClick?.();
          setOpen(false);
        }}
        className={className}
      >
        {inner}
      </button>
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : label}
        className="md:hidden shrink-0 -mr-1 rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        {open ? <X size={22} /> : <Menu size={22} />}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-30 cursor-default bg-black/40 md:hidden"
          />
          <div className="absolute inset-x-0 top-full z-40 max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-b border-gray-200 bg-white p-3 shadow-lg md:hidden">
            <div className="flex flex-col gap-1">{rest.map(renderItem)}</div>
            {primary.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 border-t border-gray-100 pt-3">
                {primary.map((item) => {
                  const Icon = item.icon;
                  const inner = (
                    <>
                      {Icon ? <Icon size={16} aria-hidden /> : null}
                      <span className="truncate">{item.label}</span>
                    </>
                  );
                  const className =
                    "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors bg-indigo-600 hover:bg-indigo-700";

                  return item.href ? (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={className}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        item.onClick?.();
                        setOpen(false);
                      }}
                      className={className}
                    >
                      {inner}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
