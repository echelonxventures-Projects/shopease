"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getUserSessions() {
  const session = await getSession();
  if (!session?.user) return [];
  const userId = (session.user as { id: string }).id;
  return prisma.auditLog.findMany({
    where: { userId, action: "LOGIN" },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: { id: true, ipAddress: true, userAgent: true, createdAt: true, metadata: true },
  });
}

export async function revokeSession(sessionId: string) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  // Mark session as revoked in audit log
  await prisma.auditLog.update({ where: { id: sessionId }, data: { metadata: { revoked: true } } });
  return { success: true };
}

export async function revokeAllSessions() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const userId = (session.user as { id: string }).id;
  await prisma.auditLog.updateMany({
    where: { userId, action: "LOGIN" },
    data: { metadata: { revoked: true } },
  });
  return { success: true };
}
