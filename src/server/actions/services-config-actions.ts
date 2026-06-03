"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

async function requireSuperAdmin() {
  const session = await getSession();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "SUPER_ADMIN" && role !== "ADMIN") throw new Error("Forbidden: Super Admin only");
  return session;
}

/** All toggleable services with their config keys */
const SERVICE_TOGGLES = [
  // Payments & Fintech
  { key: "upi_mandate", label: "UPI Mandate / Autopay", category: "payments", configKey: CONFIG_KEYS.UPI_MANDATE_ENABLED },
  { key: "wallet_p2p", label: "Wallet P2P Transfers", category: "payments", configKey: CONFIG_KEYS.WALLET_P2P_ENABLED },
  { key: "wallet_kyc", label: "Wallet KYC Requirement", category: "payments", configKey: CONFIG_KEYS.WALLET_KYC_REQUIRED },
  { key: "cashback", label: "Cashback Engine", category: "payments", configKey: CONFIG_KEYS.CASHBACK_ENABLED },
  { key: "instant_refund", label: "Instant Refunds", category: "payments", configKey: CONFIG_KEYS.INSTANT_REFUND_ENABLED },

  // Delivery & Logistics
  { key: "delivery_otp", label: "Delivery OTP Verification", category: "delivery", configKey: CONFIG_KEYS.DELIVERY_OTP_ENABLED },
  { key: "surge_display", label: "Surge Pricing Display", category: "delivery", configKey: CONFIG_KEYS.SURGE_DISPLAY_ENABLED },
  { key: "surge_engine", label: "Surge Pricing Engine", category: "delivery", configKey: CONFIG_KEYS.SURGE_ENABLED },
  { key: "promise_sla", label: "Delivery SLA Breach Alerts", category: "delivery", configKey: CONFIG_KEYS.PROMISE_SLA_BREACH_ALERT },
  { key: "batch_assign", label: "Batch Delivery Assignment", category: "delivery", configKey: CONFIG_KEYS.DELIVERY_BATCH_ASSIGN_ENABLED },

  // Notifications
  { key: "push_notif", label: "Push Notifications", category: "notifications", configKey: CONFIG_KEYS.NOTIFICATION_PUSH_ENABLED },
  { key: "sms_notif", label: "SMS Notifications", category: "notifications", configKey: CONFIG_KEYS.NOTIFICATION_SMS_ENABLED },
  { key: "email_notif", label: "Email Notifications", category: "notifications", configKey: CONFIG_KEYS.NOTIFICATION_EMAIL_ENABLED },
  { key: "whatsapp_notif", label: "WhatsApp Notifications", category: "notifications", configKey: CONFIG_KEYS.NOTIFICATION_WHATSAPP_ENABLED },

  // Security
  { key: "auth_anomaly", label: "Login Anomaly Detection", category: "security", configKey: CONFIG_KEYS.AUTH_ANOMALY_ENABLED },
  { key: "mfa", label: "Multi-Factor Authentication", category: "security", configKey: CONFIG_KEYS.MFA_ENABLED },
  { key: "mfa_admin", label: "Enforce MFA for Admins", category: "security", configKey: CONFIG_KEYS.MFA_ENFORCE_ADMIN },
  { key: "fraud_engine", label: "Fraud Detection Engine", category: "security", configKey: CONFIG_KEYS.FRAUD_ENABLED },
  { key: "circuit_breaker", label: "Circuit Breakers", category: "security", configKey: CONFIG_KEYS.CIRCUIT_BREAKER_ENABLED },

  // Commerce
  { key: "dynamic_pricing", label: "Dynamic Pricing", category: "commerce", configKey: CONFIG_KEYS.DYNAMIC_PRICING_ENABLED },
  { key: "gamification", label: "Gamification (Spin/Scratch)", category: "commerce", configKey: CONFIG_KEYS.GAMIFICATION_ENABLED },
  { key: "referral", label: "Referral Program", category: "commerce", configKey: CONFIG_KEYS.REFERRAL_ENABLED },
  { key: "cart_abandon", label: "Cart Abandonment Recovery", category: "commerce", configKey: CONFIG_KEYS.CART_ABANDON_ENABLED },

  // Observability
  { key: "monitoring", label: "Monitoring & Alerts", category: "observability", configKey: CONFIG_KEYS.MONITORING_ENABLED },
  { key: "tracing", label: "Distributed Tracing", category: "observability", configKey: CONFIG_KEYS.MONITORING_TRACING_ENABLED },
  { key: "web_vitals", label: "Web Vitals Tracking", category: "observability", configKey: CONFIG_KEYS.PERFORMANCE_WEB_VITALS_ENABLED },
  { key: "gdpr_consent", label: "GDPR Cookie Consent", category: "observability", configKey: CONFIG_KEYS.GDPR_COOKIE_CONSENT_ENABLED },
];

/** Provider config keys exposed to admin */
const PROVIDER_CONFIGS = [
  CONFIG_KEYS.UPI_PROVIDER,
  CONFIG_KEYS.UPI_MERCHANT_VPA,
  CONFIG_KEYS.BBPS_PROVIDER,
  CONFIG_KEYS.RECHARGE_PROVIDER,
  CONFIG_KEYS.GOLD_PROVIDER,
  CONFIG_KEYS.INSURANCE_PROVIDER,
  CONFIG_KEYS.MF_PROVIDER,
  CONFIG_KEYS.MOVIES_PROVIDER,
  CONFIG_KEYS.TRAVEL_PROVIDER,
  CONFIG_KEYS.CREDIT_SCORE_PROVIDER,
  CONFIG_KEYS.BNPL_PROVIDER,
  CONFIG_KEYS.PUSH_PROVIDER,
  CONFIG_KEYS.SEARCH_PROVIDER,
  CONFIG_KEYS.CACHE_PROVIDER,
  CONFIG_KEYS.QUEUE_PROVIDER,
  CONFIG_KEYS.INSTANT_REFUND_MAX_AMOUNT,
  CONFIG_KEYS.INSTANT_REFUND_MAX_ORDER_AGE_HOURS,
  CONFIG_KEYS.WALLET_LIMIT_WITHOUT_KYC,
  CONFIG_KEYS.WALLET_LIMIT_WITH_KYC,
  CONFIG_KEYS.BNPL_MIN_ORDER_AMOUNT,
  CONFIG_KEYS.BNPL_MAX_TENURE_MONTHS,
  CONFIG_KEYS.BNPL_NO_COST_EMI_MONTHS,
  CONFIG_KEYS.BNPL_INTEREST_RATE,
  CONFIG_KEYS.CASHBACK_DEFAULT_PROBABILITY,
  CONFIG_KEYS.CASHBACK_MAX_PERCENTAGE,
  CONFIG_KEYS.CASHBACK_MAX_AMOUNT,
  CONFIG_KEYS.SURGE_BASE_FEE,
  CONFIG_KEYS.SURGE_DEMAND_THRESHOLD,
  CONFIG_KEYS.SURGE_MAX_MULTIPLIER,
  CONFIG_KEYS.PROMISE_AVG_SPEED_KMH,
  CONFIG_KEYS.PROMISE_BASE_PREP_MIN,
  CONFIG_KEYS.DELIVERY_OTP_LENGTH,
  CONFIG_KEYS.DELIVERY_OTP_EXPIRY_MIN,
  CONFIG_KEYS.AUTH_ANOMALY_RAPID_SWITCH_MIN,
  CONFIG_KEYS.MERCHANT_MDR_PERCENTAGE,
  CONFIG_KEYS.MERCHANT_SETTLEMENT_SCHEDULE,
];

export async function getServicesConfig() {
  await requireSuperAdmin();

  // Load current values from DB
  const rows = await prisma.systemConfig.findMany({
    where: { key: { in: [...SERVICE_TOGGLES.map((t) => t.configKey), ...PROVIDER_CONFIGS] } },
  });
  const dbValues = new Map(rows.map((r) => [r.key, r.value]));

  const toggles = SERVICE_TOGGLES.map((t) => ({
    ...t,
    enabled: (dbValues.get(t.configKey) ?? "true") === "true",
  }));

  const configs: Record<string, string> = {};
  for (const key of PROVIDER_CONFIGS) {
    configs[key] = dbValues.get(key) ?? "";
  }

  return { toggles, configs };
}

export async function updateServiceConfig(key: string, value: string) {
  await requireSuperAdmin();

  await prisma.systemConfig.upsert({
    where: { key },
    create: { key, value },
    update: { value },
  });

  return { success: true, key, value };
}

export async function bulkUpdateConfigs(updates: { key: string; value: string }[]) {
  await requireSuperAdmin();

  for (const { key, value } of updates) {
    await prisma.systemConfig.upsert({ where: { key }, create: { key, value }, update: { value } });
  }

  return { success: true, count: updates.length };
}
