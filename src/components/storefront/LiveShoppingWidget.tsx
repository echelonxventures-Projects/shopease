"use client";

import { useState, useEffect } from "react";
import { Play, ShoppingBag, Send, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface LiveProduct {
  id: string;
  name: string;
  price: number;
  image: string;
  livePrice?: number;
}

interface LiveShoppingProps {
  streamId: string;
  title: string;
  hostName: string;
  products: LiveProduct[];
  viewerCount: number;
}

export function LiveShopping({ streamId, title, hostName, products, viewerCount }: LiveShoppingProps) {
  const [messages, setMessages] = useState<{ user: string; text: string; time: string }[]>([]);
  const [input, setInput] = useState("");
  const [_isLive, _setIsLive] = useState(true);

  // Simulated live chat
  useEffect(() => {
    const names = ["Priya", "Rahul", "Anjali", "Vikram", "Sneha", "Amit", "Kavita"];
    const msgs = ["Amazing deal!", "What's the material?", "Is this available in blue?", "Just bought it!", "Great quality!", "How fast is delivery?"];
    const interval = setInterval(() => {
      setMessages((prev) => [
        ...prev.slice(-20),
        {
          user: names[Math.floor(Math.random() * names.length)],
          text: msgs[Math.floor(Math.random() * msgs.length)],
          time: new Date().toLocaleTimeString("en-IN"),
        },
      ]);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { user: "You", text: input, time: new Date().toLocaleTimeString("en-IN") }]);
    setInput("");
  };

  return (
    <div className="border rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Video area (placeholder) */}
      <div className="relative bg-gray-900 aspect-video flex items-center justify-center">
        <div className="text-center text-white">
          <div className="flex items-center gap-2 justify-center mb-4">
            <span className="bg-red-600 px-2 py-0.5 rounded text-xs font-bold animate-pulse">LIVE</span>
            <span className="flex items-center gap-1 text-sm">
              <Users className="w-4 h-4" /> {viewerCount} watching
            </span>
          </div>
          <Play className="w-16 h-16 mx-auto opacity-50" />
          <p className="mt-2 text-sm opacity-75">Live stream from {hostName}</p>
        </div>
      </div>

      {/* Header */}
      <div className="p-4 border-b">
        <h3 className="font-bold">{title}</h3>
        <p className="text-sm text-gray-500">Hosted by {hostName}</p>
      </div>

      {/* Products for sale */}
      <div className="p-4 border-b bg-gray-50">
        <h4 className="font-semibold text-sm mb-2 flex items-center gap-1">
          <ShoppingBag className="w-4 h-4" /> Products in this stream
        </h4>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {products.map((p) => (
            <div key={p.id} className="shrink-0 w-32 border rounded-lg p-2 bg-white">
              <div className="aspect-square bg-gray-100 rounded mb-1" />
              <p className="text-xs font-medium truncate">{p.name}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-sm font-bold text-green-700">₹{p.livePrice || p.price}</span>
                {p.livePrice && p.livePrice < p.price && (
                  <span className="text-xs line-through text-gray-400">₹{p.price}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Live chat */}
      <div className="h-48 overflow-y-auto p-4 space-y-2">
        {messages.map((m, i) => (
          <div key={i} className="text-sm">
            <span className="font-medium text-blue-600">{m.user}:</span>{" "}
            <span className="text-gray-700">{m.text}</span>
          </div>
        ))}
      </div>

      {/* Chat input */}
      <div className="flex gap-2 p-3 border-t">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 h-9"
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <Button size="sm" onClick={sendMessage} aria-label="Send chat message">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
