"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { DeliveryAgentStatus } from "@prisma/client";

// ===================== FLEET OVERVIEW =====================

async function _getFleetOverview() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const [totalAgents, onlineAgents, offlineAgents, activeDeliveries] =
    await Promise.all([
      prisma.deliveryAgent.count(),
      prisma.deliveryAgent.count({
        where: { status: { in: ["ONLINE", "AVAILABLE"] } },
      }),
      prisma.deliveryAgent.count({ where: { status: "OFFLINE" } }),
      prisma.deliveryAssignment.count({
        where: {
          status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "NEARBY"] },
        },
      }),
    ]);

  const agents = await prisma.deliveryAgent.findMany({
    include: {
      user: { select: { id: true, name: true, email: true, avatar: true } },
      zone: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Get today's deliveries per agent
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayAssignments = await prisma.deliveryAssignment.findMany({
    where: { createdAt: { gte: todayStart } },
    select: {
      deliveryAgentId: true,
      status: true,
      actualDuration: true,
      deliveredAt: true,
    },
  });

  const agentStats = new Map<
    string,
    { deliveriesToday: number; completedDurations: number[] }
  >();
  for (const a of todayAssignments) {
    if (!agentStats.has(a.deliveryAgentId)) {
      agentStats.set(a.deliveryAgentId, {
        deliveriesToday: 0,
        completedDurations: [],
      });
    }
    const stats = agentStats.get(a.deliveryAgentId)!;
    if (a.status === "DELIVERED") {
      stats.deliveriesToday++;
      if (a.actualDuration) stats.completedDurations.push(a.actualDuration);
    }
  }

  const enrichedAgents = agents.map((agent) => {
    const stats = agentStats.get(agent.id);
    const durations = stats?.completedDurations ?? [];
    const avgDeliveryTime =
      durations.length > 0
        ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
        : null;

    return {
      id: agent.id,
      name: agent.user.name || "Unknown",
      email: agent.user.email,
      phone: agent.phone,
      image: agent.user.avatar,
      status: agent.status,
      vehicleType: agent.vehicleType,
      vehicleNumber: agent.vehicleNumber,
      zoneId: agent.zoneId,
      zoneName: agent.zone?.name ?? "Unassigned",
      rating: Number(agent.rating),
      totalDeliveries: agent.totalDeliveries,
      currentLat: agent.currentLat ? Number(agent.currentLat) : null,
      currentLng: agent.currentLng ? Number(agent.currentLng) : null,
      lastSeenAt: agent.lastSeenAt,
      deliveriesToday: stats?.deliveriesToday ?? 0,
      avgDeliveryTime,
    };
  });

  return {
    summary: {
      totalAgents,
      onlineAgents,
      offlineAgents,
      activeDeliveries,
    },
    agents: enrichedAgents,
  };
}

export const getFleetOverview = withErrorHandling(_getFleetOverview);

// ===================== AGENT LOCATIONS =====================

async function _getAgentLocations() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const agents = await prisma.deliveryAgent.findMany({
    where: {
      currentLat: { not: null },
      currentLng: { not: null },
    },
    include: {
      user: { select: { name: true, avatar: true } },
      zone: { select: { id: true, name: true } },
    },
  });

  return agents.map((a) => ({
    id: a.id,
    name: a.user.name || "Unknown",
    image: a.user.avatar,
    status: a.status,
    lat: Number(a.currentLat!),
    lng: Number(a.currentLng!),
    zoneName: a.zone?.name ?? "Unassigned",
    lastSeenAt: a.lastSeenAt,
  }));
}

export const getAgentLocations = withErrorHandling(_getAgentLocations);

// ===================== AGENT PERFORMANCE =====================

async function _getAgentPerformance(agentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const agent = await prisma.deliveryAgent.findUnique({
    where: { id: agentId },
    include: {
      user: { select: { name: true, email: true, avatar: true } },
      zone: { select: { name: true } },
    },
  });

  if (!agent) throw new Error("Agent not found");

  // Get last 30 days of assignments
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const assignments = await prisma.deliveryAssignment.findMany({
    where: {
      deliveryAgentId: agentId,
      createdAt: { gte: thirtyDaysAgo },
    },
    select: {
      id: true,
      status: true,
      actualDuration: true,
      deliveredAt: true,
      estimatedEta: true,
      createdAt: true,
    },
  });

  const delivered = assignments.filter((a) => a.status === "DELIVERED");
  const onTime = delivered.filter((a) => {
    if (!a.deliveredAt || !a.estimatedEta) return false;
    return a.deliveredAt <= a.estimatedEta;
  });

  const durations = delivered
    .filter((a) => a.actualDuration != null)
    .map((a) => a.actualDuration!);

  const avgDeliveryTime =
    durations.length > 0
      ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
      : null;

  const onTimePercent =
    delivered.length > 0
      ? Math.round((onTime.length / delivered.length) * 100)
      : 0;

  // Daily breakdown for chart
  const dailyMap = new Map<string, { date: string; count: number; avgDuration: number }>();
  for (const a of delivered) {
    const date = a.createdAt.toISOString().split("T")[0];
    if (!dailyMap.has(date)) {
      dailyMap.set(date, { date, count: 0, avgDuration: 0 });
    }
    const day = dailyMap.get(date)!;
    day.count++;
    if (a.actualDuration) {
      day.avgDuration =
        (day.avgDuration * (day.count - 1) + a.actualDuration) / day.count;
    }
  }

  return {
    agent: {
      id: agent.id,
      name: agent.user.name || "Unknown",
      email: agent.user.email,
      image: agent.user.avatar,
      phone: agent.phone,
      status: agent.status,
      zoneName: agent.zone?.name ?? "Unassigned",
      rating: Number(agent.rating),
      totalDeliveries: agent.totalDeliveries,
    },
    metrics: {
      totalAssignments: assignments.length,
      deliveredCount: delivered.length,
      onTimeCount: onTime.length,
      onTimePercent,
      avgDeliveryTime,
      cancelledCount: assignments.filter((a) => a.status === "CANCELLED").length,
    },
    dailyBreakdown: Array.from(dailyMap.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    ),
  };
}

export const getAgentPerformance = withErrorHandling(_getAgentPerformance);

// ===================== UPDATE AGENT STATUS =====================

async function _updateAgentStatus(
  agentId: string,
  status: DeliveryAgentStatus
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const validStatuses: DeliveryAgentStatus[] = [
    "ONLINE",
    "OFFLINE",
    "AVAILABLE",
    "ON_DELIVERY",
    "UNAVAILABLE",
  ];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status: ${status}`);
  }

  const agent = await prisma.deliveryAgent.update({
    where: { id: agentId },
    data: {
      status,
      lastSeenAt: status === "ONLINE" || status === "AVAILABLE" ? new Date() : undefined,
    },
    include: {
      user: { select: { name: true } },
    },
  });

  return {
    id: agent.id,
    name: agent.user.name || "Unknown",
    status: agent.status,
  };
}

export const updateAgentStatus = withErrorHandling(_updateAgentStatus);

// ===================== FLEET STATS =====================

async function _getFleetStats(zoneId?: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const agentWhere: Record<string, unknown> = {};
  if (zoneId) agentWhere.zoneId = zoneId;

  const [totalAgents, agentsByStatus, zones] = await Promise.all([
    prisma.deliveryAgent.count({ where: agentWhere }),
    prisma.deliveryAgent.groupBy({
      by: ["status"],
      where: agentWhere,
      _count: true,
    }),
    prisma.deliveryZone.findMany({
      select: { id: true, name: true, isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const statusCounts: Record<string, number> = {};
  for (const g of agentsByStatus) {
    statusCounts[g.status] = g._count;
  }

  // Active deliveries by zone
  const assignmentWhere: Record<string, unknown> = {
    status: { in: ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "NEARBY"] },
  };
  if (zoneId) assignmentWhere.zoneId = zoneId;

  const activeDeliveries = await prisma.deliveryAssignment.count({
    where: assignmentWhere,
  });

  // Today's stats
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayDelivered = await prisma.deliveryAssignment.count({
    where: {
      ...(zoneId ? { zoneId } : {}),
      status: "DELIVERED",
      deliveredAt: { gte: todayStart },
    },
  });

  // Average delivery time across all today's deliveries
  const todayAssignments = await prisma.deliveryAssignment.findMany({
    where: {
      ...(zoneId ? { zoneId } : {}),
      status: "DELIVERED",
      deliveredAt: { gte: todayStart },
      actualDuration: { not: null },
    },
    select: { actualDuration: true },
  });

  const avgDeliveryTime =
    todayAssignments.length > 0
      ? Math.round(
          todayAssignments.reduce((s, a) => s + (a.actualDuration || 0), 0) /
            todayAssignments.length
        )
      : null;

  return {
    totalAgents,
    statusCounts,
    activeDeliveries,
    todayDelivered,
    avgDeliveryTime,
    zones: zones.map((z) => ({
      id: z.id,
      name: z.name,
      isActive: z.isActive,
    })),
  };
}

export const getFleetStats = withErrorHandling(_getFleetStats);
