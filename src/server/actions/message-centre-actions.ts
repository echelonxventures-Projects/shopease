"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export type UnifiedMessage = {
  id: string;
  type: "notification" | "support_ticket" | "live_chat";
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  metadata?: Record<string, unknown>;
};

export async function getUnifiedMessages(limit = 50) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  const userId = session.user.id as string;

  const [notifications, tickets, chats] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: limit,
    }),
    prisma.supportTicket.findMany({
      where: { customerId: userId },
      include: { _count: { select: { messages: true } } },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
    prisma.liveChatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: limit,
    }),
  ]);

  const unified: UnifiedMessage[] = [
    ...notifications.map((n) => ({
      id: n.id,
      type: "notification" as const,
      title: n.title,
      message: n.message,
      isRead: n.isRead,
      createdAt: n.createdAt.toISOString(),
      link: n.link || undefined,
      metadata: { type: n.type },
    })),
    ...tickets.map((t) => ({
      id: t.id,
      type: "support_ticket" as const,
      title: t.subject,
      message: t.description?.slice(0, 100) || "No description",
      isRead: ["RESOLVED", "CLOSED"].includes(t.status),
      createdAt: t.updatedAt.toISOString(),
      link: `/account/tickets/${t.id}`,
      metadata: { status: t.status, priority: t.priority, messageCount: t._count.messages },
    })),
    ...chats.map((c) => ({
      id: c.id,
      type: "live_chat" as const,
      title: c.productId ? "Product Inquiry" : "Live Chat",
      message: c.status === "OPEN" ? "Active chat session" : "Chat session closed",
      isRead: c.status === "CLOSED",
      createdAt: c.updatedAt.toISOString(),
      link: c.productId ? `/products/${c.productId}` : "/account/live-chat",
      metadata: { status: c.status, hasAgent: !!c.agentId },
    })),
  ];

  return unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
}

export async function markMessageRead(id: string, type: "notification" | "support_ticket" | "live_chat") {
  const session = await getSession();
  if (!session?.user?.id) return;

  if (type === "notification") {
    await prisma.notification.updateMany({
      where: { id, userId: session.user.id },
      data: { isRead: true },
    });
  }
}

export async function markAllMessagesRead() {
  const session = await getSession();
  if (!session?.user?.id) return;
  await prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
}
