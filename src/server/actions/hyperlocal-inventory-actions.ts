"use server";

import { prisma } from "@/lib/prisma";

// Resolve hyperlocal availability for a product: among active dark stores that
// actually hold stock, choose the fastest-serving one using the store's zone
// delivery-time config (real data, not a hardcoded ETA).
export async function checkHyperlocalAvailability(productId: string, _pincode: string) {
  const stores = await prisma.microFulfillmentCenter.findMany({
    where: { isActive: true, locationId: { not: null } },
    select: { id: true, name: true, locationId: true, zone: { select: { deliveryTimeMin: true, deliveryTimeMax: true } } },
  });
  if (stores.length === 0) return { available: false, eta: null };

  const locationIds = stores.map((s) => s.locationId!).filter(Boolean);
  const inventories = await prisma.inventory.findMany({
    where: { productId, locationId: { in: locationIds }, quantity: { gt: 0 } },
    select: { locationId: true, quantity: true },
  });
  const stockByLocation = new Map(inventories.map((i) => [i.locationId, i.quantity]));

  const inStock = stores
    .filter((s) => (stockByLocation.get(s.locationId) ?? 0) > 0)
    .map((s) => ({
      storeId: s.id,
      storeName: s.name,
      stock: stockByLocation.get(s.locationId) ?? 0,
      eta: s.zone?.deliveryTimeMax ?? 30,
    }))
    .sort((a, b) => a.eta - b.eta);

  if (inStock.length === 0) return { available: false, eta: null };
  const best = inStock[0];
  return { available: true, ...best, alternatives: inStock.slice(1, 4) };
}

export async function reserveStock(productId: string, storeId: string, quantity: number) {
  const store = await prisma.microFulfillmentCenter.findUnique({ where: { id: storeId } });
  if (!store?.locationId) throw new Error("Store not found");

  const inventory = await prisma.inventory.findFirst({
    where: { productId, locationId: store.locationId, quantity: { gte: quantity } },
  });
  if (!inventory) throw new Error("Insufficient stock");

  await prisma.inventory.update({ where: { id: inventory.id }, data: { quantity: { decrement: quantity }, reserved: { increment: quantity } } });
  return { reserved: true, inventoryId: inventory.id };
}
