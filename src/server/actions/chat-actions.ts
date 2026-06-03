"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";

/**
 * Create a new chat session for the current user.
 */
export const createChatSession = withErrorHandling(
  async (productId?: string, orderId?: string) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Close any existing open sessions for this user
    await prisma.liveChatSession.updateMany({
      where: { userId: session.user.id, status: "OPEN" },
      data: { status: "CLOSED" },
    });

    const chatSession = await prisma.liveChatSession.create({
      data: {
        userId: session.user.id,
        status: "OPEN",
        productId: productId || null,
        orderId: orderId || null,
      },
      include: {
        user: { select: { name: true, email: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });

    return {
      session: {
        id: chatSession.id,
        userId: chatSession.userId,
        status: chatSession.status,
        createdAt: chatSession.createdAt.toISOString(),
        updatedAt: chatSession.updatedAt.toISOString(),
        userName: chatSession.user?.name || chatSession.user?.email,
      },
      messages: chatSession.messages.map((m) => ({
        id: m.id,
        sessionId: m.sessionId,
        senderId: m.senderId,
        isAgent: m.isAgent,
        message: m.message,
        createdAt: m.createdAt.toISOString(),
      })),
    };
  },
);

/**
 * Send a message in a chat session.
 */
export const sendMessage = withErrorHandling(
  async (sessionId: string, message: string) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify session exists and user has access (or is agent/admin)
    const chatSession = await prisma.liveChatSession.findUnique({
      where: { id: sessionId },
    });

    if (!chatSession) throw new Error("Chat session not found");
    if (chatSession.status === "CLOSED") throw new Error("Chat session is closed");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    const isAdmin = (session.user as any).role === "ADMIN";
    if (chatSession.userId !== session.user.id && !isAdmin) {
      throw new Error("Unauthorized");
    }

    const isAgent = isAdmin || chatSession.agentId === session.user.id;

    // If agent is sending and not yet assigned, assign them
    if (isAgent && !chatSession.agentId) {
      await prisma.liveChatSession.update({
        where: { id: sessionId },
        data: { agentId: session.user.id },
      });
    }

    const chatMessage = await prisma.liveChatMessage.create({
      data: {
        sessionId,
        senderId: session.user.id,
        isAgent,
        message,
      },
    });

    // Update session timestamp
    await prisma.liveChatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });

    return {
      id: chatMessage.id,
      sessionId: chatMessage.sessionId,
      senderId: chatMessage.senderId,
      isAgent: chatMessage.isAgent,
      message: chatMessage.message,
      createdAt: chatMessage.createdAt.toISOString(),
    };
  },
);

/**
 * Get all messages for a chat session.
 */
export const getMessages = withErrorHandling(async (sessionId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const chatSession = await prisma.liveChatSession.findUnique({
    where: { id: sessionId },
  });

  if (!chatSession) throw new Error("Chat session not found");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
  const isAdmin = (session.user as any).role === "ADMIN";
  if (chatSession.userId !== session.user.id && !isAdmin) {
    throw new Error("Unauthorized");
  }

  const messages = await prisma.liveChatMessage.findMany({
    where: { sessionId },
    orderBy: { createdAt: "asc" },
  });

  return messages.map((m) => ({
    id: m.id,
    sessionId: m.sessionId,
    senderId: m.senderId,
    isAgent: m.isAgent,
    message: m.message,
    createdAt: m.createdAt.toISOString(),
  }));
});

/**
 * Get all active chat sessions (admin only).
 */
export const getActiveSessions = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
  if ((session.user as any).role !== "ADMIN") throw new Error("Unauthorized");

  const sessions = await prisma.liveChatSession.findMany({
    where: { status: { in: ["OPEN", "TRANSFERRED"] } },
    include: {
      user: { select: { name: true, email: true } },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return sessions.map((s) => ({
    id: s.id,
    userId: s.userId,
    userName: s.user?.name || s.user?.email,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
    lastMessage: s.messages[0]?.message,
  }));
});

/**
 * Close a chat session (admin only).
 */
export const closeChatSession = withErrorHandling(async (sessionId: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const chatSession = await prisma.liveChatSession.findUnique({
    where: { id: sessionId },
  });

  if (!chatSession) throw new Error("Chat session not found");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
  const isAdmin = (session.user as any).role === "ADMIN";
  if (chatSession.userId !== session.user.id && !isAdmin) {
    throw new Error("Unauthorized");
  }

  await prisma.liveChatSession.update({
    where: { id: sessionId },
    data: { status: "CLOSED" },
  });

  return { success: true };
});
