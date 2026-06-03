# Module Documentation — Master Index

> Reference catalog of every backend/business module in this project, grouped by domain, with an implementation-maturity rating. Use this as the entry point; each domain links to a detailed module doc.
>
> See also: [`../ARCHITECTURE.md`](../ARCHITECTURE.md) (high-level platform architecture).

- **Project:** `ecomm` (Next.js 16 + Prisma + PostgreSQL, multi-tenant)
- **Scope:** Server Actions (`src/server/actions`, 135 files), API routes (`src/app/api`, 40 handlers), lib services (`src/lib`), app routes (`src/app`), data layer (`prisma/schema.prisma`), frontend (components/hooks/stores).
- **Last indexed:** 2026-06-01

## How to use this doc
1. Find the domain you care about in the **Domain Map** below.
2. Open the linked module doc for the per-file catalog (path · status · purpose).
3. Status reflects *implementation maturity*, not whether the file exists.

## Status legend
| Badge | Meaning |
|---|---|
| ✅ **Real** | DB-backed CRUD + working business logic; functions end-to-end in-app |
| 🟡 **Partial** | Real DB/logic exists, but a key external integration is stubbed / provider-pluggable, or the logic is simplified (heuristic, not the production algorithm) |
| 🔴 **Stub** | Hardcoded/mock data, no persistence; demo only |

> Methodology: statuses derived from code signals (Prisma persistence, `getServiceProvider`/`ServicesConfig` provider hooks, hardcoded returns) plus direct file sampling. Descriptions are inferred from file names + sampled code. Treat as a living document; verify before relying on any single entry for production.

## Domain Map
| # | Domain | Doc | Inspiration |
|---|---|---|---|
| 1 | Commerce & Marketplace | [amazon-commerce.md](./amazon-commerce.md) | Amazon |
| 2 | Quick Commerce (q-grocery, delivery) | [quick-commerce.md](./quick-commerce.md) | Blinkit / Instamart |
| 3 | Payments & Fintech (wallet, VAS) | [paytm-fintech.md](./paytm-fintech.md) | Paytm |
| 4 | Platform, Admin, Ops, AI & Verticals | [platform-admin.md](./platform-admin.md) | Cross-cutting |
| 5 | Infrastructure (lib, API, data, frontend) | [infrastructure.md](./infrastructure.md) | Cross-cutting |

## Coverage scorecard (approximate)
| Platform | Real | Partial | Stub | Readiness |
|---|---|---|---|---|
| Amazon (commerce) | High | Some | Minimal | **High** |
| Blinkit (quick-commerce) | Good | Some | Minimal | **Medium-High** |
| Instamart (quick-commerce) | Shared engine | Some | — | **Medium** |
| Paytm (fintech/VAS) | Wallet only | Many | Several | **Low** |

## Quick facts
- **135** server-action files; **129** persist to the DB via Prisma.
- **Real payment gateways** wired: Razorpay, Stripe, PayPal (`src/lib/payments/providers/*`) + webhooks.
- **Provider-pluggable** value-added services (UPI/BBPS/recharge/BNPL/gold/cashback) fall back to stubs unless a provider is configured.
- **Pure stubs:** mutual funds, insurance, movie/travel booking, credit score.
- **Specialized verticals present:** trading, streaming, agent network (see platform doc).

## Conventions
- Server Actions live in `src/server/actions/*-actions.ts` and use `"use server"`.
- Auth/session via `src/lib/auth.ts` (`getSession`); tenant scoping via `src/lib/site-context.ts` + `middleware.ts`.
- DB access via the singleton in `src/lib/prisma.ts`.
- External services abstracted via `src/lib/config/services-config.ts` (`ServicesConfig`, `getServiceProvider`).
