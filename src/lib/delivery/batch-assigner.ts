// ===================== BATCH DELIVERY ASSIGNMENT =====================
// Groups unassigned orders by proximity and assigns to nearest available agent.

import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BatchAssignmentResult {
  agentId: string;
  orderIds: string[];
  totalDistance: number;
  estimatedDuration: number;
}

interface OrderLocation {
  orderId: string;
  lat: number;
  lng: number;
}

interface AgentLocation {
  agentId: string;
  lat: number;
  lng: number;
}

// ── Configuration ─────────────────────────────────────────────────────────────

const DEFAULT_RADIUS_KM = 5;
const MAX_ORDERS_PER_BATCH = 8;
const AVG_SPEED_KMH = 25; // average delivery speed

// ── Haversine distance ────────────────────────────────────────────────────────

function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

// ── Load config from SystemConfig ─────────────────────────────────────────────

async function getConfig(): Promise<{ radiusKm: number; maxOrdersPerBatch: number }> {
  try {
    const [radiusCfg, maxCfg] = await Promise.all([
      prisma.systemConfig.findUnique({ where: { key: "batch_assignment_radius_km" } }),
      prisma.systemConfig.findUnique({ where: { key: "batch_assignment_max_orders" } }),
    ]);
    return {
      radiusKm: radiusCfg ? parseFloat(radiusCfg.value) : DEFAULT_RADIUS_KM,
      maxOrdersPerBatch: maxCfg ? parseInt(maxCfg.value, 10) : MAX_ORDERS_PER_BATCH,
    };
  } catch {
    return { radiusKm: DEFAULT_RADIUS_KM, maxOrdersPerBatch: MAX_ORDERS_PER_BATCH };
  }
}

// ── Main algorithm ────────────────────────────────────────────────────────────

/**
 * Run batch assignment for unassigned orders.
 * 1. Fetch unassigned orders with delivery coordinates
 * 2. Fetch available agents in the zone
 * 3. Group orders by proximity (within radius)
 * 4. Assign each group to the nearest available agent
 */
export async function runBatchAssignment(zoneId?: string): Promise<BatchAssignmentResult[]> {
  const config = await getConfig();
  const results: BatchAssignmentResult[] = [];

  // 1. Fetch unassigned orders with delivery coordinates
  const orderWhere: Record<string, unknown> = {
    deliveryAssignment: null,
    status: { in: ["CONFIRMED", "PROCESSING"] },
  };
  if (zoneId) {
    // Filter by orders in the zone (via delivery slot or address)
    orderWhere.deliverySlot = { zoneId };
  }

  const orders = await prisma.order.findMany({
    where: orderWhere,
    select: {
      id: true,
      shippingAddress: true,
    },
    take: 200, // process in reasonable batches
  });

  const orderLocations: OrderLocation[] = orders
    .map((o) => {
      const addr = o.shippingAddress as { latitude?: string; longitude?: string } | null;
      if (!addr?.latitude || !addr?.longitude) return null;
      return {
        orderId: o.id,
        lat: parseFloat(addr.latitude),
        lng: parseFloat(addr.longitude),
      };
    })
    .filter((o): o is OrderLocation => o !== null);

  if (orderLocations.length === 0) {
    logger.info("[BatchAssign] No unassigned orders with coordinates found");
    return results;
  }

  // 2. Fetch available agents
  const agentWhere: Record<string, unknown> = {
    status: { in: ["AVAILABLE", "ONLINE"] },
  };
  if (zoneId) {
    agentWhere.zoneId = zoneId;
  }

  const agents = await prisma.deliveryAgent.findMany({
    where: agentWhere,
    select: {
      id: true,
      currentLat: true,
      currentLng: true,
    },
  });

  const agentLocations: AgentLocation[] = agents
    .map((a) => {
      if (!a.currentLat || !a.currentLng) return null;
      return {
        agentId: a.id,
        lat: parseFloat(a.currentLat.toString()),
        lng: parseFloat(a.currentLng.toString()),
      };
    })
    .filter((a): a is AgentLocation => a !== null);

  if (agentLocations.length === 0) {
    logger.info("[BatchAssign] No available agents found");
    return results;
  }

  // 3. Group orders by proximity (greedy clustering)
  const assigned = new Set<string>();
  const agentAssigned = new Set<string>();

  for (const agent of agentLocations) {
    if (agentAssigned.has(agent.agentId)) continue;

    // Find orders within radius of this agent
    const nearbyOrders = orderLocations
      .filter((o) => !assigned.has(o.orderId))
      .map((o) => ({
        ...o,
        distance: haversine(agent.lat, agent.lng, o.lat, o.lng),
      }))
      .filter((o) => o.distance <= config.radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, config.maxOrdersPerBatch);

    if (nearbyOrders.length === 0) continue;

    // 4. Assign orders to this agent
    const orderIds = nearbyOrders.map((o) => o.orderId);
    const totalDistance = nearbyOrders.reduce((sum, o) => sum + o.distance, 0);
    const estimatedDuration = Math.round((totalDistance / AVG_SPEED_KMH) * 60); // minutes

    // Create delivery assignments in DB
    for (const orderId of orderIds) {
      try {
        await prisma.deliveryAssignment.create({
          data: {
            orderId,
            deliveryAgentId: agent.agentId,
            zoneId: zoneId || null,
            status: "ASSIGNED",
          },
        });
        assigned.add(orderId);
      } catch (err) {
        logger.error({ err, orderId }, "[BatchAssign] Failed to create assignment");
      }
    }

    // Update agent status
    try {
      await prisma.deliveryAgent.update({
        where: { id: agent.agentId },
        data: { status: "ON_DELIVERY" },
      });
    } catch {
      // Non-critical
    }

    agentAssigned.add(agent.agentId);
    results.push({
      agentId: agent.agentId,
      orderIds,
      totalDistance: Math.round(totalDistance * 100) / 100,
      estimatedDuration,
    });
  }

  logger.info(
    { agentsAssigned: results.length, ordersAssigned: assigned.size },
    "[BatchAssign] Batch assignment complete"
  );

  return results;
}
