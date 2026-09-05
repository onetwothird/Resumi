"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Send, Loader2, MessageSquare, X } from "lucide-react";

export default function SendMessageClient({ receiverId }: { receiverId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handleSend = async () => {
    if (!content.trim()) return;
    setStatus("sending");
    setErrorMessage("");
    
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId, content }),
      });
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Server failed to process message.");
      }
      
      setStatus("sent");
      setTimeout(() => {
        setIsOpen(false);
        setStatus("idle");
        setContent("");
      }, 2000);
    } catch (err: any) {
      setStatus("error");
      setErrorMessage(err.message || "An unknown error occurred.");
    }
  };

  const modalUI = isOpen ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] transition-all">
      <div className="bg-white rounded-3xl shadow-xl ring-1 ring-black/5 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="text-indigo-500" size={20} /> Message Candidate
          </h3>
          <button 
            onClick={() => setIsOpen(false)}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1.5 rounded-full transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-6">
          {status === "sent" ? (
            <div className="py-8 flex flex-col items-center justify-center text-center">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3">
                <Send size={20} />
              </div>
              <h4 className="text-gray-900 font-bold mb-1">Message Sent!</h4>
              <p className="text-sm text-gray-500">The candidate has been notified.</p>
            </div>
          ) : (
            <>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Type your message here..."
                className="w-full text-sm p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none shadow-xs transition-all mb-1"
                rows={5}
                autoFocus
              />
              
              {status === "error" && (
                <div className="mt-2 p-3 bg-red-50 border border-red-100 rounded-lg">
                  <p className="text-xs font-bold text-red-600 flex flex-col gap-1">
                    <span>Failed to send message. Reason:</span>
                    <span className="font-normal">{errorMessage}</span>
                  </p>
                </div>
              )}
              
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setIsOpen(false)}
                  disabled={status === "sending"}
                  className="px-5 py-2.5 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSend}
                  disabled={status === "sending" || !content.trim()}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white px-5 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-sm"
                >
                  {status === "sending" ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                  Send Message
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="w-full flex items-center justify-center gap-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-4 py-2.5 rounded-xl transition-colors shadow-sm text-sm"
      >
        <MessageSquare size={16} /> Direct Message
      </button>

      {mounted && modalUI ? createPortal(modalUI, document.body) : null}
    </>
  );
}