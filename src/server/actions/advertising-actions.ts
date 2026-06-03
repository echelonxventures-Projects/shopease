"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const num = (v: unknown) => Number(v);

/** Seller funds a sponsored campaign for a product (CPC + budget). */
export async function createAdCampaign(data: { productId: string; bid: number; budget: number }) {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  if (data.bid <= 0 || data.budget <= 0) throw new Error("Bid and budget must be positive");
  const sellerId = (session.user as { id: string }).id;
  return prisma.adCampaign.create({ data: { sellerId, productId: data.productId, bid: data.bid, budget: data.budget, status: "ACTIVE" } });
}

/** Sponsored placements: active campaigns with budget left, ranked by bid (auction). */
export async function getSponsoredProducts(categoryId?: string, limit = 4) {
  const campaigns = await prisma.adCampaign.findMany({
    where: { status: "ACTIVE" },
    orderBy: { bid: "desc" },
    take: limit * 3,
  });
  const live = campaigns.filter((c) => num(c.spent) < num(c.budget));
  if (!live.length) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: live.map((c) => c.productId) }, isActive: true, ...(categoryId ? { categoryId } : {}) },
    include: { brand: true, category: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  const ranked = live
    .filter((c) => byId.has(c.productId))
    .slice(0, limit)
    .map((c) => ({ campaignId: c.id, sponsored: true as const, bid: num(c.bid), product: { ...byId.get(c.productId)!, price: num(byId.get(c.productId)!.price) } }));

  // count impressions for served placements
  await prisma.adCampaign.updateMany({ where: { id: { in: ranked.map((r) => r.campaignId) } }, data: { impressions: { increment: 1 } } });
  return ranked;
}

/** Charge a click: spend += bid; exhaust the campaign when budget is consumed. */
export async function recordAdClick(campaignId: string) {
  const c = await prisma.adCampaign.findUnique({ where: { id: campaignId } });
  if (!c || c.status !== "ACTIVE") return { charged: false };
  const spent = num(c.spent) + num(c.bid);
  await prisma.adCampaign.update({
    where: { id: campaignId },
    data: { clicks: { increment: 1 }, spent, ...(spent >= num(c.budget) ? { status: "EXHAUSTED" } : {}) },
  });
  return { charged: true, spent };
}

export async function getMyCampaigns() {
  const session = await getSession();
  if (!session?.user) return [];
  const sellerId = (session.user as { id: string }).id;
  const rows = await prisma.adCampaign.findMany({ where: { sellerId }, orderBy: { createdAt: "desc" } });
  return rows.map((c) => ({
    ...c,
    bid: num(c.bid),
    budget: num(c.budget),
    spent: num(c.spent),
    ctr: c.impressions ? Math.round((c.clicks / c.impressions) * 1000) / 10 : 0,
  }));
}
