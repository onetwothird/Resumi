// C:\resumi\src\components\features\dashboard\NotificationBell.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, CheckCheck, Clock, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/ui/LoadingProvider";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
  totalCount: number;
}

function formatRelative(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);
  const router = useRouter();
  const { startLoading } = useLoading();
  const menuRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=10");
      if (!res.ok) return;
      const data: NotificationsResponse = await res.json();
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // Silent: the bell should never break the page.
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAsRead = async (id: string, link: string | null) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
    setIsOpen(false);
    if (link) {
      startLoading();
      router.push(link);
    }
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch {
      // Ignore — next poll will re-sync.
    } finally {
      setMarkingAll(false);
    }
  };

  const handleViewAll = () => {
    setIsOpen(false);
    startLoading();
    router.push("/notifications");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors bg-white"
        aria-label="Notifications"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-red-500 border-2 border-white rounded-full text-[8px] font-extrabold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-85 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <span className="font-bold text-sm text-gray-900">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                disabled={markingAll}
                className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-60"
              >
                <CheckCheck size={12} />
                {markingAll ? "Marking..." : "Mark all read"}
              </button>
            )}
          </div>
          <div className="max-h-95 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">You have no notifications.</div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markAsRead(n.id, n.link)}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${n.isRead ? "opacity-60" : "bg-indigo-50/20"}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className={`text-sm font-bold ${n.isRead ? "text-gray-700" : "text-indigo-900"}`}>{n.title}</span>
                    {!n.isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full mt-1.5 shrink-0"></span>}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed">{n.message}</p>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-1.5" suppressHydrationWarning>
                    <Clock size={9} /> {formatRelative(n.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
          <button
            onClick={handleViewAll}
            className="w-full px-4 py-3 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50/60 hover:text-indigo-800 transition-colors border-t border-gray-100 flex items-center justify-center gap-1"
          >
            View all notifications <ExternalLink size={11} />
          </button>
        </div>
      )}
    </div>
  );
}