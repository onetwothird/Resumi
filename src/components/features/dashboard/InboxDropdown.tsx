"use client";

import { useState, useEffect, useRef } from "react";
import { Mail } from "lucide-react";

interface Message {
  id: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export default function InboxDropdown() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const res = await fetch("/api/messages");
      if (res.ok) setMessages(await res.json());
    };

     
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
    setMessages(prev => prev.map(m => m.id === id ? { ...m, isRead: true } : m));
    await fetch("/api/messages", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <div className="relative" ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-400 hover:text-gray-600 rounded-full border border-gray-200 transition-colors bg-white"
      >
        <Mail size={16} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-blue-500 border-2 border-white rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
            <span className="font-bold text-sm text-gray-900">Direct Messages</span>
          </div>
          <div className="max-h-87.5 overflow-y-auto">
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
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}