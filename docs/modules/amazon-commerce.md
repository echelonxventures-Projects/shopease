# Domain 1 — Commerce & Marketplace (Amazon-like)

[← Master Index](./README.md) · Legend: ✅ Real · 🟡 Partial · 🔴 Stub

Core e-commerce: catalog, cart, checkout, orders, seller marketplace, B2B, reviews, returns, promotions, loyalty, tax/invoicing, i18n.

## Catalog & Products
| Module (server action) | Status | Purpose |
|---|---|---|
| `product-actions.ts` | ✅ | Product CRUD, fetch by slug/category, listing. |
| `product-catalog-actions.ts` | ✅ | Catalog browsing/filtering, category trees. |
| `product-master-actions.ts` | ✅ | Master-data product records (universal attributes). |
| `variant-actions.ts` | ✅ | Product variants, options, per-variant price/stock. |
| `product-badges-actions.ts` | ✅ | Product badges/labels (e.g. "Bestseller"). |
| `brand-category-actions.ts` | ✅ | Brand ↔ category associations. |

## Cart, Checkout & Orders
| Module | Status | Purpose |
|---|---|---|
| `cart-actions.ts` | ✅ | Server cart operations (add/update/remove). |
| `cart-abandonment-actions.ts` | ✅ | Detect/recover abandoned carts (with cron route). |
| `order-actions.ts` | ✅ | Order creation, status transitions, history. |
| `commerce-actions.ts` | ✅ | Cross-cutting commerce flows (checkout glue, 53 DB ops). |
| `reorder-actions.ts` | ✅ | One-click reorder from past orders. |
| `browse-history-actions.ts` | ✅ | Recently viewed tracking. |
| `split-shipment-actions.ts` | 🟡 | Split an order into multiple shipments (thin). |

## Reviews & Returns
| Module | Status | Purpose |
|---|---|---|
| `review-actions.ts` | ✅ | Product reviews/ratings CRUD. |
| `review-moderation-actions.ts` | ✅ | Admin moderation/approval of reviews. |
| `return-actions.ts` | ✅ | RMA / return requests and processing. |
| `refund-automation-actions.ts` | ✅ | Automated refund rules on returns. |
| `instant-refund-actions.ts` | 🟡 | Instant refund to wallet — provider-pluggable. |

## Wishlist & Lists
| Module | Status | Purpose |
|---|---|---|
| `wishlist-actions.ts` | ✅ | Wishlist add/remove/list. |
| `list-actions.ts` | ✅ | Custom user lists (e.g. gift/saved lists). |

## Search & Discovery
| Module | Status | Purpose |
|---|---|---|
| `search-actions.ts` | 🟡 | DB-backed product search/filter (no dedicated search engine). |
| `search-personalization-actions.ts` | 🟡 | Personalized result tweaks (heuristic). |
| `ai-recommendation-actions.ts` | 🟡 | "Inspired by browsing" recs (heuristic, not trained ML). |

## Seller Marketplace & B2B
| Module | Status | Purpose |
|---|---|---|
| `seller-actions.ts` | ✅ | Seller onboarding, listings, seller data. |
| `seller-portal-actions.ts` | ✅ | Seller dashboard operations. |
| `rfq-actions.ts` | ✅ | Request-for-quote workflow (B2B). |
| `b2b-actions.ts` | 🟡 | B2B account features (thin). |
| `business-actions.ts` | ✅ | Business-account management. |
| `business-team-actions.ts` | ✅ | Business sub-users/teams. |
| `bulk-upload-actions.ts` | ✅ | CSV/bulk catalog import. |

## Membership, Loyalty & Growth
| Module | Status | Purpose |
|---|---|---|
| `membership-actions.ts` | ✅ | Prime-style membership tiers/benefits. |
| `loyalty-actions.ts` | ✅ | Points/loyalty accrual & redemption. |
| `gamification-actions.ts` | ✅ | Gamified engagement (challenges/badges). |
| `gamified-actions.ts` | ✅ | Gamified campaign helpers. |
| `referral-actions.ts` | ✅ | Referral program. |
| `conversion-actions.ts` | ✅ | Conversion-event tracking. |

## Promotions, Pricing & Discounts
| Module | Status | Purpose |
|---|---|---|
| `promotion-actions.ts` | ✅ | Promotions/campaign CRUD. |
| `promo-actions.ts` | ✅ | Promo/coupon application. |
| `promo-analytics.ts` | ✅ | Promo performance metrics. |
| `discount-engine.ts` | ✅ | Discount calculation engine (rules/stacking). |
| `voucher-tier-actions.ts` | ✅ | Tiered voucher logic. |
| `gift-card-store-actions.ts` | ✅ | Gift-card purchase/redeem (23 DB ops). |

## Tax, Invoicing & Localization
| Module | Status | Purpose |
|---|---|---|
| `tax-actions.ts` | ✅ | Tax computation. |
| `tax-rules-actions.ts` | ✅ | Tax-rule configuration. |
| `tax-sync-actions.ts` | ✅ | Sync tax tables/rates. |
| `invoice-actions.ts` | ✅ | Invoice generation (+ `api/invoice`). |
| `localization-actions.ts` | ✅ | i18n strings, locale/currency (55 DB ops). |

## Phase bundles
| Module | Status | Purpose |
|---|---|---|
| `phaseA-actions.ts` | ✅ | Aggregated "Phase A" commerce features (70 DB ops) — review for exact scope. |
| `phaseB-actions.ts` | ✅ | Aggregated "Phase B" commerce features (29 DB ops) — review for exact scope. |

## Storefront routes (`src/app/(site)`)
`/` (home) · `products` · `category` · `search` · `cart` · `checkout` · `orders` · `wishlist` · `deals` · `brands` · `rewards` · `seller` · `account/*` · `auth` · `terms` · `privacy` · `offline`.
