"use client";

import { useState, useEffect } from "react";
import { getUnifiedMessages, markMessageRead, markAllMessagesRead } from "@/server/actions/message-centre-actions";
import { Button } from "@/components/ui/button";
import { Bell, Package, MessageSquare, CheckCircle, Loader2 } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

type Tab = "all" | "notification" | "support_ticket" | "live_chat";

export default function MessageCentrePage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("all");

  const fetch = () => {
    getUnifiedMessages(50)
      .then(setMessages)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleMarkRead = async (id: string, type: string) => {
    await markMessageRead(id, type as any);
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, isRead: true } : m));
  };

  const handleMarkAllRead = async () => {
    await markAllMessagesRead();
    setMessages((prev) => prev.map((m) => ({ ...m, isRead: true })));
    toast.success("All marked as read");
  };

  const filtered = tab === "all" ? messages : messages.filter((m) => m.type === tab);
  const hasUnread = messages.some((m) => !m.isRead);

  const typeConfig: Record<string, { icon: any; color: string; label: string }> = {
    notification: { icon: Bell, color: "bg-blue-100 text-blue-600", label: "Notification" },
    support_ticket: { icon: Package, color: "bg-orange-100 text-orange-600", label: "Support Ticket" },
    live_chat: { icon: MessageSquare, color: "bg-green-100 text-green-600", label: "Live Chat" },
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Message Centre</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Message Centre</h1>
        {hasUnread && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead}>
            <CheckCircle className="w-4 h-4 mr-2" /> Mark all read
          </Button>
        )}
      </div>

      {/* Tab filter */}
      <div className="flex gap-2 border-b flex-wrap">
        {([
          { key: "all" as Tab, label: `All (${messages.length})` },
          { key: "notification" as Tab, label: `Notifications (${messages.filter((m) => m.type === "notification").length})` },
          { key: "support_ticket" as Tab, label: `Tickets (${messages.filter((m) => m.type === "support_ticket").length})` },
          { key: "live_chat" as Tab, label: `Chats (${messages.filter((m) => m.type === "live_chat").length})` },
        ]).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              tab === t.key ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No messages</h3>
          <p className="text-sm text-gray-400 mt-2">You&apos;ll see messages here when there are updates.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((msg: any) => {
            const config = typeConfig[msg.type] || typeConfig.notification;
            const Icon = config.icon;

            return (
              <div
                key={msg.id}
                className={`border rounded-lg p-4 flex items-start gap-3 transition-colors ${
                  msg.isRead ? "bg-white" : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${config.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{msg.title}</p>
                    <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">{config.label}</span>
                    {msg.metadata?.status && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        msg.metadata.status === "RESOLVED" ? "bg-green-100 text-green-700" :
                        msg.metadata.status === "OPEN" ? "bg-red-100 text-red-700" :
                        "bg-yellow-100 text-yellow-700"
                      }`}>
                        {msg.metadata.status}
                      </span>
                    )}
                    {msg.metadata?.messageCount !== undefined && (
                      <span className="text-xs text-gray-400">
                        {msg.metadata.messageCount} messages
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{msg.message}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(msg.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div className="shrink-0 flex gap-1">
                  {!msg.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(msg.id, msg.type)}>
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  )}
                  {msg.link && (
                    <Link href={msg.link} className="inline-flex items-center px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded">
                      View →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
