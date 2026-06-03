"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { MessageCircle } from "lucide-react";
import { ChatDashboard } from "@/components/admin/chat/ChatDashboard";

export default function AdminChatPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <MessageCircle className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Live Chat</h1>
          <p className="text-sm text-gray-500">
            Manage customer conversations
          </p>
        </div>
      </div>

      <ChatDashboard />
    </div>
  );
}
