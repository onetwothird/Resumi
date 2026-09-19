"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bell,
  BellOff,
  CheckCheck,
  ChevronRight,
  Clock,
  Loader2,
  Trash2,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
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

export default function NotificationsClient() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications?limit=50");
      if (!res.ok) throw new Error("Failed to load notifications");
      const data = await res.json();
      setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
    } catch (err) {
      console.error(err);
      setError("Couldn't load your notifications.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const openNotification = async (n: NotificationItem) => {
    if (!n.isRead) {
      setNotifications((prev) => prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)));
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: n.id }),
      }).catch(() => null);
    }
    if (n.link) router.push(n.link);
  };

  const markAllAsRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      if (!res.ok) throw new Error("Failed to mark as read");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      setError("Couldn't mark notifications as read.");
    } finally {
      setMarkingAll(false);
    }
  };

  const deleteNotification = async (id: string) => {
    setDeletingId(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      const res = await fetch("/api/notifications", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete notification");
    } catch {
      setError("Couldn't delete that notification.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <AppHeader />
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
              <Bell size={20} className="text-indigo-600" />
              Notifications
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}` : "You're all caught up!"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              disabled={markingAll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl transition-colors disabled:opacity-60"
            >
              {markingAll ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
              Mark all as read
            </button>
          )}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-semibold text-red-600 text-center">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Loader2 size={22} className="animate-spin" />
              <span className="text-sm font-medium">Loading notifications...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center px-6">
              <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
                <BellOff size={26} className="text-gray-300" />
              </div>
              <h3 className="text-base font-bold text-gray-900 mb-1">No notifications yet</h3>
              <p className="text-sm text-gray-500 max-w-60 leading-relaxed">
                Updates about your applications, messages, and job postings will show up here.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => openNotification(n)}
                  className={`group relative flex items-start gap-3.5 px-4 sm:px-5 py-4 cursor-pointer transition-colors ${
                    n.isRead ? "hover:bg-gray-50" : "bg-indigo-50/30 hover:bg-indigo-50/50"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                      n.isRead ? "bg-gray-100 text-gray-400" : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    <Bell size={16} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className={`text-sm truncate ${n.isRead ? "font-semibold text-gray-700" : "font-extrabold text-gray-900"}`}>
                        {n.title}
                      </span>
                      <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium shrink-0" suppressHydrationWarning>
                        <Clock size={10} /> {formatRelative(n.createdAt)}
                      </span>
                    </div>
                    <p className={`text-xs leading-relaxed ${n.isRead ? "text-gray-500" : "text-gray-600"}`}>{n.message}</p>
                    {n.link && (
                      <span className="inline-flex items-center gap-0.5 mt-1.5 text-[11px] font-bold text-indigo-600 group-hover:text-indigo-700">
                        Open <ChevronRight size={12} />
                      </span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(n.id);
                    }}
                    disabled={deletingId === n.id}
                    aria-label="Delete notification"
                    className="self-center -mr-1 p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-40"
                  >
                    {deletingId === n.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}