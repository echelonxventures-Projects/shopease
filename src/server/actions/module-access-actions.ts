"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

/**
 * MODULE ACCESS CONTROL
 * 
 * Super Admin → enables/disables modules per site/platform
 * Site Admin → can only configure modules that Super Admin has granted
 * 
 * Flow: Super Admin grants "payments" module to Site A → Site A admin can configure PG, methods, commissions for their site only
 */

export const ALL_MODULES = {
  // Payments & Commerce
  payments: { label: "Payments & Gateways", description: "Configure payment methods, gateways, commissions" },
  upi: { label: "UPI Payments", description: "UPI intent, QR, mandate" },
  wallet: { label: "Digital Wallet", description: "Wallet, KYC, P2P transfers" },
  bnpl: { label: "Buy Now Pay Later", description: "EMI, credit assessment" },
  cashback: { label: "Cashback & Rewards", description: "Cashback campaigns, scratch cards" },
  commissions: { label: "Commission Chains", description: "Multi-stakeholder commission splits" },
  pricing: { label: "Dynamic Pricing", description: "Surge, demand-based pricing" },
  promotions: { label: "Promotions & Coupons", description: "Promos, discounts, flash deals" },
  gift_cards: { label: "Gift Cards", description: "Gift card store, redemption" },

  // Delivery & Logistics
  delivery: { label: "Delivery & Logistics", description: "Zones, agents, tracking" },
  quick_commerce: { label: "Quick Commerce", description: "Dark stores, 10-min delivery" },
  surge_pricing: { label: "Surge Pricing", description: "Demand-based delivery fees" },
  delivery_otp: { label: "Delivery OTP", description: "OTP verification on delivery" },
  slot_management: { label: "Slot Management", description: "Delivery time slots" },

  // Products & Catalog
  products: { label: "Product Catalog", description: "Products, variants, categories" },
  inventory: { label: "Inventory", description: "Stock management, purchase orders" },
  bulk_upload: { label: "Bulk Upload", description: "CSV product imports" },
  reviews: { label: "Reviews & Moderation", description: "Review management, moderation" },

  // Users & Auth
  users: { label: "User Management", description: "Customers, roles, permissions" },
  sellers: { label: "Seller Marketplace", description: "Seller onboarding, payouts" },
  b2b: { label: "B2B Commerce", description: "Business accounts, RFQ" },
  affiliates: { label: "Affiliate Program", description: "Affiliate tracking, payouts" },

  // Services (Paytm-style)
  bills: { label: "Bill Payments", description: "BBPS bill payments" },
  recharge: { label: "Recharges", description: "Mobile/DTH recharge" },
  insurance: { label: "Insurance", description: "Insurance marketplace" },
  mutual_funds: { label: "Mutual Funds", description: "Investment platform" },
  gold: { label: "Digital Gold", description: "Gold buy/sell" },
  movies: { label: "Movie Tickets", description: "Movie/event booking" },
  travel: { label: "Travel Booking", description: "Flights, trains, hotels" },
  credit_score: { label: "Credit Score", description: "Credit bureau integration" },

  // Support & Communication
  support: { label: "Customer Support", description: "Tickets, live chat" },
  notifications: { label: "Notifications", description: "Push, SMS, email, WhatsApp" },

  // Analytics & Admin
  analytics: { label: "Analytics & Reports", description: "Dashboards, reports" },
  ai: { label: "AI/ML Platform", description: "Recommendations, chatbot, fraud" },
  cms: { label: "CMS & Content", description: "Pages, banners, FAQ" },
  settings: { label: "Site Settings", description: "Branding, locale, domain" },
} as const;

export type ModuleId = keyof typeof ALL_MODULES;

// ─── Super Admin: Grant/Revoke modules to sites ─────────────────────────────────

async function requireSuperAdmin() {
  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "SUPER_ADMIN") throw new Error("Forbidden: Super Admin only");
}

async function requireSiteAdmin() {
  const session = await getSession();
  if (!session?.user) throw new Error("Unauthorized");
  const role = (session.user as { role?: string }).role;
  const siteId = (session.user as { siteId?: string }).siteId;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN" && !siteId) throw new Error("Forbidden");
  return { role, siteId, userId: (session.user as { id: string }).id };
}

/** Super Admin: Get all modules with grant status per site */
export async function getSiteModuleGrants(siteId: string) {
  await requireSuperAdmin();
  const row = await prisma.systemConfig.findUnique({ where: { key: `site_modules.${siteId}` } });
  const granted: Record<string, boolean> = row ? JSON.parse(row.value) : {};
  return Object.entries(ALL_MODULES).map(([id, meta]) => ({
    id,
    ...meta,
    granted: granted[id] ?? false,
  }));
}

/** Super Admin: Grant or revoke a module for a site */
export async function setModuleGrant(siteId: string, moduleId: string, granted: boolean) {
  await requireSuperAdmin();
  const key = `site_modules.${siteId}`;
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  const current: Record<string, boolean> = row ? JSON.parse(row.value) : {};
  current[moduleId] = granted;
  await prisma.systemConfig.upsert({ where: { key }, create: { key, value: JSON.stringify(current) }, update: { value: JSON.stringify(current) } });
  return { success: true, moduleId, granted };
}

/** Super Admin: Bulk grant modules to a site */
export async function bulkSetModuleGrants(siteId: string, grants: Record<string, boolean>) {
  await requireSuperAdmin();
  const key = `site_modules.${siteId}`;
  const row = await prisma.systemConfig.findUnique({ where: { key } });
  const current: Record<string, boolean> = row ? JSON.parse(row.value) : {};
  Object.assign(current, grants);
  await prisma.systemConfig.upsert({ where: { key }, create: { key, value: JSON.stringify(current) }, update: { value: JSON.stringify(current) } });
  return { success: true };
}

// ─── Site Admin: Check access & configure within scope ──────────────────────────

/** Check if current site admin has access to a module */
export async function hasModuleAccess(moduleId: string): Promise<boolean> {
  const { role, siteId } = await requireSiteAdmin();
  if (role === "SUPER_ADMIN") return true; // Super admin has all access

  if (!siteId) return false;
  const row = await prisma.systemConfig.findUnique({ where: { key: `site_modules.${siteId}` } });
  if (!row) return false;
  const grants: Record<string, boolean> = JSON.parse(row.value);
  return grants[moduleId] === true;
}

/** Site Admin: Get list of modules they can access */
export async function getMyModules() {
  const { role, siteId } = await requireSiteAdmin();
  if (role === "SUPER_ADMIN") {
    return Object.entries(ALL_MODULES).map(([id, meta]) => ({ id, ...meta, granted: true }));
  }

  if (!siteId) return [];
  const row = await prisma.systemConfig.findUnique({ where: { key: `site_modules.${siteId}` } });
  const grants: Record<string, boolean> = row ? JSON.parse(row.value) : {};
  return Object.entries(ALL_MODULES)
    .filter(([id]) => grants[id] === true)
    .map(([id, meta]) => ({ id, ...meta, granted: true }));
}

/** Guard: wrap any site-admin action with module check */
export async function guardModule(moduleId: string) {
  const hasAccess = await hasModuleAccess(moduleId);
  if (!hasAccess) throw new Error(`Access denied: module "${moduleId}" not enabled for your site`);
}
