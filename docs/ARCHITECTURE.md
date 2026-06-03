# Hyper-Commerce Platform — Master Architecture Document

> **Version**: 1.0.0 | **Last Updated**: 2026-05-30 | **Status**: Living Document
>
> **REMINDER**: This document is the single source of truth for the entire platform. Nothing gets lost. Every module, feature, security layer, compliance requirement, and implementation detail is indexed here. Refer back to this document before every sprint, every PR review, and every architecture decision.

> 📚 **Per-module implementation catalog** (file paths + Real/Partial/Stub maturity for all 135 server actions, 40 API routes, lib services, data layer, frontend): see [`docs/modules/README.md`](./modules/README.md).
> - [Commerce & Marketplace](./modules/amazon-commerce.md) · [Quick Commerce](./modules/quick-commerce.md) · [Payments & Fintech](./modules/paytm-fintech.md) · [Platform/Admin/AI/Verticals](./modules/platform-admin.md) · [Infrastructure](./modules/infrastructure.md)

---

## Table of Contents

1. [Executive Summary & Vision](#1-executive-summary--vision)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Data Model (103 Models, 52+ Enums)](#4-data-model)
5. [Module Index — Complete Feature Map](#5-module-index)
   - 5.1 [Authentication & Users](#51-authentication--users)
   - 5.2 [Product Catalog & Variants](#52-product-catalog--variants)
   - 5.3 [Multi-Site / Multi-Tenant](#53-multi-site--multi-tenant)
   - 5.4 [Globalization & i18n](#54-globalization--i18n)
   - 5.5 [Shopping Cart & Checkout](#55-shopping-cart--checkout)
   - 5.6 [Orders & Fulfillment](#56-orders--fulfillment)
   - 5.7 [Payments & Financial](#57-payments--financial)
   - 5.8 [Wallet, Vouchers & Gift Cards](#58-wallet-vouchers--gift-cards)
   - 5.9 [Promotions & Dynamic Pricing](#59-promotions--dynamic-pricing)
   - 5.10 [Inventory & Supply Chain](#510-inventory--supply-chain)
   - 5.11 [Delivery & Logistics (Quick Commerce)](#511-delivery--logistics)
   - 5.12 [Seller Marketplace](#512-seller-marketplace)
   - 5.13 [B2B Commerce](#513-b2b-commerce)
   - 5.14 [AI/ML Platform](#514-aiml-platform)
   - 5.15 [Search & Discovery](#515-search--discovery)
   - 5.16 [Reviews, Q&A & Social](#516-reviews-qa--social)
   - 5.17 [Loyalty, Gamification & Referrals](#517-loyalty-gamification--referrals)
   - 5.18 [Customer Support](#518-customer-support)
   - 5.19 [Notifications & Messaging](#519-notifications--messaging)
   - 5.20 [CMS & Content](#520-cms--content)
   - 5.21 [Analytics & Reporting](#521-analytics--reporting)
6. [Security Architecture (8-Layer Defense)](#6-security-architecture)
7. [Compliance & Regulatory](#7-compliance--regulatory)
8. [Infrastructure & DevOps](#8-infrastructure--devops)
9. [API Architecture](#9-api-architecture)
10. [Mobile & PWA](#10-mobile--pwa)
11. [Testing Strategy](#11-testing-strategy)
12. [Performance & Observability](#12-performance--observability)
13. [Route Map (Complete URL Structure)](#13-route-map)
14. [Server Actions Index (97 Actions)](#14-server-actions-index)
15. [Library Modules Index (src/lib)](#15-library-modules-index)
16. [Component Architecture](#16-component-architecture)
17. [Implementation Roadmap](#17-implementation-roadmap)
18. [Business Model & Revenue](#18-business-model--revenue)
19. [Competitive Positioning](#19-competitive-positioning)
20. [Risk Matrix](#20-risk-matrix)

---

## 1. Executive Summary & Vision

### Vision Statement

Build a **unified, infinitely scalable, enterprise-grade e-commerce platform** that combines:
- **Amazon** — Marketplace + logistics + seller ecosystem
- **Zepto** — 10-minute delivery / quick commerce
- **Instamart** — Dark stores / micro-fulfillment
- **Flipkart** — Flash sales + aggressive growth

Packaged as a **white-label SaaS solution** enabling unlimited platform instantiation across geographies with enterprise-grade security, global compliance automation, and AI-driven optimization.

### What's Already Built (Current State)

| Metric | Count |
|--------|-------|
| Prisma Models | 103 |
| Enums | 52+ |
| Server Actions | 97 |
| API Routes | 40+ |
| Admin Pages | 65+ |
| Storefront Pages | 30+ |
| Components | 150+ |
| Hooks | 8 |
| Zustand Stores | 4 |
| Validation Schemas | 21 |
| Test Files | 19 |
| CI/CD Workflows | 2 |

### Core Differentiators

| Feature | Shopify | WooCommerce | BigCommerce | **Hyper-Commerce** |
|---------|---------|-------------|-------------|-------------------|
| Marketplace | ❌ | Plugin | ❌ | ✅ Native |
| Quick Commerce | ❌ | ❌ | ❌ | ✅ Native |
| Dark Stores | ❌ | ❌ | ❌ | ✅ Native |
| Flash Sales | ⚠️ | Plugin | ⚠️ | ✅ Native |
| White-Label Multi-Tenant | ❌ | ❌ | ❌ | ✅ Native |
| GDPR/DPDP/CCPA Auto | ⚠️ | ❌ | ⚠️ | ✅ Native |
| Multi-Currency/Region | ⚠️ | Plugin | ⚠️ | ✅ Native |
| AI/ML Built-in | ❌ | ❌ | ❌ | ✅ Native |
| B2B + B2C Unified | ❌ | ❌ | ⚠️ | ✅ Native |
| PCI DSS L1 Ready | ❌ | ❌ | ❌ | ✅ Architecture |

---

## 2. Technology Stack

### Core Runtime

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| Framework | Next.js | 16.2.6 | Full-stack React framework (App Router) |
| Language | TypeScript | 5.x | Type safety across entire codebase |
| Runtime | React | 19.2.4 | UI rendering with Server Components |
| Database | PostgreSQL | 15+ | Primary data store |
| ORM | Prisma | 6.19.3 | Type-safe database access |
| State | Zustand | 5.0.13 | Client-side state management |
| Validation | Zod | 4.4.3 | Runtime schema validation |
| Styling | Tailwind CSS | 4.x | Utility-first CSS |
| UI Components | shadcn/ui | Latest | Accessible component primitives |
| Icons | Lucide React | 1.14.0 | Icon library |

### Security & Auth

| Technology | Purpose |
|-----------|---------|
| NextAuth.js | 4.24.14 — Authentication (JWT strategy) |
| bcryptjs | 3.0.3 — Password hashing |
| crypto-js | 4.2.0 — AES-256-GCM encryption |
| Custom Rate Limiter | Sliding window (in-memory, Redis-ready) |
| CSP Headers | Content Security Policy |
| HSTS | HTTP Strict Transport Security |

### Payments & Commerce

| Technology | Purpose |
|-----------|---------|
| Razorpay | Primary payment gateway (India) |
| Stripe (planned) | International payments |
| PayPal (planned) | Alternative payment method |

### Observability & Quality

| Technology | Purpose |
|-----------|---------|
| Sentry | 10.54.0 — Error tracking & performance |
| Pino | 10.3.1 — Structured logging with redaction |
| Vitest | 3.1.1 — Unit & integration testing |
| Playwright | 1.51.1 — E2E browser testing |
| Web Vitals | Core Web Vitals monitoring |

### Infrastructure

| Technology | Purpose |
|-----------|---------|
| Docker | Containerization (standalone output) |
| Docker Compose | Local dev + production orchestration |
| GitHub Actions | CI/CD pipeline |
| Vercel | Primary deployment target |
| Husky + lint-staged | Git hooks for code quality |

### Data & Search

| Technology | Purpose |
|-----------|---------|
| Recharts | 3.8.1 — Analytics visualization |
| Leaflet / React-Leaflet | Maps & geolocation |
| date-fns | 4.1.0 — Date manipulation |
| slugify | 1.6.9 — URL slug generation |


---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                      │
├──────────────┬──────────────┬──────────────┬────────────────────────────┤
│  Storefront  │  Admin Panel │ Agent App    │  Mobile (React Native)     │
│  (Next.js)   │  (Next.js)   │ (Next.js)    │  (Expo)                    │
└──────┬───────┴──────┬───────┴──────┬───────┴────────────┬───────────────┘
       │              │              │                     │
┌──────▼──────────────▼──────────────▼─────────────────────▼───────────────┐
│                      MIDDLEWARE LAYER                                      │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐ ┌──────────────────┐  │
│  │Security │ │Rate Limit│ │Site Resol│ │Locale  │ │Auth (JWT/RBAC)   │  │
│  │Headers  │ │(Sliding) │ │(Hostname)│ │Detect  │ │Role Protection   │  │
│  └─────────┘ └──────────┘ └──────────┘ └────────┘ └──────────────────┘  │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────────┐
│                      APPLICATION LAYER                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────────────┐  │
│  │ Server Actions   │  │ API Routes       │  │ Server Components      │  │
│  │ (97 action files)│  │ (40+ endpoints)  │  │ (SSR + Streaming)      │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────────────────────┘  │
│           │                      │                                         │
│  ┌────────▼──────────────────────▼─────────────────────────────────────┐  │
│  │                    SERVICE LAYER (src/lib/)                           │  │
│  │  ┌─────────┐ ┌────────┐ ┌───────┐ ┌──────┐ ┌───────┐ ┌─────────┐  │  │
│  │  │Payments │ │Search  │ │AI/ML  │ │Fraud │ │Queue  │ │Cache    │  │  │
│  │  │Gateway  │ │Engine  │ │Engine │ │Engine│ │System │ │Layer    │  │  │
│  │  └─────────┘ └────────┘ └───────┘ └──────┘ └───────┘ └─────────┘  │  │
│  │  ┌─────────┐ ┌────────┐ ┌───────┐ ┌──────┐ ┌───────┐ ┌─────────┐  │  │
│  │  │Invoice  │ │Tax     │ │Pricing│ │Slot  │ │Circuit│ │Feature  │  │  │
│  │  │Generator│ │Provider│ │Engine │ │Engine│ │Breaker│ │Flags    │  │  │
│  │  └─────────┘ └────────┘ └───────┘ └──────┘ └───────┘ └─────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────┬───────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼───────────────────────────────────────┐
│                      DATA LAYER                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│  │ PostgreSQL   │  │ Redis Cache  │  │ File Storage │  │ External    │  │
│  │ (Prisma ORM) │  │ (planned)    │  │ (local/S3)   │  │ APIs        │  │
│  │ 103 models   │  │              │  │              │  │ (Razorpay)  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────────┘  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Monorepo | Single Next.js app | Faster iteration, shared types, simpler CI |
| Server Actions | Over REST APIs | Type-safe, no API layer boilerplate, progressive enhancement |
| App Router | Over Pages Router | Server Components, streaming, layouts, parallel routes |
| Prisma | Over raw SQL | Type safety, migrations, multi-DB support |
| Zustand | Over Redux | Minimal boilerplate, React 19 compatible |
| In-memory rate limit | Over Redis (initial) | Zero-dependency start, Redis swap documented |
| Standalone output | Docker-ready | Containerized deployment anywhere |

---

## 4. Data Model

### 4.1 Model Count by Domain (103 Total)

| Domain | Models | Key Models |
|--------|--------|-----------|
| Location Hierarchy | 3 | Location, LocationTranslation, CountryProfile |
| Globalization | 6 | Region, ProductTranslation, ProductRegionPrice, ProductRegionAvailability, CategoryTranslation, BrandTranslation |
| Auth & Users | 3 | User, Address, ConsentRecord |
| Products & Catalog | 12 | Product, Category, Brand, ProductVariant, ProductOptionType/Value, TierPrice, BundleItem, ProductBarcode, ProductSubscription, SerialLotTracking |
| Inventory & Stock | 4 | Inventory, StockMovement, InventoryLog, UnitOfMeasure |
| Suppliers | 5 | Supplier, ProductSupplier, SupplierProductListing, SupplierReturn, SupplierReturnItem |
| Purchase Orders | 2 | PurchaseOrder, PurchaseOrderItem |
| Cart | 2 | CartItem, CartSession |
| Orders | 4 | Order, OrderStatusHistory, ReturnRequest, DeliveryFeedback |
| Payments | 7 | Payment, Refund, PaymentGateway, PaymentGatewayRegion, PaymentGatewayMethod, PaymentTransaction, SplitPayment |
| Wallet & Vouchers | 9 | Wallet, WalletTransaction, WalletTopUp, VoucherTier, VoucherTierTranslation, Voucher, VoucherRedemption, VoucherAttempt, VoucherTierBalance |
| Gift Cards | 7 | GiftCard, GiftCardTransaction, GiftCardOccasion, GiftCardRecipientType, GiftCardDesign, GiftCardStore, GiftCardOrder |
| Promotions | 25 | Promo, PromoTranslation, PromoUsage, PromotionCondition/Effect/Link, BankOffer, ShippingPromotion, PaymentMethodPromotion, LightningDeal, MultiBuyTier, GiftWithPurchase, CrossCategoryBundle, DynamicPriceRule, ABTestPromo, etc. |
| Promo Analytics | 6 | PromoAnalytics, PromoClick, PromoScheduler, PromoBudgetCap, ABTestPromo, ABTestAssignment |
| Gamification | 2 | GamifiedPromo, GamifiedPlay |
| Loyalty & Referrals | 4 | LoyaltyProgram, LoyaltyTransaction, ReferralPromo, ReferralReward |
| Reviews & Q&A | 6 | Review, ReviewVote, VideoReview, ProductQuestion, ProductAnswer, PriceHistory |
| Wishlists & Lists | 4 | WishlistItem, CustomList, CustomListItem, PriceDropAlert |
| Delivery & Logistics | 7 | DeliverySlot, DeliveryZone, MicroFulfillmentCenter, DeliveryAgent, DeliveryAssignment, DeliveryTrackingEvent, DeliveryFeedback |
| Customer Support | 5 | SupportTicket, TicketMessage, LiveChatSession, LiveChatMessage, CallbackRequest |
| B2B Commerce | 14 | BusinessProfile, BusinessDocument, BusinessVerification, BusinessUser, BusinessApprovalRule, RFQ, RFQItem, RFQResponse, RFQResponseItem, BusinessTaxExemption, StateTaxRule, B2BOrder, BusinessTierPrice, BusinessAnalyticsSnapshot |
| Seller Marketplace | 5 | Seller, SellerProduct, SellerOrder, SellerPayout, SellerReview |
| BNPL | 2 | BNPLOrder, BNPLInstallment |
| Notifications | 3 | Notification, NotificationPreference, FCMToken |
| Multi-Site | 8 | Site, SiteDomain, SiteProduct, SiteCategory, SiteBrand, SiteBanner, SiteMenu, SitePage |
| Webhooks & API | 3 | Webhook, WebhookDelivery, ApiKey |
| AI/ML Platform | 15 | ChatbotSession, AIConfig, UserBehavior, AIRecommendation, VoiceSearchLog, VoicePattern, VideoAnalysis, FraudScore, ChurnPrediction, CustomerSegment, AIAgent, AgentRun, PricingPrediction, DemandForecast, NextBestAction |
| Analytics | 2 | SearchAnalytics, PerformanceMetric |
| Fraud | 1 | FraudRule |
| Finance & Tax | 5 | TaxCategoryRule, TaxRate, Currency, TaxSyncLog, StateTaxRule |
| Membership | 1 | PrimeMembership |
| Content & Misc | 4 | Banner, SiteLink, PageContent, BrowseHistory |

### 4.2 Enum Index (52+ Enums)

| Category | Enums |
|----------|-------|
| Location | LocationType |
| User | UserRole, AddressType |
| Product | ProductType, UOMCategory, UOM, FreightClass, TaxCategory, ProductTrackingType |
| Commerce | DiscountType, OrderStatus, PaymentStatus, RefundStatus |
| Inventory | PurchaseOrderStatus, InventoryLogType, ReturnStatus |
| Supplier | SupplierIdType, SupplierVerificationStatus |
| Promotions | PromoType, PromoStatus, PromoDiscountType, PromotionConditionType, PromotionEffectType, PromotionStackStrategy, EffectScope, PriceTrigger, BehavioralType, GamificationType |
| Payments | PaymentMethodType, WalletTxnType, TopUpMethod, TopUpStatus |
| Vouchers | VoucherType, TierBalanceMode |
| Gift Cards | GiftCardTxnType, GiftCardDeliveryType, GiftCardFormat |
| Loyalty | LoyaltyTier |
| Support | TicketCategory, TicketPriority, TicketStatus |
| Compliance | ConsentType |
| System | ActivitySeverity, NotifType |
| Delivery | DeliveryAgentStatus, VehicleType, DeliveryStatus, TrackingEventType |
| Multi-Site | SiteStatus |
| B2B | BusinessType, BusinessVerificationStatus, BusinessUserRole, RFQStatus, RFQPriority, RFQResponseStatus, B2BPaymentTerms, TaxExemptionType |


---

## 5. Module Index — Complete Feature Map

> **REMINDER**: Every feature listed here is either IMPLEMENTED (✅), PARTIALLY IMPLEMENTED (⚠️), or PLANNED (📋). Nothing is lost. This is the master checklist.

### 5.1 Authentication & Users

| Feature | Status | Implementation |
|---------|--------|---------------|
| Email/Password Auth | ✅ | NextAuth CredentialsProvider + bcrypt |
| JWT Session Strategy | ✅ | Stateless tokens with role claims |
| Role-Based Access (RBAC) | ✅ | ADMIN, CUSTOMER, CUSTOMER_CARE, SUPPORT, DELIVERY_AGENT |
| Route Protection (Middleware) | ✅ | Per-role route groups in middleware.ts |
| User Profile Management | ✅ | profile-actions.ts |
| Address Management (CRUD) | ✅ | address-actions.ts with location hierarchy |
| Multi-Factor Auth (TOTP) | ✅ | src/lib/mfa/totp.ts + mfa-actions.ts |
| MFA Verification Page | ✅ | /auth/verify-mfa |
| GDPR Consent Tracking | ✅ | ConsentRecord model + gdpr-actions.ts |
| Account Deletion (Right to Erasure) | ✅ | /api/gdpr/delete |
| Data Export (Right to Portability) | ✅ | /api/gdpr/export |
| OAuth Providers (Google, GitHub) | 📋 | NextAuth adapter ready |
| Passwordless (Magic Link) | 📋 | NextAuth EmailProvider ready |
| Session Management UI | 📋 | Planned |
| IP-based Suspicious Login Detection | ⚠️ | IP extraction implemented, alerting planned |

**Files**: `src/lib/auth.ts`, `src/server/actions/auth-actions.ts`, `src/server/actions/mfa-actions.ts`, `src/server/actions/gdpr-actions.ts`, `src/lib/mfa/totp.ts`

### 5.2 Product Catalog & Variants

| Feature | Status | Implementation |
|---------|--------|---------------|
| Product CRUD | ✅ | product-actions.ts, product-master-actions.ts |
| 6 Product Types | ✅ | PHYSICAL, DIGITAL, SUBSCRIPTION, SERVICE, BUNDLE, COMBO |
| Hierarchical Categories | ✅ | Self-referential Category model |
| Brand Management | ✅ | Brand model with translations |
| Product Variants (Size/Color/etc.) | ✅ | ProductOptionType → ProductOptionValue → ProductVariant |
| SKU-level Inventory | ✅ | Variant-level stock tracking |
| Tier Pricing (Quantity Breaks) | ✅ | TierPrice model |
| Bundle Products | ✅ | BundleItem model |
| Product Barcodes | ✅ | ProductBarcode model |
| Serial/Lot Tracking | ✅ | SerialLotTracking model |
| Subscription Products | ✅ | ProductSubscription model |
| Bulk Upload (CSV) | ✅ | bulk-upload-actions.ts + csv-parser.ts |
| Product Badges | ✅ | product-badges-actions.ts |
| Price History Tracking | ✅ | PriceHistory model |
| Price Drop Alerts | ✅ | PriceDropAlert model + /api/cron/price-alerts |
| Product Q&A | ✅ | ProductQuestion + ProductAnswer models |
| Video Reviews | ✅ | VideoReview model |
| Image Search | ✅ | src/lib/image-search.ts + /api/search/image |
| UOM (Unit of Measure) | ✅ | UnitOfMeasure model with 30+ units |
| Freight Classes | ✅ | STANDARD, OVERSIZED, FRAGILE, HAZARDOUS, PERISHABLE, REFRIGERATED |

**Files**: `src/server/actions/product-actions.ts`, `variant-actions.ts`, `product-catalog-actions.ts`, `product-master-actions.ts`, `bulk-upload-actions.ts`

### 5.3 Multi-Site / Multi-Tenant

| Feature | Status | Implementation |
|---------|--------|---------------|
| Site Model (Tenant) | ✅ | Site model with slug, domain, branding |
| Custom Domains per Site | ✅ | SiteDomain model |
| Hostname-based Site Resolution | ✅ | Middleware + /api/site/resolve |
| Per-Site Product Visibility | ✅ | SiteProduct model |
| Per-Site Category Visibility | ✅ | SiteCategory model |
| Per-Site Brand Visibility | ✅ | SiteBrand model |
| Per-Site Banners | ✅ | SiteBanner model |
| Per-Site Navigation Menus | ✅ | SiteMenu model |
| Per-Site CMS Pages | ✅ | SitePage model |
| Site Branding (Colors, Fonts) | ✅ | Site.primaryColor, secondaryColor, fontFamily |
| Site Settings (Tax, Currency, Maintenance) | ✅ | Site.settings JSON |
| Migration Script (Single → Multi) | ✅ | scripts/migrate-to-multi-site.ts |
| Admin Site Management | ✅ | /admin/sites |
| Unlimited Site Creation | ✅ | No hard limits in schema |

**Files**: `src/server/actions/site-actions.ts`, `src/lib/site-context.ts`, `scripts/migrate-to-multi-site.ts`

### 5.4 Globalization & i18n

| Feature | Status | Implementation |
|---------|--------|---------------|
| Region Model (Market Zones) | ✅ | Region with currency, locale, tax |
| Auto Locale Detection | ✅ | Middleware Accept-Language parsing |
| Auto Region Assignment | ✅ | Locale → Region mapping in middleware |
| Cookie-based Locale/Region | ✅ | Persistent cookies (1 year) |
| Product Translations | ✅ | ProductTranslation model |
| Category Translations | ✅ | CategoryTranslation model |
| Brand Translations | ✅ | BrandTranslation model |
| Location Translations | ✅ | LocationTranslation model |
| Voucher Tier Translations | ✅ | VoucherTierTranslation model |
| Promo Translations | ✅ | PromoTranslation model |
| Per-Region Pricing | ✅ | ProductRegionPrice model |
| Per-Region Availability | ✅ | ProductRegionAvailability model |
| Multi-Currency Support | ✅ | Currency model + exchange rates |
| Currency Formatting | ✅ | src/lib/currency-format.ts |
| Currency Conversion API | ✅ | src/lib/currency-api.ts |
| Tax-Inclusive vs Exclusive | ✅ | Region.taxInclusive flag |
| Timezone Support | ✅ | Region.timezone + CountryProfile.timezone |
| Location Hierarchy (Planet→Village) | ✅ | 8-level hierarchy with LocationType enum |
| Country Profiles | ✅ | ISO codes, dial codes, supported locales |

**Files**: `src/lib/i18n.ts`, `src/lib/currency.ts`, `src/lib/currency-format.ts`, `src/lib/currency-api.ts`, `src/lib/cookies.ts`, `src/stores/useRegionStore.ts`, `src/stores/useLocaleStore.ts`

### 5.5 Shopping Cart & Checkout

| Feature | Status | Implementation |
|---------|--------|---------------|
| Cart CRUD (Add/Update/Remove) | ✅ | cart-actions.ts |
| Cart State (Zustand) | ✅ | src/stores/useCartStore.ts |
| Cart Abandonment Tracking | ✅ | CartSession model + cart-abandonment-actions.ts |
| Cart Abandonment Recovery (Cron) | ✅ | /api/cron/cart-abandonment |
| Multi-step Checkout | ✅ | /checkout with layout |
| Checkout Success Page | ✅ | /checkout/success |
| Address Selection at Checkout | ✅ | Integrated with Address model |
| Delivery Slot Selection | ✅ | slot-actions.ts |
| Coupon/Promo Application | ✅ | discount-engine.ts |
| Split Payments | ✅ | split-payment-actions.ts |
| Split Shipments | ✅ | split-shipment-actions.ts |
| Reorder (One-click) | ✅ | reorder-actions.ts |
| Auto-Replenishment | ✅ | replenishment-actions.ts + /auto-replenishment page |
| Site-scoped Cart | ✅ | CartItem.siteId |

**Files**: `src/server/actions/cart-actions.ts`, `cart-abandonment-actions.ts`, `src/stores/useCartStore.ts`

### 5.6 Orders & Fulfillment

| Feature | Status | Implementation |
|---------|--------|---------------|
| Order Creation | ✅ | order-actions.ts |
| Order Status Tracking | ✅ | OrderStatusHistory model (8 statuses) |
| Order Detail Page | ✅ | /account/orders/[id] |
| Admin Order Management | ✅ | /admin/orders + /admin/orders/[id] |
| Return Requests | ✅ | ReturnRequest model + return-actions.ts |
| Refund Automation | ✅ | refund-automation-actions.ts |
| Delivery Feedback | ✅ | DeliveryFeedback model + /orders/[id]/feedback |
| Refund Status Page | ✅ | /orders/[id]/refund-status |
| Order Tracking Page | ✅ | /orders/[id]/tracking |
| Invoice Generation | ✅ | invoice-actions.ts + /api/invoice/[orderId] |
| GST Invoice Template | ✅ | src/lib/invoice/templates/gst-template.ts |
| Standard Invoice Template | ✅ | src/lib/invoice/templates/standard-template.ts |
| B2B Order Extension | ✅ | B2BOrder model |
| Seller Order Splitting | ✅ | SellerOrder model |
| BNPL Orders | ✅ | BNPLOrder + BNPLInstallment models |

**Files**: `src/server/actions/order-actions.ts`, `return-actions.ts`, `refund-automation-actions.ts`, `invoice-actions.ts`

### 5.7 Payments & Financial

| Feature | Status | Implementation |
|---------|--------|---------------|
| Razorpay Integration | ✅ | src/lib/razorpay.ts + payment-actions.ts |
| Razorpay Webhook Handler | ✅ | /api/razorpay/webhook |
| Multi-Gateway Registry | ✅ | src/lib/payments/gateway-registry.ts |
| Stripe Provider | ⚠️ | src/lib/payments/providers/stripe.ts (interface) |
| PayPal Provider | ⚠️ | src/lib/payments/providers/paypal.ts (interface) |
| Payment Gateway per Region | ✅ | PaymentGatewayRegion model |
| Payment Methods per Gateway | ✅ | PaymentGatewayMethod model |
| Transaction Logging | ✅ | PaymentTransaction model |
| Split Payments | ✅ | SplitPayment model |
| Payment Retry Logic | ✅ | payment-retry-actions.ts |
| Saved Payment Methods | ✅ | saved-payment-actions.ts |
| Refund Processing | ✅ | Refund model (PENDING → APPROVED → PROCESSED) |
| 13 Payment Method Types | ✅ | CARD, UPI, WALLET, NETBANKING, BNPL, CRYPTO, BANK_TRANSFER, COD, APPLE_PAY, GOOGLE_PAY, PAYPAL, KLARNA, AFTERPAY |
| Seller Payouts | ✅ | SellerPayout model |
| BNPL Installments | ✅ | BNPLInstallment model |

**Files**: `src/lib/razorpay.ts`, `src/lib/payments/`, `src/server/actions/payment-actions.ts`, `payment-retry-actions.ts`, `split-payment-actions.ts`

### 5.8 Wallet, Vouchers & Gift Cards

| Feature | Status | Implementation |
|---------|--------|---------------|
| Digital Wallet | ✅ | Wallet model (1:1 with User) |
| Wallet Transactions (Credit/Debit) | ✅ | WalletTransaction model |
| Wallet Top-Up (UPI/Card/Netbanking) | ✅ | WalletTopUp model |
| Voucher Tiers (Categories) | ✅ | VoucherTier model with translations |
| Voucher Codes (Encrypted) | ✅ | Voucher model + AES-256-GCM encryption |
| Voucher Redemption | ✅ | VoucherRedemption model |
| Voucher Attempt Logging | ✅ | VoucherAttempt model (fraud prevention) |
| Per-User Tier Balances | ✅ | VoucherTierBalance model |
| Gift Card Store | ✅ | GiftCardStore + GiftCardDesign models |
| Gift Card Occasions | ✅ | GiftCardOccasion model |
| Gift Card Purchase Flow | ✅ | /gift-cards/purchase/[id] |
| Gift Card Redemption | ✅ | /gift-cards/redeem |
| Corporate Gift Cards | ✅ | /gift-cards/corporate |
| Gift Card Transactions | ✅ | GiftCardTransaction model |
| E-Gift & Physical Cards | ✅ | GiftCardDeliveryType enum |
| Admin Voucher Management | ✅ | /admin/vouchers + /admin/vouchers/tiers |
| Admin Wallet Management | ✅ | /admin/wallets |

**Files**: `src/server/actions/wallet-actions.ts`, `voucher-tier-actions.ts`, `gift-card-store-actions.ts`, `src/lib/encryption.ts`

### 5.9 Promotions & Dynamic Pricing

| Feature | Status | Implementation |
|---------|--------|---------------|
| Unified Promo Engine | ✅ | Promo model with 12 PromoTypes |
| Modular Conditions (13 types) | ✅ | PromotionCondition model |
| Modular Effects (9 types) | ✅ | PromotionEffect model |
| Bank Offers | ✅ | BankOffer model |
| Shipping Promotions | ✅ | ShippingPromotion model |
| Payment Method Discounts | ✅ | PaymentMethodPromotion model |
| Lightning/Flash Deals | ✅ | LightningDeal + LightningDealClaim |
| Multi-Buy Tiers | ✅ | MultiBuyTier model |
| Gift with Purchase | ✅ | GiftWithPurchase model |
| Cross-Category Bundles | ✅ | CrossCategoryBundle model |
| VIP/Loyalty Tier Deals | ✅ | VIPDeal model |
| Subscribe & Save Promos | ✅ | SubscribePromo model |
| Clipped Coupons (Amazon-style) | ✅ | ClippedCoupon model |
| Dynamic Price Rules | ✅ | DynamicPriceRule model |
| Auto Promo Triggers | ✅ | AutoPromoTrigger model (6 PriceTriggers) |
| Behavioral Triggers | ✅ | BehavioralPromoTrigger (6 types) |
| Search-Triggered Promos | ✅ | SearchPromoTrigger model |
| Pincode-Specific Promos | ✅ | PincodePromo model |
| Promo Stacking Rules | ✅ | PromotionStackRule (BEST_WINS, ADDITIVE, EXCLUSIVE) |
| A/B Test Promos | ✅ | ABTestPromo + ABTestAssignment |
| Promo Scheduling | ✅ | PromoScheduler model |
| Budget Caps | ✅ | PromoBudgetCap model |
| Promo Analytics (Daily) | ✅ | PromoAnalytics + PromoClick models |
| Promo Explanation Templates | ✅ | PromoExplanation model |
| Gamified Promos | ✅ | GamifiedPromo (SPIN_WHEEL, SCRATCH_CARD, MYSTERY_BOX, TREASURE_HUNT) |
| Surge Pricing | ✅ | src/lib/surge/surge-engine.ts |
| Dynamic Pricing Engine | ✅ | src/lib/pricing/dynamic-pricing.ts |
| Discount Calculation Engine | ✅ | src/server/actions/discount-engine.ts |

**Files**: `src/server/actions/promo-actions.ts`, `promotion-actions.ts`, `dynamic-pricing-actions.ts`, `surge-actions.ts`, `lightning-actions.ts`, `gamification-actions.ts`, `src/lib/pricing/`, `src/lib/surge/`

### 5.10 Inventory & Supply Chain

| Feature | Status | Implementation |
|---------|--------|---------------|
| Multi-Location Inventory | ✅ | Inventory model (product × supplier × location) |
| Stock Movements | ✅ | StockMovement model |
| Inventory Audit Log | ✅ | InventoryLog model (6 log types) |
| Purchase Orders | ✅ | PurchaseOrder + PurchaseOrderItem (7 statuses) |
| Supplier Management | ✅ | Supplier model with verification |
| Supplier Product Listings | ✅ | SupplierProductListing model |
| Supplier Returns | ✅ | SupplierReturn + SupplierReturnItem |
| Supplier Verification Workflow | ✅ | SupplierVerificationStatus enum |
| Unit of Measure (30+ units) | ✅ | UnitOfMeasure model with conversions |
| Serial/Lot Tracking | ✅ | SerialLotTracking model |
| Demand Forecasting | ✅ | DemandForecast model + forecast-actions.ts |
| Auto-Replenishment | ✅ | replenishment-actions.ts |
| Admin Inventory Page | ✅ | /admin/inventory |
| Admin Purchase Orders | ✅ | /admin/purchase-orders |
| Admin Suppliers | ✅ | /admin/suppliers |
| Supplier Catalog | ✅ | /admin/supplier-catalog |

**Files**: `src/server/actions/inventory-actions.ts` (42KB — largest action file), `replenishment-actions.ts`, `forecast-actions.ts`

### 5.11 Delivery & Logistics (Quick Commerce)

| Feature | Status | Implementation |
|---------|--------|---------------|
| Delivery Zones | ✅ | DeliveryZone model (linked to Region + Location) |
| Micro-Fulfillment Centers (Dark Stores) | ✅ | MicroFulfillmentCenter model |
| Delivery Agents | ✅ | DeliveryAgent model (5 statuses, 4 vehicle types) |
| Delivery Assignment | ✅ | DeliveryAssignment model |
| Real-Time Tracking Events | ✅ | DeliveryTrackingEvent model (6 event types) |
| Delivery Tracking API | ✅ | /api/delivery/track/[assignmentId] |
| Delivery Slots | ✅ | DeliverySlot model + slot-actions.ts |
| Slot Engine | ✅ | src/lib/slot/slot-engine.ts |
| Batch Assignment | ✅ | src/lib/delivery/batch-assigner.ts |
| Fleet Management | ✅ | fleet-actions.ts + /admin/fleet |
| Agent Dashboard | ✅ | /agent/dashboard |
| Agent Earnings | ✅ | /agent/earnings |
| Agent Order View | ✅ | /agent/orders/[id] |
| Agent Login | ✅ | /agent/login |
| Dark Store Admin | ✅ | /admin/dark-stores + /admin/dark-stores/[id] |
| Delivery Zone Admin | ✅ | /admin/delivery-zones |
| Delivery Agent Admin | ✅ | /admin/delivery-agents |
| Delivery Feedback | ✅ | DeliveryFeedback model |
| Delivery Estimates | ✅ | src/lib/delivery-estimates.ts |
| Agent Components | ✅ | OrderCard, PhotoProof, NavigationPanel, GPSTracker, OTPVerification |
| Dark Store Components | ✅ | PickList, PackStation |
| Fleet Map | ✅ | FleetMap component |

**Files**: `src/server/actions/delivery-actions.ts`, `dark-store-actions.ts`, `fleet-actions.ts`, `slot-actions.ts`, `batch-assignment-actions.ts`, `src/lib/slot/`, `src/lib/delivery/`


### 5.12 Seller Marketplace

| Feature | Status | Implementation |
|---------|--------|---------------|
| Seller Registration | ✅ | /seller/register |
| Seller Dashboard | ✅ | /seller/dashboard |
| Seller Payouts | ✅ | /seller/payouts + SellerPayout model |
| Seller Product Listings | ✅ | SellerProduct model |
| Seller Order Management | ✅ | SellerOrder model |
| Seller Reviews | ✅ | SellerReview model |
| Admin Seller Management | ✅ | /admin/sellers + /admin/sellers/[id] |
| Admin Seller Payouts | ✅ | /admin/sellers/payouts |
| Admin Commissions | ✅ | /admin/sellers/commissions |
| Seller Portal Actions | ✅ | seller-portal-actions.ts |
| RFQ Responses (B2B) | ✅ | RFQResponse model linked to Seller |

**Files**: `src/server/actions/seller-actions.ts`, `seller-portal-actions.ts`

### 5.13 B2B Commerce

| Feature | Status | Implementation |
|---------|--------|---------------|
| Business Registration | ✅ | /business/register |
| Business Dashboard | ✅ | /business/dashboard |
| Business Profile | ✅ | BusinessProfile model (8 business types) |
| Business Documents | ✅ | BusinessDocument model |
| Business Verification Workflow | ✅ | BusinessVerification (6 statuses) |
| Team Management | ✅ | BusinessUser model (4 roles) + /business/team |
| Approval Rules | ✅ | BusinessApprovalRule model |
| Approval Workflow | ✅ | /business/approvals |
| Request for Quotation (RFQ) | ✅ | RFQ + RFQItem models |
| RFQ Creation | ✅ | /business/rfq/new |
| RFQ Responses | ✅ | RFQResponse + RFQResponseItem |
| Tax Exemptions | ✅ | BusinessTaxExemption (7 types) |
| State Tax Rules | ✅ | StateTaxRule model |
| B2B Orders | ✅ | B2BOrder model with payment terms |
| Business Tier Pricing | ✅ | BusinessTierPrice model |
| Business Analytics | ✅ | BusinessAnalyticsSnapshot model |
| Payment Terms | ✅ | CASH, NET_15, NET_30, NET_60, NET_90 |
| Admin B2B Management | ✅ | /admin/business |

**Files**: `src/server/actions/b2b-actions.ts`, `business-actions.ts`, `business-team-actions.ts`, `rfq-actions.ts`

### 5.14 AI/ML Platform

| Feature | Status | Implementation |
|---------|--------|---------------|
| AI Recommendation Engine | ✅ | AIRecommendation model + ai-recommendation-actions.ts |
| Multi-Provider AI (OpenAI, Groq, Replicate, Local) | ✅ | src/lib/ai/providers/ |
| AI Orchestrator | ✅ | src/lib/ai/orchestrator.ts |
| Multi-Modal AI | ✅ | src/lib/ai/multi-modal.ts |
| AI Feature Flags | ✅ | AIConfig model |
| User Behavior Tracking | ✅ | UserBehavior model + ai-behavior-actions.ts |
| Chatbot Sessions | ✅ | ChatbotSession model + /api/chatbot |
| Voice Search | ✅ | VoiceSearchLog + VoicePattern models |
| Video Analysis | ✅ | VideoAnalysis model + ai-video-actions.ts |
| Fraud Scoring (ML) | ✅ | FraudScore model |
| Churn Prediction | ✅ | ChurnPrediction model |
| Customer Segmentation | ✅ | CustomerSegment model |
| AI Agents | ✅ | AIAgent + AgentRun models |
| Agent Execution API | ✅ | /api/ai/agents/run |
| Pricing Prediction | ✅ | PricingPrediction model |
| Demand Forecasting | ✅ | DemandForecast model |
| Next Best Action | ✅ | NextBestAction model |
| AI Content Generation | ✅ | ai-content-actions.ts |
| AI Data Analysis | ✅ | /api/ai/data + /api/ai/analyze |
| Admin AI Dashboard | ✅ | /admin/ai (9 sub-pages) |
| AI Analytics | ✅ | ai-analytics-actions.ts |

**Files**: `src/lib/ai/` (orchestrator, multi-modal, features, providers), `src/server/actions/ai-*.ts` (8 action files)

### 5.15 Search & Discovery

| Feature | Status | Implementation |
|---------|--------|---------------|
| Pluggable Search Engine | ✅ | src/lib/search/search-provider.ts |
| Typesense Provider | ✅ | src/lib/search/providers/typesense-provider.ts |
| Meilisearch Provider | ✅ | src/lib/search/providers/meilisearch-provider.ts |
| PostgreSQL Fallback | ✅ | src/lib/search/providers/postgres-provider.ts |
| Search API | ✅ | /api/search |
| Autocomplete API | ✅ | /api/search/autocomplete |
| Image Search | ✅ | /api/search/image + src/lib/image-search.ts |
| Search Analytics | ✅ | SearchAnalytics model + /api/search/analytics |
| Search Personalization | ✅ | src/lib/search/personalization.ts |
| Search Page | ✅ | /search |
| Admin Search Analytics | ✅ | /admin/search-analytics |
| Voice Search | ✅ | VoiceSearchLog model |
| Browse History | ✅ | BrowseHistory model + browse-history-actions.ts |

**Files**: `src/lib/search/`, `src/server/actions/search-actions.ts`, `search-personalization-actions.ts`

### 5.16 Reviews, Q&A & Social

| Feature | Status | Implementation |
|---------|--------|---------------|
| Product Reviews (Star Rating) | ✅ | Review model |
| Review Helpful Votes | ✅ | ReviewVote model |
| Video Reviews | ✅ | VideoReview model |
| Product Questions | ✅ | ProductQuestion model |
| Product Answers | ✅ | ProductAnswer model |
| Social Sharing | ✅ | SocialShare model |
| Wishlist Sharing (Token) | ✅ | User.wishlistShareToken + /share/[token] |
| Account Reviews Page | ✅ | /account/reviews |
| Admin Review Moderation | 📋 | Planned |

**Files**: `src/server/actions/review-actions.ts`

### 5.17 Loyalty, Gamification & Referrals

| Feature | Status | Implementation |
|---------|--------|---------------|
| Loyalty Program | ✅ | LoyaltyProgram model |
| Loyalty Tiers (Bronze→Platinum) | ✅ | LoyaltyTier enum |
| Points Earn/Redeem | ✅ | LoyaltyTransaction model |
| Referral Program | ✅ | ReferralPromo model |
| Referral Rewards | ✅ | ReferralReward model |
| Referral Page | ✅ | /account/referrals |
| Gamified Promos | ✅ | GamifiedPromo model (4 types) |
| Spin Wheel | ✅ | /rewards/spin |
| Scratch Cards | ✅ | GamificationType.SCRATCH_CARD |
| Mystery Box | ✅ | GamificationType.MYSTERY_BOX |
| Treasure Hunt | ✅ | GamificationType.TREASURE_HUNT |
| Gamification Engine | ✅ | src/lib/gamification/engine.ts |
| Prime Membership | ✅ | PrimeMembership model |
| Admin Loyalty | ✅ | /admin/loyalty |
| Admin Referrals | ✅ | /admin/referrals |
| Admin Prime | ✅ | /admin/prime |
| Admin Gamification | ✅ | /admin/gamification |

**Files**: `src/server/actions/loyalty-actions.ts`, `referral-actions.ts`, `gamification-actions.ts`, `membership-actions.ts`, `src/lib/gamification/engine.ts`

### 5.18 Customer Support

| Feature | Status | Implementation |
|---------|--------|---------------|
| Support Tickets | ✅ | SupportTicket model (7 categories, 4 priorities, 6 statuses) |
| Ticket Messages | ✅ | TicketMessage model |
| Live Chat Sessions | ✅ | LiveChatSession + LiveChatMessage models |
| Live Chat Server | ✅ | src/lib/live-chat-server.ts |
| Live Chat Hook | ✅ | src/hooks/useChat.ts |
| Callback Requests | ✅ | CallbackRequest model |
| Customer Care Portal | ✅ | /customer-care/tickets + /customer-care/tickets/[id] |
| Customer Care Returns | ✅ | /customer-care/returns |
| Customer Care Refunds | ✅ | /customer-care/refunds |
| Admin Chat Dashboard | ✅ | /admin/chat |
| Admin Callbacks | ✅ | /admin/callbacks |
| Account Messages | ✅ | /account/messages |

**Files**: `src/server/actions/support-actions.ts`, `ticket-actions.ts`, `chat-actions.ts`, `src/lib/live-chat-server.ts`

### 5.19 Notifications & Messaging

| Feature | Status | Implementation |
|---------|--------|---------------|
| In-App Notifications | ✅ | Notification model (6 types) |
| Notification Preferences | ✅ | NotificationPreference model |
| FCM Push Tokens | ✅ | FCMToken model |
| Notification Preference Page | ✅ | /account/notifications/preferences |
| Communication Preferences | ✅ | /account/communication-preferences |
| Message Centre | ✅ | message-centre-actions.ts |
| Background Notification Jobs | ✅ | src/lib/queue/jobs/notification-job.ts |
| Email Jobs | ✅ | src/lib/queue/jobs/email-job.ts |

**Files**: `src/server/actions/notification-preference-actions.ts`, `message-centre-actions.ts`, `src/lib/queue/jobs/`

### 5.20 CMS & Content

| Feature | Status | Implementation |
|---------|--------|---------------|
| Page Content (Landing Pages) | ✅ | PageContent model + page-content-actions.ts |
| Site Pages (Per-Tenant CMS) | ✅ | SitePage model |
| Banners | ✅ | Banner + SiteBanner models |
| Site Links (Navigation) | ✅ | SiteLink model |
| FAQ / Knowledge Base | ✅ | FAQ model |
| Brand Stories | ✅ | BrandStory model |
| Daily Deals | ✅ | DailyDeal model |
| Terms of Service Page | ✅ | /terms |
| Privacy Policy Page | ✅ | /privacy |
| FAQ Page | ✅ | /faq |
| Admin Banners | ✅ | /admin/banners |
| Admin FAQ | ✅ | /admin/faq |

**Files**: `src/server/actions/page-content-actions.ts`, `scripts/seed-page-content.ts`, `scripts/seed-site-links.ts`

### 5.21 Analytics & Reporting

| Feature | Status | Implementation |
|---------|--------|---------------|
| Admin Dashboard | ✅ | /admin/dashboard (6 widgets) |
| Revenue Analytics | ✅ | /admin/analytics/revenue |
| Conversion Analytics | ✅ | /admin/analytics/conversion |
| Cohort Analysis | ✅ | /admin/analytics/cohort |
| Customer Analytics | ✅ | /admin/customers/analytics |
| Search Analytics | ✅ | /admin/search-analytics |
| Promo Analytics | ✅ | /admin/promotions/analytics |
| Performance Metrics | ✅ | PerformanceMetric model + /admin/performance |
| Conversion Events | ✅ | ConversionEvent model + conversion-actions.ts |
| Real-Time Analytics API | ✅ | /api/analytics/realtime |
| Report Generation | ✅ | report-actions.ts + report-job.ts |
| Admin Reports | ✅ | /admin/reports |
| Forecasting Dashboard | ✅ | /admin/forecasting |
| Web Vitals Tracking | ✅ | src/hooks/useWebVitals.ts + src/lib/performance/web-vitals.ts |

**Files**: `src/server/actions/analytics-actions.ts`, `conversion-actions.ts`, `report-actions.ts`, `performance-actions.ts`


---

## 6. Security Architecture (8-Layer Defense)

> **REMINDER**: Security is non-negotiable. Every layer below is implemented or has a clear path to implementation. Review this section before every deployment.

### Layer 1: Network & Transport

| Control | Status | Implementation |
|---------|--------|---------------|
| HTTPS Enforced (HSTS) | ✅ | `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload` |
| TLS 1.3 | ✅ | Enforced by hosting provider (Vercel/AWS) |
| CORS Restriction | ✅ | `allowedOrigins` in next.config.ts |
| Cross-Origin Policies | ✅ | COOP: same-origin, CORP: same-origin |

### Layer 2: Application Security Headers

| Header | Value | Purpose |
|--------|-------|---------|
| Content-Security-Policy | `default-src 'self'; script-src 'self' 'unsafe-inline' https://checkout.razorpay.com; ...` | XSS prevention |
| X-Content-Type-Options | `nosniff` | MIME sniffing prevention |
| X-Frame-Options | `DENY` | Clickjacking prevention |
| X-XSS-Protection | `1; mode=block` | Legacy XSS filter |
| Referrer-Policy | `strict-origin-when-cross-origin` | Referrer leakage prevention |
| Permissions-Policy | `camera=(), microphone=(), geolocation=(self)` | Feature restriction |

### Layer 3: Rate Limiting

| Route Type | Limit | Window | Implementation |
|-----------|-------|--------|---------------|
| Auth routes | 5 requests | 60 seconds | Sliding window |
| Payment routes | 10 requests | 60 seconds | Sliding window |
| Search routes | 30 requests | 60 seconds | Sliding window |
| Upload routes | 5 requests | 60 seconds | Sliding window |
| General API | 60 requests | 60 seconds | Sliding window |

Response headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Layer 4: Authentication & Authorization

| Control | Implementation |
|---------|---------------|
| Password Hashing | bcrypt (cost factor 10+) |
| JWT Tokens | Stateless, role-embedded, short-lived |
| RBAC | 5 roles with route-level enforcement |
| MFA (TOTP) | Time-based one-time passwords |
| Session Invalidation | Token expiry + forced logout |

### Layer 5: Data Encryption

| Data Type | Method | Key Management |
|-----------|--------|---------------|
| Voucher Codes | AES-256-GCM | VOUCHER_CODE_ENCRYPTION_KEY (64 hex) |
| PII (Personal Data) | AES-256-GCM | PII_ENCRYPTION_KEY (64 hex, separate) |
| Passwords | bcrypt | One-way hash (no key) |
| Redemption Tokens | HMAC-SHA256 | Derived from encryption key |
| Secure Codes | crypto.randomBytes | Ambiguous chars excluded |

### Layer 6: Input Validation

| Layer | Technology | Coverage |
|-------|-----------|----------|
| Client-side | Zod schemas | 21 validation schema files |
| Server-side | Zod + server-action-wrapper | All 97 server actions wrapped |
| File uploads | file-validator.ts | Type, size, extension validation |
| API routes | Zod | Request body validation |

### Layer 7: Logging & Audit

| System | Purpose | Implementation |
|--------|---------|---------------|
| Pino Logger | Structured JSON logs | Auto-redacts password, token, secret, authorization |
| AuditLog Model | User action audit trail | Who did what, when |
| SystemActivity Model | System events | With severity levels (INFO→CRITICAL) |
| Request IDs | Request tracing | `req_xxx` format, propagated via headers |
| Sentry | Error tracking | Strips cookies from events |

### Layer 8: Fraud Detection

| Component | Implementation |
|-----------|---------------|
| Fraud Engine | src/lib/fraud/fraud-engine.ts |
| Amount Rule | Flags unusually large orders |
| Velocity Rule | Flags rapid successive orders |
| Device Rule | Device fingerprint anomalies |
| Location Rule | Geographic impossibility detection |
| FraudScore Model | ML-based scoring per order |
| FraudRule Model | Configurable rule definitions |
| Admin Fraud Dashboard | /admin/fraud |

---

## 7. Compliance & Regulatory

> **REMINDER**: Compliance is baked into the architecture, not bolted on. Every market entry requires reviewing this section.

### 7.1 GDPR (EU/EEA — 31 Countries)

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| Consent Collection | ✅ | ConsentRecord model (6 consent types) |
| Right to Access | ✅ | /api/gdpr/export |
| Right to Erasure | ✅ | /api/gdpr/delete |
| Right to Portability | ✅ | JSON data export |
| Data Minimization | ✅ | Separate PII encryption key |
| Cookie Consent | ✅ | CookieConsent component |
| EU Country Detection | ✅ | src/lib/gdpr.ts (31 countries) |
| Consent Types | ✅ | PRIVACY_POLICY, TERMS_OF_SERVICE, MARKETING_EMAILS, MARKETING_SMS, COOKIES_ANALYTICS, COOKIES_MARKETING |

### 7.2 India DPDP Act

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| Consent Management | ✅ | ConsentRecord model |
| Data Localization | ⚠️ | PostgreSQL in India region (deployment config) |
| Grievance Redressal | ✅ | SupportTicket system |
| Data Breach Notification | 📋 | Alert system ready (src/lib/observability/alerts.ts) |

### 7.3 PCI DSS Readiness

| Requirement | Status | Implementation |
|-------------|--------|---------------|
| No card data storage | ✅ | Razorpay tokenization (no PAN stored) |
| Encryption at rest | ✅ | AES-256-GCM for sensitive data |
| Access controls | ✅ | RBAC + route protection |
| Audit logging | ✅ | AuditLog model |
| Network security | ✅ | CSP + HSTS + rate limiting |
| Vulnerability management | ⚠️ | Dependabot + manual reviews |

### 7.4 Tax Compliance

| Region | Status | Implementation |
|--------|--------|---------------|
| India GST | ✅ | src/lib/tax/providers/india-gst-provider.ts + GST invoice template |
| Multi-State Tax | ✅ | StateTaxRule model |
| Tax Categories | ✅ | TaxCategory enum (8 categories) |
| Tax Sync Audit | ✅ | TaxSyncLog model |
| International Tax Rates | ✅ | TaxRate model |
| Tax-Inclusive/Exclusive | ✅ | Region.taxInclusive flag |
| Admin Tax Management | ✅ | /admin/tax-rules, /admin/tax-rates, /admin/tax-categories |

---

## 8. Infrastructure & DevOps

### 8.1 Docker Configuration

**Development** (`docker-compose.yml`):
- PostgreSQL 15 (port 5432)
- Redis 7 (port 6379)
- Volume persistence for data

**Production** (`docker-compose.prod.yml`):
- App container (standalone Next.js)
- PostgreSQL with health checks
- Redis with persistence
- Nginx reverse proxy (ports 80/443)
- Auto-restart policies

**Dockerfile**:
- Multi-stage build (deps → build → production)
- Standalone output mode
- Non-root user
- Minimal production image

### 8.2 CI/CD Pipeline (GitHub Actions)

**Workflow**: `.github/workflows/ci.yml`
- Triggers: push to main, pull requests
- Steps: lint → type-check → unit tests → build → E2E tests
- Caching: node_modules, Next.js build cache
- Playwright browser installation
- Coverage reporting

### 8.3 Deployment Targets

| Target | Configuration | Use Case |
|--------|--------------|----------|
| Vercel | vercel.json (security headers, rewrites) | Primary (serverless) |
| Docker | Dockerfile + docker-compose.prod.yml | Self-hosted / AWS ECS |
| Standalone | `output: "standalone"` in next.config.ts | Any Node.js host |

### 8.4 Environment Management

| Environment | Purpose | Config |
|-------------|---------|--------|
| .env | Base defaults | Checked into git (non-sensitive) |
| .env.local | Local overrides | Git-ignored |
| .env.example | Template for new devs | Documented |
| Production | Vercel/Docker env vars | Never in git |

---

## 9. API Architecture

### 9.1 API Routes (40+ Endpoints)

| Category | Endpoints |
|----------|-----------|
| Auth | `/api/auth/[...nextauth]` |
| Health | `/api/health`, `/api/health/deep` |
| Search | `/api/search`, `/api/search/autocomplete`, `/api/search/analytics`, `/api/search/image` |
| GDPR | `/api/gdpr/export`, `/api/gdpr/delete` |
| Payments | `/api/razorpay/webhook` |
| AI | `/api/ai/agents/run`, `/api/ai/data`, `/api/ai/analyze`, `/api/chatbot` |
| Delivery | `/api/delivery/track/[assignmentId]` |
| Cron | `/api/cron/cart-abandonment`, `/api/cron/price-alerts` |
| Admin | `/api/admin/queue`, `/api/admin/alerts`, `/api/admin/circuit-breaker`, `/api/admin/config/reload`, `/api/admin/tax-sync`, `/api/admin/voucher-code` |
| Site | `/api/site/resolve` |
| Invoice | `/api/invoice`, `/api/invoice/[orderId]` |
| Analytics | `/api/analytics/realtime` |
| Upload | `/api/upload` |
| Events | `/api/events` |
| Feature Flags | `/api/feature-flags` |
| Deep Links | `/api/deep-link`, `/deep/[...slug]` |
| Manifest | `/api/manifest` |
| Location | `/api/location` |
| Deals | `/api/deals` |
| Versioned API | `/api/v1/[...slug]` (catch-all for external consumers) |

### 9.2 Webhook System

| Feature | Implementation |
|---------|---------------|
| Webhook Registration | Webhook model + webhook-actions.ts |
| Webhook Delivery | WebhookDelivery model with retry |
| Delivery Logging | Success/failure tracking |
| Admin Management | /admin/webhooks + /admin/webhooks/deliveries |
| Background Delivery | src/lib/queue/jobs/webhook-job.ts |

### 9.3 API Key Management

| Feature | Implementation |
|---------|---------------|
| API Key Generation | ApiKey model + api-key-actions.ts |
| Key Scoping | Per-user API keys |
| Admin Management | /admin/api-keys |
| Rate Limiting | Applied via middleware |

---

## 10. Mobile & PWA

### 10.1 Progressive Web App (PWA)

| Feature | Status | Implementation |
|---------|--------|---------------|
| Web App Manifest | ✅ | public/manifest.json |
| Service Worker | ✅ | public/sw.js (offline caching, push notifications) |
| Offline Page | ✅ | /offline |
| PWA Registration Hook | ✅ | src/hooks/usePWARegistration.ts |
| App Icons (192px, 512px) | ✅ | public/icon-192.png, public/icon-512.png |
| Deep Links | ✅ | src/lib/deep-links/handler.ts |
| Admin PWA/Deep Linking | ✅ | /admin/pwa-deep-linking |

### 10.2 React Native Mobile App

| Feature | Status | Implementation |
|---------|--------|---------------|
| Expo Setup | ✅ | mobile/app.json |
| TypeScript Config | ✅ | mobile/tsconfig.json |
| API Client | ✅ | mobile/src/api/ |
| App Entry | ✅ | mobile/App.tsx |
| Android Asset Links | ✅ | public/.well-known/assetlinks.json |
| iOS App Site Association | ✅ | public/.well-known/apple-app-site-association |

---

## 11. Testing Strategy

### 11.1 Test Pyramid

| Level | Framework | Count | Coverage Target |
|-------|-----------|-------|----------------|
| Unit Tests | Vitest | 11 specs | 70% lines/functions |
| Integration Tests | Vitest | 2 specs | Payment + Order flows |
| E2E Tests | Playwright | 5 specs | Critical user journeys |
| Action Tests | Vitest | 1 spec | Server action validation |

### 11.2 Unit Test Coverage

| Module | Test File |
|--------|-----------|
| Fraud Engine | fraud-engine.test.ts |
| Promotion Engine | promotion-engine.test.ts |
| Circuit Breaker | circuit-breaker.test.ts |
| Discount Engine | discount-engine.test.ts |
| Feature Flags | feature-flags.test.ts |
| Rate Limiter | rate-limit.test.ts |
| Encryption | encryption.test.ts |
| Cart Logic | cart.test.ts |
| File Validator | file-validator.test.ts |
| Validations | validations.test.ts |
| Error Handling | errors.test.ts |

### 11.3 E2E Test Coverage

| Journey | Test File |
|---------|-----------|
| Checkout Flow | checkout.spec.ts |
| Admin Dashboard | admin-dashboard.spec.ts |
| Product Browsing | browse-products.spec.ts |
| Error Boundaries | error-boundary.spec.ts |
| Authentication | auth.spec.ts |

### 11.4 Coverage Thresholds

```
Branches:   60%
Functions:  70%
Lines:      70%
Statements: 70%
```

---

## 12. Performance & Observability

### 12.1 Monitoring Stack

| System | Purpose | Implementation |
|--------|---------|---------------|
| Sentry | Error tracking + performance | sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts |
| Pino | Structured logging | src/lib/logger.ts (JSON in prod, pretty in dev) |
| Web Vitals | Core Web Vitals | src/hooks/useWebVitals.ts + PerformanceMetric model |
| Health Checks | Service health | /api/health (shallow) + /api/health/deep (DB check) |
| Alerts | Threshold alerting | src/lib/observability/alerts.ts |
| Tracing | Distributed tracing | src/lib/observability/tracing.ts |
| Metrics | Custom metrics | src/lib/observability/metrics.ts |

### 12.2 Resilience Patterns

| Pattern | Implementation | Purpose |
|---------|---------------|---------|
| Circuit Breaker | src/lib/circuit-breaker/ | External service failure isolation |
| Rate Limiting | src/lib/rate-limit.ts | Abuse prevention |
| Queue System | src/lib/queue/ (BullMQ + memory) | Async job processing |
| Cache Layer | src/lib/cache/ (Redis + memory) | Response caching |
| Feature Flags | src/lib/feature-flags/ | Safe rollouts |
| A/B Testing | src/lib/feature-flags/ab-test.ts | Experiment framework |
| Error Boundaries | error.tsx, global-error.tsx | Graceful degradation |

### 12.3 Performance Targets

| Metric | Target | Monitoring |
|--------|--------|-----------|
| API Latency (P99) | <200ms | Sentry performance |
| Page Load (LCP) | <1.5s | Web Vitals hook |
| First Input Delay | <100ms | Web Vitals hook |
| CLS | <0.1 | Web Vitals hook |
| Uptime | 99.95% | Health check + alerts |
| Error Rate | <0.1% | Sentry |


---

## 13. Route Map (Complete URL Structure)

### Public Storefront

| Route | Purpose |
|-------|---------|
| `/` | Homepage |
| `/products` | Product listing |
| `/products/[slug]` | Product detail |
| `/category/[slug]` | Category page |
| `/brands` | Brand listing |
| `/brands/[slug]` | Brand page |
| `/search` | Search results |
| `/deals` | Deals page |
| `/cart` | Shopping cart |
| `/checkout` | Checkout flow |
| `/checkout/success` | Order confirmation |
| `/groceries` | Grocery section |
| `/gift-cards` | Gift card store |
| `/gift-cards/purchase/[id]` | Gift card purchase |
| `/gift-cards/redeem` | Redeem gift card |
| `/gift-cards/corporate` | Corporate gift cards |
| `/rewards/spin` | Spin wheel game |
| `/share/[token]` | Shared wishlist |
| `/faq` | FAQ page |
| `/terms` | Terms of service |
| `/privacy` | Privacy policy |
| `/offline` | Offline fallback (PWA) |
| `/prime` | Prime membership |
| `/b2b` | B2B landing |
| `/sell` | Sell on platform |
| `/sell/accelerator` | Seller accelerator |
| `/fba` | Fulfillment by platform |
| `/affiliate` | Affiliate program |
| `/supply` | Supply chain |
| `/advertise` | Advertising |
| `/brand-registry` | Brand registry |
| `/global-sell` | Global selling |
| `/auto-replenishment` | Subscribe & save |
| `/pay/merchants` | Merchant payments |

### Account (Authenticated)

| Route | Purpose |
|-------|---------|
| `/account` | Account overview |
| `/account/profile` | Profile settings |
| `/account/security` | Security (MFA) |
| `/account/privacy` | Privacy settings |
| `/account/addresses` | Address book |
| `/account/addresses/new` | Add address |
| `/account/addresses/edit/[id]` | Edit address |
| `/account/orders` | Order history |
| `/account/orders/[id]` | Order detail |
| `/account/wallet` | Digital wallet |
| `/account/returns` | Return requests |
| `/account/reviews` | My reviews |
| `/account/messages` | Message center |
| `/account/lists` | Shopping lists |
| `/account/lists/[id]` | List detail |
| `/account/referrals` | Referral program |
| `/account/payment-methods` | Saved payments |
| `/account/notifications` | Notifications |
| `/account/notifications/preferences` | Notification settings |
| `/account/communication-preferences` | Communication prefs |
| `/account/browsing-history` | Browse history |
| `/account/price-alerts` | Price drop alerts |
| `/wishlist` | Wishlist |
| `/orders/[id]/tracking` | Order tracking |
| `/orders/[id]/feedback` | Delivery feedback |
| `/orders/[id]/refund-status` | Refund status |

### Seller Portal

| Route | Purpose |
|-------|---------|
| `/seller/register` | Seller registration |
| `/seller/dashboard` | Seller dashboard |
| `/seller/payouts` | Payout history |

### B2B Portal

| Route | Purpose |
|-------|---------|
| `/business/register` | Business registration |
| `/business/dashboard` | Business dashboard |
| `/business/orders` | B2B orders |
| `/business/team` | Team management |
| `/business/approvals` | Approval workflows |
| `/business/rfq` | RFQ list |
| `/business/rfq/new` | Create RFQ |
| `/business/rfq/[id]` | RFQ detail |

### Delivery Agent

| Route | Purpose |
|-------|---------|
| `/agent/login` | Agent login |
| `/agent/dashboard` | Active deliveries |
| `/agent/earnings` | Earnings |
| `/agent/orders/[id]` | Delivery detail |

### Admin Panel (65+ Pages)

| Route | Purpose |
|-------|---------|
| `/admin/dashboard` | Overview metrics |
| `/admin/products` | Product management |
| `/admin/products/new` | Create product |
| `/admin/products/[id]` | Edit product |
| `/admin/products/bulk-upload` | CSV upload |
| `/admin/orders` | Order management |
| `/admin/orders/[id]` | Order detail |
| `/admin/customers` | Customer list |
| `/admin/customers/analytics` | Customer analytics |
| `/admin/sellers` | Seller management |
| `/admin/sellers/[id]` | Seller detail |
| `/admin/sellers/payouts` | Seller payouts |
| `/admin/sellers/commissions` | Commission config |
| `/admin/analytics` | Analytics overview |
| `/admin/analytics/revenue` | Revenue analytics |
| `/admin/analytics/conversion` | Conversion funnel |
| `/admin/analytics/cohort` | Cohort analysis |
| `/admin/ai` | AI dashboard |
| `/admin/ai/config` | AI configuration |
| `/admin/ai/predictions` | AI predictions |
| `/admin/ai/agents` | AI agents |
| `/admin/ai/recommendations` | Recommendations |
| `/admin/ai/analytics` | AI analytics |
| `/admin/ai/data-analysis` | Data analysis |
| `/admin/ai/video-recognition` | Video AI |
| `/admin/ai/voice-learning` | Voice AI |
| `/admin/promotions/*` | 19 promotion sub-pages |
| `/admin/sites` | Multi-site management |
| `/admin/sites/[id]` | Site config |
| `/admin/dark-stores` | Dark store management |
| `/admin/inventory` | Inventory |
| `/admin/purchase-orders` | Purchase orders |
| `/admin/suppliers` | Suppliers |
| `/admin/categories` | Categories |
| `/admin/brands` | Brands |
| `/admin/translations` | Translations |
| `/admin/regions` | Regions |
| `/admin/locations` | Locations |
| `/admin/payments` | Payments |
| `/admin/wallets` | Wallets |
| `/admin/vouchers` | Vouchers |
| `/admin/tax-rules` | Tax rules |
| `/admin/tax-rates` | Tax rates |
| `/admin/delivery-zones` | Delivery zones |
| `/admin/delivery-agents` | Delivery agents |
| `/admin/fleet` | Fleet management |
| `/admin/loyalty` | Loyalty program |
| `/admin/referrals` | Referrals |
| `/admin/prime` | Prime membership |
| `/admin/gamification` | Gamification |
| `/admin/fraud` | Fraud detection |
| `/admin/webhooks` | Webhooks |
| `/admin/api-keys` | API keys |
| `/admin/feature-flags` | Feature flags |
| `/admin/config` | Runtime config |
| `/admin/monitoring` | System monitoring |
| `/admin/circuit-breaker` | Circuit breakers |
| `/admin/queue` | Job queue |
| `/admin/performance` | Performance |
| `/admin/chat` | Live chat admin |
| `/admin/reports` | Reports |
| `/admin/settings` | Platform settings |
| `/admin/crm` | CRM integration |
| `/admin/erp` | ERP integration |
| `/admin/business` | B2B admin |
| `/admin/surge-pricing` | Surge pricing |
| `/admin/dynamic-pricing` | Dynamic pricing |
| `/admin/forecasting` | Demand forecasting |
| `/admin/batch-assignment` | Delivery batching |
| `/admin/slots` | Delivery slots |
| `/admin/cart-abandonment` | Cart recovery |
| `/admin/search-analytics` | Search analytics |

### Support & Customer Care

| Route | Purpose |
|-------|---------|
| `/customer-care/tickets` | Ticket list |
| `/customer-care/tickets/[id]` | Ticket detail |
| `/customer-care/returns` | Returns |
| `/customer-care/refunds` | Refunds |
| `/logs` | System logs (Support) |
| `/health` | Health dashboard (Support) |
| `/configurations` | Config (Support) |

---

## 14. Server Actions Index (97 Actions)

Grouped by domain:

**Auth & User** (6): auth, profile, mfa, gdpr, settings, notification-preference

**Products** (7): product, product-catalog, product-master, product-badges, variant, bulk-upload, commerce

**Orders & Fulfillment** (6): order, return, refund-automation, invoice, reorder, split-shipment

**Payments** (4): payment, payment-retry, split-payment, saved-payment

**Cart** (2): cart, cart-abandonment

**Promotions** (6): promo, promotion, discount-engine, dynamic-pricing, surge, lightning

**Inventory & Supply** (4): inventory, replenishment, forecast, grocery

**Delivery** (6): delivery, dark-store, fleet, slot, batch-assignment, agent

**Wallet & Vouchers** (2): wallet, voucher-tier, gift-card-store

**Seller** (2): seller, seller-portal

**B2B** (4): b2b, business, business-team, rfq

**AI/ML** (8): ai-agent, ai-analytics, ai-behavior, ai-config, ai-content, ai-prediction, ai-recommendation, ai-voice, ai-video

**Search** (2): search, search-personalization

**Support** (4): support, ticket, chat, feedback

**Analytics** (4): analytics, conversion, performance, monitoring

**System** (8): config, feature-flag, queue, circuit-breaker, webhook, api-key, report, site

**Content** (2): page-content, localization

**Engagement** (5): gamification, loyalty, referral, membership, browse-history

**Misc** (3): location, location-lookup, message-centre, phaseA, phaseB

---

## 15. Library Modules Index (src/lib)

### Core Infrastructure

| Module | Files | Purpose |
|--------|-------|---------|
| `auth.ts` | 1 | NextAuth configuration |
| `prisma.ts` | 1 | Database client singleton |
| `logger.ts` | 1 | Pino structured logging |
| `errors.ts` | 1 | Typed error classes |
| `server-action-wrapper.ts` | 1 | Error-safe action wrapper |
| `env-validation.ts` | 1 | Startup environment checks |

### Security

| Module | Files | Purpose |
|--------|-------|---------|
| `rate-limit.ts` | 1 | Sliding window rate limiter |
| `encryption.ts` | 1 | AES-256-GCM + HMAC |
| `get-real-ip.ts` | 1 | Client IP extraction |
| `request-id.ts` | 1 | Request tracing |
| `mfa/` | 1 | TOTP multi-factor auth |
| `fraud/` | 5 | Fraud detection engine + rules |

### Commerce

| Module | Files | Purpose |
|--------|-------|---------|
| `payments/` | 5 | Multi-gateway payment processing |
| `pricing/` | 1 | Dynamic pricing engine |
| `surge/` | 2 | Surge pricing logic |
| `tax/` | 3 | Tax calculation (India GST) |
| `invoice/` | 3 | PDF invoice generation |
| `delivery-estimates.ts` | 1 | Delivery time estimation |

### Platform

| Module | Files | Purpose |
|--------|-------|---------|
| `ai/` | 7 | AI/ML orchestration + providers |
| `search/` | 6 | Pluggable search engine |
| `cache/` | 5 | Redis + memory caching |
| `queue/` | 10 | Background job processing |
| `circuit-breaker/` | 2 | External service resilience |
| `feature-flags/` | 2 | Feature flags + A/B testing |
| `config/` | 3 | Runtime configuration |
| `observability/` | 4 | Alerts, tracing, metrics, health |

### Utilities

| Module | Files | Purpose |
|--------|-------|---------|
| `validations/` | 21 | Zod schemas for all domains |
| `i18n.ts` | 1 | Internationalization |
| `currency.ts` | 1 | Currency handling |
| `currency-format.ts` | 1 | Currency formatting |
| `currency-api.ts` | 1 | Exchange rate API |
| `geo.ts` | 1 | Geolocation |
| `ip-geolocation.ts` | 1 | IP → location |
| `gdpr.ts` | 1 | EU/EEA detection |
| `cookies.ts` | 1 | Cookie helpers |
| `site-context.ts` | 1 | Multi-site context |
| `utils.ts` | 1 | General utilities |
| `serialize.ts` | 1 | Data serialization |
| `file-validator.ts` | 1 | Upload validation |
| `image-search.ts` | 1 | Visual search |
| `map-config.ts` | 1 | Map provider config |
| `deep-links/` | 1 | Deep link routing |
| `bulk-upload/` | 1 | CSV parsing |
| `gamification/` | 1 | Rewards engine |
| `performance/` | 1 | Web vitals |
| `delivery/` | 1 | Batch assignment |
| `slot/` | 1 | Delivery slot engine |
| `forecast/` | 1 | Demand forecasting |
| `live-chat-server.ts` | 1 | Chat server |
| `crm.ts` | 1 | CRM integration |
| `erp.ts` | 1 | ERP integration |
| `webhook-delivery.ts` | 1 | Outbound webhooks |

---

## 16. Component Architecture

### Storefront Components (94+)

**Product**: ProductCard, ProductGrid, ProductDetail, ProductGallery, VariantSelector, PriceDisplay, StockBadge, ProductBadges, RelatedProducts, RecentlyViewed

**Cart & Checkout**: CartDrawer, CartItem, CartSummary, CheckoutForm, AddressSelector, DeliverySlotPicker, PaymentMethodSelector, OrderSummary, CouponInput

**Search & Navigation**: SearchBar, SearchResults, AutocompleteDropdown, CategoryNav, BreadcrumbNav, FilterSidebar, SortDropdown, MegaMenu

**User**: ProfileForm, AddressForm, OrderCard, OrderTimeline, WishlistGrid, ReviewForm, NotificationBell

**Engagement**: ChatWidget, CookieConsent, PriceDropBanner, FlashDealTimer, SpinWheel, ScratchCard, ReferralBanner, LoyaltyBadge

**Maps & Delivery**: DeliveryMap, StoreLocator, DeliveryTracker, SlotSelector

**Wallet**: VoucherTierCard, AddMoneySection, GiftCardSection

### Admin Components

**Dashboard**: RevenueChart, OrdersWidget, TopProducts, CustomerGrowth, ConversionFunnel, RealtimeOrders

**Fleet**: FleetMap, AgentPerformance

**Forecast**: ForecastChart

**Seller**: SellerList, SellerDetail, PayoutTable, CommissionConfig

**Dark Store**: PickList, PackStation

**Chat**: ChatDashboard

### Agent Components (5)

OrderCard, PhotoProof, NavigationPanel, GPSTracker, OTPVerification

### UI Primitives (28 — shadcn/ui)

button, card, dialog, sheet, table, select, input, label, badge, avatar, dropdown-menu, separator, skeleton, tabs, textarea, toast, tooltip, command, drawer, popover, scroll-area, switch, checkbox, radio-group, progress, slider, calendar, accordion

---

## 17. Implementation Roadmap

### Phase 1: Foundation (COMPLETED ✅)

- [x] Next.js 16 + React 19 setup
- [x] Prisma schema (103 models)
- [x] Authentication (NextAuth + bcrypt + JWT)
- [x] RBAC middleware
- [x] Security headers (CSP, HSTS, rate limiting)
- [x] Multi-site architecture
- [x] Globalization (regions, locales, translations)
- [x] Product catalog + variants
- [x] Shopping cart + checkout
- [x] Order management
- [x] Razorpay payments
- [x] Wallet + vouchers + gift cards
- [x] Promotion engine (25 models)
- [x] Inventory management
- [x] Delivery & logistics
- [x] Seller marketplace
- [x] B2B commerce
- [x] AI/ML platform
- [x] Search engine
- [x] Customer support
- [x] Admin panel (65+ pages)
- [x] Docker + CI/CD
- [x] Testing framework
- [x] Mobile app scaffold

### Phase 2: Production Hardening (NEXT)

- [ ] Redis cache integration (swap from in-memory)
- [ ] Stripe + PayPal payment providers
- [ ] Email service integration (SendGrid/SES)
- [ ] SMS service integration (Twilio)
- [ ] S3/CloudFront for file storage
- [ ] Full E2E test coverage (20+ specs)
- [ ] Load testing (k6/Artillery)
- [ ] Database indexing optimization
- [ ] Connection pooling (PgBouncer)
- [ ] CDN configuration
- [ ] Error monitoring alerting rules
- [ ] Backup & disaster recovery

### Phase 3: Scale & Launch

- [ ] Multi-region deployment (India + SEA)
- [ ] Kubernetes orchestration
- [ ] Auto-scaling policies
- [ ] Database read replicas
- [ ] Full-text search (Typesense/Meilisearch deployment)
- [ ] Real-time WebSocket notifications
- [ ] Mobile app store deployment
- [ ] SOC 2 Type II audit
- [ ] PCI DSS L1 certification
- [ ] Performance optimization (<100ms P99)
- [ ] 99.99% uptime SLA

### Phase 4: Growth & Expansion

- [ ] 10+ market localizations
- [ ] Enterprise SSO (SAML/OIDC)
- [ ] Advanced ML models (on-premise)
- [ ] Marketplace ads platform
- [ ] White-label mobile app builder
- [ ] Partner API ecosystem
- [ ] Vertical solutions (Pharma, Food, Services)

---

## 18. Business Model & Revenue

| Stream | Model | Target |
|--------|-------|--------|
| SaaS Subscriptions | $500-$200k/month per tenant | $70M+ ARR by Year 5 |
| Usage Add-ons | Per-SMS, per-API-call, per-report | +30% of subscription |
| Marketplace Commission | 10-15% GMV (own instances) | Optional |
| Consulting | Implementation + migration | +20% of subscription |

### Target Markets (Priority Order)

1. **India** — Quick commerce boom, GST simplified, English-speaking talent
2. **Southeast Asia** — Vietnam, Philippines, Indonesia
3. **LATAM** — Mexico, Brazil
4. **Africa** — Nigeria, Kenya
5. **Middle East** — UAE, Saudi Arabia
6. **Europe** — UK, Germany (compliance-heavy, high willingness to pay)

---

## 19. Competitive Positioning

**"Build once, deploy 100 times, monetize across geographies."**

| Moat | How |
|------|-----|
| Unified Architecture | Single codebase handles marketplace + quick commerce + hyperlocal |
| White-Label SaaS | Sell to entrepreneurs, enterprises, VCs |
| Compliance Automation | GDPR, DPDP, CCPA, PCI DSS, GST baked in |
| Multi-Tenancy at Scale | One ops team manages 100+ instances |
| AI/ML Parity | Recommendations, fraud, forecasting built-in |

---

## 20. Risk Matrix

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Scaling bottleneck | Medium | High | Pre-plan sharding, load test quarterly at 10x |
| Payment gateway downtime | Low | Critical | Multi-gateway redundancy, COD fallback |
| Data breach | Low | Critical | 8-layer security, bug bounty, cyber insurance |
| Seller/buyer fraud | High | Medium | ML fraud detection, verification, protection fund |
| Slow customer acquisition | Medium | High | Free tier, referral bonuses, partnerships |
| Competition from hyperscalers | High | High | Focus on underserved regions, niche verticals |
| Regulatory changes | Medium | Medium | Compliance team, monthly policy review |
| Key person departure | Low | Medium | Document all processes, multi-person reviews |
| Churn from price sensitivity | Medium | Medium | Transparent pricing, long-term contracts |
| Technical debt accumulation | Medium | Medium | Quarterly refactoring sprints, test coverage gates |

---

## Appendix: Quick Reference Commands

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # ESLint check

# Database
npx prisma generate           # Generate client
npx prisma db push            # Push schema changes
npx prisma studio             # Visual DB browser
npm run seed                   # Seed database

# Testing
npm test                       # Run unit tests
npm run test:watch             # Watch mode
npm run test:coverage          # With coverage
npm run test:e2e               # Playwright E2E
npm run test:e2e:ui            # Playwright UI mode

# Docker
docker compose up -d           # Start dev services
docker compose -f docker-compose.prod.yml up -d  # Production

# Scripts
npx tsx scripts/migrate-to-multi-site.ts    # Multi-site migration
npx tsx scripts/seed-locations.ts           # Seed locations
npx tsx scripts/seed-gift-cards.ts          # Seed gift cards
npx tsx scripts/seed-page-content.ts        # Seed CMS content
npx tsx scripts/seed-site-links.ts          # Seed navigation
```

---

> **END OF DOCUMENT**
>
> **REMINDER**: This is a living document. Update it with every major feature addition, architecture decision, or security change. Nothing gets lost. Every module, every route, every model is indexed above. Use this as your north star for development, onboarding, audits, and investor presentations.
>
> **Last verified against codebase**: 2026-05-30

