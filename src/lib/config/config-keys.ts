/**
 * Central registry of ALL configuration keys used across the system.
 * Every key maps to a SystemConfig row with a typed default value.
 * Zero hard coding — all behavior is configurable at runtime.
 */

export const CONFIG_KEYS = {
  // ── Search ───────────────────────────────────────────────────────────────────
  SEARCH_PROVIDER: "search.provider",
  SEARCH_PERSONALIZATION_BROWSE_HISTORY_LIMIT: "search.personalization.browse_history_limit",
  SEARCH_MEILISEARCH_URL: "search.meilisearch.url",
  SEARCH_MEILISEARCH_KEY: "search.meilisearch.key",
  SEARCH_TYPESENSE_URL: "search.typesense.url",
  SEARCH_TYPESENSE_KEY: "search.typesense.key",
  SEARCH_AUTOCOMPLETE_MIN_CHARS: "search.autocomplete.min_chars",
  SEARCH_RESULTS_PER_PAGE: "search.results_per_page",
  SEARCH_TYPO_TOLERANCE: "search.typo_tolerance",
  SEARCH_ANALYTICS_ENABLED: "search.analytics_enabled",

  // ── Cache ────────────────────────────────────────────────────────────────────
  CACHE_PROVIDER: "cache.provider",
  CACHE_REDIS_URL: "cache.redis.url",
  CACHE_DEFAULT_TTL: "cache.default_ttl",
  CACHE_PRODUCT_TTL: "cache.product_ttl",
  CACHE_CATEGORY_TTL: "cache.category_ttl",
  CACHE_SESSION_TTL: "cache.session_ttl",

  // ── Queue ────────────────────────────────────────────────────────────────────
  QUEUE_PROVIDER: "queue.provider",
  QUEUE_BULLMQ_REDIS_URL: "queue.bullmq.redis_url",
  QUEUE_CONCURRENCY: "queue.concurrency",
  QUEUE_RETRY_ATTEMPTS: "queue.retry_attempts",
  QUEUE_RETRY_DELAY_MS: "queue.retry_delay_ms",

  // ── Feature Flags ────────────────────────────────────────────────────────────
  FEATURE_FLAGS: "feature_flags",
  AB_TESTS: "ab_tests",

  // ── Circuit Breaker ──────────────────────────────────────────────────────────
  CIRCUIT_BREAKER_ENABLED: "circuit_breaker.enabled",
  CIRCUIT_BREAKER_PAYMENT_THRESHOLD: "circuit_breaker.payment.failure_threshold",
  CIRCUIT_BREAKER_PAYMENT_TIMEOUT_MS: "circuit_breaker.payment.timeout_ms",
  CIRCUIT_BREAKER_NOTIFICATION_THRESHOLD: "circuit_breaker.notification.failure_threshold",
  CIRCUIT_BREAKER_NOTIFICATION_TIMEOUT_MS: "circuit_breaker.notification.timeout_ms",
  CIRCUIT_BREAKER_GEOCODING_THRESHOLD: "circuit_breaker.geocoding.failure_threshold",
  CIRCUIT_BREAKER_AI_THRESHOLD: "circuit_breaker.ai.failure_threshold",

  // ── Fraud Detection ──────────────────────────────────────────────────────────
  FRAUD_ENABLED: "fraud.enabled",
  FRAUD_VELOCITY_WINDOW_MIN: "fraud.velocity.window_min",
  FRAUD_VELOCITY_MAX_ORDERS: "fraud.velocity.max_orders",
  FRAUD_AMOUNT_THRESHOLD: "fraud.amount.threshold",
  FRAUD_AUTO_BLOCK_SCORE: "fraud.auto_block_score",
  FRAUD_REVIEW_SCORE: "fraud.review_score",
  FRAUD_DEVICE_FINGERPRINT_ENABLED: "fraud.device_fingerprint.enabled",
  FRAUD_LOCATION_CHECK_ENABLED: "fraud.location_check.enabled",
  FRAUD_IP_VELOCITY_WINDOW_MIN: "fraud.ip_velocity.window_min",
  FRAUD_IP_VELOCITY_MAX_USERS: "fraud.ip_velocity.max_users",

  // ── Cart Abandonment ─────────────────────────────────────────────────────────
  CART_ABANDON_ENABLED: "cart.abandon.enabled",
  CART_ABANDON_PUSH_DELAY_MIN: "cart.abandon.push_delay_min",
  CART_ABANDON_EMAIL_DELAY_MIN: "cart.abandon.email_delay_min",
  CART_ABANDON_SMS_DELAY_MIN: "cart.abandon.sms_delay_min",
  CART_ABANDON_INACTIVITY_MIN: "cart.abandon.inactivity_min",
  CART_ABANDON_MAX_REMINDERS: "cart.abandon.max_reminders",

  // ── Invoice ──────────────────────────────────────────────────────────────────
  INVOICE_ENABLED: "invoice.enabled",
  INVOICE_GST_ENABLED: "invoice.gst_enabled",
  INVOICE_TEMPLATE: "invoice.template",
  INVOICE_COMPANY_NAME: "invoice.company_name",
  INVOICE_COMPANY_GSTIN: "invoice.company_gstin",
  INVOICE_COMPANY_ADDRESS: "invoice.company_address",
  INVOICE_COMPANY_PHONE: "invoice.company_phone",
  INVOICE_COMPANY_EMAIL: "invoice.company_email",
  INVOICE_PREFIX: "invoice.prefix",
  INVOICE_LOGO_URL: "invoice.logo_url",

  // ── Homepage ─────────────────────────────────────────────────────────────────
  HOMEPAGE_SECTIONS: "homepage.sections",
  HOMEPAGE_BANNER_COUNT: "homepage.banner_count",
  HOMEPAGE_PRODUCT_COUNT: "homepage.product_count",
  HOMEPAGE_DEAL_COUNT: "homepage.deal_count",

  // ── Surge Pricing ────────────────────────────────────────────────────────────
  SURGE_ENABLED: "surge.enabled",
  SURGE_MAX_MULTIPLIER: "surge.max_multiplier",
  SURGE_ORDER_DENSITY_THRESHOLD: "surge.order_density_threshold",
  SURGE_AGENT_SHORTAGE_THRESHOLD: "surge.agent_shortage_threshold",
  SURGE_WEATHER_ENABLED: "surge.weather_enabled",
  SURGE_TIME_BASED_ENABLED: "surge.time_based_enabled",

  // ── Slot Engine ──────────────────────────────────────────────────────────────
  SLOT_DURATION_MIN: "slot.duration_min",
  SLOT_BUFFER_MIN: "slot.buffer_min",
  SLOT_MAX_ORDERS_PER_SLOT: "slot.max_orders_per_slot",
  SLOT_ADVANCE_BOOKING_HOURS: "slot.advance_booking_hours",
  SLOT_CUTOFF_MIN: "slot.cutoff_min",
  SLOT_PREP_TIME_MIN: "slot.prep_time_min",

  // ── Dynamic Pricing ──────────────────────────────────────────────────────────
  DYNAMIC_PRICING_ENABLED: "dynamic_pricing.enabled",
  DYNAMIC_PRICING_MAX_DISCOUNT_PCT: "dynamic_pricing.max_discount_pct",
  DYNAMIC_PRICING_MAX_SURCHARGE_PCT: "dynamic_pricing.max_surcharge_pct",
  DYNAMIC_PRICING_DEMAND_WINDOW_HOURS: "dynamic_pricing.demand_window_hours",

  // ── Gamification ─────────────────────────────────────────────────────────────
  GAMIFICATION_ENABLED: "gamification.enabled",
  GAMIFICATION_SPIN_COST_POINTS: "gamification.spin.cost_points",
  GAMIFICATION_SPIN_COOLDOWN_HOURS: "gamification.spin.cooldown_hours",
  GAMIFICATION_SCRATCH_COST_POINTS: "gamification.scratch.cost_points",
  GAMIFICATION_DAILY_LOGIN_POINTS: "gamification.daily_login_points",

  // ── Referral ─────────────────────────────────────────────────────────────────
  REFERRAL_ENABLED: "referral.enabled",
  REFERRAL_REWARD_AMOUNT: "referral.reward_amount",
  REFERRAL_REWARD_TYPE: "referral.reward_type",
  REFERRAL_MIN_ORDER_AMOUNT: "referral.min_order_amount",
  REFERRAL_EXPIRY_DAYS: "referral.expiry_days",
  REFERRAL_MAX_PER_USER: "referral.max_per_user",

  // ── MFA ──────────────────────────────────────────────────────────────────────
  MFA_ENABLED: "mfa.enabled",
  MFA_ENFORCE_ADMIN: "mfa.enforce_admin",
  MFA_ISSUER: "mfa.issuer",
  MFA_BACKUP_CODES_COUNT: "mfa.backup_codes_count",

  // ── GDPR ─────────────────────────────────────────────────────────────────────
  GDPR_COOKIE_CONSENT_ENABLED: "gdpr.cookie_consent_enabled",
  GDPR_DATA_RETENTION_DAYS: "gdpr.data_retention_days",
  GDPR_EXPORT_FORMAT: "gdpr.export_format",
  GDPR_DELETION_GRACE_DAYS: "gdpr.deletion_grace_days",

  // ── Monitoring & Observability ───────────────────────────────────────────────
  MONITORING_ENABLED: "monitoring.enabled",
  MONITORING_TRACING_ENABLED: "monitoring.tracing_enabled",
  MONITORING_METRICS_ENABLED: "monitoring.metrics_enabled",
  MONITORING_ALERT_EMAIL: "monitoring.alert_email",
  MONITORING_ERROR_RATE_THRESHOLD: "monitoring.error_rate_threshold",
  MONITORING_LATENCY_P99_THRESHOLD_MS: "monitoring.latency_p99_threshold_ms",
  MONITORING_HEALTH_CHECK_INTERVAL_S: "monitoring.health_check_interval_s",

  // ── Performance ──────────────────────────────────────────────────────────────
  PERFORMANCE_WEB_VITALS_ENABLED: "performance.web_vitals_enabled",
  PERFORMANCE_LCP_BUDGET_MS: "performance.lcp_budget_ms",
  PERFORMANCE_FID_BUDGET_MS: "performance.fid_budget_ms",
  PERFORMANCE_CLS_BUDGET: "performance.cls_budget",
  PERFORMANCE_INP_BUDGET_MS: "performance.inp_budget_ms",

  // ── Delivery ─────────────────────────────────────────────────────────────────
  DELIVERY_BATCH_ASSIGN_ENABLED: "delivery.batch_assign_enabled",
  DELIVERY_BATCH_RADIUS_KM: "delivery.batch_radius_km",
  DELIVERY_BATCH_MAX_ORDERS: "delivery.batch_max_orders",
  DELIVERY_ETA_BUFFER_MIN: "delivery.eta_buffer_min",
  DELIVERY_EXPRESS_SURCHARGE: "delivery.express_surcharge",

  // ── Forecast ─────────────────────────────────────────────────────────────────
  FORECAST_WINDOW_DAYS: "forecast.window_days",
  FORECAST_METHOD: "forecast.method",
  FORECAST_CONFIDENCE_LEVEL: "forecast.confidence_level",
  FORECAST_SEASON_LENGTH: "forecast.season_length",
  FORECAST_ALPHA: "forecast.alpha",
  FORECAST_BETA: "forecast.beta",
  FORECAST_GAMMA: "forecast.gamma",

  // ── Recommendations ──────────────────────────────────────────────────────────
  RECS_WEIGHT_PERSONALIZED: "recs.weight_personalized",
  RECS_WEIGHT_CONTENT: "recs.weight_content",
  RECS_WEIGHT_CROSS_SELL: "recs.weight_cross_sell",
  RECS_WEIGHT_COLLABORATIVE: "recs.weight_collaborative",
  RECS_WEIGHT_TRENDING: "recs.weight_trending",

  // ── Out-of-stock Substitution ────────────────────────────────────────────────
  SUBSTITUTION_LIMIT: "substitution.limit",
  SUBSTITUTION_PRICE_BAND_PCT: "substitution.price_band_pct",

  // ── Notifications ────────────────────────────────────────────────────────────
  NOTIFICATION_SMS_ENABLED: "notification.sms_enabled",
  NOTIFICATION_EMAIL_ENABLED: "notification.email_enabled",
  NOTIFICATION_WHATSAPP_ENABLED: "notification.whatsapp_enabled",
  NOTIFICATION_PUSH_ENABLED: "notification.push_enabled",

  // ── Webhook ──────────────────────────────────────────────────────────────────
  WEBHOOK_MAX_RETRIES: "webhook.max_retries",
  WEBHOOK_RETRY_BASE_DELAY_MS: "webhook.retry_base_delay_ms",
  WEBHOOK_TIMEOUT_MS: "webhook.timeout_ms",
  WEBHOOK_DEAD_LETTER_ENABLED: "webhook.dead_letter_enabled",

  // ── Rate Limiting ────────────────────────────────────────────────────────────
  RATE_LIMIT_AUTH: "rate_limit.auth",
  RATE_LIMIT_PAYMENT: "rate_limit.payment",
  RATE_LIMIT_SEARCH: "rate_limit.search",
  RATE_LIMIT_UPLOAD: "rate_limit.upload",
  RATE_LIMIT_GENERAL: "rate_limit.general",

  // ── Store ────────────────────────────────────────────────────────────────────
  STORE_NAME: "store_name",
  STORE_CURRENCY: "store_currency",
  STORE_LOGO_URL: "store_logo_url",
  STORE_SUPPORT_EMAIL: "store_support_email",
  STORE_SUPPORT_PHONE: "store_support_phone",

  // ── Services: UPI ────────────────────────────────────────────────────────────
  UPI_PROVIDER: "services.upi.provider",
  UPI_MERCHANT_VPA: "services.upi.merchant_vpa",
  UPI_MANDATE_ENABLED: "services.upi.mandate_enabled",

  // ── Services: Bills & Recharge ───────────────────────────────────────────────
  BBPS_PROVIDER: "services.bbps.provider",
  BBPS_API_URL: "services.bbps.api_url",
  BBPS_API_KEY: "services.bbps.api_key",
  BBPS_CATEGORIES: "services.bbps.categories",
  RECHARGE_PROVIDER: "services.recharge.provider",
  RECHARGE_API_URL: "services.recharge.api_url",
  RECHARGE_API_KEY: "services.recharge.api_key",
  RECHARGE_OPERATORS: "services.recharge.operators",
  RECHARGE_PREFIX_MAP: "services.recharge.prefix_map",
  RECHARGE_PLAN_AMOUNTS: "services.recharge.plan_amounts",

  // ── Services: Gold ───────────────────────────────────────────────────────────
  GOLD_PROVIDER: "services.gold.provider",
  GOLD_API_URL: "services.gold.api_url",
  GOLD_API_KEY: "services.gold.api_key",
  GOLD_MIN_BUY_AMOUNT: "services.gold.min_buy_amount",
  GOLD_SPREAD_PCT: "services.gold.spread_pct",

  // ── Services: FX (USD→INR for metal/commodity pricing) ───────────────────────
  FX_API_URL: "services.fx.api_url",
  FX_USD_INR_FALLBACK: "services.fx.usd_inr_fallback",

  // ── Services: Mutual Funds (extra) ───────────────────────────────────────────
  MF_SEARCH_NAV_LIMIT: "services.mf.search_nav_limit",

  // ── Services: Insurance ──────────────────────────────────────────────────────
  INSURANCE_PROVIDER: "services.insurance.provider",
  INSURANCE_API_URL: "services.insurance.api_url",
  INSURANCE_API_KEY: "services.insurance.api_key",
  INSURANCE_PROVIDERS: "services.insurance.providers",
  INSURANCE_BASE_RATES: "services.insurance.base_rates",
  INSURANCE_AGE_BASE: "services.insurance.age_base",
  INSURANCE_AGE_LOADING: "services.insurance.age_loading",
  INSURANCE_DEFAULT_SUM_INSURED: "services.insurance.default_sum_insured",
  INSURANCE_TENURE_MONTHS: "services.insurance.tenure_months",

  // ── Services: Mutual Funds ───────────────────────────────────────────────────
  MF_PROVIDER: "services.mf.provider",
  MF_API_URL: "services.mf.api_url",
  MF_API_KEY: "services.mf.api_key",
  MF_KYC_REQUIRED: "services.mf.kyc_required",

  // ── Services: Movies & Travel ────────────────────────────────────────────────
  MOVIES_PROVIDER: "services.movies.provider",
  MOVIES_API_URL: "services.movies.api_url",
  MOVIES_API_KEY: "services.movies.api_key",
  MOVIES_REGION: "services.movies.region",
  MOVIES_CINEMAS: "services.movies.cinemas",
  MOVIES_SHOW_TIMES: "services.movies.show_times",
  MOVIES_TICKET_PRICE: "services.movies.ticket_price",
  MOVIES_EVENING_SURCHARGE: "services.movies.evening_surcharge",
  MOVIES_SEAT_CAPACITY: "services.movies.seat_capacity",
  TRAVEL_PROVIDER: "services.travel.provider",
  TRAVEL_API_URL: "services.travel.api_url",
  TRAVEL_API_KEY: "services.travel.api_key",
  TRAVEL_AIRLINES: "services.travel.airlines",
  TRAVEL_FLIGHT_BASE_FARE: "services.travel.flight_base_fare",
  TRAVEL_FLIGHT_SLOTS: "services.travel.flight_slots",
  TRAVEL_TRAINS: "services.travel.trains",
  TRAVEL_HOTELS: "services.travel.hotels",

  // ── Services: Credit Score ───────────────────────────────────────────────────
  CREDIT_SCORE_PROVIDER: "services.credit_score.provider",
  CREDIT_SCORE_API_URL: "services.credit_score.api_url",
  CREDIT_SCORE_API_KEY: "services.credit_score.api_key",
  CREDIT_SCORE_MIN: "services.credit_score.min",
  CREDIT_SCORE_MAX: "services.credit_score.max",
  CREDIT_W_PAYMENT: "services.credit_score.weight_payment",
  CREDIT_W_UTILIZATION: "services.credit_score.weight_utilization",
  CREDIT_W_AGE: "services.credit_score.weight_age",
  CREDIT_W_ACTIVITY: "services.credit_score.weight_activity",

  // ── Services: BNPL ───────────────────────────────────────────────────────────
  BNPL_PROVIDER: "services.bnpl.provider",
  BNPL_MIN_ORDER_AMOUNT: "services.bnpl.min_order_amount",
  BNPL_MAX_TENURE_MONTHS: "services.bnpl.max_tenure_months",
  BNPL_NO_COST_EMI_MONTHS: "services.bnpl.no_cost_emi_months",
  BNPL_INTEREST_RATE: "services.bnpl.interest_rate",

  // ── Services: Cashback ───────────────────────────────────────────────────────
  CASHBACK_ENABLED: "services.cashback.enabled",
  CASHBACK_DEFAULT_PROBABILITY: "services.cashback.default_probability",
  CASHBACK_MAX_PERCENTAGE: "services.cashback.max_percentage",
  CASHBACK_MAX_AMOUNT: "services.cashback.max_amount",
  CASHBACK_MODE: "services.cashback.mode",
  CASHBACK_TIERS: "services.cashback.tiers",

  // ── Services: Merchant Payments ──────────────────────────────────────────────
  MERCHANT_SETTLEMENT_SCHEDULE: "services.merchant.settlement_schedule",
  MERCHANT_MDR_PERCENTAGE: "services.merchant.mdr_percentage",

  // ── Delivery: Promise Engine ─────────────────────────────────────────────────
  PROMISE_AVG_SPEED_KMH: "delivery.promise.avg_speed_kmh",
  PROMISE_BASE_PREP_MIN: "delivery.promise.base_prep_min",
  PROMISE_PER_ITEM_PREP_MIN: "delivery.promise.per_item_prep_min",
  PROMISE_SLA_BREACH_ALERT: "delivery.promise.sla_breach_alert",

  // ── Delivery: OTP ────────────────────────────────────────────────────────────
  DELIVERY_OTP_ENABLED: "delivery.otp.enabled",
  DELIVERY_OTP_LENGTH: "delivery.otp.length",
  DELIVERY_OTP_EXPIRY_MIN: "delivery.otp.expiry_min",

  // ── Delivery: Surge Display ──────────────────────────────────────────────────
  SURGE_DISPLAY_ENABLED: "delivery.surge.display_enabled",
  SURGE_BASE_FEE: "delivery.surge.base_fee",
  SURGE_DEMAND_THRESHOLD: "delivery.surge.demand_threshold",
  SURGE_WINDOW_MIN: "delivery.surge.window_min",

  // ── Push Notifications ───────────────────────────────────────────────────────
  PUSH_PROVIDER: "notification.push.provider",
  PUSH_FCM_SERVICE_ACCOUNT: "notification.push.fcm_service_account",

  // ── Auth: Anomaly Detection ──────────────────────────────────────────────────
  AUTH_ANOMALY_ENABLED: "auth.anomaly.enabled",
  AUTH_ANOMALY_RAPID_SWITCH_MIN: "auth.anomaly.rapid_switch_min",
  AUTH_ANOMALY_ALERT_ON_NEW_IP: "auth.anomaly.alert_on_new_ip",

  // ── Wallet ───────────────────────────────────────────────────────────────────
  WALLET_KYC_REQUIRED: "wallet.kyc_required",
  WALLET_KYC_AUTO_APPROVE: "wallet.kyc_auto_approve",
  WALLET_LIMIT_WITHOUT_KYC: "wallet.limit_without_kyc",
  WALLET_LIMIT_WITH_KYC: "wallet.limit_with_kyc",
  WALLET_P2P_ENABLED: "wallet.p2p_enabled",

  // ── Instant Refund ───────────────────────────────────────────────────────────
  INSTANT_REFUND_ENABLED: "refund.instant.enabled",
  INSTANT_REFUND_MAX_AMOUNT: "refund.instant.max_amount",
  INSTANT_REFUND_MAX_ORDER_AGE_HOURS: "refund.instant.max_order_age_hours",
} as const;

export type ConfigKey = (typeof CONFIG_KEYS)[keyof typeof CONFIG_KEYS];
