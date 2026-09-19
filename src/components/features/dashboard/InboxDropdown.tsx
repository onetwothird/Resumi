"use client";

import { useState, useEffect, useRef } from "react";
import { Clock, Mail, MessagesSquare } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLoading } from "@/components/ui/LoadingProvider";

interface Message {
  id: string;
  senderName: string;
  content: string;
  isRead: boolean;
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

export default function InboxDropdown() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { startLoading } = useLoading();

  const fetchMessages = async () => {
    try {
      const res = await fetch("/api/messages");
      if (!res.ok) return;
      const data = await res.json();
      setMessages(Array.isArray(data) ? data : []);
    } catch {
      // Silent: the inbox should never break the page.
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
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

  const markAsRead = async (id: string) => {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, isRead: true } : m)));
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
  };

  const handleViewAll = () => {
    setIsOpen(false);
    startLoading();
    router.push("/messages");
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors bg-white"
        aria-label="Messages"
      >
        <Mail size={16} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-blue-500 border-2 border-white rounded-full text-[8px] font-extrabold text-white flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-85 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <span className="font-bold text-sm text-gray-900">Direct Messages</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wide">{unreadCount} new</span>
            )}
          </div>
          <div className="max-h-95 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="p-6 text-center text-sm text-gray-500">Inbox is empty.</div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  onClick={() => markAsRead(m.id)}
                  className={`p-4 border-b border-gray-50 cursor-pointer transition-colors hover:bg-gray-50 ${m.isRead ? "opacity-60" : "bg-blue-50/20"}`}
                >
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <span className={`text-sm font-bold ${m.isRead ? "text-gray-700" : "text-blue-900"}`}>{m.senderName}</span>
                    {!m.isRead && <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wide">New</span>}
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">{m.content}</p>
                  <span className="flex items-center gap-1 text-[10px] text-gray-400 font-medium mt-1.5" suppressHydrationWarning>
                    <Clock size={9} /> {formatRelative(m.createdAt)}
                  </span>
                </div>
              ))
            )}
          </div>
          <button
            onClick={handleViewAll}
            className="w-full px-4 py-3 text-center text-xs font-bold text-indigo-600 hover:bg-indigo-50/60 hover:text-indigo-800 transition-colors border-t border-gray-100 flex items-center justify-center gap-1.5"
          >
            <MessagesSquare size={12} /> Open full inbox
          </button>
        </div>
      )}
    </div>
  );
}