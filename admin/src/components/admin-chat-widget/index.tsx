"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { MessageCircle, X, Send, Loader2, ChevronUp } from "lucide-react";
import { io, Socket } from "socket.io-client";
import { api } from "@/hooks/api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_BASE_URL || "";

/**
 * Floating chat widget for Brokers and Owners to message the admin.
 * Reuses the same ChatMessage backend as the guest ChatWidget.
 * Hidden for ADMIN role (admins use the Messages page instead).
 */
export function AdminChatWidget() {
  const { data: session } = authClient.useSession();
  const user = session?.user as any;
  const role = user?.role;

  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const loadedRef = useRef(false);

  // Only show for BROKER and OWNER — not ADMIN (they use Messages page)
  const isVisible = role === "BROKER" || role === "OWNER";

  // Init socket
  useEffect(() => {
    if (!user?.id || !isVisible) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("admin_session_token") : null;
    const socket = io(SERVER_URL, {
      auth: { userId: user.id, token },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
    });
    socketRef.current = socket;

    socket.on("message:new", (msg: any) => {
      setMessages(prev => {
        if (prev.some(m => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [user?.id, isVisible]);

  const loadMessages = useCallback(async (pageNum = 1, prepend = false) => {
    if (!user?.id) return;
    if (pageNum === 1) setLoading(true);
    try {
      const res = await api.get("/chat/my", { params: { page: pageNum, limit: 50 } });
      const msgs = res.data.data || [];
      setTotalPages(res.data.totalPages || 1);
      if (prepend) {
        setMessages(prev => [...msgs, ...prev]);
      } else {
        setMessages(msgs);
        loadedRef.current = true;
      }
    } catch {}
    setLoading(false);
  }, [user?.id]);

  // Pre-load messages when user is known
  useEffect(() => {
    if (user?.id && isVisible && !loadedRef.current) {
      loadMessages(1);
    }
  }, [user?.id, isVisible, loadMessages]);

  // Refresh on open
  useEffect(() => {
    if (open && user?.id) loadMessages(1);
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleLoadMore = async () => {
    if (page >= totalPages) return;
    setLoadingMore(true);
    const next = page + 1;
    setPage(next);
    await loadMessages(next, true);
    setLoadingMore(false);
  };

  const handleSend = async () => {
    if (!input.trim() || sending || !user?.id) return;
    const text = input.trim();
    setSending(true);
    const optId = `opt-${Date.now()}`;
    const optimistic = { id: optId, message: text, isAdmin: false, createdAt: new Date().toISOString(), user };
    setMessages(prev => [...prev, optimistic]);
    setInput("");

    try {
      const res = await api.post("/chat", { message: text });
      setMessages(prev => prev.map(m => m.id === optId ? res.data.data : m));
      // Notify admin via socket
      socketRef.current?.emit("user:message:notify", { userId: user.id, message: res.data.data });
    } catch {
      setMessages(prev => prev.filter(m => m.id !== optId));
      setInput(text);
    } finally {
      setSending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Chat window */}
      {open && (
        <div className="mb-3 w-80 sm:w-96 bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden"
          style={{ height: "420px" }}>
          {/* Header */}
          <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Message Admin</p>
                <p className="text-white/70 text-xs flex items-center gap-1">
                  <span className={cn("w-1.5 h-1.5 rounded-full inline-block",
                    socketRef.current?.connected ? "bg-green-300" : "bg-white/40")} />
                  {socketRef.current?.connected ? "Connected" : "We'll reply as soon as possible"}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/80 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {page < totalPages && (
              <div className="flex justify-center">
                <button onClick={handleLoadMore} disabled={loadingMore}
                  className="text-xs text-primary flex items-center gap-1 hover:underline">
                  <ChevronUp className="w-3 h-3" />
                  {loadingMore ? "Loading..." : "Load older messages"}
                </button>
              </div>
            )}
            {loading && messages.length === 0 ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>Send a message to contact the admin</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={cn("flex", msg.isAdmin ? "justify-start" : "justify-end")}>
                  <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                    msg.isAdmin
                      ? "bg-muted text-foreground rounded-bl-sm"
                      : "bg-primary text-primary-foreground rounded-br-sm"
                  )}>
                    {msg.isAdmin && <p className="text-xs font-semibold mb-0.5 opacity-70">Admin</p>}
                    <p>{msg.message}</p>
                    <p className={cn("text-xs mt-0.5",
                      msg.isAdmin ? "text-muted-foreground" : "text-primary-foreground/60")}>
                      {format(new Date(msg.createdAt), "h:mm a")}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={endRef} />
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex gap-2 shrink-0">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Type a message to admin..."
              className="flex-1 text-sm bg-muted rounded-xl px-3 py-2 outline-none border border-border focus:border-primary transition-colors"
            />
            <button onClick={handleSend} disabled={sending || !input.trim()}
              className="w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0">
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-14 h-14 rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 transition-all hover:scale-105 flex items-center justify-center"
        aria-label="Message Admin"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </div>
  );
}
