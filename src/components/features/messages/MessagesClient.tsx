"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle2,
  Inbox,
  Loader2,
  Mail,
  Send,
  X,
} from "lucide-react";
import AppHeader from "@/components/layout/AppHeader";
import { MessageThread } from "@/types/messages";

interface ConversationMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  mine: boolean;
}

interface Conversation {
  otherUserId: string;
  otherName: string;
  otherUsername: string | null;
  otherImageUrl: string | null;
  messages: ConversationMessage[];
}

function formatTime(iso: string) {
  const date = new Date(iso);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function MessagesClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedWith = searchParams.get("with");

  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [threadsLoading, setThreadsLoading] = useState(true);
  const [activeUserId, setActiveUserId] = useState<string | null>(null);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mobilePane, setMobilePane] = useState<"list" | "thread">("list");

  const bottomRef = useRef<HTMLDivElement>(null);
  const activeUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeUserIdRef.current = activeUserId;
  }, [activeUserId]);

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/messages/threads");
      if (!res.ok) throw new Error("Failed to load conversations");
      const data = await res.json();
      setThreads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Couldn't load your conversations. Refresh to try again.");
    } finally {
      setThreadsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchThreads();
    const interval = setInterval(fetchThreads, 25000);
    return () => clearInterval(interval);
  }, [fetchThreads]);

  const openThread = useCallback(
    async (otherUserId: string) => {
      setActiveUserId(otherUserId);
      setMobilePane("thread");
      setConversationLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/messages/${otherUserId}`);
        if (!res.ok) throw new Error("Failed to load conversation");
        const data: Conversation = await res.json();
        setConversation(data);

        // Mark the other party's messages as read locally + on the server.
        setThreads((prev) =>
          prev.map((t) => (t.otherUserId === otherUserId ? { ...t, unreadCount: 0 } : t))
        );
        await fetch(`/api/messages/${otherUserId}`, { method: "PATCH" }).catch(() => null);
      } catch (err) {
        console.error(err);
        setError("Couldn't load this conversation.");
      } finally {
        setConversationLoading(false);
      }
    },
    []
  );

  // Deep-link support: /messages?with=<userId> opens that thread automatically.
  useEffect(() => {
    if (requestedWith && activeUserIdRef.current !== requestedWith) {
      openThread(requestedWith);
    }
  }, [requestedWith, openThread]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [conversation?.messages.length]);

  const sendReply = async () => {
    if (!activeUserId || !reply.trim() || sending) return;
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeUserId, content: reply.trim() }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to send message.");
      }
      setReply("");
      await Promise.all([openThread(activeUserId), fetchThreads()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't send your message.");
    } finally {
      setSending(false);
    }
  };

  const unreadTotal = threads.reduce((sum, t) => sum + t.unreadCount, 0);

  const threadList = (
    <div className="h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">Messages</h1>
          <p className="text-xs text-gray-500 mt-0.5">
            {unreadTotal > 0
              ? `${unreadTotal} unread conversation${unreadTotal === 1 ? "" : "s"}`
              : "Your conversations"}
          </p>
        </div>
        <button
          onClick={() => router.push("/employer/dashboard")}
          className="hidden sm:flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          <ArrowLeft size={14} /> Dashboard
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {threadsLoading ? (
          <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400 py-16">
            <Loader2 size={22} className="animate-spin" />
            <span className="text-sm font-medium">Loading conversations...</span>
          </div>
        ) : threads.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-16">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <Inbox size={24} className="text-gray-300" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 mb-1">No messages yet</h3>
            <p className="text-xs text-gray-500 max-w-48 leading-relaxed">
              When an employer or candidate messages you, the conversation will appear here.
            </p>
          </div>
        ) : (
          threads.map((t) => {
            const isActive = activeUserId === t.otherUserId;
            return (
              <button
                key={t.otherUserId}
                onClick={() => openThread(t.otherUserId)}
                className={`w-full flex items-start gap-3 px-4 py-3.5 text-left border-b border-gray-50 transition-colors ${
                  isActive ? "bg-indigo-50/60" : "hover:bg-gray-50"
                }`}
              >
                {t.otherImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={t.otherImageUrl}
                    alt=""
                    className="w-10 h-10 rounded-full object-cover shrink-0 border border-gray-100"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center shrink-0 text-sm">
                    {t.otherName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${t.unreadCount > 0 ? "font-extrabold text-gray-900" : "font-semibold text-gray-700"}`}>
                      {t.otherName}
                    </span>
                    <span className="text-[10px] text-gray-400 shrink-0 font-medium">{formatTime(t.lastAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <p className={`text-xs truncate ${t.unreadCount > 0 ? "text-gray-700 font-semibold" : "text-gray-500"}`}>
                      {t.lastMessage}
                    </p>
                    {t.unreadCount > 0 && (
                      <span className="w-4.5 h-4.5 shrink-0 rounded-full bg-indigo-600 text-white text-[9px] font-extrabold flex items-center justify-center">
                        {t.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  const conversationPane = (
    <div className="h-full flex flex-col bg-white">
      {conversationLoading ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-gray-400">
          <Loader2 size={22} className="animate-spin" />
          <span className="text-sm font-medium">Loading conversation...</span>
        </div>
      ) : !activeUserId ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
          <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
            <Mail size={26} className="text-gray-300" />
          </div>
          <h3 className="text-base font-bold text-gray-900 mb-1">Select a conversation</h3>
          <p className="text-sm text-gray-500 max-w-60 leading-relaxed">
            Choose a thread from your inbox on the left to start chatting.
          </p>
        </div>
      ) : (
        <>
          <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
            <button
              onClick={() => setMobilePane("list")}
              className="md:hidden p-1.5 -ml-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Back to conversations"
            >
              <ArrowLeft size={18} />
            </button>
            {conversation?.otherImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={conversation.otherImageUrl}
                alt=""
                className="w-9 h-9 rounded-full object-cover border border-gray-100"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-sm shrink-0">
                {(conversation?.otherName || "U").charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-sm font-extrabold text-gray-900 truncate">{conversation?.otherName}</h2>
              <p className="text-[11px] text-gray-400 truncate">
                {conversation?.otherUsername ? `@${conversation.otherUsername}` : "Conversation"}
              </p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-3 bg-gray-50/40">
            {conversation?.messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <div className="w-12 h-12 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-3">
                  <Send size={18} className="text-gray-300" />
                </div>
                <p className="text-sm text-gray-500 max-w-56 leading-relaxed">
                  Say hello! This is the start of your conversation with {conversation.otherName}.
                </p>
              </div>
            ) : (
              conversation?.messages.map((m) => (
                <div key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[78%] rounded-2xl px-4 py-2.5 shadow-xs ${
                      m.mine
                        ? "bg-indigo-600 text-white rounded-br-md"
                        : "bg-white border border-gray-100 text-gray-800 rounded-bl-md"
                    }`}
                  >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-break-word">{m.content}</p>
                    <div className={`flex items-center gap-1 mt-1 text-[10px] ${m.mine ? "text-indigo-200" : "text-gray-400"}`}>
                      {formatTime(m.createdAt)}
                      {m.mine && <CheckCircle2 size={11} />}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={bottomRef} />
          </div>

          <div className="border-t border-gray-100 p-4 bg-white">
            {error && (
              <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg text-xs font-semibold text-red-600 flex items-center justify-between gap-2">
                <span>{error}</span>
                <button onClick={() => setError(null)} className="shrink-0 text-red-400 hover:text-red-600">
                  <X size={14} />
                </button>
              </div>
            )}
            <div className="flex items-end gap-2.5">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendReply();
                  }
                }}
                placeholder={`Message ${conversation?.otherName || "them"}...`}
                rows={2}
                className="flex-1 text-sm p-3.5 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none shadow-xs transition-all max-h-36"
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-3.5 rounded-xl font-bold text-sm transition-all active:scale-95 shadow-sm"
              >
                {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                <span className="hidden sm:inline">Send</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex flex-col">
      <AppHeader />
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-[calc(100vh-8.5rem)] min-h-120 flex">
          <div className={`${mobilePane === "list" ? "flex" : "hidden"} md:flex w-full md:w-90 shrink-0 border-r border-gray-100 flex-col bg-white`}>
            {threadList}
          </div>
          <div className={`${mobilePane === "thread" ? "flex" : "hidden"} md:flex flex-1 flex-col min-w-0`}>
            {conversationPane}
          </div>
        </div>

        <p className="mt-4 text-center text-[11px] text-gray-400">
          Conversations update automatically. Unsure who to reach?{" "}
          <Link href="/jobs" className="text-indigo-500 font-semibold hover:text-indigo-700">
            Browse jobs
          </Link>{" "}
          or head back to the{" "}
          <Link href="/dashboard" className="text-indigo-500 font-semibold hover:text-indigo-700">
            dashboard
          </Link>
          .
        </p>
      </main>
    </div>
  );
}