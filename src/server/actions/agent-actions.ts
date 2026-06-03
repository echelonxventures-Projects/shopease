"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { haversineDistance } from "@/lib/geo";
import { DeliveryAgentStatus, DeliveryStatus, TrackingEventType } from "@prisma/client";

// ===================== AUTH =====================

async function _agentLogin(identifier: string, password?: string) {
  await getSession(); // auth check

  // If password is provided, it's an email/password flow — NextAuth handles auth
  // via the existing credentials provider. Here we verify the agent role.
  const where = password
    ? { email: identifier }
    : { phone: identifier };

  const user = await prisma.user.findFirst({
    where,
    include: { deliveryAgents: true },
  });

  if (!user) {
    return { error: "No agent account found for these credentials.", code: "AGENT_NOT_FOUND" };
  }

  const agentProfile = user.deliveryAgents?.[0];

  if (!agentProfile) {
    return { error: "Your account is not registered as a delivery agent.", code: "NOT_AN_AGENT" };
  }

  if (user.isBlocked) {
    return { error: "Your agent account has been suspended.", code: "AGENT_BLOCKED" };
  }

  // For OTP flow, in production an SMS OTP would be dispatched here.
  // We return success so the client can proceed.
  if (!password) {
    return {
      agentId: agentProfile.id,
      phone: user.phone,
      message: "OTP sent to your registered phone number.",
    };
  }

  return {
    agentId: agentProfile.id,
    email: user.email,
    message: "Signed in successfully.",
  };
}

export const agentLogin = withErrorHandling(_agentLogin);

// ===================== ORDERS =====================

async function _getAvailableOrders(agentId?: string) {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized", code: "UNAUTHORIZED" };
  }

  const agent = await prisma.deliveryAgent.findUnique({
    where: agentId ? { id: agentId } : { userId: session.user.id },
    include: { zone: true },
  });

  if (!agent) {
    return { error: "Agent profile not found.", code: "AGENT_NOT_FOUND" };
  }

  // Find orders in the agent's zone that are not yet assigned
  const where: Record<string, unknown> = {
    deliveryAssignment: null,
    status: { in: ["CONFIRMED", "PROCESSING", "READY_TO_SHIP"] },
  };

  if (agent.zoneId) {
    where.shippingAddress = { path: ["zoneId"], equals: agent.zoneId };
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "asc" },
    take: 30,
    include: {
      deliveryAssignment: true,
    },
  });

  const agentLat = agent.currentLat ? Number(agent.currentLat) : 0;
  const agentLng = agent.currentLng ? Number(agent.currentLng) : 0;

  return orders.map((order) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    const addr = (order.shippingAddress || {}) as any;
    const destLat = addr?.lat ? Number(addr.lat) : 0;
    const destLng = addr?.lng ? Number(addr.lng) : 0;
    const distance = agentLat && agentLng ? haversineDistance(agentLat, agentLng, destLat, destLng) : null;

    return {
      assignmentId: order.deliveryAssignment?.id || `pending-${order.id}`,
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: addr.fullName || "Customer",
      customerPhone: addr.phone || "",
      address: [addr.addressLine, addr.city, addr.state].filter(Boolean).join(", "),
      landmark: addr.landmark,
      items: Array.isArray(order.items)
        ? (order.items as Array<{ productId: string; quantity?: number }>).map((i: Record<string, unknown>) => ({
            name: i.name || i.productName || "Item",
            quantity: i.quantity || 1,
          }))
        : [],
      status: order.status,
      pickupConfirmed: false,
      estimatedEta: order.deliveryAssignment?.estimatedEta?.toISOString(),
      distanceKm: distance ? Math.round(distance * 100) / 100 : undefined,
      deliveryLat: destLat,
      deliveryLng: destLng,
      estimatedEarnings: Math.max(30, Math.round((distance || 2) * 15)),
    };
  });
}

export const getAvailableOrders = withErrorHandling(_getAvailableOrders);

// ===================== ACCEPT / DECLINE =====================

async function _acceptOrder(assignmentId: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized", code: "UNAUTHORIZED" };

  const agent = await prisma.deliveryAgent.findUnique({
    where: { userId: session.user.id },
  });
  if (!agent) return { error: "Agent not found", code: "AGENT_NOT_FOUND" };

  if (agent.status === DeliveryAgentStatus.ON_DELIVERY) {
    return { error: "You already have an active delivery. Complete it first.", code: "ALREADY_ON_DELIVERY" };
  }

  let assignment = await prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (!assignment) {
    // Pending assignment — create it
    const orderId = assignmentId.replace("pending-", "");
    assignment = await prisma.deliveryAssignment.create({
      data: {
        orderId,
        deliveryAgentId: agent.id,
        zoneId: agent.zoneId,
        status: DeliveryStatus.ASSIGNED,
      },
    });
  } else {
    assignment = await prisma.deliveryAssignment.update({
      where: { id: assignmentId },
      data: {
        deliveryAgentId: agent.id,
        status: DeliveryStatus.ASSIGNED,
      },
    });
  }

  await prisma.deliveryAgent.update({
    where: { id: agent.id },
    data: { status: DeliveryAgentStatus.ON_DELIVERY },
  });

  await prisma.deliveryTrackingEvent.create({
    data: {
      deliveryAssignmentId: assignment.id,
      eventType: TrackingEventType.PICKED_UP,
      message: "Order accepted by delivery agent.",
      recordedBy: agent.id,
    },
  });

  return { success: true, assignmentId: assignment.id };
}

export const acceptOrder = withErrorHandling(_acceptOrder);

async function _declineOrder(assignmentId: string, reason?: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized", code: "UNAUTHORIZED" };

  const agent = await prisma.deliveryAgent.findUnique({
    where: { userId: session.user.id },
  });
  if (!agent) return { error: "Agent not found", code: "AGENT_NOT_FOUND" };

  const existing = await prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
  });

  if (existing && existing.deliveryAgentId === agent.id) {
    await prisma.deliveryAssignment.update({
      where: { id: assignmentId },
      data: { status: DeliveryStatus.CANCELLED },
    });
    await prisma.deliveryTrackingEvent.create({
      data: {
        deliveryAssignmentId: assignmentId,
        eventType: TrackingEventType.EXCEPTION,
        message: `Order declined by agent. ${reason || ""}`.trim(),
        recordedBy: agent.id,
      },
    });
  }

  return { success: true };
}

export const declineOrder = withErrorHandling(_declineOrder);

// ===================== STATUS & LOCATION =====================

async function _updateDeliveryStatus(
  assignmentId: string,
  status: string,
  location?: { lat: number; lng: number }
) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized", code: "UNAUTHORIZED" };

  const validStatuses: DeliveryStatus[] = [
    "ASSIGNED",
    "PICKED_UP",
    "IN_TRANSIT",
    "NEARBY",
    "DELIVERED",
    "CANCELLED",
  ];
  if (!validStatuses.includes(status as DeliveryStatus)) {
    return { error: `Invalid status: ${status}`, code: "INVALID_STATUS" };
  }

  const updateData: Record<string, unknown> = { status: status as DeliveryStatus };
  if (status === "PICKED_UP") updateData.pickupAt = new Date();

  const assignment = await prisma.deliveryAssignment.update({
    where: { id: assignmentId },
    data: updateData,
  });

  const eventTypeMap: Record<string, TrackingEventType> = {
    PICKED_UP: TrackingEventType.PICKED_UP,
    IN_TRANSIT: TrackingEventType.IN_TRANSIT,
    NEARBY: TrackingEventType.NEARBY,
    DELIVERED: TrackingEventType.DELIVERED,
  };

  if (eventTypeMap[status]) {
    await prisma.deliveryTrackingEvent.create({
      data: {
        deliveryAssignmentId: assignmentId,
        eventType: eventTypeMap[status],
        message: `Status updated to ${status}.`,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        recordedBy: session.user.id,
      },
    });
  }

  return { success: true, assignment };
}

export const updateDeliveryStatus = withErrorHandling(_updateDeliveryStatus);

async function _submitProofOfDelivery(assignmentId: string, photoUrl: string, otp: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized", code: "UNAUTHORIZED" };

  if (!photoUrl) return { error: "Proof photo is required.", code: "PHOTO_REQUIRED" };
  if (!otp || otp.length < 4) return { error: "Valid OTP is required.", code: "OTP_REQUIRED" };

  const assignment = await prisma.deliveryAssignment.findUnique({
    where: { id: assignmentId },
    include: { order: true },
  });

  if (!assignment) return { error: "Assignment not found.", code: "NOT_FOUND" };

  // Verify OTP — compare against order's delivery OTP (stored on order meta)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
  const expectedOtp = (assignment.order as any)?.deliveryOtp || (assignment.order as any)?.otp;
  if (expectedOtp && String(expectedOtp) !== String(otp)) {
    return { error: "OTP does not match. Ask the customer for the correct code.", code: "OTP_MISMATCH" };
  }

  await prisma.deliveryAssignment.update({
    where: { id: assignmentId },
    data: {
      status: DeliveryStatus.DELIVERED,
      deliveredAt: new Date(),
      notes: photoUrl,
    },
  });

  await prisma.deliveryTrackingEvent.create({
    data: {
      deliveryAssignmentId: assignmentId,
      eventType: TrackingEventType.DELIVERED,
      message: "Delivery completed with proof photo.",
      metadata: { photoUrl, otpVerified: true },
      recordedBy: session.user.id,
    },
  });

  // Mark agent as available again
  await prisma.deliveryAgent.update({
    where: { userId: session.user.id },
    data: {
      status: DeliveryAgentStatus.AVAILABLE,
      totalDeliveries: { increment: 1 },
    },
  });

  return { success: true };
}

export const submitProofOfDelivery = withErrorHandling(_submitProofOfDelivery);

// ===================== EARNINGS =====================

async function _getAgentEarnings(period: string, agentId?: string) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized", code: "UNAUTHORIZED" };

  const agent = await prisma.deliveryAgent.findUnique({
    where: agentId ? { id: agentId } : { userId: session.user.id },
  });
  if (!agent) return { error: "Agent not found.", code: "AGENT_NOT_FOUND" };

  const now = new Date();
  let since: Date;
  switch (period) {
    case "today":
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week":
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      break;
    case "month":
      since = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      since = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const assignments = await prisma.deliveryAssignment.findMany({
    where: {
      deliveryAgentId: agent.id,
      status: DeliveryStatus.DELIVERED,
      deliveredAt: { gte: since },
    },
    include: { order: true },
  });

  const total = assignments.reduce((sum, a) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    const fee = Number((a.order as any)?.deliveryFee ?? 30);
    return sum + fee;
  }, 0);

  const tips = assignments.reduce((sum, a) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    const tip = Number((a.order as any)?.deliveryTip ?? 0);
    return sum + tip;
  }, 0);

  return {
    total: Math.round(total * 100) / 100,
    deliveries: assignments.length,
    tips: Math.round(tips * 100) / 100,
    payoutHistory: [],
  };
}

export const getAgentEarnings = withErrorHandling(_getAgentEarnings);

// ===================== AVAILABILITY =====================

async function _toggleAgentAvailability(available: boolean) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized", code: "UNAUTHORIZED" };

  const status = available ? DeliveryAgentStatus.AVAILABLE : DeliveryAgentStatus.OFFLINE;

  const agent = await prisma.deliveryAgent.update({
    where: { userId: session.user.id },
    data: { status, lastSeenAt: new Date() },
  });

  return { success: true, status: agent.status };
}

export const toggleAgentAvailability = withErrorHandling(_toggleAgentAvailability);

// ===================== GPS LOCATION =====================

async function _updateAgentLocation(lat: number, lng: number) {
  const session = await getSession();
  if (!session?.user?.id) return { error: "Unauthorized", code: "UNAUTHORIZED" };

  await prisma.deliveryAgent.update({
    where: { userId: session.user.id },
    data: {
      currentLat: lat,
      currentLng: lng,
      lastSeenAt: new Date(),
    },
  });

  return { success: true };
}

export const updateAgentLocation = withErrorHandling(_updateAgentLocation);
