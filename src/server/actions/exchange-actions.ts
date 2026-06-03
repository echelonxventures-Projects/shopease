"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { ALL_EXCHANGES, getExchangesByRegion, getExchangesByType, getExchangesByCountry, isExchangeOpen } from "@/lib/markets/exchanges";
import type { ExchangeConfig } from "@/lib/markets/exchanges";

/** Get all exchanges from DB (seeded from config) */
export async function getExchanges(filters?: { region?: string; marketType?: string; country?: string; isActive?: boolean }) {
  const where: any = {};
  if (filters?.region) where.region = filters.region;
  if (filters?.marketType) where.marketType = filters.marketType;
  if (filters?.country) where.country = filters.country;
  if (filters?.isActive !== undefined) where.isActive = filters.isActive;
  return prisma.tradingExchange.findMany({ where, orderBy: [{ region: "asc" }, { name: "asc" }] });
}

/** Get single exchange */
export async function getExchange(code: string) {
  return prisma.tradingExchange.findUnique({ where: { code } });
}

/** Seed all exchanges from config into DB */
export async function seedExchanges() {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  let created = 0, updated = 0;
  for (const ex of ALL_EXCHANGES) {
    const result = await prisma.tradingExchange.upsert({
      where: { code: ex.code },
      create: { code: ex.code, name: ex.name, country: ex.country, region: ex.region, timezone: ex.timezone, currency: ex.currency, marketType: ex.marketType, openTime: ex.openTime, closeTime: ex.closeTime, preMarketOpen: ex.preMarketOpen, postMarketClose: ex.postMarketClose, tradingDays: ex.tradingDays || ["MON", "TUE", "WED", "THU", "FRI"], mic: ex.mic, suffix: ex.suffix, website: ex.website, description: ex.description },
      update: { name: ex.name, country: ex.country, region: ex.region, timezone: ex.timezone, currency: ex.currency, marketType: ex.marketType },
    });
    if (result.createdAt.getTime() === result.updatedAt.getTime()) created++; else updated++;
  }
  return { total: ALL_EXCHANGES.length, created, updated };
}

/** Create a custom exchange */
export async function createExchange(data: ExchangeConfig) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.tradingExchange.create({
    data: { code: data.code, name: data.name, country: data.country, region: data.region, timezone: data.timezone, currency: data.currency, marketType: data.marketType, openTime: data.openTime, closeTime: data.closeTime, preMarketOpen: data.preMarketOpen, postMarketClose: data.postMarketClose, tradingDays: data.tradingDays || ["MON", "TUE", "WED", "THU", "FRI"], mic: data.mic, suffix: data.suffix, website: data.website, description: data.description },
  });
}

/** Toggle exchange active status */
export async function toggleExchange(code: string, isActive: boolean) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.tradingExchange.update({ where: { code }, data: { isActive } });
}

/** Delete exchange */
export async function deleteExchange(code: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.tradingExchange.delete({ where: { code } });
}

/** Get exchange status (open/closed) from config */
export async function getExchangeStatuses() {
  const exchanges = await prisma.tradingExchange.findMany({ where: { isActive: true } });
  return exchanges.map((ex) => {
    const config = ALL_EXCHANGES.find((c) => c.code === ex.code);
    return { code: ex.code, name: ex.name, region: ex.region, marketType: ex.marketType, isOpen: config ? isExchangeOpen(config) : false };
  });
}

/** Get available regions */
export async function getAvailableRegions() {
  const regions = await prisma.tradingExchange.groupBy({ by: ["region"], _count: true, where: { isActive: true } });
  return regions.map((r) => ({ region: r.region, count: r._count }));
}

/** Get available market types */
export async function getAvailableMarketTypes() {
  const types = await prisma.tradingExchange.groupBy({ by: ["marketType"], _count: true, where: { isActive: true } });
  return types.map((t) => ({ marketType: t.marketType, count: t._count }));
}

/** Static config helpers (no DB needed) */
export async function getExchangeConfig() {
  return { exchanges: ALL_EXCHANGES, byRegion: (r: string) => getExchangesByRegion(r), byType: (t: string) => getExchangesByType(t), byCountry: (c: string) => getExchangesByCountry(c) };
}
