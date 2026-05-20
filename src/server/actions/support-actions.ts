"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { ActivitySeverity } from "@prisma/client";

export async function getSystemActivities({ severity, limit = 50 }: { severity?: string; limit?: number }) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "SUPPORT") throw new Error("Unauthorized");

  const where = severity && severity !== "ALL" ? { severity: severity as ActivitySeverity } : {};

  return prisma.systemActivity.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getAuditLogs({ userId, entityType, limit = 50 }: { userId?: string; entityType?: string; limit?: number }) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "SUPPORT") throw new Error("Unauthorized");

  const where: any = {};
  if (userId) where.userId = userId;
  if (entityType) where.entityType = entityType;

  return prisma.auditLog.findMany({
    where,
    include: { user: { select: { name: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getSystemConfigs() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "SUPPORT") throw new Error("Unauthorized");

  return prisma.systemConfig.findMany({ orderBy: { key: "asc" } });
}

export async function updateSystemConfig(key: string, value: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "SUPPORT") throw new Error("Unauthorized");

  return prisma.systemConfig.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
}

export async function deleteSystemConfig(key: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "SUPPORT") throw new Error("Unauthorized");

  return prisma.systemConfig.delete({ where: { key } });
}

export async function getSystemHealth() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "SUPPORT") throw new Error("Unauthorized");

  try {
    await prisma.$queryRaw`SELECT 1`;
    const dbStatus = "connected";
    const dbStats = await prisma.$queryRaw`SELECT schemaname, relname, n_live_tup FROM pg_stat_user_tables`;

    return {
      status: "healthy",
      database: dbStatus,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      tables: dbStats,
    };
  } catch (error) {
    return { status: "unhealthy", database: "disconnected", error: (error as Error).message };
  }
}
