"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  Minus,
  User,
  Headphones,
} from "lucide-react";
import { useChat } from "@/hooks/useChat";

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    session,
    messages,
    loading,
    sending,
    error,
    startSession,
    sendMessage,
    closeSession,
  } = useChat();

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleStart = async () => {
    await startSession();
    setHasStarted(true);
  };

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    const msg = input.trim();
    setInput("");
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Floating button
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105"
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-2xl border flex flex-col overflow-hidden"
      style={{ height: "min(520px, calc(100vh - 6rem))" }}
    >
      {/* Header */}
      <div className="bg-blue-600 text-white p-4 flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
          <Headphones className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-sm">Live Support</p>
          <p className="text-xs text-blue-100">
            {session?.status === "OPEN" ? "Agent online" : "We typically reply instantly"}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Minimize"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setIsOpen(false);
              closeSession();
              setHasStarted(false);
            }}
            className="w-8 h-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
            aria-label="Close chat"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!hasStarted && !session ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageCircle className="w-8 h-8 text-blue-500" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">
              How can we help?
            </h3>
            <p className="text-sm text-gray-500 mb-6">
              Start a conversation with our support team
            </p>
            <button
              onClick={handleStart}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin inline" />
              ) : (
                "Start Chat"
              )}
            </button>
          </div>
        ) : (
          <>
            {/* Welcome message */}
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Headphones className="w-3.5 h-3.5 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-2xl rounded-tl-none px-3 py-2 max-w-[80%]">
                <p className="text-sm">
                  Hi! How can we help you today? A support agent will be with you shortly.
                </p>
              </div>
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.isAgent ? "" : "flex-row-reverse"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                    msg.isAgent
                      ? "bg-blue-100"
                      : "bg-gray-200"
                  }`}
                >
                  {msg.isAgent ? (
                    <Headphones className="w-3.5 h-3.5 text-blue-600" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-gray-600" />
                  )}
                </div>
                <div
                  className={`rounded-2xl px-3 py-2 max-w-[80%] ${
                    msg.isAgent
                      ? "bg-gray-100 rounded-tl-none"
                      : "bg-blue-600 text-white rounded-tr-none"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap break-words">
                    {msg.message}
                  </p>
                  <p
                    className={`text-[10px] mt-1 ${
                      msg.isAgent ? "text-gray-400" : "text-blue-200"
                    }`}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {sending && (
              <div className="flex gap-2 flex-row-reverse">
                <div className="bg-blue-600 rounded-2xl px-3 py-2">
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}

        {error && (
          <p className="text-xs text-red-500 text-center py-1">{error}</p>
        )}
      </div>

      {/* Input Area */}
      {hasStarted && session?.status !== "CLOSED" && (
        <div className="border-t p-3 flex items-center gap-2 shrink-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-gray-100 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200 transition-all"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="w-9 h-9 bg-blue-600 text-white rounded-full flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 shrink-0"
            aria-label="Send message"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {session?.status === "CLOSED" && (
        <div className="border-t p-3 text-center shrink-0">
          <p className="text-sm text-gray-500">Chat session closed</p>
          <button
            onClick={() => {
              setHasStarted(false);
              closeSession();
            }}
            className="text-sm text-blue-600 hover:underline mt-1"
          >
            Start new chat
          </button>
        </div>
      )}
    </div>
  );
}
