"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";

interface LiveChatProps {
  userId?: string;
  productId?: string;
  orderId?: string;
}

export function LiveChat({ userId, productId, orderId }: LiveChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // In a real implementation, this would use WebSocket for real-time messaging
  // For now, it's a placeholder component that can be integrated with a WebSocket server

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !userId) return;

    const newMessage = {
      id: Date.now(),
      senderId: userId,
      isAgent: false,
      message: input,
      createdAt: new Date(),
    };

    setMessages([...messages, newMessage]);
    setInput("");

    // TODO: Send via WebSocket
    console.log("Sending message:", input);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border z-50 flex flex-col" style={{ height: "400px" }}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-xl">
        <div>
          <h3 className="font-semibold">Live Support</h3>
          <p className="text-xs text-blue-200">We typically reply within minutes</p>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-white hover:text-blue-200">
          ✕
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-center text-gray-500 text-sm mt-8">
            Start a conversation with our support team
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.isAgent ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
              msg.isAgent
                ? "bg-gray-100 text-gray-800"
                : "bg-blue-600 text-white"
            }`}>
              {msg.message}
              <p className={`text-xs mt-1 ${msg.isAgent ? "text-gray-500" : "text-blue-200"}`}>
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type a message..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm"
          />
          <Button onClick={sendMessage} disabled={!input.trim()} size="sm">
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
