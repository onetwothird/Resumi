"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { motion } from "framer-motion";
import { CreditCard, LogIn, QrCode, X } from "lucide-react";
import CheckoutButton from "@/components/billing/CheckoutButton";
import {
  PLANS,
  chargeAmount,
  formatPeso,
  monthlyEquivalent,
  type BillingInterval,
  type PaidPlanId,
} from "@/lib/plans";


const QR_SRC = "/icon/qr/qr-scan.jpg";

/**
 * Remembered across mounts on purpose.
 *
 * Without this the dialog re-requests the QR on every single open, and while
 * the asset is still missing that is one guaranteed 404 per click. Module scope
 * is evaluated once per session, so the browser is asked at most once; adding
 * the file later needs a reload, which is what you want anyway.
 */
let qrAssetMissing = false;

interface PlanCheckoutDialogProps {
  plan: PaidPlanId;
  interval: BillingInterval;
  /** Drives whether the transfer can be attributed to an account at all. */
  signedIn: boolean;
  onClose: () => void;
}

const STEPS = [
  "Open your banking or e-wallet app and scan the code.",
  "Send the exact amount shown — a different figure delays activation.",
  "Send us the receipt and your plan is activated, usually within a few hours.",
];

export default function PlanCheckoutDialog({
  plan,
  interval,
  signedIn,
  onClose,
}: PlanCheckoutDialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [qrBroken, setQrBroken] = useState(qrAssetMissing);
  // Portals need document.body, which does not exist during SSR, and waiting for
  // the mount also keeps the dialog out of the server HTML entirely.
  //
  // useSyncExternalStore rather than a setState-in-effect: the linter rejects the
  // effect form, and this reads "am I on the client" as a subscription instead of
  // a state change, so there is no cascading render on mount.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const planName = PLANS[plan].name;
  const amount = chargeAmount(PLANS[plan], interval);
  const perMonth = monthlyEquivalent(PLANS[plan], interval);
  const yearly = interval === "year";

  // Escape closes, and the body behind the overlay stops scrolling. The padding
  // compensation keeps the page from shifting sideways as the scrollbar goes.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKeyDown);

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    // Land focus inside the dialog so the next Tab is not behind the overlay.
    panelRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [onClose]);

  if (!mounted) return null;

  // Portalled to document.body, because template.tsx wraps every page in a
  // framer-motion div that animates filter and y. A transformed or filtered
  // ancestor becomes the containing block for fixed descendants, so an overlay
  // rendered in place is measured against that page div rather than the
  // viewport: it centres on the content box, sits behind the header, and
  // slides around as the page scrolls. document.body is outside that subtree,
  // so inset-0 means the actual visible screen.
  return createPortal(
    <div
      className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/60 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-checkout-title"
      onClick={onClose}
    >
      {/*
        Three regions: a pinned header, a scrollable middle, a pinned footer.
        This is what makes the dialog behave on a short screen.

        The previous version capped the whole panel with overflow-y-auto, so on a
        phone everything scrolled as a single block — the amount, the QR and the
        Pay-with-card button all moved together and the dialog read as a long
        page that happened to have a dark border. Pinning the two ends keeps the
        amount and the call to action on screen no matter how little room there
        is, and leaves only the QR and the numbered steps to give.

        min-h-0 on the middle child is load-bearing. A flex child defaults to
        min-height:auto, which refuses to shrink below its content and would push
        the footer off the bottom instead of letting that region scroll.

        max-h is measured against the panel's own available height, which the
        overlay padding has already reduced, so the dialog can never outgrow the
        screen regardless of viewport.

        svh, not dvh: dvh is the height excluding *currently* hidden browser
        chrome, so it grows as a mobile URL bar retracts. A dialog sized against
        it would reflow mid-scroll and could outgrow the viewport between the tap
        and the render. svh is the smallest height the screen ever takes, which is
        the safe bound to lay out against.
      */}
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative flex max-h-[calc(100svh-1.5rem)] w-full max-w-md flex-col overflow-hidden rounded-3xl bg-white shadow-2xl outline-none sm:max-h-[calc(100svh-3rem)]"
      >
        <div className="shrink-0 px-4 pt-4 sm:px-7 sm:pt-7">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold tracking-wider text-indigo-600 uppercase">
                {planName} plan
              </p>
              <h2
                id="plan-checkout-title"
                className="mt-1 font-serif text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl"
              >
                {yearly ? "Annual" : "Monthly"} payment
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-m-1.5 shrink-0 rounded-full p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pt-4 pb-1 sm:px-7 sm:pt-5 sm:pb-2">

        <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-center">
            <p className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
              Amount to send
            </p>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900 tabular-nums sm:text-4xl">
              {formatPeso(amount)}
            </p>
            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              {yearly ? `${formatPeso(perMonth)}/mo for 12 months` : "for 1 month"}
            </p>
          </div>

          {/*
            The QR is the tallest fixed-cost element here, so it is sized against
            the viewport rather than against the panel width.

            max-h, not a width cap, because the asset is portrait (1220x1714) and
            height is therefore the binding dimension. A width cap alone renders it
            around 330px tall on a phone, which is what overflowed the old panel.
            With h-auto/w-auto plus a max-h the browser scales the replaced element
            down and the width follows the aspect ratio, so the code stays square
            and undistorted at any viewport height.

            The min() pairs a viewport-height budget with an absolute ceiling, so
            it shrinks on a short screen and stops growing on a tall one instead
            of becoming a billboard on a desktop.
          */}
          <div className="mt-4 flex justify-center">
            {qrBroken || qrAssetMissing ? (
              <div className="mx-auto flex aspect-[1220/1714] h-[min(36svh,300px)] w-auto min-w-36 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white p-3 text-slate-400">
                <QrCode size={40} aria-hidden />
                <span className="text-center text-[11px] font-medium">
                  Payment QR is not configured on this deployment yet
                </span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={QR_SRC}
                alt={`QR code to pay ${formatPeso(amount)} for the Resumi ${planName} plan`}
                onError={() => {
                  qrAssetMissing = true;
                  setQrBroken(true);
                }}
                className="mx-auto h-auto max-h-[min(36svh,300px)] w-auto max-w-full rounded-2xl border border-slate-200 bg-white p-1 object-contain"
              />
            )}
          </div>

          {signedIn ? (
            <ol className="mt-4 space-y-1.5 sm:space-y-2">
              {STEPS.map((step, index) => (
                <li
                  key={step}
                  className="flex items-start gap-2 text-xs text-slate-600 sm:gap-2.5 sm:text-sm"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
              <LogIn size={15} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
              <p className="text-xs text-amber-900 sm:text-sm">
                Sign in first — we need an account to attach the plan to once the
                transfer lands.
              </p>
            </div>
          )}
        </div>

        {/*
          Pinned footer. The call to action must never be the thing that scrolls
          out of reach, so it sits below the scroll region and cannot shrink.
        */}
        <div className="shrink-0 px-4 pt-3 pb-4 sm:px-7 sm:pt-4 sm:pb-7">
          {/* Two ways to pay, not a replacement: the QR is manual, and card
              checkout stays one tap for anyone who would rather not wait on a
              transfer to be matched up by hand. */}
          <div className="flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-slate-200" />
            <span className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
              or
            </span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <div className="mt-3 space-y-2 sm:mt-4">
            {signedIn ? (
              <CheckoutButton
                plan={plan}
                interval={interval}
                signedOutHref="/pricing"
                pendingLabel="Opening card checkout…"
                className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:border-indigo-300 hover:text-indigo-700 sm:py-3"
              >
                <span className="inline-flex items-center gap-2">
                  <CreditCard size={15} aria-hidden />
                  Pay with card instead
                </span>
              </CheckoutButton>
            ) : (
              <Link
                href="/sign-up"
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 sm:py-3"
              >
                <LogIn size={15} aria-hidden />
                Sign up to pay
              </Link>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800 sm:py-2.5"
            >
              Not now
            </button>
          </div>

          <p className="mt-2 text-center text-[11px] leading-relaxed text-slate-400 sm:mt-3 sm:text-xs">
            Charged once for the period you buy. It does not renew on its own, and
            you keep every resume you make either way.
          </p>
        </div>
      </motion.div>
    </div>,
    document.body
  );
}