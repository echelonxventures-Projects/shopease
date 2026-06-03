"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * COMMISSION CHAIN SYSTEM
 * 
 * Supports unlimited stakeholders (gainers) per transaction.
 * Each chain has unlimited rules. Each rule can split to unlimited beneficiaries.
 * Fully configurable: by region, site, category, product, seller, gateway, method, network, brand, etc.
 * 
 * Flow: Order → resolve matching chains → calculate each stakeholder's share → distribute
 */

// ─── Types ──────────────────────────────────────────────────────────────────────

export type StakeholderType =
  | "PLATFORM"        // Platform owner
  | "SELLER"          // Marketplace seller
  | "AFFILIATE"       // Affiliate referrer
  | "INFLUENCER"      // Social influencer
  | "AGENT"           // Sales/delivery agent
  | "FRANCHISE"       // Franchise owner
  | "DISTRIBUTOR"     // Distributor
  | "MANUFACTURER"    // Manufacturer/brand
  | "PAYMENT_GATEWAY" // PG fees
  | "TAX_AUTHORITY"   // Tax collection
  | "LOGISTICS"       // Delivery partner
  | "WAREHOUSE"       // Warehouse/dark store
  | "INVESTOR"        // Revenue share investor
  | "CHARITY"         // Donation split
  | "REFERRER"        // User who referred buyer
  | "CASHBACK_POOL"   // Cashback reserve
  | "INSURANCE_POOL"  // Buyer protection fund
  | "CUSTOM";         // Any custom stakeholder

export type CommissionCalcType =
  | "FLAT"            // Fixed amount
  | "PERCENTAGE"      // % of base
  | "TIERED"          // Slab-based
  | "FORMULA"         // Custom formula (e.g. "base * 0.05 + 10")
  | "REMAINDER";      // Whatever is left after others

export type CommissionBase =
  | "ORDER_TOTAL"     // % of order total
  | "ITEM_PRICE"      // % of item price
  | "PROFIT_MARGIN"   // % of margin (price - cost)
  | "SHIPPING_FEE"    // % of shipping
  | "PAYMENT_AMOUNT"  // % of payment collected
  | "CUSTOM";         // Custom base from metadata

export interface CommissionCondition {
  field: string;      // e.g. "region", "site", "category", "product", "seller", "gateway", "method", "network", "brand", "orderAmount", "quantity", "customerTier"
  operator: "eq" | "neq" | "in" | "nin" | "gt" | "gte" | "lt" | "lte" | "contains" | "exists";
  value: string | number | string[];
}

// ─── Server Actions ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") throw new Error("Forbidden");
}

/** Create a commission chain (a set of rules that apply together) */
export async function createCommissionChain(data: {
  name: string;
  description?: string;
  priority?: number;
  conditions: CommissionCondition[];
  isActive?: boolean;
}) {
  await requireAdmin();
  return prisma.systemConfig.create({
    data: {
      key: `commission_chain.${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      value: JSON.stringify({ ...data, stakeholders: [], createdAt: new Date().toISOString() }),
    },
  });
}

/** Add a stakeholder (gainer) to a commission chain */
export async function addStakeholder(chainKey: string, stakeholder: {
  name: string;
  type: StakeholderType;
  entityId?: string;           // userId, sellerId, etc. (null = pool/system)
  calcType: CommissionCalcType;
  base: CommissionBase;
  value: number;               // flat amount or percentage
  formula?: string;            // for FORMULA type
  tiers?: { min: number; max: number; rate: number }[];
  minAmount?: number;
  maxAmount?: number;
  currency?: string;
  conditions?: CommissionCondition[]; // additional conditions for this stakeholder
  priority?: number;           // order of deduction (lower = first)
}) {
  await requireAdmin();
  const row = await prisma.systemConfig.findUnique({ where: { key: chainKey } });
  if (!row) throw new Error("Chain not found");

  const chain = JSON.parse(row.value);
  chain.stakeholders = chain.stakeholders || [];
  chain.stakeholders.push({ id: `sh_${Date.now()}`, ...stakeholder });

  await prisma.systemConfig.update({ where: { key: chainKey }, data: { value: JSON.stringify(chain) } });
  return { success: true, stakeholderCount: chain.stakeholders.length };
}

/** Remove a stakeholder from a chain */
export async function removeStakeholder(chainKey: string, stakeholderId: string) {
  await requireAdmin();
  const row = await prisma.systemConfig.findUnique({ where: { key: chainKey } });
  if (!row) throw new Error("Chain not found");

  const chain = JSON.parse(row.value);
  chain.stakeholders = (chain.stakeholders || []).filter((s: { id: string }) => s.id !== stakeholderId);

  await prisma.systemConfig.update({ where: { key: chainKey }, data: { value: JSON.stringify(chain) } });
  return { success: true };
}

/** List all commission chains */
export async function listCommissionChains() {
  await requireAdmin();
  const rows = await prisma.systemConfig.findMany({ where: { key: { startsWith: "commission_chain." } } });
  return rows.map((r) => ({ key: r.key, ...JSON.parse(r.value) }));
}

/** Update a chain's conditions or metadata */
export async function updateCommissionChain(chainKey: string, updates: { name?: string; conditions?: CommissionCondition[]; isActive?: boolean; priority?: number }) {
  await requireAdmin();
  const row = await prisma.systemConfig.findUnique({ where: { key: chainKey } });
  if (!row) throw new Error("Chain not found");

  const chain = { ...JSON.parse(row.value), ...updates };
  await prisma.systemConfig.update({ where: { key: chainKey }, data: { value: JSON.stringify(chain) } });
  return { success: true };
}

/** Delete a chain */
export async function deleteCommissionChain(chainKey: string) {
  await requireAdmin();
  await prisma.systemConfig.delete({ where: { key: chainKey } });
  return { success: true };
}

// ─── Commission Calculation Engine ──────────────────────────────────────────────

interface OrderContext {
  orderId: string;
  orderTotal: number;
  itemPrice?: number;
  costPrice?: number;
  shippingFee?: number;
  paymentAmount?: number;
  regionId?: string;
  siteId?: string;
  categoryId?: string;
  productId?: string;
  sellerId?: string;
  gatewayId?: string;
  method?: string;
  cardNetwork?: string;
  brandId?: string;
  customerTier?: string;
  quantity?: number;
  [key: string]: unknown; // extensible
}

interface CommissionSplit {
  stakeholderName: string;
  stakeholderType: StakeholderType;
  entityId?: string;
  amount: number;
  currency: string;
  chainKey: string;
  calcDetail: string;
}

function matchesConditions(conditions: CommissionCondition[], ctx: OrderContext): boolean {
  return conditions.every((c) => {
    const val = ctx[c.field];
    switch (c.operator) {
      case "eq": return val === c.value;
      case "neq": return val !== c.value;
      case "in": return Array.isArray(c.value) && c.value.includes(String(val));
      case "nin": return Array.isArray(c.value) && !c.value.includes(String(val));
      case "gt": return Number(val) > Number(c.value);
      case "gte": return Number(val) >= Number(c.value);
      case "lt": return Number(val) < Number(c.value);
      case "lte": return Number(val) <= Number(c.value);
      case "contains": return String(val).includes(String(c.value));
      case "exists": return val !== undefined && val !== null;
      default: return true;
    }
  });
}

function getBase(base: CommissionBase, ctx: OrderContext): number {
  switch (base) {
    case "ORDER_TOTAL": return ctx.orderTotal;
    case "ITEM_PRICE": return ctx.itemPrice || ctx.orderTotal;
    case "PROFIT_MARGIN": return (ctx.itemPrice || ctx.orderTotal) - (ctx.costPrice || 0);
    case "SHIPPING_FEE": return ctx.shippingFee || 0;
    case "PAYMENT_AMOUNT": return ctx.paymentAmount || ctx.orderTotal;
    default: return ctx.orderTotal;
  }
}

function calculateAmount(stakeholder: { calcType: CommissionCalcType; base: CommissionBase; value: number; formula?: string; tiers?: { min: number; max: number; rate: number }[]; minAmount?: number; maxAmount?: number }, ctx: OrderContext, remaining: number): number {
  const base = getBase(stakeholder.base, ctx);
  let amount = 0;

  switch (stakeholder.calcType) {
    case "FLAT":
      amount = stakeholder.value;
      break;
    case "PERCENTAGE":
      amount = base * (stakeholder.value / 100);
      break;
    case "TIERED":
      for (const tier of stakeholder.tiers || []) {
        if (base >= tier.min && base <= tier.max) { amount = base * (tier.rate / 100); break; }
      }
      break;
    case "FORMULA":
      try { amount = Function("base", "total", "margin", "remaining", `return ${stakeholder.formula}`)(base, ctx.orderTotal, (ctx.itemPrice || 0) - (ctx.costPrice || 0), remaining); } catch { amount = 0; }
      break;
    case "REMAINDER":
      amount = remaining;
      break;
  }

  if (stakeholder.minAmount && amount < stakeholder.minAmount) amount = stakeholder.minAmount;
  if (stakeholder.maxAmount && amount > stakeholder.maxAmount) amount = stakeholder.maxAmount;
  return Math.round(amount * 100) / 100;
}

/** Calculate all commission splits for an order */
export async function calculateCommissionSplits(ctx: OrderContext): Promise<CommissionSplit[]> {
  const rows = await prisma.systemConfig.findMany({ where: { key: { startsWith: "commission_chain." } } });
  const chains = rows.map((r) => ({ key: r.key, ...JSON.parse(r.value) }))
    .filter((c) => c.isActive !== false)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));

  const splits: CommissionSplit[] = [];
  let remaining = ctx.orderTotal;

  for (const chain of chains) {
    if (!matchesConditions(chain.conditions || [], ctx)) continue;

    const stakeholders = (chain.stakeholders || [])
      .filter((s: { conditions?: CommissionCondition[] }) => !s.conditions || matchesConditions(s.conditions, ctx))
      .sort((a: { priority?: number }, b: { priority?: number }) => (a.priority || 0) - (b.priority || 0));

    for (const sh of stakeholders) {
      const amount = calculateAmount(sh, ctx, remaining);
      if (amount > 0) {
        splits.push({
          stakeholderName: sh.name,
          stakeholderType: sh.type,
          entityId: sh.entityId,
          amount,
          currency: sh.currency || "INR",
          chainKey: chain.key,
          calcDetail: `${sh.calcType}: ${sh.value}${sh.calcType === "PERCENTAGE" ? "%" : ""} of ${sh.base}`,
        });
        remaining -= amount;
      }
    }
  }

  return splits;
}
