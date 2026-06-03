"use client";

import { useState, useEffect, useRef } from "react";
import { MessageSquare, Send, User, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: string;
  isRead: boolean;
}

interface InAppMessagingProps {
  recipientId: string;
  recipientName: string;
}

export function InAppMessaging({ recipientId, recipientName }: InAppMessagingProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Simulated messages (in production, use WebSocket/SSE)
  useEffect(() => {
    if (isOpen) {
      setMessages([
        { id: "1", senderId: recipientId, senderName: recipientName, text: "Hi! How can I help?", timestamp: new Date().toISOString(), isRead: true },
      ]);
    }
  }, [isOpen, recipientId, recipientName]);

  useEffect(() => {
    scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight);
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    setSending(true);
    // In production: call sendMessage server action
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      senderId: "me",
      senderName: "You",
      text: input,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setSending(false);
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-lg bg-blue-600 hover:bg-blue-700"
        aria-label="Open messaging"
      >
        <MessageSquare className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 bg-white border rounded-xl shadow-2xl z-50 flex flex-col" style={{ height: "400px" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-xl">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <span className="font-medium text-sm">{recipientName}</span>
        </div>
        <button onClick={() => setIsOpen(false)} aria-label="Close messaging">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.map((m) => (
          <div key={m.id} className={`flex ${m.senderId === "me" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
              m.senderId === "me" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-800"
            }`}>
              <p>{m.text}</p>
              <p className={`text-xs mt-1 ${m.senderId === "me" ? "text-blue-200" : "text-gray-400"}`}>
                {new Date(m.timestamp).toLocaleTimeString("en-IN")}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="flex gap-2 p-3 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 h-9"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button size="sm" onClick={sendMessage} disabled={sending} aria-label="Send message">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
