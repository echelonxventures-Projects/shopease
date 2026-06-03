"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { logger } from "@/lib/logger";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { runBatchAssignment as engineRunBatch } from "@/lib/delivery/batch-assigner";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ── Get Unassigned Orders ────────────────────────────────────────────────────

async function _getUnassignedOrders(zoneId?: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const where: Record<string, unknown> = {
    deliveryAssignment: null,
    status: { in: ["CONFIRMED", "PROCESSING"] },
  };

  if (zoneId) {
    where.deliverySlot = { zoneId };
  }

  const [orders, count] = await Promise.all([
    prisma.order.findMany({
      where,
      select: {
        id: true,
        orderNumber: true,
        total: true,
        shippingAddress: true,
        createdAt: true,
        status: true,
      },
      orderBy: { createdAt: "asc" },
      take: 100,
    }),
    prisma.order.count({ where }),
  ]);

  return {
    orders: orders.map((o) => ({
      ...o,
      total: Number(o.total),
      shippingAddress: o.shippingAddress as Record<string, string>,
    })),
    total: count,
  };
}

// ── Run Batch Assignment ────────────────────────────────────────────────────

async function _runBatchAssignment(zoneId?: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");

  logger.info({ zoneId, adminUserId: session.user?.id }, "[BatchAssign] Triggered by admin");
  const results = await engineRunBatch(zoneId);

  return {
    results,
    totalAssigned: results.reduce((sum, r) => sum + r.orderIds.length, 0),
    agentsUsed: results.length,
  };
}

// ── Get Batch Assignment History ────────────────────────────────────────────

async function _getBatchAssignmentHistory(limit: number = 50) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const assignments = await prisma.deliveryAssignment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      deliveryAgent: {
        select: { id: true, user: { select: { name: true } }, vehicleType: true },
      },
      order: {
        select: { id: true, orderNumber: true, status: true },
      },
    },
  });

  // Group by agent for summary
  const agentMap: Record<string, {
    agentId: string;
    agentName: string;
    vehicleType: string;
    assignments: Array<{ orderId: string; orderNumber: string; status: string; createdAt: Date }>;
  }> = {};

  for (const a of assignments) {
    if (!agentMap[a.deliveryAgentId]) {
      agentMap[a.deliveryAgentId] = {
        agentId: a.deliveryAgentId,
        agentName: a.deliveryAgent?.user?.name || "Unknown",
        vehicleType: a.deliveryAgent?.vehicleType || "BIKE",
        assignments: [],
      };
    }
    agentMap[a.deliveryAgentId].assignments.push({
      orderId: a.orderId,
      orderNumber: a.order.orderNumber,
      status: a.order.status,
      createdAt: a.createdAt,
    });
  }

  return {
    history: Object.values(agentMap),
    total: assignments.length,
  };
}

// ── Exports ─────────────────────────────────────────────────────────────────

export const getUnassignedOrders = withErrorHandling(_getUnassignedOrders);
export const runBatchAssignment = withErrorHandling(_runBatchAssignment);
export const getBatchAssignmentHistory = withErrorHandling(_getBatchAssignmentHistory);
