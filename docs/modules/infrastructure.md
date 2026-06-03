# Domain 5 — Infrastructure (lib, API, data, frontend)

[← Master Index](./README.md) · Legend: ✅ Real · 🟡 Partial · 🔴 Stub

Shared libraries, HTTP API surface, the data layer, and the frontend (components/hooks/stores/middleware) that support all domains.

## Core libraries (`src/lib`)
| Module | Status | Purpose |
|---|---|---|
| `prisma.ts` | ✅ | Prisma client singleton (DB access). |
| `auth.ts` + `auth/` | ✅ | Session/auth helpers (`getSession`), NextAuth config. |
| `site-context.ts` / `site-permissions.ts` / `require-site-admin.ts` | ✅ | Tenant resolution & per-site authorization. |
| `platform-access.ts` / `module-guard.ts` | ✅ | Platform/module access guards. |
| `config/` (`services-config.ts`, `app-config.ts`) | 🟡 | Central config + external service provider registry (`getServiceProvider`). |
| `providers/` | 🟡 | Service-provider adapters (many default to stubs). |
| `payments/` (`providers/razorpay|stripe|paypal`, `index.ts`) | ✅ | Real payment gateway integrations. |
| `razorpay.ts` | ✅ | Razorpay helper. |
| `queue/` | ✅ | BullMQ background jobs (Redis/ioredis). |
| `cache/` + `cache-config.ts` | ✅ | Caching layer. |
| `search/` | 🟡 | Search helpers (DB-based; not a search engine). |
| `image-search.ts` | 🟡 | Image search (`api/search/image`). |
| `observability/` + `logger.ts` + `request-id.ts` | ✅ | Logging (pino), tracing, request IDs (+ Sentry config at repo root). |
| `circuit-breaker/` | 🟡 | Resilience wrappers. |
| `feature-flags/` | ✅ | Flag evaluation. |
| `mfa/` | ✅ | TOTP/MFA. |
| `encryption.ts` | ✅ | Encryption (crypto-js). |
| `rate-limit.ts` | ✅ | Rate limiting. |
| `fraud/` | 🟡 | Fraud rule helpers. |
| `delivery/` + `delivery-estimates.ts` | 🟡 | Delivery/ETA helpers. |
| `surge/` | ✅ | Surge pricing helpers. |
| `pricing/` | 🟡 | Pricing helpers. |
| `slot/` | ✅ | Slot helpers. |
| `forecast/` | 🟡 | Forecast helpers. |
| `gamification/` | ✅ | Gamification helpers. |
| `tax/` | ✅ | Tax helpers. |
| `invoice/` | ✅ | Invoice rendering. |
| `bulk-upload/` | ✅ | Bulk import parsing. |
| `upload/` + `file-validator.ts` | ✅ | File uploads (`api/upload`), S3 (`@aws-sdk`). |
| `deep-links/` | ✅ | Deep links / PWA (`api/deep-link`). |
| `markets/` | ✅ | Market/exchange data for trading vertical. |
| `sites/` | ✅ | Site helpers. |
| `ai/` | 🟡 | AI orchestration core (provider-dependent inference). |
| `geo.ts` / `ip-geolocation.ts` / `get-real-ip.ts` | ✅ | Geo/IP utilities. |
| `currency.ts` / `currency-api.ts` / `currency-format.ts` | 🟡 | Currency conversion (external rate API optional). |
| `i18n.ts` | ✅ | i18n helper. |
| `live-chat-server.ts` | ✅ | WebSocket chat server (ws). |
| `webhook-delivery.ts` | ✅ | Outbound webhook dispatch. |
| `crm.ts` / `erp.ts` | 🟡 | CRM/ERP connectors (thin). |
| `gdpr.ts` | ✅ | GDPR helpers. |
| `validations/` (24 files) | ✅ | Zod schemas per domain. |
| `serialize.ts` / `validate.ts` / `validation-helpers.ts` / `server-action-wrapper.ts` / `errors.ts` / `cookies.ts` / `utils.ts` / `map-config.ts` / `duplicate-prevention.ts` / `env-validation.ts` | ✅ | Misc shared utilities. |

## API routes (`src/app/api`, 40 handlers)
| Area | Routes | Notes |
|---|---|---|
| Auth | `auth/[...nextauth]` | NextAuth. |
| Public API | `v1/[...slug]` | Versioned catch-all API (key-gated). |
| Payments | `razorpay/webhook` · `stripe/webhook` · `paypal/webhook` | ✅ Real webhooks. |
| Search | `search` · `search/autocomplete` · `search/image` · `search/analytics` | 🟡 DB-based. |
| Delivery | `delivery/track/[assignmentId]` · `delivery/live` | 🟡 Snapshot tracking. |
| AI | `ai/agents/run` · `ai/analyze` · `ai/data` | 🟡 Provider-dependent. |
| Admin/Ops | `admin/dashboard` · `admin/queue` · `admin/circuit-breaker` · `admin/alerts` · `admin/config/reload` · `admin/tax-sync` · `admin/voucher-code` | ✅ |
| Platform | `site/resolve` · `feature-flags` · `manifest` · `deep-link` · `events` | ✅ Tenant resolution etc. |
| GDPR | `gdpr/export` · `gdpr/delete` | ✅ |
| Commerce | `deals` · `invoice` · `invoice/[orderId]` · `upload` · `location` · `chatbot` | ✅/🟡 |
| Trading | `trading/sync` | ✅ |
| Cron | `cron/price-alerts` · `cron/cart-abandonment` | ✅ Scheduled jobs. |
| Health | `health` · `health/deep` · `analytics/realtime` | ✅ |

## Data layer
| Item | Status | Purpose |
|---|---|---|
| `prisma/schema.prisma` (~225 KB) | ✅ | PostgreSQL schema — very large (`Product` alone has 100s of fields), multi-tenant (`sites`, `site_domains`), wallet, orders, supplier listings, etc. |
| `prisma/migrations/` | ✅ | Versioned migrations. |
| `prisma/seed.ts` (+ `seed-data/`, `seed-locations.ts`) | ✅ | Seed data. |
| `scripts/seed-*.ts` | ✅ | Demo sites, e2e users, gift cards, page content, locations. |

## Frontend
| Area | Status | Purpose |
|---|---|---|
| `src/middleware.ts` | ✅ | Tenant routing/host resolution (Next 16 deprecation: rename to `proxy`). |
| `components/ui` (~30) | ✅ | Design-system primitives (shadcn/Radix). |
| `components/storefront` (~96) | ✅ | Storefront UI (home, PDP, cart, checkout, etc.). |
| `components/admin` | ✅ | Admin UI. |
| `components/agent` · `wallet` · `map` · `variants` | ✅ | Feature UIs (agent, wallet, Leaflet maps, variant pickers). |
| `hooks/` (8) | ✅ | `useCart*`, `useChat`, `useFeatureFlag`, `useABTest`, `useAIRecommendations`, `useBehaviorTracking`, `useConversionTracking`, `useWebVitals`, `usePWARegistration`. |
| `stores/` (4) | ✅ | Zustand: `useCartStore`, `usePromoStore`, `useRegionStore`, `useLocaleStore`. |

## Cross-cutting infra (repo root)
- `sentry.*.config.ts` + `instrumentation.ts` — error/perf monitoring.
- `docker-compose.yml` / `docker-compose.prod.yml` / `Dockerfile` / `Caddyfile` — deployment.
- `playwright.config.ts` + `src/tests` — unit (vitest) and e2e (Playwright) tests.
- `.github/workflows/ci.yml` — CI.
