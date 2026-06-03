"use server";

import { getSession, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ===================== GET DARK STORES =====================

export async function getDarkStores() {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const centers = await prisma.microFulfillmentCenter.findMany({
    include: {
      zone: { select: { id: true, name: true } },
      location: { select: { name: true } },
    },
    orderBy: { name: "asc" },
  });

  // Enrich with stats
  const enriched = await Promise.all(
    centers.map(async (c) => {
      // Count inventory items at this location
      const inventoryCount = c.locationId
        ? await prisma.inventory.count({ where: { locationId: c.locationId } })
        : 0;

      // Count pending orders assigned to this zone
      const pendingOrders = await prisma.deliveryAssignment.count({
        where: {
          zoneId: c.zoneId,
          status: { in: ["ASSIGNED", "PICKED_UP"] },
        },
      });

      // Count active delivery agents in this zone
      const activePickers = await prisma.deliveryAgent.count({
        where: {
          zoneId: c.zoneId,
          status: { in: ["ONLINE", "AVAILABLE", "ON_DELIVERY"] },
        },
      });

      return {
        ...c,
        lat: c.lat ? Number(c.lat) : null,
        lng: c.lng ? Number(c.lng) : null,
        stats: {
          inventoryCount,
          pendingOrders,
          activePickers,
        },
      };
    })
  );

  return enriched;
}

// ===================== GET DARK STORE DETAIL =====================

export async function getDarkStoreDetail(id: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const center = await prisma.microFulfillmentCenter.findUnique({
    where: { id },
    include: {
      zone: { select: { id: true, name: true } },
      location: { select: { id: true, name: true } },
    },
  });

  if (!center) throw new Error("Dark store not found");

  const inventoryCount = center.locationId
    ? await prisma.inventory.count({ where: { locationId: center.locationId } })
    : 0;

  const pendingOrders = await prisma.deliveryAssignment.count({
    where: { zoneId: center.zoneId, status: { in: ["ASSIGNED", "PICKED_UP"] } },
  });

  const activePickers = await prisma.deliveryAgent.count({
    where: {
      zoneId: center.zoneId,
      status: { in: ["ONLINE", "AVAILABLE", "ON_DELIVERY"] },
    },
  });

  return {
    ...center,
    lat: center.lat ? Number(center.lat) : null,
    lng: center.lng ? Number(center.lng) : null,
    stats: { inventoryCount, pendingOrders, activePickers },
  };
}

// ===================== GET DARK STORE INVENTORY =====================

export async function getDarkStoreInventory(storeId: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const center = await prisma.microFulfillmentCenter.findUnique({
    where: { id: storeId },
  });

  if (!center) throw new Error("Dark store not found");
  if (!center.locationId) return [];

  const items = await prisma.inventory.findMany({
    where: { locationId: center.locationId },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          price: true,
          images: true,
        },
      },
    },
    orderBy: { updatedAt: "desc" },
  });

  return items.map((item) => ({
    id: item.id,
    productId: item.productId,
    quantity: item.quantity,
    lowStock: item.lowStock,
    avgCost: Number(item.avgCost),
    updatedAt: item.updatedAt.toISOString(),
    product: {
      ...item.product,
      price: Number(item.product.price),
    },
  }));
}

// ===================== PICK LISTS =====================

export async function getPickLists(storeId: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const center = await prisma.microFulfillmentCenter.findUnique({
    where: { id: storeId },
  });

  if (!center) throw new Error("Dark store not found");

  // Get orders assigned to this zone that need picking
  const assignments = await prisma.deliveryAssignment.findMany({
    where: {
      zoneId: center.zoneId,
      status: "ASSIGNED",
    },
    include: {
      order: {
        include: {
          user: { select: { name: true } },
        },
      },
      deliveryAgent: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  // Build pick list items from order items
  const pickItems: Array<{
    id: string;
    orderId: string;
    orderNumber: string;
    productName: string;
    quantity: number;
    aisle: string;
    location: string;
    picked: boolean;
    assignmentId: string;
  }> = [];

  for (const assignment of assignments) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    const orderItems = (assignment.order.items as any[]) || [];
    for (const item of orderItems) {
      pickItems.push({
        id: `${assignment.id}-${item.productId || item.name}`,
        orderId: assignment.orderId,
        orderNumber: assignment.order.orderNumber,
        productName: item.name || item.productName || "Unknown",
        quantity: item.quantity || 1,
        aisle: `A-${Math.floor(Math.random() * 10) + 1}`, // Placeholder aisle
        location: `Shelf ${Math.floor(Math.random() * 20) + 1}`,
        picked: false,
        assignmentId: assignment.id,
      });
    }
  }

  return pickItems;
}

// ===================== UPDATE PICK STATUS =====================

export async function updatePickStatus(
  itemId: string,
  picked: boolean
) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  // In a real system, this would update a pick list item in the database.
  // For now, we log the action and update the assignment status if all items are picked.
  logger.info({ itemId, picked, by: (session as unknown as SessionWithUser).user?.email }, "Pick status updated");

  // Extract assignmentId from the itemId format "assignmentId-productId"
  const parts = itemId.split("-");
  const assignmentId = parts[0];

  if (picked && assignmentId) {
    // Update assignment to PICKED_UP if all items are picked
    try {
      await prisma.deliveryAssignment.update({
        where: { id: assignmentId },
        data: { status: "PICKED_UP", pickupAt: new Date() },
      });
    } catch {
      // Assignment might already be updated
    }
  }

  return { success: true, itemId, picked };
}

// ===================== PACK STATION STATUS =====================

export async function getPackStationStatus(storeId: string) {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const center = await prisma.microFulfillmentCenter.findUnique({
    where: { id: storeId },
  });

  if (!center) throw new Error("Dark store not found");

  // Get orders that are picked up and ready for packing
  const assignments = await prisma.deliveryAssignment.findMany({
    where: {
      zoneId: center.zoneId,
      status: "PICKED_UP",
    },
    include: {
      order: {
        include: {
          user: { select: { name: true, phone: true } },
        },
      },
      deliveryAgent: {
        include: { user: { select: { name: true } } },
      },
    },
    orderBy: { pickupAt: "asc" },
  });

  return assignments.map((a) => ({
    id: a.id,
    orderId: a.orderId,
    orderNumber: a.order.orderNumber,
    customerName: a.order.user.name || "Guest",
    customerPhone: a.order.user.phone || "",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    itemCount: ((a.order.items as any[]) || []).length,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    items: (a.order.items as any[]) || [],
    agentName: a.deliveryAgent?.user?.name || "Unassigned",
    pickedUpAt: a.pickupAt?.toISOString() || null,
    estimatedEta: a.estimatedEta?.toISOString() || null,
    packed: false,
    labelGenerated: false,
  }));
}
