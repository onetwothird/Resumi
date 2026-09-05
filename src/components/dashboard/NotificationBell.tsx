// C:\resumi\src\components\dashboard\NotificationBell.tsx

"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";

interface Notification {
  id: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      const res = await fetch("/api/notifications");
      if (res.ok) setNotifications(await res.json());
    };

     
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
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setIsOpen(false);
    if (link) router.push(link);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors bg-white"
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <span className="font-bold text-sm text-gray-900">Notifications</span>
          </div>
          <div className="max-h-87.5 overflow-y-auto">
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
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}