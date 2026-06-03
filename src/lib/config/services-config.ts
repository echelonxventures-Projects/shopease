/**
 * Central Services Config Registry
 * All external integrations read from here. Zero hardcoding.
 * Providers are plug-and-play — swap by changing config, not code.
 */

import { CONFIG_KEYS } from "./config-keys";

// ─── Provider Interface ────────────────────────────────────────────────────────

export interface ServiceProvider<T = unknown> {
  readonly name: string;
  initialize(config: Record<string, string>): Promise<void>;
  execute(method: string, params: T): Promise<unknown>;
  healthCheck(): Promise<boolean>;
}

// ─── Provider Registry ─────────────────────────────────────────────────────────

const providerRegistry = new Map<string, Map<string, ServiceProvider>>();

export function registerServiceProvider(category: string, provider: ServiceProvider) {
  if (!providerRegistry.has(category)) providerRegistry.set(category, new Map());
  providerRegistry.get(category)!.set(provider.name, provider);
}

export function getServiceProvider(category: string, name?: string): ServiceProvider | undefined {
  const providers = providerRegistry.get(category);
  if (!providers) return undefined;
  if (name) return providers.get(name);
  return providers.values().next().value; // default first registered
}

export function listProviders(category: string): string[] {
  return Array.from(providerRegistry.get(category)?.keys() || []);
}

// ─── Config Resolver ───────────────────────────────────────────────────────────

type ConfigStore = Map<string, string>;
let configCache: ConfigStore = new Map();
let configLoaded = false;

/** Load config from env + DB (call once at startup or on reload) */
export async function loadServicesConfig() {
  const { prisma } = await import("@/lib/prisma");
  const rows = await prisma.systemConfig.findMany();
  configCache = new Map(rows.map((r) => [r.key, r.value]));
  configLoaded = true;
}

/** Get a config value with env override → DB → default fallback */
export function getConfig(key: string, defaultValue = ""): string {
  // Env override: convert dot notation to UPPER_SNAKE (services.upi.provider → SERVICES_UPI_PROVIDER)
  const envKey = key.replace(/\./g, "_").toUpperCase();
  if (process.env[envKey]) return process.env[envKey]!;
  if (configCache.has(key)) return configCache.get(key)!;
  return defaultValue;
}

export function getConfigNumber(key: string, defaultValue: number): number {
  const v = getConfig(key, String(defaultValue));
  return Number(v) || defaultValue;
}

export function getConfigBool(key: string, defaultValue: boolean): boolean {
  const v = getConfig(key, String(defaultValue));
  return v === "true" || v === "1";
}

// ─── Service-Specific Config Accessors ─────────────────────────────────────────

export const ServicesConfig = {
  upi: () => ({
    provider: getConfig(CONFIG_KEYS.UPI_PROVIDER, "razorpay"),
    merchantVpa: getConfig(CONFIG_KEYS.UPI_MERCHANT_VPA, ""),
    mandateEnabled: getConfigBool(CONFIG_KEYS.UPI_MANDATE_ENABLED, false),
  }),
  bills: () => ({
    provider: getConfig(CONFIG_KEYS.BBPS_PROVIDER, "stub"),
    apiUrl: getConfig(CONFIG_KEYS.BBPS_API_URL, ""),
    apiKey: getConfig(CONFIG_KEYS.BBPS_API_KEY, ""),
  }),
  recharge: () => ({
    provider: getConfig(CONFIG_KEYS.RECHARGE_PROVIDER, "stub"),
    apiUrl: getConfig(CONFIG_KEYS.RECHARGE_API_URL, ""),
    apiKey: getConfig(CONFIG_KEYS.RECHARGE_API_KEY, ""),
  }),
  gold: () => ({
    provider: getConfig(CONFIG_KEYS.GOLD_PROVIDER, "stub"),
    apiUrl: getConfig(CONFIG_KEYS.GOLD_API_URL, ""),
    apiKey: getConfig(CONFIG_KEYS.GOLD_API_KEY, ""),
    minBuyAmount: getConfigNumber(CONFIG_KEYS.GOLD_MIN_BUY_AMOUNT, 10),
  }),
  insurance: () => ({
    provider: getConfig(CONFIG_KEYS.INSURANCE_PROVIDER, "stub"),
    apiUrl: getConfig(CONFIG_KEYS.INSURANCE_API_URL, ""),
    apiKey: getConfig(CONFIG_KEYS.INSURANCE_API_KEY, ""),
  }),
  mutualFunds: () => ({
    provider: getConfig(CONFIG_KEYS.MF_PROVIDER, "stub"),
    apiUrl: getConfig(CONFIG_KEYS.MF_API_URL, ""),
    apiKey: getConfig(CONFIG_KEYS.MF_API_KEY, ""),
    kycRequired: getConfigBool(CONFIG_KEYS.MF_KYC_REQUIRED, true),
  }),
  movies: () => ({
    provider: getConfig(CONFIG_KEYS.MOVIES_PROVIDER, "stub"),
    apiUrl: getConfig(CONFIG_KEYS.MOVIES_API_URL, ""),
    apiKey: getConfig(CONFIG_KEYS.MOVIES_API_KEY, ""),
  }),
  travel: () => ({
    provider: getConfig(CONFIG_KEYS.TRAVEL_PROVIDER, "stub"),
    apiUrl: getConfig(CONFIG_KEYS.TRAVEL_API_URL, ""),
    apiKey: getConfig(CONFIG_KEYS.TRAVEL_API_KEY, ""),
  }),
  creditScore: () => ({
    provider: getConfig(CONFIG_KEYS.CREDIT_SCORE_PROVIDER, "stub"),
    apiUrl: getConfig(CONFIG_KEYS.CREDIT_SCORE_API_URL, ""),
    apiKey: getConfig(CONFIG_KEYS.CREDIT_SCORE_API_KEY, ""),
  }),
  bnpl: () => ({
    provider: getConfig(CONFIG_KEYS.BNPL_PROVIDER, "internal"),
    minOrderAmount: getConfigNumber(CONFIG_KEYS.BNPL_MIN_ORDER_AMOUNT, 500),
    maxTenure: getConfigNumber(CONFIG_KEYS.BNPL_MAX_TENURE_MONTHS, 12),
    noCostEmiMonths: getConfigNumber(CONFIG_KEYS.BNPL_NO_COST_EMI_MONTHS, 3),
    interestRate: getConfigNumber(CONFIG_KEYS.BNPL_INTEREST_RATE, 14) / 100,
  }),
  cashback: () => ({
    enabled: getConfigBool(CONFIG_KEYS.CASHBACK_ENABLED, true),
    probability: getConfigNumber(CONFIG_KEYS.CASHBACK_DEFAULT_PROBABILITY, 70) / 100,
    maxPercentage: getConfigNumber(CONFIG_KEYS.CASHBACK_MAX_PERCENTAGE, 10),
    maxAmount: getConfigNumber(CONFIG_KEYS.CASHBACK_MAX_AMOUNT, 200),
  }),
  merchant: () => ({
    settlementSchedule: getConfig(CONFIG_KEYS.MERCHANT_SETTLEMENT_SCHEDULE, "T+1"),
    mdrPercentage: getConfigNumber(CONFIG_KEYS.MERCHANT_MDR_PERCENTAGE, 2) / 100,
  }),
  deliveryPromise: () => ({
    avgSpeedKmh: getConfigNumber(CONFIG_KEYS.PROMISE_AVG_SPEED_KMH, 20),
    basePrepMin: getConfigNumber(CONFIG_KEYS.PROMISE_BASE_PREP_MIN, 3),
    perItemPrepMin: getConfigNumber(CONFIG_KEYS.PROMISE_PER_ITEM_PREP_MIN, 0.5),
    slaBreachAlert: getConfigBool(CONFIG_KEYS.PROMISE_SLA_BREACH_ALERT, true),
  }),
  deliveryOtp: () => ({
    enabled: getConfigBool(CONFIG_KEYS.DELIVERY_OTP_ENABLED, true),
    length: getConfigNumber(CONFIG_KEYS.DELIVERY_OTP_LENGTH, 4),
    expiryMin: getConfigNumber(CONFIG_KEYS.DELIVERY_OTP_EXPIRY_MIN, 30),
  }),
  surge: () => ({
    displayEnabled: getConfigBool(CONFIG_KEYS.SURGE_DISPLAY_ENABLED, true),
    baseFee: getConfigNumber(CONFIG_KEYS.SURGE_BASE_FEE, 25),
    demandThreshold: getConfigNumber(CONFIG_KEYS.SURGE_DEMAND_THRESHOLD, 20),
    windowMin: getConfigNumber(CONFIG_KEYS.SURGE_WINDOW_MIN, 30),
  }),
  push: () => ({
    provider: getConfig(CONFIG_KEYS.PUSH_PROVIDER, "fcm"),
    fcmServiceAccount: getConfig(CONFIG_KEYS.PUSH_FCM_SERVICE_ACCOUNT, ""),
  }),
  authAnomaly: () => ({
    enabled: getConfigBool(CONFIG_KEYS.AUTH_ANOMALY_ENABLED, true),
    rapidSwitchMin: getConfigNumber(CONFIG_KEYS.AUTH_ANOMALY_RAPID_SWITCH_MIN, 5),
    alertOnNewIp: getConfigBool(CONFIG_KEYS.AUTH_ANOMALY_ALERT_ON_NEW_IP, true),
  }),
  wallet: () => ({
    kycRequired: getConfigBool(CONFIG_KEYS.WALLET_KYC_REQUIRED, true),
    limitWithoutKyc: getConfigNumber(CONFIG_KEYS.WALLET_LIMIT_WITHOUT_KYC, 10000),
    limitWithKyc: getConfigNumber(CONFIG_KEYS.WALLET_LIMIT_WITH_KYC, 100000),
    p2pEnabled: getConfigBool(CONFIG_KEYS.WALLET_P2P_ENABLED, true),
  }),
  instantRefund: () => ({
    enabled: getConfigBool(CONFIG_KEYS.INSTANT_REFUND_ENABLED, true),
    maxAmount: getConfigNumber(CONFIG_KEYS.INSTANT_REFUND_MAX_AMOUNT, 500),
    maxOrderAgeHours: getConfigNumber(CONFIG_KEYS.INSTANT_REFUND_MAX_ORDER_AGE_HOURS, 24),
  }),
};
