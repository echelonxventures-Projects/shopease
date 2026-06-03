"use server";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// Split a single order into multiple shipments (different items/addresses/methods),
// each independently trackable. Shipment state is persisted on `order.metadata`.

interface Shipment {
  shipmentNumber: number;
  items: Array<{ productId: string; quantity: number }>;
  address: string;
  shippingMethod: string;
  status: string;
  trackingNumber: string | null;
  createdAt: string;
  updatedAt?: string;
}

function readShipments(metadata: unknown, notes: string | null): Shipment[] {
  const meta = (metadata as Record<string, unknown>) || {};
  if (Array.isArray(meta.shipments)) return meta.shipments as Shipment[];
  // Backward-compat: older records stored shipments in notes JSON.
  try {
    const parsed = notes ? JSON.parse(notes) : {};
    return Array.isArray(parsed.shipments) ? parsed.shipments : [];
  } catch {
    return [];
  }
}

async function ownedOrder(orderId: string, userId: string) {
  const order = await prisma.order.findFirst({ where: { id: orderId, userId }, select: { id: true, metadata: true, notes: true } });
  if (!order) throw new Error("Order not found");
  return order;
}

export async function getShipmentInfo(orderId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const order = await ownedOrder(orderId, session.user.id);
  return readShipments(order.metadata, order.notes);
}

export async function splitOrderIntoShipments(input: {
  orderId: string;
  shipments: Array<{ items: Array<{ productId: string; quantity: number }>; address: string; shippingMethod: string }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (!input.shipments?.length) throw new Error("At least one shipment is required");

  const order = await ownedOrder(input.orderId, session.user.id);
  const shipments: Shipment[] = input.shipments.map((s, idx) => ({
    shipmentNumber: idx + 1,
    items: s.items,
    address: s.address,
    shippingMethod: s.shippingMethod,
    status: "PENDING",
    trackingNumber: null,
    createdAt: new Date().toISOString(),
  }));

  const meta = (order.metadata as Record<string, unknown>) || {};
  return prisma.order.update({
    where: { id: input.orderId },
    data: { metadata: { ...meta, shipments, splitAt: new Date().toISOString() } as unknown as Prisma.InputJsonValue },
  });
}

export async function updateShipmentStatus(input: {
  orderId: string;
  shipmentNumber: number;
  status: string;
  trackingNumber?: string;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const order = await ownedOrder(input.orderId, session.user.id);

  const shipments = readShipments(order.metadata, order.notes);
  const target = shipments.find((s) => s.shipmentNumber === input.shipmentNumber);
  if (!target) throw new Error("Shipment not found");
  target.status = input.status;
  if (input.trackingNumber !== undefined) target.trackingNumber = input.trackingNumber;
  target.updatedAt = new Date().toISOString();

  const meta = (order.metadata as Record<string, unknown>) || {};
  await prisma.order.update({
    where: { id: input.orderId },
    data: { metadata: { ...meta, shipments } as unknown as Prisma.InputJsonValue },
  });
  return target;
}
