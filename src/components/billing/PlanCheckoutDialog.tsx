"use client";

import { useEffect, useRef, useState } from "react";
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="plan-checkout-title"
      onClick={onClose}
    >
      <motion.div
        ref={panelRef}
        tabIndex={-1}
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md rounded-3xl bg-white shadow-2xl p-5 sm:p-7 outline-none max-h-[min(96dvh,720px)] overflow-y-auto overscroll-contain"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 -m-1 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={18} />
        </button>

        <div className="pr-8">
          <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
            {planName} plan
          </p>
          <h2
            id="plan-checkout-title"
            className="mt-1 font-serif text-xl font-extrabold tracking-tight text-slate-900"
          >
            {yearly ? "Annual" : "Monthly"} payment
          </h2>
        </div>

        <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Amount to send
          </p>
          <p className="mt-1 text-4xl font-extrabold tracking-tight text-slate-900 tabular-nums">
            {formatPeso(amount)}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {yearly ? `${formatPeso(perMonth)}/mo for 12 months` : "for 1 month"}
          </p>
        </div>

        <div className="mt-4 flex justify-center">
          {qrBroken || qrAssetMissing ? (
            <div
              className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400 w-full max-w-60 aspect-3/4 sm:max-w-70"
            >
              <QrCode size={44} aria-hidden />
              <span className="px-4 text-center text-[11px] font-medium">
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
              className="rounded-2xl border border-slate-200 bg-white p-1 w-full max-w-60 h-auto sm:max-w-70 object-contain"
            />
          )}
        </div>

        {signedIn ? (
          <ol className="mt-4 space-y-1.5 sm:mt-5 sm:space-y-2">
            {STEPS.map((step, index) => (
              <li key={step} className="flex items-start gap-2 text-sm text-slate-600 sm:gap-2.5">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-[11px] font-bold text-indigo-700">
                  {index + 1}
                </span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        ) : (
          <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
            <LogIn size={16} className="mt-0.5 shrink-0 text-amber-600" aria-hidden />
            <p className="text-sm text-amber-900">
              Sign in first — we need an account to attach the plan to once the
              transfer lands.
            </p>
          </div>
        )}

        {/* Two ways to pay, not a replacement: the QR is manual, and card
            checkout stays one tap for anyone who would rather not wait on a
            transfer to be matched up by hand. */}
        <div className="mt-4 flex items-center gap-3 sm:mt-5" aria-hidden>
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            or
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>

        <div className="mt-4 space-y-2 sm:mt-5 sm:space-y-2.5">
          {signedIn ? (
            <CheckoutButton
              plan={plan}
              interval={interval}
              signedOutHref="/pricing"
              pendingLabel="Opening card checkout…"
              className="w-full rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 transition-colors sm:py-3"
            >
              <span className="inline-flex items-center gap-2">
                <CreditCard size={15} aria-hidden />
                Pay with card instead
              </span>
            </CheckoutButton>
          ) : (
            <Link
              href="/sign-up"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors sm:py-3"
            >
              <LogIn size={15} aria-hidden />
              Sign up to pay
            </Link>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl py-2 text-sm font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-colors sm:py-2.5"
          >
            Not now
          </button>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400 leading-relaxed sm:mt-4">
          Charged once for the period you buy. It does not renew on its own, and
          you keep every resume you make either way.
        </p>
      </motion.div>
    </div>
  );
}