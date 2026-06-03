"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/** Enroll a product into platform fulfillment at a micro-fulfillment center and stock it. */
export async function enrollFba(productId: string, mfcId: string, units: number) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const sellerId = (session.user as { id: string }).id;
  if (units <= 0) throw new Error("Units must be positive");

  const mfc = await prisma.microFulfillmentCenter.findUnique({ where: { id: mfcId }, select: { locationId: true } });
  if (!mfc?.locationId) throw new Error("Fulfillment center not found");

  const enrollment = await prisma.fbaEnrollment.create({ data: { productId, sellerId, mfcId, units, status: "ACTIVE" } });

  // Stock the product at the center's location (Inventory unique has nullable supplierId → find-or-create)
  const existing = await prisma.inventory.findFirst({ where: { productId, locationId: mfc.locationId } });
  if (existing) await prisma.inventory.update({ where: { id: existing.id }, data: { quantity: { increment: units } } });
  else await prisma.inventory.create({ data: { productId, locationId: mfc.locationId, quantity: units } });

  return { enrollmentId: enrollment.id, productId, mfcId, units, status: enrollment.status };
}

export async function getMyFbaProducts() {
  const session = await getSession();
  if (!session?.user) return [];
  const sellerId = (session.user as { id: string }).id;
  const enrollments = await prisma.fbaEnrollment.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" } });
  if (!enrollments.length) return [];
  const products = await prisma.product.findMany({ where: { id: { in: enrollments.map((e) => e.productId) } }, select: { id: true, name: true, slug: true, images: true } });
  const byId = new Map(products.map((p) => [p.id, p]));
  return enrollments.map((e) => ({ ...e, product: byId.get(e.productId) || null }));
}

export async function getFbaInventory(mfcId: string) {
  return prisma.fbaEnrollment.findMany({ where: { mfcId, status: "ACTIVE" }, orderBy: { createdAt: "desc" } });
}
