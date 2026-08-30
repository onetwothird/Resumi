"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, X } from "lucide-react";

export interface ToastItem {
  id: number;
  message: string;
  variant: "success" | "error";
}

interface ToastStackProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}

export function ToastStack({ toasts, onDismiss }: ToastStackProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 flex flex-col gap-2 w-full max-w-xs px-4">
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const timer = setTimeout(() => setVisible(false), 3200);
    const remove = setTimeout(() => onDismiss(toast.id), 3500);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      clearTimeout(remove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id]);

  const isSuccess = toast.variant === "success";

  return (
    <div
      role="status"
      className={`flex items-start gap-2.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-lg rounded-xl px-4 py-3 transition-all duration-300 ease-out ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
      }`}
    >
      {isSuccess ? (
        <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
      ) : (
        <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
      )}
      <p className="text-sm text-gray-700 dark:text-gray-200 flex-1 leading-snug">
        {toast.message}
      </p>
      <button
        onClick={() => onDismiss(toast.id)}
        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shrink-0"
        aria-label="Dismiss notification"
      >
        <X size={14} />
      </button>
    </div>
  );
}