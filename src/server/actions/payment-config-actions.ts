"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// ─── Payment Method Types (expandable) ─────────────────────────────────────────

export const PAYMENT_METHODS = {
  UPI: { id: "UPI", label: "UPI", icon: "upi", category: "DIGITAL" },
  CREDIT_CARD: { id: "CREDIT_CARD", label: "Credit Card", icon: "cc", category: "CARD" },
  DEBIT_CARD: { id: "DEBIT_CARD", label: "Debit Card", icon: "dc", category: "CARD" },
  NET_BANKING: { id: "NET_BANKING", label: "Net Banking", icon: "bank", category: "DIGITAL" },
  WALLET: { id: "WALLET", label: "Wallet", icon: "wallet", category: "DIGITAL" },
  QR_CODE: { id: "QR_CODE", label: "QR Code", icon: "qr", category: "DIGITAL" },
  BNPL: { id: "BNPL", label: "Buy Now Pay Later", icon: "bnpl", category: "CREDIT" },
  EMI: { id: "EMI", label: "EMI", icon: "emi", category: "CREDIT" },
  COD: { id: "COD", label: "Cash on Delivery", icon: "cod", category: "OFFLINE" },
  BANK_TRANSFER: { id: "BANK_TRANSFER", label: "Bank Transfer / NEFT / RTGS", icon: "transfer", category: "DIGITAL" },
  CRYPTO: { id: "CRYPTO", label: "Cryptocurrency", icon: "crypto", category: "CRYPTO" },
  APPLE_PAY: { id: "APPLE_PAY", label: "Apple Pay", icon: "apple", category: "DIGITAL" },
  GOOGLE_PAY: { id: "GOOGLE_PAY", label: "Google Pay", icon: "gpay", category: "DIGITAL" },
  SAMSUNG_PAY: { id: "SAMSUNG_PAY", label: "Samsung Pay", icon: "samsung", category: "DIGITAL" },
  PAYPAL: { id: "PAYPAL", label: "PayPal", icon: "paypal", category: "DIGITAL" },
  AMAZON_PAY: { id: "AMAZON_PAY", label: "Amazon Pay", icon: "amazonpay", category: "DIGITAL" },
  KLARNA: { id: "KLARNA", label: "Klarna", icon: "klarna", category: "CREDIT" },
  AFTERPAY: { id: "AFTERPAY", label: "Afterpay", icon: "afterpay", category: "CREDIT" },
  PAYTM: { id: "PAYTM", label: "Paytm", icon: "paytm", category: "DIGITAL" },
  PHONEPE: { id: "PHONEPE", label: "PhonePe", icon: "phonepe", category: "DIGITAL" },
  WIRE_TRANSFER: { id: "WIRE_TRANSFER", label: "Wire Transfer (International)", icon: "wire", category: "DIGITAL" },
  CHECK: { id: "CHECK", label: "Cheque / Demand Draft", icon: "check", category: "OFFLINE" },
  STORE_CREDIT: { id: "STORE_CREDIT", label: "Store Credit", icon: "store", category: "INTERNAL" },
  GIFT_CARD: { id: "GIFT_CARD", label: "Gift Card", icon: "gift", category: "INTERNAL" },
} as const;

// ─── Card Networks (expandable) ─────────────────────────────────────────────────

export const CARD_NETWORKS = {
  VISA: { id: "VISA", label: "Visa", type: "INTERNATIONAL" },
  MASTERCARD: { id: "MASTERCARD", label: "Mastercard", type: "INTERNATIONAL" },
  AMEX: { id: "AMEX", label: "American Express", type: "INTERNATIONAL" },
  DISCOVER: { id: "DISCOVER", label: "Discover", type: "INTERNATIONAL" },
  DINERS: { id: "DINERS", label: "Diners Club", type: "INTERNATIONAL" },
  JCB: { id: "JCB", label: "JCB", type: "INTERNATIONAL" },
  UNIONPAY: { id: "UNIONPAY", label: "UnionPay", type: "INTERNATIONAL" },
  RUPAY: { id: "RUPAY", label: "RuPay", type: "DOMESTIC_IN" },
  MAESTRO: { id: "MAESTRO", label: "Maestro", type: "INTERNATIONAL" },
  ELO: { id: "ELO", label: "Elo", type: "DOMESTIC_BR" },
  MIR: { id: "MIR", label: "Mir", type: "DOMESTIC_RU" },
} as const;

// ─── Wallet Providers (expandable) ──────────────────────────────────────────────

export const WALLET_PROVIDERS = {
  PAYTM: { id: "PAYTM", label: "Paytm Wallet", region: "IN" },
  PHONEPE: { id: "PHONEPE", label: "PhonePe Wallet", region: "IN" },
  MOBIKWIK: { id: "MOBIKWIK", label: "MobiKwik", region: "IN" },
  FREECHARGE: { id: "FREECHARGE", label: "Freecharge", region: "IN" },
  AIRTEL_MONEY: { id: "AIRTEL_MONEY", label: "Airtel Money", region: "IN" },
  JIOMONEY: { id: "JIOMONEY", label: "Jio Money", region: "IN" },
  AMAZON_PAY: { id: "AMAZON_PAY", label: "Amazon Pay Balance", region: "GLOBAL" },
  PAYPAL_BALANCE: { id: "PAYPAL_BALANCE", label: "PayPal Balance", region: "GLOBAL" },
  ALIPAY: { id: "ALIPAY", label: "Alipay", region: "CN" },
  WECHAT_PAY: { id: "WECHAT_PAY", label: "WeChat Pay", region: "CN" },
  MPESA: { id: "MPESA", label: "M-Pesa", region: "AF" },
  GCASH: { id: "GCASH", label: "GCash", region: "PH" },
  GRABPAY: { id: "GRABPAY", label: "GrabPay", region: "SEA" },
} as const;

// ─── Crypto Currencies (expandable) ─────────────────────────────────────────────

export const CRYPTO_CURRENCIES = {
  BTC: { id: "BTC", label: "Bitcoin", network: "BITCOIN" },
  ETH: { id: "ETH", label: "Ethereum", network: "ETHEREUM" },
  USDT: { id: "USDT", label: "Tether (USDT)", network: "MULTI" },
  USDC: { id: "USDC", label: "USD Coin", network: "MULTI" },
  BNB: { id: "BNB", label: "BNB", network: "BSC" },
  SOL: { id: "SOL", label: "Solana", network: "SOLANA" },
  XRP: { id: "XRP", label: "XRP", network: "RIPPLE" },
} as const;

// ─── BNPL Providers (expandable) ────────────────────────────────────────────────

export const BNPL_PROVIDERS = {
  SIMPL: { id: "SIMPL", label: "Simpl", region: "IN", maxTenure: 1 },
  LAZYPAY: { id: "LAZYPAY", label: "LazyPay", region: "IN", maxTenure: 3 },
  ZESTMONEY: { id: "ZESTMONEY", label: "ZestMoney", region: "IN", maxTenure: 12 },
  KLARNA: { id: "KLARNA", label: "Klarna", region: "GLOBAL", maxTenure: 4 },
  AFTERPAY: { id: "AFTERPAY", label: "Afterpay", region: "GLOBAL", maxTenure: 4 },
  AFFIRM: { id: "AFFIRM", label: "Affirm", region: "US", maxTenure: 36 },
  SEZZLE: { id: "SEZZLE", label: "Sezzle", region: "US", maxTenure: 4 },
} as const;

// ─── Commission Structure Types ─────────────────────────────────────────────────

export type CommissionType = "FLAT" | "PERCENTAGE" | "TIERED" | "HYBRID" | "SUBSCRIPTION" | "REVENUE_SHARE";
export type CommissionScope = "GLOBAL" | "REGION" | "COUNTRY" | "SITE" | "MERCHANT" | "CATEGORY" | "PRODUCT" | "PAYMENT_METHOD";

export interface CommissionRule {
  id: string;
  name: string;
  type: CommissionType;
  scope: CommissionScope;
  scopeId?: string; // region/country/site/merchant/category ID
  paymentMethod?: string;
  cardNetwork?: string;
  flatAmount?: number;
  percentage?: number;
  tiers?: { minAmount: number; maxAmount: number; rate: number }[];
  minCommission?: number;
  maxCommission?: number;
  currency: string;
  isActive: boolean;
}

// ─── Server Actions ─────────────────────────────────────────────────────────────

async function requireAdmin() {
  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") throw new Error("Forbidden");
}

/** Get all payment methods with their enabled status per site/region */
export async function getPaymentMethodConfig(siteId?: string, regionId?: string) {
  await requireAdmin();
  const configs = await prisma.paymentGatewayMethod.findMany({
    where: { gateway: { regions: regionId ? { some: { regionId } } : undefined } },
    include: { gateway: { select: { name: true, provider: true } } },
  });
  return {
    methods: Object.values(PAYMENT_METHODS),
    cardNetworks: Object.values(CARD_NETWORKS),
    wallets: Object.values(WALLET_PROVIDERS),
    crypto: Object.values(CRYPTO_CURRENCIES),
    bnplProviders: Object.values(BNPL_PROVIDERS),
    configured: configs,
  };
}

/** Enable/disable a payment method for a site/region/merchant */
export async function togglePaymentMethod(data: {
  gatewayId: string;
  method: string;
  enabled: boolean;
  config?: Record<string, unknown>;
}) {
  await requireAdmin();
  const existing = await prisma.paymentGatewayMethod.findFirst({
    where: { gatewayId: data.gatewayId, method: data.method as never },
  });
  if (existing) {
    await prisma.paymentGatewayMethod.update({ where: { id: existing.id }, data: { isEnabled: data.enabled, config: data.config as object } });
  } else {
    await prisma.paymentGatewayMethod.create({
      data: { gatewayId: data.gatewayId, method: data.method as never, name: PAYMENT_METHODS[data.method as keyof typeof PAYMENT_METHODS]?.label || data.method, isEnabled: data.enabled, config: data.config as object },
    });
  }
  return { success: true };
}

/** Get commission rules */
export async function getCommissionRules(filters?: { scope?: CommissionScope; scopeId?: string }) {
  await requireAdmin();
  const where: Record<string, unknown> = {};
  if (filters?.scope) where.scope = filters.scope;
  if (filters?.scopeId) where.scopeId = filters.scopeId;

  const rules = await prisma.systemConfig.findMany({
    where: { key: { startsWith: "commission." } },
  });
  return rules.map((r) => ({ key: r.key, ...JSON.parse(r.value) as CommissionRule }));
}

/** Create/update a commission rule */
export async function upsertCommissionRule(rule: CommissionRule) {
  await requireAdmin();
  const key = `commission.${rule.scope.toLowerCase()}.${rule.scopeId || "default"}.${rule.paymentMethod || "all"}`;
  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value: JSON.stringify(rule) },
    update: { value: JSON.stringify(rule) },
  });
  return { success: true, key };
}

/** Delete a commission rule */
export async function deleteCommissionRule(key: string) {
  await requireAdmin();
  await prisma.systemConfig.delete({ where: { key } });
  return { success: true };
}

/** Get payment config for a specific merchant */
export async function getMerchantPaymentConfig(merchantId: string) {
  await requireAdmin();
  const configs = await prisma.systemConfig.findMany({
    where: { key: { startsWith: `merchant.${merchantId}.payment` } },
  });
  return Object.fromEntries(configs.map((c) => [c.key, c.value]));
}

/** Set merchant-specific payment overrides */
export async function setMerchantPaymentConfig(merchantId: string, config: {
  enabledMethods?: string[];
  enabledNetworks?: string[];
  commissionOverride?: Partial<CommissionRule>;
  settlementSchedule?: string;
  mdrOverride?: number;
}) {
  await requireAdmin();
  const key = `merchant.${merchantId}.payment.config`;
  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value: JSON.stringify(config) },
    update: { value: JSON.stringify(config) },
  });
  return { success: true };
}
