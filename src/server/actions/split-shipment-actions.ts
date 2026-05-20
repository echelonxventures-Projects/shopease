"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getShipmentInfo(orderId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findFirst({
    where: { id: orderId, userId: session.user.id },
  });
  if (!order) throw new Error("Order not found");

  // Shipments are stored as JSON in order.notes for now
  try {
    const parsed = order.notes ? JSON.parse(order.notes) : {};
    return parsed.shipments || [];
  } catch {
    return [];
  }
}

export async function splitOrderIntoShipments(input: {
  orderId: string;
  shipments: Array<{
    items: Array<{ productId: string; quantity: number }>;
    address: string;
    shippingMethod: string;
  }>;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const order = await prisma.order.findFirst({
    where: { id: input.orderId, userId: session.user.id },
  });
  if (!order) throw new Error("Order not found");

  const shipments = input.shipments.map((s, idx) => ({
    shipmentNumber: idx + 1,
    items: s.items,
    address: s.address,
    shippingMethod: s.shippingMethod,
    status: "PENDING",
    trackingNumber: null,
    createdAt: new Date().toISOString(),
  }));

  return prisma.order.update({
    where: { id: input.orderId },
    data: {
      notes: JSON.stringify({ shipments, splitAt: new Date().toISOString() }),
    },
  });
}
