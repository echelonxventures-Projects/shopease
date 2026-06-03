"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Loader2,
  MessageCircle,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Search,
} from "lucide-react";
import { getActiveSessions, getMessages, sendMessage, closeChatSession } from "@/server/actions/chat-actions";

interface ChatSessionItem {
  id: string;
  userId: string;
  userName?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastMessage?: string;
}

interface ChatMessageItem {
  id: string;
  sessionId: string;
  senderId: string;
  isAgent: boolean;
  message: string;
  createdAt: string;
}

export function ChatDashboard() {
  const [sessions, setSessions] = useState<ChatSessionItem[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState("");
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // Load active sessions
  const loadSessions = useCallback(async () => {
    try {
      const data = await getActiveSessions();
      setSessions(data as ChatSessionItem[]);
    } catch {
      // Non-critical
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // Load messages for active session
  const loadMessages = useCallback(async (sessionId: string) => {
    setLoadingMessages(true);
    try {
      const data = await getMessages(sessionId);
      setMessages(data as ChatMessageItem[]);
    } catch {
      // Non-critical
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Poll for new messages on active session
  useEffect(() => {
    if (!activeSessionId) return;
    loadMessages(activeSessionId);
    pollRef.current = setInterval(() => loadMessages(activeSessionId), 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeSessionId, loadMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSelectSession = (sessionId: string) => {
    setActiveSessionId(sessionId);
    setMessages([]);
  };

  const handleSend = async () => {
    if (!activeSessionId || !input.trim() || sending) return;
    setSending(true);
    try {
      const msg = await sendMessage(activeSessionId, input.trim());
      if (msg && !("error" in msg)) {
        setMessages((prev) => [...prev, msg as ChatMessageItem]);
        setInput("");
      }
    } catch {
      // Error handled by server action
    } finally {
      setSending(false);
    }
  };

  const handleClose = async (sessionId: string) => {
    try {
      await closeChatSession(sessionId);
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, status: "CLOSED" } : s,
        ),
      );
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
    } catch {
      // Non-critical
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const filteredSessions = sessions.filter((s) =>
    s.userName?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeSession = sessions.find((s) => s.id === activeSessionId);

  return (
    <div className="bg-white rounded-xl border flex overflow-hidden" style={{ height: "calc(100vh - 12rem)" }}>
      {/* Session List - Left Panel */}
      <div className="w-80 border-r flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-semibold mb-3">Chat Sessions</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search sessions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 border rounded-lg pl-9 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingSessions ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageCircle className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">No active sessions</p>
            </div>
          ) : (
            filteredSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`w-full text-left p-4 border-b hover:bg-gray-50 transition-colors ${
                  activeSessionId === session.id ? "bg-blue-50 border-l-2 border-l-blue-600" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm truncate">
                    {session.userName || "Customer"}
                  </span>
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      session.status === "OPEN"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
                {session.lastMessage && (
                  <p className="text-xs text-gray-500 truncate">
                    {session.lastMessage}
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(session.updatedAt).toLocaleTimeString("en-IN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Message Thread - Right Panel */}
      <div className="flex-1 flex flex-col">
        {!activeSessionId ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="w-12 h-12 mx-auto mb-3" />
              <p className="font-medium">Select a conversation</p>
              <p className="text-sm">Choose a session from the left panel</p>
            </div>
          </div>
        ) : (
          <>
            {/* Session Header */}
            <div className="p-4 border-b flex items-center justify-between shrink-0">
              <div>
                <p className="font-semibold">
                  {activeSession?.userName || "Customer"}
                </p>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Started{" "}
                  {activeSession
                    ? new Date(activeSession.createdAt).toLocaleString("en-IN")
                    : ""}
                </p>
              </div>
              {activeSession?.status === "OPEN" && (
                <button
                  onClick={() => handleClose(activeSessionId)}
                  className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <XCircle className="w-4 h-4" />
                  Close Chat
                </button>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingMessages ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-2 ${
                      msg.isAgent ? "flex-row-reverse" : ""
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                        msg.isAgent ? "bg-blue-100" : "bg-gray-200"
                      }`}
                    >
                      {msg.isAgent ? (
                        <CheckCircle className="w-3.5 h-3.5 text-blue-600" />
                      ) : (
                        <User className="w-3.5 h-3.5 text-gray-600" />
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-3 py-2 max-w-[70%] ${
                        msg.isAgent
                          ? "bg-blue-600 text-white rounded-tr-none"
                          : "bg-gray-100 rounded-tl-none"
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.message}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          msg.isAgent ? "text-blue-200" : "text-gray-400"
                        }`}
                      >
                        {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            {activeSession?.status === "OPEN" && (
              <div className="border-t p-3 flex items-center gap-2 shrink-0">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your reply..."
                  className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  disabled={sending}
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || sending}
                  className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
