/**
 * Default values for every configuration key.
 * Used when no SystemConfig row exists for a key.
 */

import { CONFIG_KEYS } from "./config-keys";

export interface ConfigDefinition {
  key: string;
  defaultValue: string;
  type: "string" | "number" | "boolean" | "json";
  description: string;
  category: string;
  isSecret?: boolean;
}

export const CONFIG_DEFAULTS: ConfigDefinition[] = [
  // Search
  { key: CONFIG_KEYS.SEARCH_PROVIDER, defaultValue: "postgres", type: "string", description: "Search engine provider (postgres, meilisearch, typesense)", category: "search" },
  { key: CONFIG_KEYS.SEARCH_MEILISEARCH_URL, defaultValue: "http://localhost:7700", type: "string", description: "Meilisearch instance URL", category: "search" },
  { key: CONFIG_KEYS.SEARCH_MEILISEARCH_KEY, defaultValue: "", type: "string", description: "Meilisearch master/API key", category: "search", isSecret: true },
  { key: CONFIG_KEYS.SEARCH_TYPESENSE_URL, defaultValue: "http://localhost:8108", type: "string", description: "Typesense instance URL", category: "search" },
  { key: CONFIG_KEYS.SEARCH_TYPESENSE_KEY, defaultValue: "", type: "string", description: "Typesense API key", category: "search", isSecret: true },
  { key: CONFIG_KEYS.SEARCH_AUTOCOMPLETE_MIN_CHARS, defaultValue: "2", type: "number", description: "Minimum characters before autocomplete triggers", category: "search" },
  { key: CONFIG_KEYS.SEARCH_RESULTS_PER_PAGE, defaultValue: "20", type: "number", description: "Search results per page", category: "search" },
  { key: CONFIG_KEYS.SEARCH_TYPO_TOLERANCE, defaultValue: "true", type: "boolean", description: "Enable typo-tolerant search", category: "search" },
  { key: CONFIG_KEYS.SEARCH_ANALYTICS_ENABLED, defaultValue: "true", type: "boolean", description: "Track search analytics", category: "search" },

  // Cache
  { key: CONFIG_KEYS.CACHE_PROVIDER, defaultValue: "memory", type: "string", description: "Cache provider (memory, redis)", category: "cache" },
  { key: CONFIG_KEYS.CACHE_REDIS_URL, defaultValue: "", type: "string", description: "Redis connection URL", category: "cache", isSecret: true },
  { key: CONFIG_KEYS.CACHE_DEFAULT_TTL, defaultValue: "300", type: "number", description: "Default cache TTL in seconds", category: "cache" },
  { key: CONFIG_KEYS.CACHE_PRODUCT_TTL, defaultValue: "60", type: "number", description: "Product cache TTL in seconds", category: "cache" },
  { key: CONFIG_KEYS.CACHE_CATEGORY_TTL, defaultValue: "3600", type: "number", description: "Category cache TTL in seconds", category: "cache" },
  { key: CONFIG_KEYS.CACHE_SESSION_TTL, defaultValue: "300", type: "number", description: "Session cache TTL in seconds", category: "cache" },

  // Queue
  { key: CONFIG_KEYS.QUEUE_PROVIDER, defaultValue: "memory", type: "string", description: "Queue provider (memory, bullmq)", category: "queue" },
  { key: CONFIG_KEYS.QUEUE_BULLMQ_REDIS_URL, defaultValue: "", type: "string", description: "BullMQ Redis URL", category: "queue", isSecret: true },
  { key: CONFIG_KEYS.QUEUE_CONCURRENCY, defaultValue: "5", type: "number", description: "Max concurrent jobs per queue", category: "queue" },
  { key: CONFIG_KEYS.QUEUE_RETRY_ATTEMPTS, defaultValue: "3", type: "number", description: "Max retry attempts for failed jobs", category: "queue" },
  { key: CONFIG_KEYS.QUEUE_RETRY_DELAY_MS, defaultValue: "5000", type: "number", description: "Base retry delay in milliseconds", category: "queue" },

  // Feature Flags
  { key: CONFIG_KEYS.FEATURE_FLAGS, defaultValue: "{}", type: "json", description: "Feature flag definitions", category: "feature_flags" },
  { key: CONFIG_KEYS.AB_TESTS, defaultValue: "[]", type: "json", description: "Active A/B test configurations", category: "feature_flags" },

  // Circuit Breaker
  { key: CONFIG_KEYS.CIRCUIT_BREAKER_ENABLED, defaultValue: "true", type: "boolean", description: "Enable circuit breakers globally", category: "circuit_breaker" },
  { key: CONFIG_KEYS.CIRCUIT_BREAKER_PAYMENT_THRESHOLD, defaultValue: "5", type: "number", description: "Payment service failure threshold", category: "circuit_breaker" },
  { key: CONFIG_KEYS.CIRCUIT_BREAKER_PAYMENT_TIMEOUT_MS, defaultValue: "30000", type: "number", description: "Payment breaker timeout before half-open", category: "circuit_breaker" },
  { key: CONFIG_KEYS.CIRCUIT_BREAKER_NOTIFICATION_THRESHOLD, defaultValue: "3", type: "number", description: "Notification service failure threshold", category: "circuit_breaker" },
  { key: CONFIG_KEYS.CIRCUIT_BREAKER_NOTIFICATION_TIMEOUT_MS, defaultValue: "15000", type: "number", description: "Notification breaker timeout", category: "circuit_breaker" },
  { key: CONFIG_KEYS.CIRCUIT_BREAKER_GEOCODING_THRESHOLD, defaultValue: "5", type: "number", description: "Geocoding service failure threshold", category: "circuit_breaker" },
  { key: CONFIG_KEYS.CIRCUIT_BREAKER_AI_THRESHOLD, defaultValue: "3", type: "number", description: "AI service failure threshold", category: "circuit_breaker" },

  // Fraud
  { key: CONFIG_KEYS.FRAUD_ENABLED, defaultValue: "true", type: "boolean", description: "Enable fraud detection", category: "fraud" },
  { key: CONFIG_KEYS.FRAUD_VELOCITY_WINDOW_MIN, defaultValue: "60", type: "number", description: "Velocity check window in minutes", category: "fraud" },
  { key: CONFIG_KEYS.FRAUD_VELOCITY_MAX_ORDERS, defaultValue: "5", type: "number", description: "Max orders allowed in velocity window", category: "fraud" },
  { key: CONFIG_KEYS.FRAUD_AMOUNT_THRESHOLD, defaultValue: "50000", type: "number", description: "Order amount threshold for flagging", category: "fraud" },
  { key: CONFIG_KEYS.FRAUD_AUTO_BLOCK_SCORE, defaultValue: "80", type: "number", description: "Fraud score threshold for auto-blocking (0-100)", category: "fraud" },
  { key: CONFIG_KEYS.FRAUD_REVIEW_SCORE, defaultValue: "50", type: "number", description: "Fraud score threshold for manual review", category: "fraud" },
  { key: CONFIG_KEYS.FRAUD_DEVICE_FINGERPRINT_ENABLED, defaultValue: "true", type: "boolean", description: "Enable device fingerprint checks", category: "fraud" },
  { key: CONFIG_KEYS.FRAUD_LOCATION_CHECK_ENABLED, defaultValue: "true", type: "boolean", description: "Enable location anomaly checks", category: "fraud" },
  { key: CONFIG_KEYS.FRAUD_IP_VELOCITY_WINDOW_MIN, defaultValue: "60", type: "number", description: "IP velocity check window in minutes", category: "fraud" },
  { key: CONFIG_KEYS.FRAUD_IP_VELOCITY_MAX_USERS, defaultValue: "3", type: "number", description: "Max unique users from same IP in window", category: "fraud" },

  // Cart Abandonment
  { key: CONFIG_KEYS.CART_ABANDON_ENABLED, defaultValue: "true", type: "boolean", description: "Enable cart abandonment recovery", category: "cart" },
  { key: CONFIG_KEYS.CART_ABANDON_PUSH_DELAY_MIN, defaultValue: "30", type: "number", description: "Minutes before sending push reminder", category: "cart" },
  { key: CONFIG_KEYS.CART_ABANDON_EMAIL_DELAY_MIN, defaultValue: "60", type: "number", description: "Minutes before sending email reminder", category: "cart" },
  { key: CONFIG_KEYS.CART_ABANDON_SMS_DELAY_MIN, defaultValue: "1440", type: "number", description: "Minutes before sending SMS reminder", category: "cart" },
  { key: CONFIG_KEYS.CART_ABANDON_INACTIVITY_MIN, defaultValue: "15", type: "number", description: "Minutes of inactivity to consider abandoned", category: "cart" },
  { key: CONFIG_KEYS.CART_ABANDON_MAX_REMINDERS, defaultValue: "3", type: "number", description: "Max reminders per abandoned cart", category: "cart" },

  // Invoice
  { key: CONFIG_KEYS.INVOICE_ENABLED, defaultValue: "true", type: "boolean", description: "Enable invoice generation", category: "invoice" },
  { key: CONFIG_KEYS.INVOICE_GST_ENABLED, defaultValue: "true", type: "boolean", description: "Include GST breakdown in invoices", category: "invoice" },
  { key: CONFIG_KEYS.INVOICE_TEMPLATE, defaultValue: "standard", type: "string", description: "Invoice template (standard, gst)", category: "invoice" },
  { key: CONFIG_KEYS.INVOICE_COMPANY_NAME, defaultValue: "ShopEase", type: "string", description: "Company name on invoice", category: "invoice" },
  { key: CONFIG_KEYS.INVOICE_COMPANY_GSTIN, defaultValue: "", type: "string", description: "Company GSTIN for GST invoices", category: "invoice" },
  { key: CONFIG_KEYS.INVOICE_COMPANY_ADDRESS, defaultValue: "", type: "string", description: "Company address on invoice", category: "invoice" },
  { key: CONFIG_KEYS.INVOICE_COMPANY_PHONE, defaultValue: "", type: "string", description: "Company phone on invoice", category: "invoice" },
  { key: CONFIG_KEYS.INVOICE_COMPANY_EMAIL, defaultValue: "", type: "string", description: "Company email on invoice", category: "invoice" },
  { key: CONFIG_KEYS.INVOICE_PREFIX, defaultValue: "INV", type: "string", description: "Invoice number prefix", category: "invoice" },
  { key: CONFIG_KEYS.INVOICE_LOGO_URL, defaultValue: "", type: "string", description: "Logo URL for invoice header", category: "invoice" },

  // Homepage
  { key: CONFIG_KEYS.HOMEPAGE_SECTIONS, defaultValue: '["banners","categories","deals","recommendations","recentlyViewed"]', type: "json", description: "Ordered homepage section list", category: "homepage" },
  { key: CONFIG_KEYS.HOMEPAGE_BANNER_COUNT, defaultValue: "5", type: "number", description: "Max banners in carousel", category: "homepage" },
  { key: CONFIG_KEYS.HOMEPAGE_PRODUCT_COUNT, defaultValue: "12", type: "number", description: "Products per homepage section", category: "homepage" },
  { key: CONFIG_KEYS.HOMEPAGE_DEAL_COUNT, defaultValue: "6", type: "number", description: "Max deals shown", category: "homepage" },

  // Surge
  { key: CONFIG_KEYS.SURGE_ENABLED, defaultValue: "false", type: "boolean", description: "Enable surge pricing", category: "surge" },
  { key: CONFIG_KEYS.SURGE_MAX_MULTIPLIER, defaultValue: "2.0", type: "number", description: "Maximum surge price multiplier", category: "surge" },
  { key: CONFIG_KEYS.SURGE_ORDER_DENSITY_THRESHOLD, defaultValue: "50", type: "number", description: "Orders/hour threshold to trigger surge", category: "surge" },
  { key: CONFIG_KEYS.SURGE_AGENT_SHORTAGE_THRESHOLD, defaultValue: "0.5", type: "number", description: "Agent-to-order ratio below which surge triggers", category: "surge" },
  { key: CONFIG_KEYS.SURGE_WEATHER_ENABLED, defaultValue: "false", type: "boolean", description: "Enable weather-based surge", category: "surge" },
  { key: CONFIG_KEYS.SURGE_TIME_BASED_ENABLED, defaultValue: "false", type: "boolean", description: "Enable time-of-day surge", category: "surge" },

  // Slot
  { key: CONFIG_KEYS.SLOT_DURATION_MIN, defaultValue: "30", type: "number", description: "Delivery slot duration in minutes", category: "slot" },
  { key: CONFIG_KEYS.SLOT_BUFFER_MIN, defaultValue: "15", type: "number", description: "Buffer between slots in minutes", category: "slot" },
  { key: CONFIG_KEYS.SLOT_MAX_ORDERS_PER_SLOT, defaultValue: "10", type: "number", description: "Maximum orders per time slot", category: "slot" },
  { key: CONFIG_KEYS.SLOT_ADVANCE_BOOKING_HOURS, defaultValue: "48", type: "number", description: "How far ahead slots can be booked", category: "slot" },
  { key: CONFIG_KEYS.SLOT_CUTOFF_MIN, defaultValue: "30", type: "number", description: "Minutes before slot starts to stop booking", category: "slot" },
  { key: CONFIG_KEYS.SLOT_PREP_TIME_MIN, defaultValue: "20", type: "number", description: "Order preparation time in minutes", category: "slot" },

  // Dynamic Pricing
  { key: CONFIG_KEYS.DYNAMIC_PRICING_ENABLED, defaultValue: "false", type: "boolean", description: "Enable dynamic pricing", category: "pricing" },
  { key: CONFIG_KEYS.DYNAMIC_PRICING_MAX_DISCOUNT_PCT, defaultValue: "20", type: "number", description: "Maximum dynamic discount percentage", category: "pricing" },
  { key: CONFIG_KEYS.DYNAMIC_PRICING_MAX_SURCHARGE_PCT, defaultValue: "15", type: "number", description: "Maximum dynamic surcharge percentage", category: "pricing" },
  { key: CONFIG_KEYS.DYNAMIC_PRICING_DEMAND_WINDOW_HOURS, defaultValue: "24", type: "number", description: "Demand analysis window in hours", category: "pricing" },

  // Gamification
  { key: CONFIG_KEYS.GAMIFICATION_ENABLED, defaultValue: "true", type: "boolean", description: "Enable gamification features", category: "gamification" },
  { key: CONFIG_KEYS.GAMIFICATION_SPIN_COST_POINTS, defaultValue: "50", type: "number", description: "Points required for one spin", category: "gamification" },
  { key: CONFIG_KEYS.GAMIFICATION_SPIN_COOLDOWN_HOURS, defaultValue: "24", type: "number", description: "Cooldown between spins in hours", category: "gamification" },
  { key: CONFIG_KEYS.GAMIFICATION_SCRATCH_COST_POINTS, defaultValue: "30", type: "number", description: "Points required for one scratch card", category: "gamification" },
  { key: CONFIG_KEYS.GAMIFICATION_DAILY_LOGIN_POINTS, defaultValue: "10", type: "number", description: "Points awarded for daily login", category: "gamification" },

  // Referral
  { key: CONFIG_KEYS.REFERRAL_ENABLED, defaultValue: "true", type: "boolean", description: "Enable referral program", category: "referral" },
  { key: CONFIG_KEYS.REFERRAL_REWARD_AMOUNT, defaultValue: "100", type: "number", description: "Reward amount for successful referral", category: "referral" },
  { key: CONFIG_KEYS.REFERRAL_REWARD_TYPE, defaultValue: "WALLET", type: "string", description: "Reward type (WALLET, DISCOUNT, FREE_PRODUCT)", category: "referral" },
  { key: CONFIG_KEYS.REFERRAL_MIN_ORDER_AMOUNT, defaultValue: "500", type: "number", description: "Minimum order amount to trigger referral reward", category: "referral" },
  { key: CONFIG_KEYS.REFERRAL_EXPIRY_DAYS, defaultValue: "90", type: "number", description: "Referral reward expiry in days", category: "referral" },
  { key: CONFIG_KEYS.REFERRAL_MAX_PER_USER, defaultValue: "10", type: "number", description: "Max referral rewards per user", category: "referral" },

  // MFA
  { key: CONFIG_KEYS.MFA_ENABLED, defaultValue: "true", type: "boolean", description: "Allow users to enable MFA", category: "mfa" },
  { key: CONFIG_KEYS.MFA_ENFORCE_ADMIN, defaultValue: "false", type: "boolean", description: "Enforce MFA for admin accounts", category: "mfa" },
  { key: CONFIG_KEYS.MFA_ISSUER, defaultValue: "ShopEase", type: "string", description: "TOTP issuer name shown in authenticator", category: "mfa" },
  { key: CONFIG_KEYS.MFA_BACKUP_CODES_COUNT, defaultValue: "8", type: "number", description: "Number of backup codes to generate", category: "mfa" },

  // GDPR
  { key: CONFIG_KEYS.GDPR_COOKIE_CONSENT_ENABLED, defaultValue: "true", type: "boolean", description: "Show cookie consent banner", category: "gdpr" },
  { key: CONFIG_KEYS.GDPR_DATA_RETENTION_DAYS, defaultValue: "365", type: "number", description: "Data retention period in days", category: "gdpr" },
  { key: CONFIG_KEYS.GDPR_EXPORT_FORMAT, defaultValue: "json", type: "string", description: "Data export format (json, csv)", category: "gdpr" },
  { key: CONFIG_KEYS.GDPR_DELETION_GRACE_DAYS, defaultValue: "30", type: "number", description: "Grace period before permanent deletion", category: "gdpr" },

  // Monitoring
  { key: CONFIG_KEYS.MONITORING_ENABLED, defaultValue: "true", type: "boolean", description: "Enable monitoring system", category: "monitoring" },
  { key: CONFIG_KEYS.MONITORING_TRACING_ENABLED, defaultValue: "true", type: "boolean", description: "Enable distributed tracing", category: "monitoring" },
  { key: CONFIG_KEYS.MONITORING_METRICS_ENABLED, defaultValue: "true", type: "boolean", description: "Enable metrics collection", category: "monitoring" },
  { key: CONFIG_KEYS.MONITORING_ALERT_EMAIL, defaultValue: "", type: "string", description: "Email for alert notifications", category: "monitoring" },
  { key: CONFIG_KEYS.MONITORING_ERROR_RATE_THRESHOLD, defaultValue: "5", type: "number", description: "Error rate % threshold for alerts", category: "monitoring" },
  { key: CONFIG_KEYS.MONITORING_LATENCY_P99_THRESHOLD_MS, defaultValue: "2000", type: "number", description: "P99 latency threshold in ms", category: "monitoring" },
  { key: CONFIG_KEYS.MONITORING_HEALTH_CHECK_INTERVAL_S, defaultValue: "30", type: "number", description: "Health check interval in seconds", category: "monitoring" },

  // Performance
  { key: CONFIG_KEYS.PERFORMANCE_WEB_VITALS_ENABLED, defaultValue: "true", type: "boolean", description: "Track Core Web Vitals", category: "performance" },
  { key: CONFIG_KEYS.PERFORMANCE_LCP_BUDGET_MS, defaultValue: "2500", type: "number", description: "LCP budget in ms (good < 2500)", category: "performance" },
  { key: CONFIG_KEYS.PERFORMANCE_FID_BUDGET_MS, defaultValue: "100", type: "number", description: "FID budget in ms (good < 100)", category: "performance" },
  { key: CONFIG_KEYS.PERFORMANCE_CLS_BUDGET, defaultValue: "0.1", type: "number", description: "CLS budget (good < 0.1)", category: "performance" },
  { key: CONFIG_KEYS.PERFORMANCE_INP_BUDGET_MS, defaultValue: "200", type: "number", description: "INP budget in ms (good < 200)", category: "performance" },

  // Delivery
  { key: CONFIG_KEYS.DELIVERY_BATCH_ASSIGN_ENABLED, defaultValue: "true", type: "boolean", description: "Enable batch delivery assignment", category: "delivery" },
  { key: CONFIG_KEYS.DELIVERY_BATCH_RADIUS_KM, defaultValue: "2", type: "number", description: "Batch assignment radius in km", category: "delivery" },
  { key: CONFIG_KEYS.DELIVERY_BATCH_MAX_ORDERS, defaultValue: "5", type: "number", description: "Max orders per batch", category: "delivery" },
  { key: CONFIG_KEYS.DELIVERY_ETA_BUFFER_MIN, defaultValue: "10", type: "number", description: "ETA buffer in minutes", category: "delivery" },
  { key: CONFIG_KEYS.DELIVERY_EXPRESS_SURCHARGE, defaultValue: "50", type: "number", description: "Express delivery surcharge amount", category: "delivery" },

  // Forecast
  { key: CONFIG_KEYS.FORECAST_WINDOW_DAYS, defaultValue: "30", type: "number", description: "Historical data window for forecasting", category: "forecast" },
  { key: CONFIG_KEYS.FORECAST_METHOD, defaultValue: "moving_average", type: "string", description: "Forecast method (moving_average, exponential_smoothing)", category: "forecast" },
  { key: CONFIG_KEYS.FORECAST_CONFIDENCE_LEVEL, defaultValue: "0.95", type: "number", description: "Confidence level for predictions", category: "forecast" },

  // Notifications
  { key: CONFIG_KEYS.NOTIFICATION_SMS_ENABLED, defaultValue: "true", type: "boolean", description: "Enable SMS notifications", category: "notification" },
  { key: CONFIG_KEYS.NOTIFICATION_EMAIL_ENABLED, defaultValue: "true", type: "boolean", description: "Enable email notifications", category: "notification" },
  { key: CONFIG_KEYS.NOTIFICATION_WHATSAPP_ENABLED, defaultValue: "false", type: "boolean", description: "Enable WhatsApp notifications", category: "notification" },
  { key: CONFIG_KEYS.NOTIFICATION_PUSH_ENABLED, defaultValue: "true", type: "boolean", description: "Enable push notifications", category: "notification" },

  // Webhook
  { key: CONFIG_KEYS.WEBHOOK_MAX_RETRIES, defaultValue: "5", type: "number", description: "Maximum webhook retry attempts", category: "webhook" },
  { key: CONFIG_KEYS.WEBHOOK_RETRY_BASE_DELAY_MS, defaultValue: "60000", type: "number", description: "Base retry delay in ms", category: "webhook" },
  { key: CONFIG_KEYS.WEBHOOK_TIMEOUT_MS, defaultValue: "10000", type: "number", description: "Webhook delivery timeout in ms", category: "webhook" },
  { key: CONFIG_KEYS.WEBHOOK_DEAD_LETTER_ENABLED, defaultValue: "true", type: "boolean", description: "Enable dead letter queue for failed webhooks", category: "webhook" },

  // Rate Limiting
  { key: CONFIG_KEYS.RATE_LIMIT_AUTH, defaultValue: "5", type: "number", description: "Auth endpoint rate limit per minute", category: "rate_limit" },
  { key: CONFIG_KEYS.RATE_LIMIT_PAYMENT, defaultValue: "10", type: "number", description: "Payment endpoint rate limit per minute", category: "rate_limit" },
  { key: CONFIG_KEYS.RATE_LIMIT_SEARCH, defaultValue: "30", type: "number", description: "Search endpoint rate limit per minute", category: "rate_limit" },
  { key: CONFIG_KEYS.RATE_LIMIT_UPLOAD, defaultValue: "5", type: "number", description: "Upload endpoint rate limit per minute", category: "rate_limit" },
  { key: CONFIG_KEYS.RATE_LIMIT_GENERAL, defaultValue: "60", type: "number", description: "General endpoint rate limit per minute", category: "rate_limit" },

  // Store
  { key: CONFIG_KEYS.STORE_NAME, defaultValue: "ShopEase", type: "string", description: "Store name", category: "store" },
  { key: CONFIG_KEYS.STORE_CURRENCY, defaultValue: "INR", type: "string", description: "Default store currency", category: "store" },
  { key: CONFIG_KEYS.STORE_LOGO_URL, defaultValue: "", type: "string", description: "Store logo URL", category: "store" },
  { key: CONFIG_KEYS.STORE_SUPPORT_EMAIL, defaultValue: "", type: "string", description: "Support email address", category: "store" },
  { key: CONFIG_KEYS.STORE_SUPPORT_PHONE, defaultValue: "", type: "string", description: "Support phone number", category: "store" },
];

/**
 * Lookup helper to get default for a specific key.
 */
export function getConfigDefault(key: string): ConfigDefinition | undefined {
  return CONFIG_DEFAULTS.find((d) => d.key === key);
}

/**
 * Get all defaults as a key-value map.
 */
export function getAllDefaults(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const d of CONFIG_DEFAULTS) {
    map[d.key] = d.defaultValue;
  }
  return map;
}
