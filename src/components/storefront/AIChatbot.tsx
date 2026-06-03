"use client";

import { useState, useEffect, useRef } from "react";
import { Bot, Send, User, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface AIChatbotProps {
  productId?: string;
}

export function AIChatbot({ productId }: AIChatbotProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg].map((m) => ({ role: m.role, content: m.content })),
          productId,
        }),
      });

      const data = await res.json();

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "I'm sorry, I couldn't process that request.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting. Please try again later.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 left-6 rounded-full w-14 h-14 shadow-lg bg-violet-600 hover:bg-violet-700"
        aria-label="Open AI assistant"
      >
        <Bot className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 left-6 w-80 bg-white border rounded-xl shadow-2xl z-50 flex flex-col" style={{ height: "400px" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-violet-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          <span className="font-medium text-sm">ShopEase AI Assistant</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-violet-700 rounded" aria-label="Minimize AI assistant">
            <Minus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Bot className="w-8 h-8 mx-auto mb-2" />
            <p className="text-sm">Hi! I&apos;m your AI shopping assistant.</p>
            <p className="text-xs mt-1">Ask me about products, orders, or deals!</p>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`flex items-start gap-2 max-w-[85%] ${m.role === "user" ? "flex-row-reverse" : ""}`}>
              {m.role === "assistant" ? (
                <Bot className="w-4 h-4 text-violet-600 mt-1 flex-shrink-0" />
              ) : (
                <User className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
              )}
              <div className={`rounded-lg px-3 py-2 text-sm ${
                m.role === "user" ? "bg-violet-600 text-white" : "bg-gray-100 text-gray-800"
              }`}>
                <p className="whitespace-pre-wrap">{m.content}</p>
                <p className={`text-xs mt-1 ${m.role === "user" ? "text-violet-200" : "text-gray-400"}`}>
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Bot className="w-4 h-4 animate-pulse" />
            <span>Thinking...</span>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask me anything..."
          className="flex-1 h-9"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button size="sm" onClick={sendMessage} disabled={loading} aria-label="Send message">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
