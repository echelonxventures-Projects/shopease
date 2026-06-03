"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

async function requireAdmin() {
  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") throw new Error("Forbidden");
}

// ─── Gateway CRUD ───────────────────────────────────────────────────────────────

export async function listGateways() {
  await requireAdmin();
  return prisma.paymentGateway.findMany({
    include: {
      regions: { include: { region: { select: { name: true } } } },
      methods: true,
      sites: { include: { site: { select: { name: true } } } },
      categories: { include: { category: { select: { name: true } } } },
      banks: true,
      commissions: true,
      _count: { select: { transactions: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function createGateway(data: { provider: string; name: string; logo?: string; description?: string }) {
  await requireAdmin();
  return prisma.paymentGateway.create({ data });
}

export async function updateGateway(id: string, data: { name?: string; logo?: string; description?: string; isActive?: boolean }) {
  await requireAdmin();
  return prisma.paymentGateway.update({ where: { id }, data });
}

export async function deleteGateway(id: string) {
  await requireAdmin();
  return prisma.paymentGateway.delete({ where: { id } });
}

// ─── Gateway ↔ Region Mapping ───────────────────────────────────────────────────

export async function assignGatewayToRegion(gatewayId: string, regionId: string, opts?: { isPrimary?: boolean; priority?: number; currency?: string; config?: Record<string, unknown> }) {
  await requireAdmin();
  return prisma.paymentGatewayRegion.upsert({
    where: { gatewayId_regionId: { gatewayId, regionId } },
    create: { gatewayId, regionId, isPrimary: opts?.isPrimary ?? false, priority: opts?.priority ?? 0, currency: opts?.currency, config: opts?.config as object },
    update: { isPrimary: opts?.isPrimary, priority: opts?.priority, currency: opts?.currency, config: opts?.config as object, isActive: true },
  });
}

export async function removeGatewayFromRegion(gatewayId: string, regionId: string) {
  await requireAdmin();
  return prisma.paymentGatewayRegion.update({ where: { gatewayId_regionId: { gatewayId, regionId } }, data: { isActive: false } });
}

// ─── Gateway ↔ Site/Platform Mapping ────────────────────────────────────────────

export async function assignGatewayToSite(gatewayId: string, siteId: string, opts?: { isPrimary?: boolean; priority?: number; config?: Record<string, unknown> }) {
  await requireAdmin();
  return prisma.paymentGatewaySite.upsert({
    where: { gatewayId_siteId: { gatewayId, siteId } },
    create: { gatewayId, siteId, isPrimary: opts?.isPrimary ?? false, priority: opts?.priority ?? 0, config: opts?.config as object },
    update: { isPrimary: opts?.isPrimary, priority: opts?.priority, config: opts?.config as object, isActive: true },
  });
}

export async function removeGatewayFromSite(gatewayId: string, siteId: string) {
  await requireAdmin();
  return prisma.paymentGatewaySite.update({ where: { gatewayId_siteId: { gatewayId, siteId } }, data: { isActive: false } });
}

// ─── Gateway ↔ Product Category Mapping ─────────────────────────────────────────

export async function assignGatewayToCategory(gatewayId: string, categoryId: string, priority?: number) {
  await requireAdmin();
  return prisma.paymentGatewayCategory.upsert({
    where: { gatewayId_categoryId: { gatewayId, categoryId } },
    create: { gatewayId, categoryId, priority: priority ?? 0 },
    update: { priority, isActive: true },
  });
}

export async function removeGatewayFromCategory(gatewayId: string, categoryId: string) {
  await requireAdmin();
  return prisma.paymentGatewayCategory.update({ where: { gatewayId_categoryId: { gatewayId, categoryId } }, data: { isActive: false } });
}

// ─── Gateway Methods (UPI/CC/DC/etc) ────────────────────────────────────────────

export async function setGatewayMethods(gatewayId: string, methods: { method: string; name: string; enabled: boolean; config?: Record<string, unknown> }[]) {
  await requireAdmin();
  for (const m of methods) {
    await prisma.paymentGatewayMethod.upsert({
      where: { gatewayId_method: { gatewayId, method: m.method as never } },
      create: { gatewayId, method: m.method as never, name: m.name, isEnabled: m.enabled, config: m.config as object },
      update: { name: m.name, isEnabled: m.enabled, config: m.config as object },
    });
  }
  return { success: true };
}

// ─── Gateway Banks ──────────────────────────────────────────────────────────────

export async function addGatewayBank(gatewayId: string, data: { bankName: string; bankCode: string; ifscPrefix?: string; methods: string[]; logo?: string }) {
  await requireAdmin();
  return prisma.paymentGatewayBank.upsert({
    where: { gatewayId_bankCode: { gatewayId, bankCode: data.bankCode } },
    create: { gatewayId, ...data },
    update: { ...data, isActive: true },
  });
}

export async function removeGatewayBank(gatewayId: string, bankCode: string) {
  await requireAdmin();
  return prisma.paymentGatewayBank.update({ where: { gatewayId_bankCode: { gatewayId, bankCode } }, data: { isActive: false } });
}

export async function listGatewayBanks(gatewayId: string) {
  await requireAdmin();
  return prisma.paymentGatewayBank.findMany({ where: { gatewayId, isActive: true }, orderBy: { bankName: "asc" } });
}

// ─── Gateway Commission ─────────────────────────────────────────────────────────

export async function setGatewayCommission(gatewayId: string, data: {
  method?: string;
  cardNetwork?: string;
  type: "FLAT" | "PERCENTAGE" | "TIERED";
  flatAmount?: number;
  percentage?: number;
  tiers?: { minAmount: number; maxAmount: number; rate: number }[];
  minCommission?: number;
  maxCommission?: number;
  currency?: string;
}) {
  await requireAdmin();
  return prisma.paymentGatewayCommission.create({
    data: { gatewayId, method: data.method, cardNetwork: data.cardNetwork, type: data.type, flatAmount: data.flatAmount, percentage: data.percentage, tiers: data.tiers as object, minCommission: data.minCommission, maxCommission: data.maxCommission, currency: data.currency || "INR" },
  });
}

export async function updateGatewayCommission(id: string, data: Partial<{ type: string; flatAmount: number; percentage: number; tiers: object; minCommission: number; maxCommission: number; isActive: boolean }>) {
  await requireAdmin();
  return prisma.paymentGatewayCommission.update({ where: { id }, data });
}

export async function deleteGatewayCommission(id: string) {
  await requireAdmin();
  return prisma.paymentGatewayCommission.delete({ where: { id } });
}

// ─── Resolution: Which PG for a given context ───────────────────────────────────

export async function resolveGatewayForContext(opts: { regionId?: string; siteId?: string; categoryId?: string; method?: string }) {
  // Priority: Category > Site > Region > Global
  if (opts.categoryId) {
    const catGw = await prisma.paymentGatewayCategory.findFirst({
      where: { categoryId: opts.categoryId, isActive: true },
      include: { gateway: true },
      orderBy: { priority: "asc" },
    });
    if (catGw) return catGw.gateway;
  }

  if (opts.siteId) {
    const siteGw = await prisma.paymentGatewaySite.findFirst({
      where: { siteId: opts.siteId, isActive: true },
      include: { gateway: true },
      orderBy: { priority: "asc" },
    });
    if (siteGw) return siteGw.gateway;
  }

  if (opts.regionId) {
    const regionGw = await prisma.paymentGatewayRegion.findFirst({
      where: { regionId: opts.regionId, isActive: true },
      include: { gateway: true },
      orderBy: { priority: "asc" },
    });
    if (regionGw) return regionGw.gateway;
  }

  // Fallback: first active gateway
  return prisma.paymentGateway.findFirst({ where: { isActive: true } });
}
