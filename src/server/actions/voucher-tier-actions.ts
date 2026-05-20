"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TierBalanceMode } from "@prisma/client";

// ===================== ADMIN: VOUCHER TIER MANAGEMENT =====================

export async function getVoucherTiersAdmin(regionId?: string | null) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const where: any = {};
  if (regionId !== undefined) {
    where.regionId = regionId || null;
  }

  const tiers = await prisma.voucherTier.findMany({
    where,
    include: {
      region: true,
      _count: { select: { vouchers: true, userBalances: true, giftCards: true } },
    },
    orderBy: { sortOrder: "asc" },
  });
  return tiers.map((t) => ({
    ...t,
    minPurchasePrice: t.minPurchasePrice ? Number(t.minPurchasePrice) : null,
    maxRedemptionPerOrder: t.maxRedemptionPerOrder ? Number(t.maxRedemptionPerOrder) : null,
    region: t.region ? { ...t.region, taxRate: Number(t.region.taxRate) } : null,
  }));
}

export async function createVoucherTier(data: {
  slug: string;
  name: string;
  icon: string;
  description?: string;
  color?: string;
  balanceMode?: string;
  minPurchasePrice?: number;
  maxRedemptionPerOrder?: number;
  sortOrder?: number;
  isActive?: boolean;
  regionId?: string | null;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  return prisma.voucherTier.create({
    data: {
      slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      name: data.name,
      icon: data.icon,
      description: data.description,
      color: data.color || "#2563eb",
      balanceMode: (data.balanceMode || "SHARED") as TierBalanceMode,
      minPurchasePrice: data.minPurchasePrice,
      maxRedemptionPerOrder: data.maxRedemptionPerOrder ?? 100,
      sortOrder: data.sortOrder ?? 0,
      regionId: data.regionId || null,
      isActive: data.isActive ?? true,
    },
  });
}

export async function updateVoucherTier(
  id: string,
  data: {
    name?: string;
    icon?: string;
    description?: string;
    color?: string;
    balanceMode?: string;
    minPurchasePrice?: number;
    maxRedemptionPerOrder?: number;
    sortOrder?: number;
    isActive?: boolean;
    regionId?: string | null;
  }
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const updateData: any = { ...data };
  if (data.balanceMode) updateData.balanceMode = data.balanceMode as TierBalanceMode;

  return prisma.voucherTier.update({ where: { id }, data: updateData });
}

export async function deleteVoucherTier(id: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  // Check if tier has vouchers
  const count = await prisma.voucher.count({ where: { voucherTierId: id } });
  if (count > 0) throw new Error(`Cannot delete tier with ${count} voucher(s). Reassign them first.`);

  return prisma.voucherTier.delete({ where: { id } });
}

export async function getTierStats(tierId: string) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const [totalBalance, totalRedemptions, activeVouchers, uniqueUsers] = await Promise.all([
    prisma.voucherTierBalance.aggregate({
      where: { voucherTierId: tierId },
      _sum: { balance: true },
    }),
    prisma.voucherRedemption.count({
      where: { voucher: { voucherTierId: tierId } },
    }),
    prisma.voucher.count({
      where: { voucherTierId: tierId, isActive: true },
    }),
    prisma.voucherTierBalance.count({
      where: { voucherTierId: tierId, balance: { gt: 0 } },
    }),
  ]);

  return {
    totalBalance: totalBalance._sum.balance?.toNumber() || 0,
    totalRedemptions,
    activeVouchers,
    uniqueUsers,
  };
}
