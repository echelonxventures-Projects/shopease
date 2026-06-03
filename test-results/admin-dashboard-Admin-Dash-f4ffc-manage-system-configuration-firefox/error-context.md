# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: admin-dashboard.spec.ts >> Admin Dashboard E2E >> should manage system configuration
- Location: src/tests/e2e/admin-dashboard.spec.ts:130:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('[data-testid="config-list"]')
Expected: visible
Timeout: 10000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 10000ms
  - waiting for locator('[data-testid="config-list"]')

```

```yaml
- complementary:
  - link "ShopEase Admin":
    - /url: /admin/dashboard
  - navigation:
    - link "📊 Dashboard":
      - /url: /admin/dashboard
    - button "📦 Catalog ▸"
    - button "🛒 Orders & Fulfillment ▸"
    - button "👥 Customers ▸"
    - button "🏭 Suppliers & Procurement ▸"
    - button "🏪 Marketplace ▸"
    - button "🎉 Promotions & Loyalty ▸"
    - button "💳 Payments & Finance ▸"
    - button "🖼️ Content & CMS ▸"
    - button "🌍 Regions ▸"
    - button "🌐 Sites ▸"
    - button "🧩 Platforms ▸"
    - link "➕ Create New Platform":
      - /url: /admin/platforms
    - button "💰 Reselling & Revenue ▸"
    - button "📈 Analytics & Reports ▸"
    - button "⚙️ Settings & System ▸"
    - link "🏠 Back to Store":
      - /url: /
- banner:
  - heading "Admin Dashboard" [level=2]
  - text: A Admin
  - button "Logout"
- main:
  - heading "System Configuration" [level=1]
  - paragraph: Manage all runtime configuration. Changes take effect after cache TTL (60s) or manual reload.
  - button "Seed Defaults"
  - button "Reload Cache"
  - textbox "Search configurations..."
  - combobox:
    - option "All Categories" [selected]
    - option "Cache"
    - option "Cart"
    - option "Circuit Breaker"
    - option "Delivery"
    - option "Feature Flags"
    - option "Forecast"
    - option "Fraud"
    - option "Gamification"
    - option "Gdpr"
    - option "Homepage"
    - option "Invoice"
    - option "Mfa"
    - option "Monitoring"
    - option "Notification"
    - option "Performance"
    - option "Pricing"
    - option "Queue"
    - option "Rate Limit"
    - option "Referral"
    - option "Search"
    - option "Slot"
    - option "Store"
    - option "Surge"
    - option "Webhook"
  - text: Showing 141 configurations
  - heading "cache" [level=2]
  - code: cache.category_ttl
  - text: number default
  - paragraph: Category cache TTL in seconds
  - text: "3600"
  - button "Edit"
  - code: cache.default_ttl
  - text: number default
  - paragraph: Default cache TTL in seconds
  - text: "300"
  - button "Edit"
  - code: cache.product_ttl
  - text: number default
  - paragraph: Product cache TTL in seconds
  - text: "60"
  - button "Edit"
  - code: cache.provider
  - text: string default
  - paragraph: Cache provider (memory, redis)
  - text: memory
  - button "Edit"
  - code: cache.redis.url
  - text: string secret default
  - paragraph: Redis connection URL
  - text: (empty)
  - button "Edit"
  - code: cache.session_ttl
  - text: number default
  - paragraph: Session cache TTL in seconds
  - text: "300"
  - button "Edit"
  - heading "cart" [level=2]
  - code: cart.abandon.email_delay_min
  - text: number default
  - paragraph: Minutes before sending email reminder
  - text: "60"
  - button "Edit"
  - code: cart.abandon.enabled
  - text: boolean default
  - paragraph: Enable cart abandonment recovery
  - text: "true"
  - button "Edit"
  - code: cart.abandon.inactivity_min
  - text: number default
  - paragraph: Minutes of inactivity to consider abandoned
  - text: "15"
  - button "Edit"
  - code: cart.abandon.max_reminders
  - text: number default
  - paragraph: Max reminders per abandoned cart
  - text: "3"
  - button "Edit"
  - code: cart.abandon.push_delay_min
  - text: number default
  - paragraph: Minutes before sending push reminder
  - text: "30"
  - button "Edit"
  - code: cart.abandon.sms_delay_min
  - text: number default
  - paragraph: Minutes before sending SMS reminder
  - text: "1440"
  - button "Edit"
  - heading "circuit breaker" [level=2]
  - code: circuit_breaker.ai.failure_threshold
  - text: number default
  - paragraph: AI service failure threshold
  - text: "3"
  - button "Edit"
  - code: circuit_breaker.enabled
  - text: boolean default
  - paragraph: Enable circuit breakers globally
  - text: "true"
  - button "Edit"
  - code: circuit_breaker.geocoding.failure_threshold
  - text: number default
  - paragraph: Geocoding service failure threshold
  - text: "5"
  - button "Edit"
  - code: circuit_breaker.notification.failure_threshold
  - text: number default
  - paragraph: Notification service failure threshold
  - text: "3"
  - button "Edit"
  - code: circuit_breaker.notification.timeout_ms
  - text: number default
  - paragraph: Notification breaker timeout
  - text: "15000"
  - button "Edit"
  - code: circuit_breaker.payment.failure_threshold
  - text: number default
  - paragraph: Payment service failure threshold
  - text: "5"
  - button "Edit"
  - code: circuit_breaker.payment.timeout_ms
  - text: number default
  - paragraph: Payment breaker timeout before half-open
  - text: "30000"
  - button "Edit"
  - heading "delivery" [level=2]
  - code: delivery.batch_assign_enabled
  - text: boolean default
  - paragraph: Enable batch delivery assignment
  - text: "true"
  - button "Edit"
  - code: delivery.batch_max_orders
  - text: number default
  - paragraph: Max orders per batch
  - text: "5"
  - button "Edit"
  - code: delivery.batch_radius_km
  - text: number default
  - paragraph: Batch assignment radius in km
  - text: "2"
  - button "Edit"
  - code: delivery.eta_buffer_min
  - text: number default
  - paragraph: ETA buffer in minutes
  - text: "10"
  - button "Edit"
  - code: delivery.express_surcharge
  - text: number default
  - paragraph: Express delivery surcharge amount
  - text: "50"
  - button "Edit"
  - heading "feature flags" [level=2]
  - code: ab_tests
  - text: json default
  - paragraph: Active A/B test configurations
  - text: "[]"
  - button "Edit"
  - code: feature_flags
  - text: json default
  - paragraph: Feature flag definitions
  - text: "{}"
  - button "Edit"
  - heading "forecast" [level=2]
  - code: forecast.confidence_level
  - text: number default
  - paragraph: Confidence level for predictions
  - text: "0.95"
  - button "Edit"
  - code: forecast.method
  - text: string default
  - paragraph: Forecast method (moving_average, exponential_smoothing)
  - text: moving_average
  - button "Edit"
  - code: forecast.window_days
  - text: number default
  - paragraph: Historical data window for forecasting
  - text: "30"
  - button "Edit"
  - heading "fraud" [level=2]
  - code: fraud.amount.threshold
  - text: number default
  - paragraph: Order amount threshold for flagging
  - text: "50000"
  - button "Edit"
  - code: fraud.auto_block_score
  - text: number default
  - paragraph: Fraud score threshold for auto-blocking (0-100)
  - text: "80"
  - button "Edit"
  - code: fraud.device_fingerprint.enabled
  - text: boolean default
  - paragraph: Enable device fingerprint checks
  - text: "true"
  - button "Edit"
  - code: fraud.enabled
  - text: boolean default
  - paragraph: Enable fraud detection
  - text: "true"
  - button "Edit"
  - code: fraud.ip_velocity.max_users
  - text: number default
  - paragraph: Max unique users from same IP in window
  - text: "3"
  - button "Edit"
  - code: fraud.ip_velocity.window_min
  - text: number default
  - paragraph: IP velocity check window in minutes
  - text: "60"
  - button "Edit"
  - code: fraud.location_check.enabled
  - text: boolean default
  - paragraph: Enable location anomaly checks
  - text: "true"
  - button "Edit"
  - code: fraud.review_score
  - text: number default
  - paragraph: Fraud score threshold for manual review
  - text: "50"
  - button "Edit"
  - code: fraud.velocity.max_orders
  - text: number default
  - paragraph: Max orders allowed in velocity window
  - text: "5"
  - button "Edit"
  - code: fraud.velocity.window_min
  - text: number default
  - paragraph: Velocity check window in minutes
  - text: "60"
  - button "Edit"
  - heading "gamification" [level=2]
  - code: gamification.daily_login_points
  - text: number default
  - paragraph: Points awarded for daily login
  - text: "10"
  - button "Edit"
  - code: gamification.enabled
  - text: boolean default
  - paragraph: Enable gamification features
  - text: "true"
  - button "Edit"
  - code: gamification.scratch.cost_points
  - text: number default
  - paragraph: Points required for one scratch card
  - text: "30"
  - button "Edit"
  - code: gamification.spin.cooldown_hours
  - text: number default
  - paragraph: Cooldown between spins in hours
  - text: "24"
  - button "Edit"
  - code: gamification.spin.cost_points
  - text: number default
  - paragraph: Points required for one spin
  - text: "50"
  - button "Edit"
  - heading "gdpr" [level=2]
  - code: gdpr.cookie_consent_enabled
  - text: boolean default
  - paragraph: Show cookie consent banner
  - text: "true"
  - button "Edit"
  - code: gdpr.data_retention_days
  - text: number default
  - paragraph: Data retention period in days
  - text: "365"
  - button "Edit"
  - code: gdpr.deletion_grace_days
  - text: number default
  - paragraph: Grace period before permanent deletion
  - text: "30"
  - button "Edit"
  - code: gdpr.export_format
  - text: string default
  - paragraph: Data export format (json, csv)
  - text: json
  - button "Edit"
  - heading "general" [level=2]
  - code: store_email
  - text: string
  - paragraph: Store email address
  - text: support@shopease.com
  - button "Edit"
  - button "Reset"
  - code: store_name
  - text: string
  - paragraph: Store display name
  - text: ShopEase
  - button "Edit"
  - button "Reset"
  - code: supported_languages
  - text: string
  - paragraph: All supported languages with locale patterns and direction
  - text: "[{\"code\":\"en\",\"name\":\"English\",\"nativeName\":\"English\",\"direction\":\"LTR\",\"iso6391\":\"en\",\"iso6392\":\"eng\",\"localePatterns\":[\"en-US\",\"en-GB\",\"en-IN\",\"en-AU\",\"en-CA\"]},{\"code\":\"hi\",\"name\":\"Hindi\",\"nativeName\":\"हिन्दी\",\"direction\":\"LTR\",\"iso6391\":\"hi\",\"iso6392\":\"hin\",\"localePatterns\":[\"hi-IN\",\"hi\"]},{\"code\":\"es\",\"name\":\"Spanish\",\"nativeName\":\"Español\",\"direction\":\"LTR\",\"iso6391\":\"es\",\"iso6392\":\"spa\",\"localePatterns\":[\"es-ES\",\"es-MX\",\"es-AR\",\"es-CO\"]},{\"code\":\"zh\",\"name\":\"Chinese\",\"nativeName\":\"中文\",\"direction\":\"LTR\",\"iso6391\":\"zh\",\"iso6392\":\"zho\",\"localePatterns\":[\"zh-CN\",\"zh-TW\",\"zh-HK\",\"zh-SG\"]},{\"code\":\"ar\",\"name\":\"Arabic\",\"nativeName\":\"العربية\",\"direction\":\"RTL\",\"iso6391\":\"ar\",\"iso6392\":\"ara\",\"localePatterns\":[\"ar-SA\",\"ar-AE\",\"ar-EG\",\"ar-KW\"]},{\"code\":\"fr\",\"name\":\"French\",\"nativeName\":\"Français\",\"direction\":\"LTR\",\"iso6391\":\"fr\",\"iso6392\":\"fra\",\"localePatterns\":[\"fr-FR\",\"fr-CA\",\"fr-BE\",\"fr-CH\"]},{\"code\":\"de\",\"name\":\"German\",\"nativeName\":\"Deutsch\",\"direction\":\"LTR\",\"iso6391\":\"de\",\"iso6392\":\"deu\",\"localePatterns\":[\"de-DE\",\"de-AT\",\"de-CH\"]},{\"code\":\"pt\",\"name\":\"Portuguese\",\"nativeName\":\"Português\",\"direction\":\"LTR\",\"iso6391\":\"pt\",\"iso6392\":\"por\",\"localePatterns\":[\"pt-BR\",\"pt-PT\"]},{\"code\":\"ru\",\"name\":\"Russian\",\"nativeName\":\"Русский\",\"direction\":\"LTR\",\"iso6391\":\"ru\",\"iso6392\":\"rus\",\"localePatterns\":[\"ru-RU\"]},{\"code\":\"ja\",\"name\":\"Japanese\",\"nativeName\":\"日本語\",\"direction\":\"LTR\",\"iso6391\":\"ja\",\"iso6392\":\"jpn\",\"localePatterns\":[\"ja-JP\"]},{\"code\":\"ko\",\"name\":\"Korean\",\"nativeName\":\"한국어\",\"direction\":\"LTR\",\"iso6391\":\"ko\",\"iso6392\":\"kor\",\"localePatterns\":[\"ko-KR\"]},{\"code\":\"bn\",\"name\":\"Bengali\",\"nativeName\":\"বাংলা\",\"direction\":\"LTR\",\"iso6391\":\"bn\",\"iso6392\":\"ben\",\"localePatterns\":[\"bn-BD\",\"bn-IN\"]},{\"code\":\"ta\",\"name\":\"Tamil\",\"nativeName\":\"தமிழ்\",\"direction\":\"LTR\",\"iso6391\":\"ta\",\"iso6392\":\"tam\",\"localePatterns\":[\"ta-IN\",\"ta-LK\"]},{\"code\":\"te\",\"name\":\"Telugu\",\"nativeName\":\"తెలుగు\",\"direction\":\"LTR\",\"iso6391\":\"te\",\"iso6392\":\"tel\",\"localePatterns\":[\"te-IN\"]},{\"code\":\"mr\",\"name\":\"Marathi\",\"nativeName\":\"मराठी\",\"direction\":\"LTR\",\"iso6391\":\"mr\",\"iso6392\":\"mar\",\"localePatterns\":[\"mr-IN\"]},{\"code\":\"tr\",\"name\":\"Turkish\",\"nativeName\":\"Türkçe\",\"direction\":\"LTR\",\"iso6391\":\"tr\",\"iso6392\":\"tur\",\"localePatterns\":[\"tr-TR\"]},{\"code\":\"it\",\"name\":\"Italian\",\"nativeName\":\"Italiano\",\"direction\":\"LTR\",\"iso6391\":\"it\",\"iso6392\":\"ita\",\"localePatterns\":[\"it-IT\",\"it-CH\"]},{\"code\":\"nl\",\"name\":\"Dutch\",\"nativeName\":\"Nederlands\",\"direction\":\"LTR\",\"iso6391\":\"nl\",\"iso6392\":\"nld\",\"localePatterns\":[\"nl-NL\",\"nl-BE\"]},{\"code\":\"th\",\"name\":\"Thai\",\"nativeName\":\"ไทย\",\"direction\":\"LTR\",\"iso6391\":\"th\",\"iso6392\":\"tha\",\"localePatterns\":[\"th-TH\"]},{\"code\":\"vi\",\"name\":\"Vietnamese\",\"nativeName\":\"Tiếng Việt\",\"direction\":\"LTR\",\"iso6391\":\"vi\",\"iso6392\":\"vie\",\"localePatterns\":[\"vi-VN\"]},{\"code\":\"id\",\"name\":\"Indonesian\",\"nativeName\":\"Bahasa Indonesia\",\"direction\":\"LTR\",\"iso6391\":\"id\",\"iso6392\":\"ind\",\"localePatterns\":[\"id-ID\"]},{\"code\":\"ms\",\"name\":\"Malay\",\"nativeName\":\"Bahasa Melayu\",\"direction\":\"LTR\",\"iso6391\":\"ms\",\"iso6392\":\"msa\",\"localePatterns\":[\"ms-MY\",\"ms-SG\"]},{\"code\":\"pl\",\"name\":\"Polish\",\"nativeName\":\"Polski\",\"direction\":\"LTR\",\"iso6391\":\"pl\",\"iso6392\":\"pol\",\"localePatterns\":[\"pl-PL\"]},{\"code\":\"sv\",\"name\":\"Swedish\",\"nativeName\":\"Svenska\",\"direction\":\"LTR\",\"iso6391\":\"sv\",\"iso6392\":\"swe\",\"localePatterns\":[\"sv-SE\"]},{\"code\":\"da\",\"name\":\"Danish\",\"nativeName\":\"Dansk\",\"direction\":\"LTR\",\"iso6391\":\"da\",\"iso6392\":\"dan\",\"localePatterns\":[\"da-DK\"]},{\"code\":\"no\",\"name\":\"Norwegian\",\"nativeName\":\"Norsk\",\"direction\":\"LTR\",\"iso6391\":\"no\",\"iso6392\":\"nor\",\"localePatterns\":[\"no-NO\"]},{\"code\":\"fi\",\"name\":\"Finnish\",\"nativeName\":\"Suomi\",\"direction\":\"LTR\",\"iso6391\":\"fi\",\"iso6392\":\"fin\",\"localePatterns\":[\"fi-FI\"]},{\"code\":\"he\",\"name\":\"Hebrew\",\"nativeName\":\"עברית\",\"direction\":\"RTL\",\"iso6391\":\"he\",\"iso6392\":\"heb\",\"localePatterns\":[\"he-IL\"]},{\"code\":\"uk\",\"name\":\"Ukrainian\",\"nativeName\":\"Українська\",\"direction\":\"LTR\",\"iso6391\":\"uk\",\"iso6392\":\"ukr\",\"localePatterns\":[\"uk-UA\"]},{\"code\":\"ro\",\"name\":\"Romanian\",\"nativeName\":\"Română\",\"direction\":\"LTR\",\"iso6391\":\"ro\",\"iso6392\":\"ron\",\"localePatterns\":[\"ro-RO\"]},{\"code\":\"hu\",\"name\":\"Hungarian\",\"nativeName\":\"Magyar\",\"direction\":\"LTR\",\"iso6391\":\"hu\",\"iso6392\":\"hun\",\"localePatterns\":[\"hu-HU\"]},{\"code\":\"el\",\"name\":\"Greek\",\"nativeName\":\"Ελληνικά\",\"direction\":\"LTR\",\"iso6391\":\"el\",\"iso6392\":\"ell\",\"localePatterns\":[\"el-GR\"]},{\"code\":\"sw\",\"name\":\"Swahili\",\"nativeName\":\"Kiswahili\",\"direction\":\"LTR\",\"iso6391\":\"sw\",\"iso6392\":\"swa\",\"localePatterns\":[\"sw-KE\",\"sw-TZ\"]},{\"code\":\"ur\",\"name\":\"Urdu\",\"nativeName\":\"اردو\",\"direction\":\"RTL\",\"iso6391\":\"ur\",\"iso6392\":\"urd\",\"localePatterns\":[\"ur-PK\",\"ur-IN\"]},{\"code\":\"tl\",\"name\":\"Filipino\",\"nativeName\":\"Filipino\",\"direction\":\"LTR\",\"iso6391\":\"tl\",\"iso6392\":\"tgl\",\"localePatterns\":[\"tl-PH\"]},{\"code\":\"cs\",\"name\":\"Czech\",\"nativeName\":\"Čeština\",\"direction\":\"LTR\",\"iso6391\":\"cs\",\"iso6392\":\"ces\",\"localePatterns\":[\"cs-CZ\"]}]"
  - button "Edit"
  - button "Reset"
  - code: timezone_list
  - text: string
  - paragraph: Supported timezones with UTC offsets
  - text: "[{\"name\":\"Asia/Kolkata\",\"label\":\"IST (UTC+5:30)\",\"utcOffset\":\"+05:30\",\"country\":\"IN\",\"city\":\"Mumbai\"},{\"name\":\"America/New_York\",\"label\":\"EST/EDT (UTC-5/-4)\",\"utcOffset\":\"-05:00\",\"country\":\"US\",\"city\":\"New York\"},{\"name\":\"America/Chicago\",\"label\":\"CST/CDT (UTC-6/-5)\",\"utcOffset\":\"-06:00\",\"country\":\"US\",\"city\":\"Chicago\"},{\"name\":\"America/Los_Angeles\",\"label\":\"PST/PDT (UTC-8/-7)\",\"utcOffset\":\"-08:00\",\"country\":\"US\",\"city\":\"Los Angeles\"},{\"name\":\"Europe/London\",\"label\":\"GMT/BST (UTC+0/+1)\",\"utcOffset\":\"+00:00\",\"country\":\"GB\",\"city\":\"London\"},{\"name\":\"Europe/Berlin\",\"label\":\"CET/CEST (UTC+1/+2)\",\"utcOffset\":\"+01:00\",\"country\":\"DE\",\"city\":\"Berlin\"},{\"name\":\"Europe/Paris\",\"label\":\"CET/CEST (UTC+1/+2)\",\"utcOffset\":\"+01:00\",\"country\":\"FR\",\"city\":\"Paris\"},{\"name\":\"Asia/Tokyo\",\"label\":\"JST (UTC+9)\",\"utcOffset\":\"+09:00\",\"country\":\"JP\",\"city\":\"Tokyo\"},{\"name\":\"Asia/Shanghai\",\"label\":\"CST (UTC+8)\",\"utcOffset\":\"+08:00\",\"country\":\"CN\",\"city\":\"Shanghai\"},{\"name\":\"Asia/Singapore\",\"label\":\"SGT (UTC+8)\",\"utcOffset\":\"+08:00\",\"country\":\"SG\",\"city\":\"Singapore\"},{\"name\":\"Australia/Sydney\",\"label\":\"AEST/AEDT (UTC+10/+11)\",\"utcOffset\":\"+10:00\",\"country\":\"AU\",\"city\":\"Sydney\"},{\"name\":\"Asia/Dubai\",\"label\":\"GST (UTC+4)\",\"utcOffset\":\"+04:00\",\"country\":\"AE\",\"city\":\"Dubai\"},{\"name\":\"America/Sao_Paulo\",\"label\":\"BRT (UTC-3)\",\"utcOffset\":\"-03:00\",\"country\":\"BR\",\"city\":\"São Paulo\"},{\"name\":\"Europe/Moscow\",\"label\":\"MSK (UTC+3)\",\"utcOffset\":\"+03:00\",\"country\":\"RU\",\"city\":\"Moscow\"},{\"name\":\"Asia/Seoul\",\"label\":\"KST (UTC+9)\",\"utcOffset\":\"+09:00\",\"country\":\"KR\",\"city\":\"Seoul\"},{\"name\":\"Asia/Bangkok\",\"label\":\"ICT (UTC+7)\",\"utcOffset\":\"+07:00\",\"country\":\"TH\",\"city\":\"Bangkok\"},{\"name\":\"Africa/Lagos\",\"label\":\"WAT (UTC+1)\",\"utcOffset\":\"+01:00\",\"country\":\"NG\",\"city\":\"Lagos\"},{\"name\":\"Africa/Johannesburg\",\"label\":\"SAST (UTC+2)\",\"utcOffset\":\"+02:00\",\"country\":\"ZA\",\"city\":\"Johannesburg\"},{\"name\":\"Pacific/Auckland\",\"label\":\"NZST/NZDT (UTC+12/+13)\",\"utcOffset\":\"+12:00\",\"country\":\"NZ\",\"city\":\"Auckland\"},{\"name\":\"America/Toronto\",\"label\":\"EST/EDT (UTC-5/-4)\",\"utcOffset\":\"-05:00\",\"country\":\"CA\",\"city\":\"Toronto\"}]"
  - button "Edit"
  - button "Reset"
  - heading "homepage" [level=2]
  - code: homepage.banner_count
  - text: number default
  - paragraph: Max banners in carousel
  - text: "5"
  - button "Edit"
  - code: homepage.deal_count
  - text: number default
  - paragraph: Max deals shown
  - text: "6"
  - button "Edit"
  - code: homepage.product_count
  - text: number default
  - paragraph: Products per homepage section
  - text: "12"
  - button "Edit"
  - code: homepage.sections
  - text: json default
  - paragraph: Ordered homepage section list
  - text: "[\"banners\",\"categories\",\"deals\",\"recommendations\",\"recentlyViewed\"]"
  - button "Edit"
  - heading "invoice" [level=2]
  - code: invoice.company_address
  - text: string default
  - paragraph: Company address on invoice
  - text: (empty)
  - button "Edit"
  - code: invoice.company_email
  - text: string default
  - paragraph: Company email on invoice
  - text: (empty)
  - button "Edit"
  - code: invoice.company_gstin
  - text: string default
  - paragraph: Company GSTIN for GST invoices
  - text: (empty)
  - button "Edit"
  - code: invoice.company_name
  - text: string default
  - paragraph: Company name on invoice
  - text: ShopEase
  - button "Edit"
  - code: invoice.company_phone
  - text: string default
  - paragraph: Company phone on invoice
  - text: (empty)
  - button "Edit"
  - code: invoice.enabled
  - text: boolean default
  - paragraph: Enable invoice generation
  - text: "true"
  - button "Edit"
  - code: invoice.gst_enabled
  - text: boolean default
  - paragraph: Include GST breakdown in invoices
  - text: "true"
  - button "Edit"
  - code: invoice.logo_url
  - text: string default
  - paragraph: Logo URL for invoice header
  - text: (empty)
  - button "Edit"
  - code: invoice.prefix
  - text: string default
  - paragraph: Invoice number prefix
  - text: INV
  - button "Edit"
  - code: invoice.template
  - text: string default
  - paragraph: Invoice template (standard, gst)
  - text: standard
  - button "Edit"
  - heading "mfa" [level=2]
  - code: mfa.backup_codes_count
  - text: number default
  - paragraph: Number of backup codes to generate
  - text: "8"
  - button "Edit"
  - code: mfa.enabled
  - text: boolean default
  - paragraph: Allow users to enable MFA
  - text: "true"
  - button "Edit"
  - code: mfa.enforce_admin
  - text: boolean default
  - paragraph: Enforce MFA for admin accounts
  - text: "false"
  - button "Edit"
  - code: mfa.issuer
  - text: string default
  - paragraph: TOTP issuer name shown in authenticator
  - text: ShopEase
  - button "Edit"
  - heading "monitoring" [level=2]
  - code: monitoring.alert_email
  - text: string default
  - paragraph: Email for alert notifications
  - text: (empty)
  - button "Edit"
  - code: monitoring.enabled
  - text: boolean default
  - paragraph: Enable monitoring system
  - text: "true"
  - button "Edit"
  - code: monitoring.error_rate_threshold
  - text: number default
  - paragraph: Error rate % threshold for alerts
  - text: "5"
  - button "Edit"
  - code: monitoring.health_check_interval_s
  - text: number default
  - paragraph: Health check interval in seconds
  - text: "30"
  - button "Edit"
  - code: monitoring.latency_p99_threshold_ms
  - text: number default
  - paragraph: P99 latency threshold in ms
  - text: "2000"
  - button "Edit"
  - code: monitoring.metrics_enabled
  - text: boolean default
  - paragraph: Enable metrics collection
  - text: "true"
  - button "Edit"
  - code: monitoring.tracing_enabled
  - text: boolean default
  - paragraph: Enable distributed tracing
  - text: "true"
  - button "Edit"
  - heading "notification" [level=2]
  - code: notification.email_enabled
  - text: boolean default
  - paragraph: Enable email notifications
  - text: "true"
  - button "Edit"
  - code: notification.push_enabled
  - text: boolean default
  - paragraph: Enable push notifications
  - text: "true"
  - button "Edit"
  - code: notification.sms_enabled
  - text: boolean default
  - paragraph: Enable SMS notifications
  - text: "true"
  - button "Edit"
  - code: notification.whatsapp_enabled
  - text: boolean default
  - paragraph: Enable WhatsApp notifications
  - text: "false"
  - button "Edit"
  - heading "orders" [level=2]
  - code: order_cancellation_window
  - text: string
  - paragraph: Cancellation window in hours
  - text: "1"
  - button "Edit"
  - button "Reset"
  - heading "performance" [level=2]
  - code: performance.cls_budget
  - text: number default
  - paragraph: CLS budget (good < 0.1)
  - text: "0.1"
  - button "Edit"
  - code: performance.fid_budget_ms
  - text: number default
  - paragraph: FID budget in ms (good < 100)
  - text: "100"
  - button "Edit"
  - code: performance.inp_budget_ms
  - text: number default
  - paragraph: INP budget in ms (good < 200)
  - text: "200"
  - button "Edit"
  - code: performance.lcp_budget_ms
  - text: number default
  - paragraph: LCP budget in ms (good < 2500)
  - text: "2500"
  - button "Edit"
  - code: performance.web_vitals_enabled
  - text: boolean default
  - paragraph: Track Core Web Vitals
  - text: "true"
  - button "Edit"
  - heading "pricing" [level=2]
  - code: dynamic_pricing.demand_window_hours
  - text: number default
  - paragraph: Demand analysis window in hours
  - text: "24"
  - button "Edit"
  - code: dynamic_pricing.enabled
  - text: boolean default
  - paragraph: Enable dynamic pricing
  - text: "false"
  - button "Edit"
  - code: dynamic_pricing.max_discount_pct
  - text: number default
  - paragraph: Maximum dynamic discount percentage
  - text: "20"
  - button "Edit"
  - code: dynamic_pricing.max_surcharge_pct
  - text: number default
  - paragraph: Maximum dynamic surcharge percentage
  - text: "15"
  - button "Edit"
  - heading "queue" [level=2]
  - code: queue.bullmq.redis_url
  - text: string secret default
  - paragraph: BullMQ Redis URL
  - text: (empty)
  - button "Edit"
  - code: queue.concurrency
  - text: number default
  - paragraph: Max concurrent jobs per queue
  - text: "5"
  - button "Edit"
  - code: queue.provider
  - text: string default
  - paragraph: Queue provider (memory, bullmq)
  - text: memory
  - button "Edit"
  - code: queue.retry_attempts
  - text: number default
  - paragraph: Max retry attempts for failed jobs
  - text: "3"
  - button "Edit"
  - code: queue.retry_delay_ms
  - text: number default
  - paragraph: Base retry delay in milliseconds
  - text: "5000"
  - button "Edit"
  - heading "rate limit" [level=2]
  - code: rate_limit.auth
  - text: number default
  - paragraph: Auth endpoint rate limit per minute
  - text: "5"
  - button "Edit"
  - code: rate_limit.general
  - text: number default
  - paragraph: General endpoint rate limit per minute
  - text: "60"
  - button "Edit"
  - code: rate_limit.payment
  - text: number default
  - paragraph: Payment endpoint rate limit per minute
  - text: "10"
  - button "Edit"
  - code: rate_limit.search
  - text: number default
  - paragraph: Search endpoint rate limit per minute
  - text: "30"
  - button "Edit"
  - code: rate_limit.upload
  - text: number default
  - paragraph: Upload endpoint rate limit per minute
  - text: "5"
  - button "Edit"
  - heading "referral" [level=2]
  - code: referral.enabled
  - text: boolean default
  - paragraph: Enable referral program
  - text: "true"
  - button "Edit"
  - code: referral.expiry_days
  - text: number default
  - paragraph: Referral reward expiry in days
  - text: "90"
  - button "Edit"
  - code: referral.max_per_user
  - text: number default
  - paragraph: Max referral rewards per user
  - text: "10"
  - button "Edit"
  - code: referral.min_order_amount
  - text: number default
  - paragraph: Minimum order amount to trigger referral reward
  - text: "500"
  - button "Edit"
  - code: referral.reward_amount
  - text: number default
  - paragraph: Reward amount for successful referral
  - text: "100"
  - button "Edit"
  - code: referral.reward_type
  - text: string default
  - paragraph: Reward type (WALLET, DISCOUNT, FREE_PRODUCT)
  - text: WALLET
  - button "Edit"
  - heading "search" [level=2]
  - code: search.analytics_enabled
  - text: boolean default
  - paragraph: Track search analytics
  - text: "true"
  - button "Edit"
  - code: search.autocomplete.min_chars
  - text: number default
  - paragraph: Minimum characters before autocomplete triggers
  - text: "2"
  - button "Edit"
  - code: search.meilisearch.key
  - text: string secret default
  - paragraph: Meilisearch master/API key
  - text: (empty)
  - button "Edit"
  - code: search.meilisearch.url
  - text: string default
  - paragraph: Meilisearch instance URL
  - text: http://localhost:7700
  - button "Edit"
  - code: search.provider
  - text: string default
  - paragraph: Search engine provider (postgres, meilisearch, typesense)
  - text: postgres
  - button "Edit"
  - code: search.results_per_page
  - text: number default
  - paragraph: Search results per page
  - text: "20"
  - button "Edit"
  - code: search.typesense.key
  - text: string secret default
  - paragraph: Typesense API key
  - text: (empty)
  - button "Edit"
  - code: search.typesense.url
  - text: string default
  - paragraph: Typesense instance URL
  - text: http://localhost:8108
  - button "Edit"
  - code: search.typo_tolerance
  - text: boolean default
  - paragraph: Enable typo-tolerant search
  - text: "true"
  - button "Edit"
  - heading "shipping" [level=2]
  - code: free_shipping_min
  - text: string
  - paragraph: Free shipping above this amount
  - text: "500"
  - button "Edit"
  - button "Reset"
  - code: shipping_carriers
  - text: string
  - paragraph: Shipping carrier integrations and tracking URLs
  - text: "[{\"name\":\"ShopEase Express\",\"code\":\"SHOPEASE\",\"countries\":[\"IN\"],\"isInternational\":false,\"trackingUrl\":\"https://shopease.com/track/{id}\",\"apiProvider\":\"in-house\"},{\"name\":\"Delhivery\",\"code\":\"DELHIVERY\",\"countries\":[\"IN\"],\"isInternational\":false,\"trackingUrl\":\"https://www.delhivery.com/track/{id}\",\"apiProvider\":\"delhivery\"},{\"name\":\"Blue Dart\",\"code\":\"BLUEDART\",\"countries\":[\"IN\"],\"isInternational\":true,\"trackingUrl\":\"https://www.bluedart.com/tracking/{id}\",\"apiProvider\":\"bluedart\"},{\"name\":\"DHL Express\",\"code\":\"DHL\",\"countries\":[\"*\"],\"isInternational\":true,\"trackingUrl\":\"https://www.dhl.com/track?tracking-id={id}\",\"apiProvider\":\"dhl\"},{\"name\":\"FedEx\",\"code\":\"FEDEX\",\"countries\":[\"*\"],\"isInternational\":true,\"trackingUrl\":\"https://www.fedex.com/apps/fedextrack/?tracknumbers={id}\",\"apiProvider\":\"fedex\"},{\"name\":\"UPS\",\"code\":\"UPS\",\"countries\":[\"*\"],\"isInternational\":true,\"trackingUrl\":\"https://www.ups.com/track?loc=en_US&tracknum={id}\",\"apiProvider\":\"ups\"},{\"name\":\"USPS\",\"code\":\"USPS\",\"countries\":[\"US\"],\"isInternational\":false,\"trackingUrl\":\"https://tools.usps.com/go/TrackConfirmAction?tLabels={id}\",\"apiProvider\":\"usps\"},{\"name\":\"Ecom Express\",\"code\":\"ECOM\",\"countries\":[\"IN\"],\"isInternational\":false,\"trackingUrl\":\"https://www.ecomexpress.in/track-shipment/?awbnumber={id}\",\"apiProvider\":\"ecom\"},{\"name\":\"Xpressbees\",\"code\":\"XPRESSBEES\",\"countries\":[\"IN\"],\"isInternational\":false,\"trackingUrl\":\"https://www.xpressbees.in/tracking/{id}\",\"apiProvider\":\"xpressbees\"},{\"name\":\"Australia Post\",\"code\":\"AUSPOST\",\"countries\":[\"AU\"],\"isInternational\":true,\"trackingUrl\":\"https://auspost.com.au/track/track.html?id={id}\",\"apiProvider\":\"auspost\"},{\"name\":\"Royal Mail\",\"code\":\"ROYALMAIL\",\"countries\":[\"GB\"],\"isInternational\":true,\"trackingUrl\":\"https://www.royalmail.com/track-it?trackNumber={id}\",\"apiProvider\":\"royalmail\"},{\"name\":\"La Poste\",\"code\":\"LAPOSTE\",\"countries\":[\"FR\"],\"isInternational\":true,\"trackingUrl\":\"https://www.laposte.fr/suivre-votre-colis?code={id}\",\"apiProvider\":\"laposte\"},{\"name\":\"Correos\",\"code\":\"CORREOS\",\"countries\":[\"ES\"],\"isInternational\":true,\"trackingUrl\":\"https://www.correos.es/es/es/enviar-y-seguir/envios-nacionales-y-internacionales/seguimiento\",\"apiProvider\":\"correos\"},{\"name\":\"Japan Post\",\"code\":\"JAPANPOST\",\"countries\":[\"JP\"],\"isInternational\":true,\"trackingUrl\":\"https://track.postjapan.jp/simple/detail/{id}\",\"apiProvider\":\"japanpost\"},{\"name\":\"Korea Post\",\"code\":\"KOREAPOST\",\"countries\":[\"KR\"],\"isInternational\":true,\"trackingUrl\":\"https://service.epost.go.kr/trace/trace.RetrieveTraceListDetailView.page?tid={id}\",\"apiProvider\":\"koreapost\"}]"
  - button "Edit"
  - button "Reset"
  - code: shipping_methods
  - text: string
  - paragraph: Available shipping methods and their configurations
  - text: "[{\"code\":\"STANDARD\",\"name\":\"Standard Delivery\",\"nameHi\":\"मानक डिलीवरी\",\"description\":\"3-7 business days\",\"estimatedDays\":{\"min\":3,\"max\":7},\"isExpress\":false,\"freeShippingEligible\":true,\"priceInRupees\":50},{\"code\":\"EXPRESS\",\"name\":\"Express Delivery\",\"nameHi\":\"त्वरित डिलीवरी\",\"description\":\"1-2 business days\",\"estimatedDays\":{\"min\":1,\"max\":2},\"isExpress\":true,\"freeShippingEligible\":true,\"priceInRupees\":99},{\"code\":\"SAME_DAY\",\"name\":\"Same Day Delivery\",\"nameHi\":\"उसी दिन डिलीवरी\",\"description\":\"Delivered today (order before 12 PM)\",\"estimatedDays\":{\"min\":0,\"max\":0},\"isExpress\":true,\"freeShippingEligible\":false,\"priceInRupees\":149},{\"code\":\"ONE_HOUR\",\"name\":\"1-Hour Delivery\",\"nameHi\":\"1 घंटे में डिलीवरी\",\"description\":\"Quick commerce - within 1 hour\",\"estimatedDays\":{\"min\":0,\"max\":0},\"isExpress\":true,\"isBlinkitStyle\":true,\"freeShippingEligible\":false,\"priceInRupees\":29,\"note\":\"Available in select cities only\"},{\"code\":\"SCHEDULED\",\"name\":\"Scheduled Delivery\",\"nameHi\":\"निर्धारित डिलीवरी\",\"description\":\"Choose your preferred date & time\",\"estimatedDays\":{\"min\":3,\"max\":10},\"isExpress\":false,\"freeShippingEligible\":true,\"priceInRupees\":79},{\"code\":\"FREE_SHIPPING\",\"name\":\"Free Shipping\",\"nameHi\":\"मुफ्त शिपिंग\",\"description\":\"Orders above ₹500\",\"estimatedDays\":{\"min\":5,\"max\":10},\"isExpress\":false,\"freeShippingEligible\":true,\"priceInRupees\":0,\"minOrderValue\":500},{\"code\":\"PICKUP\",\"name\":\"Store Pickup\",\"nameHi\":\"स्टोर से उठाएं\",\"description\":\"Pick up from nearest store\",\"estimatedDays\":{\"min\":0,\"max\":1},\"isExpress\":false,\"freeShippingEligible\":true,\"priceInRupees\":0},{\"code\":\"INTERNATIONAL\",\"name\":\"International Shipping\",\"nameHi\":\"अंतर्राष्ट्रीय शिपिंग\",\"description\":\"7-21 business days\",\"estimatedDays\":{\"min\":7,\"max\":21},\"isExpress\":false,\"freeShippingEligible\":false,\"priceInRupees\":500}]"
  - button "Edit"
  - button "Reset"
  - code: shipping_rate
  - text: string
  - paragraph: Default shipping rate in INR
  - text: "50"
  - button "Edit"
  - button "Reset"
  - heading "slot" [level=2]
  - code: slot.advance_booking_hours
  - text: number default
  - paragraph: How far ahead slots can be booked
  - text: "48"
  - button "Edit"
  - code: slot.buffer_min
  - text: number default
  - paragraph: Buffer between slots in minutes
  - text: "15"
  - button "Edit"
  - code: slot.cutoff_min
  - text: number default
  - paragraph: Minutes before slot starts to stop booking
  - text: "30"
  - button "Edit"
  - code: slot.duration_min
  - text: number default
  - paragraph: Delivery slot duration in minutes
  - text: "30"
  - button "Edit"
  - code: slot.max_orders_per_slot
  - text: number default
  - paragraph: Maximum orders per time slot
  - text: "10"
  - button "Edit"
  - code: slot.prep_time_min
  - text: number default
  - paragraph: Order preparation time in minutes
  - text: "20"
  - button "Edit"
  - heading "store" [level=2]
  - code: store_currency
  - text: string default
  - paragraph: Default store currency
  - text: INR
  - button "Edit"
  - code: store_logo_url
  - text: string default
  - paragraph: Store logo URL
  - text: (empty)
  - button "Edit"
  - code: store_support_email
  - text: string default
  - paragraph: Support email address
  - text: (empty)
  - button "Edit"
  - code: store_support_phone
  - text: string default
  - paragraph: Support phone number
  - text: (empty)
  - button "Edit"
  - heading "surge" [level=2]
  - code: surge.agent_shortage_threshold
  - text: number default
  - paragraph: Agent-to-order ratio below which surge triggers
  - text: "0.5"
  - button "Edit"
  - code: surge.enabled
  - text: boolean default
  - paragraph: Enable surge pricing
  - text: "false"
  - button "Edit"
  - code: surge.max_multiplier
  - text: number default
  - paragraph: Maximum surge price multiplier
  - text: "2.0"
  - button "Edit"
  - code: surge.order_density_threshold
  - text: number default
  - paragraph: Orders/hour threshold to trigger surge
  - text: "50"
  - button "Edit"
  - code: surge.time_based_enabled
  - text: boolean default
  - paragraph: Enable time-of-day surge
  - text: "false"
  - button "Edit"
  - code: surge.weather_enabled
  - text: boolean default
  - paragraph: Enable weather-based surge
  - text: "false"
  - button "Edit"
  - heading "tax" [level=2]
  - code: tax_rate
  - text: string
  - paragraph: Default tax rate percentage
  - text: "18"
  - button "Edit"
  - button "Reset"
  - heading "webhook" [level=2]
  - code: webhook.dead_letter_enabled
  - text: boolean default
  - paragraph: Enable dead letter queue for failed webhooks
  - text: "true"
  - button "Edit"
  - code: webhook.max_retries
  - text: number default
  - paragraph: Maximum webhook retry attempts
  - text: "5"
  - button "Edit"
  - code: webhook.retry_base_delay_ms
  - text: number default
  - paragraph: Base retry delay in ms
  - text: "60000"
  - button "Edit"
  - code: webhook.timeout_ms
  - text: number default
  - paragraph: Webhook delivery timeout in ms
  - text: "10000"
  - button "Edit"
- region "Notifications alt+T"
- alert
```

# Test source

```ts
  36  |   });
  37  | 
  38  |   test("should display dashboard with key metrics", async ({ page }) => {
  39  |     await page.goto("/admin");
  40  |     await page.waitForLoadState("networkidle");
  41  | 
  42  |     // Verify revenue metric
  43  |     const revenueCard = page.locator('[data-testid="metric-revenue"]');
  44  |     await expect(revenueCard).toBeVisible({ timeout: 10000 });
  45  | 
  46  |     // Verify orders metric
  47  |     const ordersCard = page.locator('[data-testid="metric-orders"]');
  48  |     await expect(ordersCard).toBeVisible();
  49  | 
  50  |     // Verify customers metric
  51  |     const customersCard = page.locator('[data-testid="metric-customers"]');
  52  |     await expect(customersCard).toBeVisible();
  53  | 
  54  |     // Verify conversion rate
  55  |     const conversionCard = page.locator('[data-testid="metric-conversion"]');
  56  |     await expect(conversionCard).toBeVisible();
  57  |   });
  58  | 
  59  |   test("should display revenue chart", async ({ page }) => {
  60  |     await page.goto("/admin");
  61  |     await page.waitForLoadState("networkidle");
  62  | 
  63  |     // Chart should be visible
  64  |     const chart = page.locator('[data-testid="revenue-chart"]');
  65  |     await expect(chart).toBeVisible({ timeout: 10000 });
  66  | 
  67  |     // Should have date range selector
  68  |     const rangeSelector = page.locator('[data-testid="date-range-selector"]');
  69  |     if (await rangeSelector.isVisible({ timeout: 3000 }).catch(() => false)) {
  70  |       // Switch to 30 days
  71  |       await page.click('[data-testid="range-30d"]');
  72  |       await page.waitForLoadState("networkidle");
  73  |     }
  74  |   });
  75  | 
  76  |   test("should show recent orders", async ({ page }) => {
  77  |     await page.goto("/admin");
  78  |     await page.waitForLoadState("networkidle");
  79  | 
  80  |     const recentOrders = page.locator('[data-testid="recent-orders"]');
  81  |     await expect(recentOrders).toBeVisible({ timeout: 10000 });
  82  | 
  83  |     // Should have at least one order row
  84  |     const orderRows = recentOrders.locator('[data-testid="order-row"]');
  85  |     const count = await orderRows.count();
  86  |     // Orders may or may not exist in test DB
  87  |     expect(count).toBeGreaterThanOrEqual(0);
  88  |   });
  89  | 
  90  |   test("should navigate to orders management", async ({ page }) => {
  91  |     await page.goto("/admin");
  92  |     await page.waitForLoadState("networkidle");
  93  | 
  94  |     // Click on orders nav item
  95  |     await page.click('[data-testid="nav-orders"]');
  96  |     await page.waitForURL("**/admin/orders**");
  97  | 
  98  |     // Orders table should be visible
  99  |     const ordersTable = page.locator('[data-testid="orders-table"]');
  100 |     await expect(ordersTable).toBeVisible({ timeout: 10000 });
  101 | 
  102 |     // Should have status filter
  103 |     const statusFilter = page.locator('[data-testid="status-filter"]');
  104 |     if (await statusFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
  105 |       await statusFilter.selectOption("PENDING");
  106 |       await page.waitForLoadState("networkidle");
  107 |     }
  108 |   });
  109 | 
  110 |   test("should navigate to products management", async ({ page }) => {
  111 |     await page.goto("/admin");
  112 |     await page.waitForLoadState("networkidle");
  113 | 
  114 |     // Click on products nav item
  115 |     await page.click('[data-testid="nav-products"]');
  116 |     await page.waitForURL("**/admin/products**");
  117 | 
  118 |     // Products table should be visible
  119 |     const productsTable = page.locator('[data-testid="products-table"]');
  120 |     await expect(productsTable).toBeVisible({ timeout: 10000 });
  121 | 
  122 |     // Search should work
  123 |     const searchInput = page.locator('[data-testid="product-search"]');
  124 |     if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  125 |       await searchInput.fill("test");
  126 |       await page.waitForLoadState("networkidle");
  127 |     }
  128 |   });
  129 | 
  130 |   test("should manage system configuration", async ({ page }) => {
  131 |     await page.goto("/admin/config");
  132 |     await page.waitForLoadState("networkidle");
  133 | 
  134 |     // Config list should be visible
  135 |     const configList = page.locator('[data-testid="config-list"]');
> 136 |     await expect(configList).toBeVisible({ timeout: 10000 });
      |                              ^ Error: expect(locator).toBeVisible() failed
  137 | 
  138 |     // Category filter should work
  139 |     const categoryFilter = page.locator('[data-testid="config-category-filter"]');
  140 |     if (await categoryFilter.isVisible({ timeout: 3000 }).catch(() => false)) {
  141 |       await categoryFilter.selectOption("search");
  142 |       await page.waitForLoadState("networkidle");
  143 |     }
  144 | 
  145 |     // Search should work
  146 |     const searchInput = page.locator('[data-testid="config-search"]');
  147 |     if (await searchInput.isVisible({ timeout: 3000 }).catch(() => false)) {
  148 |       await searchInput.fill("cache");
  149 |       await page.waitForLoadState("networkidle");
  150 |     }
  151 |   });
  152 | 
  153 |   test("should view monitoring dashboard", async ({ page }) => {
  154 |     await page.goto("/admin/monitoring");
  155 |     await page.waitForLoadState("networkidle");
  156 | 
  157 |     // Health status should be visible
  158 |     const healthStatus = page.locator('[data-testid="health-status"]');
  159 |     await expect(healthStatus).toBeVisible({ timeout: 10000 });
  160 | 
  161 |     // Should show circuit breaker states
  162 |     const circuitBreakers = page.locator('[data-testid="circuit-breaker-status"]');
  163 |     if (await circuitBreakers.isVisible({ timeout: 5000 }).catch(() => false)) {
  164 |       await expect(circuitBreakers).toContainText("CLOSED|OPEN|HALF_OPEN");
  165 |     }
  166 |   });
  167 | 
  168 |   test("should view fraud review dashboard", async ({ page }) => {
  169 |     await page.goto("/admin/fraud");
  170 |     await page.waitForLoadState("networkidle");
  171 | 
  172 |     // Fraud dashboard should load
  173 |     const fraudContent = page.locator('[data-testid="fraud-dashboard"]');
  174 |     await expect(fraudContent).toBeVisible({ timeout: 10000 });
  175 |   });
  176 | 
  177 |   test("should manage feature flags", async ({ page }) => {
  178 |     await page.goto("/admin/feature-flags");
  179 |     await page.waitForLoadState("networkidle");
  180 | 
  181 |     // Feature flags list should be visible
  182 |     const flagList = page.locator('[data-testid="feature-flags-list"]');
  183 |     await expect(flagList).toBeVisible({ timeout: 10000 });
  184 |   });
  185 | 
  186 |   test("should view queue dashboard", async ({ page }) => {
  187 |     await page.goto("/admin/queue");
  188 |     await page.waitForLoadState("networkidle");
  189 | 
  190 |     // Queue dashboard should load
  191 |     const queueContent = page.locator('[data-testid="queue-dashboard"]');
  192 |     await expect(queueContent).toBeVisible({ timeout: 10000 });
  193 |   });
  194 | 
  195 |   test("should navigate between admin sections", async ({ page }) => {
  196 |     await page.goto("/admin");
  197 |     await page.waitForLoadState("networkidle");
  198 | 
  199 |     const navLinks = [
  200 |       { testId: "nav-orders", urlPattern: /\/admin\/orders/ },
  201 |       { testId: "nav-products", urlPattern: /\/admin\/products/ },
  202 |       { testId: "nav-customers", urlPattern: /\/admin\/customers/ },
  203 |       { testId: "nav-config", urlPattern: /\/admin\/config/ },
  204 |     ];
  205 | 
  206 |     for (const link of navLinks) {
  207 |       const navItem = page.locator(`[data-testid="${link.testId}"]`);
  208 |       if (await navItem.isVisible({ timeout: 2000 }).catch(() => false)) {
  209 |         await navItem.click();
  210 |         await page.waitForURL(link.urlPattern);
  211 |         await page.goBack();
  212 |         await page.waitForURL("**/admin");
  213 |       }
  214 |     }
  215 |   });
  216 | });
  217 | 
```