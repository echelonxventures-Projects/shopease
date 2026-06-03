"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface ChatMessage {
  id: string;
  sessionId: string;
  senderId: string;
  isAgent: boolean;
  message: string;
  createdAt: string;
}

interface ChatSession {
  id: string;
  userId: string;
  agentId?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface UseChatResult {
  session: ChatSession | null;
  messages: ChatMessage[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  startSession: (productId?: string, orderId?: string) => Promise<void>;
  sendMessage: (message: string) => Promise<void>;
  closeSession: () => Promise<void>;
  refreshMessages: () => Promise<void>;
}

export function useChat(): UseChatResult {
  const [session, setSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const refreshMessages = useCallback(async () => {
    if (!session?.id) return;
    try {
      const res = await fetch(`/api/chat/messages?sessionId=${session.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // Non-critical
    }
  }, [session]);

  // Poll for new messages
  useEffect(() => {
    if (!session || session.status === "CLOSED") return;

    pollRef.current = setInterval(refreshMessages, 3000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [session, refreshMessages]);

  const startSession = useCallback(
    async (productId?: string, orderId?: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/chat/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, orderId }),
        });
        if (!res.ok) throw new Error("Failed to start chat session");
        const data = await res.json();
        setSession(data.session);
        setMessages(data.messages || []);
      } catch (err) {
        setError((err instanceof Error ? err.message : String(err)) || "Failed to start chat");
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const sendMessage = useCallback(
    async (message: string) => {
      if (!session?.id || !message.trim()) return;
      setSending(true);
      try {
        const res = await fetch("/api/chat/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: session.id, message: message.trim() }),
        });
        if (!res.ok) throw new Error("Failed to send message");
        const data = await res.json();
        setMessages((prev) => [...prev, data.message]);
      } catch (err) {
        setError((err instanceof Error ? err.message : String(err)) || "Failed to send message");
      } finally {
        setSending(false);
      }
    },
    [session],
  );

  const closeSession = useCallback(async () => {
    if (!session?.id) return;
    try {
      await fetch("/api/chat/session", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: session.id }),
      });
      setSession((prev) => (prev ? { ...prev, status: "CLOSED" } : null));
    } catch {
      // Non-critical
    }
  }, [session]);

  return {
    session,
    messages,
    loading,
    sending,
    error,
    startSession,
    sendMessage,
    closeSession,
    refreshMessages,
  };
}
