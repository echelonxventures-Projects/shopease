"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { haversineDistance, isPointInCircle, isPointInPolygon, findNearest, getBoundingBox, estimatedTime } from "@/lib/geo";
import { DeliveryAgentStatus, VehicleType, DeliveryStatus, TrackingEventType, Prisma } from "@prisma/client";

// ===================== DELIVERY ZONE CRUD =====================

export async function createDeliveryZone(data: {
  name: string;
  description?: string;
  regionId?: string;
  facilityLocationId?: string;
  centerLat: number;
  centerLng: number;
  radiusKm?: number;
  deliveryTimeMin?: number;
  deliveryTimeMax?: number;
  minOrderValue?: number;
  deliveryFee?: number;
  freeDeliveryFrom?: number;
  coveragePolygon?: [number, number][];
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const code = `ZONE-${Date.now().toString(36).toUpperCase()}`;

  return prisma.deliveryZone.create({
    data: {
      ...data,
      code,
      isGeoFenced: !!data.coveragePolygon,
      coveragePolygon: data.coveragePolygon ? JSON.stringify(data.coveragePolygon) : undefined,
    },
  });
}

export async function updateDeliveryZone(
  id: string,
  data: {
    name?: string;
    description?: string;
    centerLat?: number;
    centerLng?: number;
    radiusKm?: number;
    deliveryTimeMin?: number;
    deliveryTimeMax?: number;
    minOrderValue?: number;
    deliveryFee?: number;
    freeDeliveryFrom?: number;
    coveragePolygon?: [number, number][];
    isActive?: boolean;
  }
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = { ...data };
  if (data.coveragePolygon !== undefined) {
    updateData.isGeoFenced = data.coveragePolygon.length > 0;
    updateData.coveragePolygon = data.coveragePolygon.length > 0
      ? JSON.stringify(data.coveragePolygon)
      : null;
  }

  return prisma.deliveryZone.update({
    where: { id },
    data: updateData,
  });
}

export async function deleteDeliveryZone(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.deliveryZone.delete({ where: { id } });
}

export async function getDeliveryZones(options?: { includeInactive?: boolean }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.deliveryZone.findMany({
    where: options?.includeInactive ? undefined : { isActive: true },
    include: {
      region: { select: { name: true } },
      facilityLocation: { select: { name: true } },
      mfc: { select: { id: true, name: true, isActive: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getDeliveryZone(id: string) {
  return prisma.deliveryZone.findUnique({
    where: { id },
    include: {
      region: { select: { name: true } },
      facilityLocation: { select: { name: true } },
      mfc: true,
    },
  });
}

// ===================== ZONE DISCOVERY =====================

export async function getNearbyDeliveryZones(lat: number, lng: number, radiusKm: number = 10) {
  const zones = await prisma.deliveryZone.findMany({
    where: { isActive: true },
  });

  const boundingBox = getBoundingBox(lat, lng, radiusKm);

  const nearby = zones.filter((zone) => {
    const centerLat = Number(zone.centerLat);
    const centerLng = Number(zone.centerLng);
    if (isNaN(centerLat) || isNaN(centerLng)) return false;

    // Quick bounding box pre-filter
    if (
      lat < boundingBox.minLat || lat > boundingBox.maxLat ||
      lng < boundingBox.minLng || lng > boundingBox.maxLng
    ) {
      return false;
    }

    const radius = Number(zone.radiusKm);

    // Check polygon coverage first
    if (zone.isGeoFenced && zone.coveragePolygon) {
      try {
        const polygon: [number, number][] = JSON.parse(zone.coveragePolygon as string);
        if (isPointInPolygon(lat, lng, polygon)) return true;
      } catch {
        // Fall through to circle check
      }
    }

    // Circle-based check
    return isPointInCircle(lat, lng, centerLat, centerLng, radius);
  });

  return nearby.map((z) => ({
    id: z.id,
    name: z.name,
    centerLat: Number(z.centerLat),
    centerLng: Number(z.centerLng),
    radius: Number(z.radiusKm) * 1000,
    etaMinutes: z.deliveryTimeMax,
    deliveryFee: Number(z.deliveryFee),
    minOrderValue: Number(z.minOrderValue),
    freeDeliveryFrom: z.freeDeliveryFrom ? Number(z.freeDeliveryFrom) : null,
  }));
}

export async function isInDeliveryZone(lat: number, lng: number) {
  const zones = await getNearbyDeliveryZones(lat, lng, 20);
  return {
    inZone: zones.length > 0,
    zone: zones[0] || null,
  };
}

// ===================== MICRO FULFILLMENT CENTER CRUD =====================

export async function createMicroFulfillmentCenter(data: {
  name: string;
  zoneId: string;
  locationId?: string;
  addressLine?: string;
  lat: number;
  lng: number;
  contactPhone?: string;
  operatingHours?: { open: string; close: string; days: number[] };
  inventoryCapacity?: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const code = `MFC-${Date.now().toString(36).toUpperCase()}`;

  return prisma.microFulfillmentCenter.create({
    data: {
      ...data,
      code,
      operatingHours: data.operatingHours as Prisma.InputJsonValue,
    },
  });
}

export async function getMicroFulfillmentCenters() {
  return prisma.microFulfillmentCenter.findMany({
    where: { isActive: true },
    include: {
      zone: { select: { id: true, name: true } },
      location: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function updateMicroFulfillmentCenter(
  id: string,
  data: {
    name?: string;
    addressLine?: string;
    lat?: number;
    lng?: number;
    contactPhone?: string;
    operatingHours?: { open: string; close: string; days: number[] };
    inventoryCapacity?: number;
    isActive?: boolean;
  }
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const updateData: Record<string, unknown> = { ...data };
  if (data.operatingHours) {
    updateData.operatingHours = data.operatingHours as Prisma.InputJsonValue;
  }

  return prisma.microFulfillmentCenter.update({
    where: { id },
    data: updateData,
  });
}

// ===================== DELIVERY AGENT MANAGEMENT =====================

export async function createDeliveryAgent(data: {
  userId: string;
  phone?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  licenseNo?: string;
  zoneId?: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.deliveryAgent.create({
    data: {
      userId: data.userId,
      phone: data.phone,
      vehicleType: (data.vehicleType || "BIKE") as VehicleType,
      vehicleNumber: data.vehicleNumber,
      licenseNo: data.licenseNo,
      zoneId: data.zoneId,
      status: DeliveryAgentStatus.OFFLINE,
    },
  });
}

export async function getDeliveryAgents(zoneId?: string) {
  return prisma.deliveryAgent.findMany({
    where: zoneId ? { zoneId } : undefined,
    include: {
      user: { select: { name: true, email: true } },
      zone: { select: { id: true, name: true } },
    },
    orderBy: { status: "asc" },
  });
}

export async function findNearestAgents(
  lat: number,
  lng: number,
  radiusKm: number = 10,
  limit: number = 5
) {
  const agents = await prisma.deliveryAgent.findMany({
    where: {
      status: { in: [DeliveryAgentStatus.AVAILABLE, DeliveryAgentStatus.ONLINE] },
      currentLat: { not: undefined },
      currentLng: { not: undefined },
    },
    include: {
      user: { select: { name: true, email: true } },
      zone: { select: { id: true, name: true } },
    },
  });

  const withCoords = agents.filter(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
    (a: any) => a.currentLat && a.currentLng
  );

  return findNearest(
    lat,
    lng,
    withCoords.map((a) => ({
      ...a,
      lat: Number(a.currentLat),
      lng: Number(a.currentLng),
    })),
    limit
  ).filter((item) => item.distanceKm <= radiusKm);
}

export async function updateAgentLocation(lat: number, lng: number) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.deliveryAgent.update({
    where: { userId: session.user.id },
    data: {
      currentLat: lat,
      currentLng: lng,
      lastSeenAt: new Date(),
    },
  });
}

export async function updateAgentStatus(status: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.deliveryAgent.update({
    where: { userId: session.user.id },
    data: { status: status as DeliveryAgentStatus },
  });
}

// ===================== DELIVERY ASSIGNMENT =====================

export async function assignDeliveryAgent(orderId: string, agentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const agent = await prisma.deliveryAgent.findUnique({
    where: { id: agentId },
    include: { user: { select: { name: true } } },
  });
  if (!agent) throw new Error("Agent not found");

  const shippingAddress = order.shippingAddress as Record<string, string>;
  const pickupLat = agent.currentLat ? Number(agent.currentLat) : undefined;
  const pickupLng = agent.currentLng ? Number(agent.currentLng) : undefined;
  const deliveryLat = shippingAddress?.latitude ? Number(shippingAddress.latitude) : undefined;
  const deliveryLng = shippingAddress?.longitude ? Number(shippingAddress.longitude) : undefined;

  const etaMinutes = pickupLat && deliveryLat
    ? estimatedTime(haversineDistance(pickupLat, pickupLng!, deliveryLat, deliveryLng!))
    : 15;

  const assignment = await prisma.deliveryAssignment.create({
    data: {
      orderId,
      deliveryAgentId: agentId,
      zoneId: agent.zoneId,
      status: DeliveryStatus.ASSIGNED,
      pickupLat,
      pickupLng,
      deliveryLat,
      deliveryLng,
      customerLandmark: shippingAddress?.landmark,
      estimatedEta: new Date(Date.now() + etaMinutes * 60000),
    },
  });

  // Create tracking event
  await prisma.deliveryTrackingEvent.create({
    data: {
      deliveryAssignmentId: assignment.id,
      eventType: TrackingEventType.PICKED_UP,
      message: `Assigned to ${agent.user.name || agent.phone || "agent"}`,
      recordedBy: session.user.id,
    },
  });

  // Update agent status
  await prisma.deliveryAgent.update({
    where: { id: agentId },
    data: { status: DeliveryAgentStatus.ON_DELIVERY },
  });

  return assignment;
}

export async function autoAssignDeliveryAgent(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  const shippingAddress = order.shippingAddress as Record<string, string>;
  const lat = shippingAddress?.latitude ? Number(shippingAddress.latitude) : null;
  const lng = shippingAddress?.longitude ? Number(shippingAddress.longitude) : null;

  if (!lat || !lng) {
    throw new Error("Order has no delivery coordinates");
  }

  // Find nearest available agents
  const nearest = await findNearestAgents(lat, lng, 20, 3);

  if (nearest.length === 0) {
    // Fallback: find any available agent in the same zone
    const zoneResult = await getNearbyDeliveryZones(lat, lng, 20);
    if (zoneResult.length > 0) {
      const zoneAgents = await prisma.deliveryAgent.findMany({
        where: {
          zoneId: zoneResult[0].id,
          status: { in: [DeliveryAgentStatus.AVAILABLE, DeliveryAgentStatus.ONLINE] },
        },
        take: 1,
      });

      if (zoneAgents.length > 0) {
        return assignDeliveryAgent(orderId, zoneAgents[0].id);
      }
    }
    throw new Error("No available delivery agents");
  }

  return assignDeliveryAgent(orderId, nearest[0].item.id);
}

// ===================== DELIVERY TRACKING =====================

export async function updateDeliveryStatus(
  assignmentId: string,
  status: string,
  lat?: number,
  lng?: number
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const assignment = await prisma.deliveryAssignment.update({
    where: { id: assignmentId },
    data: {
      status: status as DeliveryStatus,
      ...(lat && lng ? { currentLat: lat, currentLng: lng } : {}),
      ...(status === "PICKED_UP" && lat && lng ? { pickupLat: lat, pickupLng: lng, pickupAt: new Date() } : {}),
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });

  // Record tracking event
  const eventTypeMap: Record<string, TrackingEventType> = {
    ASSIGNED: TrackingEventType.PICKED_UP,
    PICKED_UP: TrackingEventType.PICKED_UP,
    IN_TRANSIT: TrackingEventType.IN_TRANSIT,
    NEARBY: TrackingEventType.NEARBY,
    DELIVERED: TrackingEventType.DELIVERED,
    CANCELLED: TrackingEventType.EXCEPTION,
  };

  await prisma.deliveryTrackingEvent.create({
    data: {
      deliveryAssignmentId: assignmentId,
      eventType: eventTypeMap[status] || TrackingEventType.LOCATION_UPDATE,
      lat: lat || 0,
      lng: lng || 0,
      message: `Delivery status: ${status}`,
      recordedBy: session.user.id,
    },
  });

  // If delivered, update agent status back to available
  if (status === "DELIVERED") {
    await prisma.deliveryAgent.update({
      where: { id: assignment.deliveryAgentId },
      data: {
        status: DeliveryAgentStatus.AVAILABLE,
        totalDeliveries: { increment: 1 },
      },
    });
  }

  return assignment;
}

export async function getDeliveryTracking(assignmentId: string) {
  const assignment = await prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
    include: {
      deliveryAgent: {
        include: {
          user: { select: { name: true, email: true } },
        },
      },
      zone: { select: { id: true, name: true } },
      trackingEvents: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!assignment) return null;

  return {
    id: assignment.id,
    orderId: assignment.orderId,
    status: assignment.status,
    pickupLat: assignment.pickupLat ? Number(assignment.pickupLat) : null,
    pickupLng: assignment.pickupLng ? Number(assignment.pickupLng) : null,
    deliveryLat: assignment.deliveryLat ? Number(assignment.deliveryLat) : null,
    deliveryLng: assignment.deliveryLng ? Number(assignment.deliveryLng) : null,
    pickupAt: assignment.pickupAt,
    deliveredAt: assignment.deliveredAt,
    estimatedEta: assignment.estimatedEta,
    actualDuration: assignment.actualDuration,
    route: assignment.route as Record<string, unknown>,
    agent: assignment.deliveryAgent ? {
      id: assignment.deliveryAgent.id,
      name: assignment.deliveryAgent.user.name,
      phone: assignment.deliveryAgent.phone,
      vehicleType: assignment.deliveryAgent.vehicleType,
      rating: Number(assignment.deliveryAgent.rating),
      currentLat: assignment.deliveryAgent.currentLat ? Number(assignment.deliveryAgent.currentLat) : null,
      currentLng: assignment.deliveryAgent.currentLng ? Number(assignment.deliveryAgent.currentLng) : null,
      status: assignment.deliveryAgent.status,
    } : null,
    events: assignment.trackingEvents.map((e) => ({
      id: e.id,
      type: e.eventType,
      message: e.message,
      lat: e.lat ? Number(e.lat) : null,
      lng: e.lng ? Number(e.lng) : null,
      createdAt: e.createdAt,
    })),
  };
}

export async function getDeliveryTrackingEvents(assignmentId: string) {
  const events = await prisma.deliveryTrackingEvent.findMany({
    where: { deliveryAssignmentId: assignmentId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return events.map((e) => ({
    id: e.id,
    type: e.eventType,
    message: e.message,
    lat: e.lat ? Number(e.lat) : null,
    lng: e.lng ? Number(e.lng) : null,
    createdAt: e.createdAt,
  }));
}

// ===================== DELIVERY ANALYTICS =====================

export async function getDeliveryAnalytics(
  zoneId?: string,
  from?: string,
  to?: string
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const where: Prisma.DeliveryAssignmentWhereInput = {};
  if (zoneId) where.zoneId = zoneId;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lte = new Date(to);
  }

  const assignments = await prisma.deliveryAssignment.findMany({
    where,
    include: {
      deliveryAgent: {
        select: { totalDeliveries: true, rating: true },
      },
    },
  });

  const completed = assignments.filter((a) => a.status === "DELIVERED");
  const durations = completed
    .map((a) => a.actualDuration)
    .filter((d): d is number => d != null);

  const avgDuration = durations.length > 0
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : 0;

  const onTime = completed.filter((a) => {
    if (!a.estimatedEta || !a.deliveredAt) return true;
    return new Date(a.deliveredAt).getTime() <= new Date(a.estimatedEta).getTime();
  }).length;

  const onTimeRate = completed.length > 0 ? onTime / completed.length : 0;

  return {
    totalAssignments: assignments.length,
    completed: completed.length,
    inProgress: assignments.filter((a) =>
      ["ASSIGNED", "PICKED_UP", "IN_TRANSIT", "NEARBY"].includes(a.status)
    ).length,
    cancelled: assignments.filter((a) => a.status === "CANCELLED").length,
    avgDurationMinutes: Math.round(avgDuration),
    onTimeRate,
    totalDeliveries: assignments.reduce((sum, a) => sum + (a.deliveryAgent?.totalDeliveries || 0), 0),
    avgRating: completed.length > 0
      ? completed.reduce((sum, a) => sum + Number(a.deliveryAgent?.rating || 0), 0) / completed.length
      : 0,
  };
}
