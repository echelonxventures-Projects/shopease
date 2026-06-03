# Domain 4 — Platform, Admin, Ops, AI & Verticals

[← Master Index](./README.md) · Legend: ✅ Real · 🟡 Partial · 🔴 Stub

Cross-cutting concerns: multi-tenancy, partner hierarchy, configuration, security, support, observability, AI, and specialized verticals (trading, streaming, agent network).

## Multi-tenant Platform
| Module (server action) | Status | Purpose |
|---|---|---|
| `site-actions.ts` | ✅ | Tenant/site CRUD, theming, domains (55 DB ops). |
| `site-provisioning-actions.ts` | ✅ | Provision new tenant sites (17 DB ops). |
| `platform-module-actions.ts` | ✅ | Enable/disable platform modules per site. |
| `module-access-actions.ts` | ✅ | Per-module access gating. |

## Partner Hierarchy & Revenue
| Module | Status | Purpose |
|---|---|---|
| `role-actions.ts` | ✅ | Roles & permissions. |
| `commission-chain-actions.ts` | ✅ | Multi-level commission chains. |
| `revenue-share-actions.ts` | ✅ | Revenue-share splits (20 DB ops). |
| `hierarchy-monitoring-actions.ts` | ✅ | Monitor partner hierarchy (18 DB ops). |

## Configuration & Feature Management
| Module | Status | Purpose |
|---|---|---|
| `config-actions.ts` | ✅ | App/site config values. |
| `settings-actions.ts` | ✅ | Settings management. |
| `services-config-actions.ts` | 🟡 | Configure external service providers (the VAS provider registry). |
| `provider-actions.ts` | 🟡 | Provider records (thin). |
| `feature-flag-actions.ts` | ✅ | Feature flags (backed by `lib/feature-flags`, `api/feature-flags`). |
| `admin-actions.ts` | ✅ | General admin operations (49 DB ops). |

## Analytics & Operations
| Module | Status | Purpose |
|---|---|---|
| `analytics-actions.ts` | ✅ | Business analytics aggregation (18 DB ops). |
| `ai-analytics-actions.ts` | 🟡 | "AI" analytics/insights (heuristic). |
| `report-actions.ts` | ✅ | Report generation. |
| `performance-actions.ts` | 🟡 | Performance metrics (Web Vitals ingest). |
| `monitoring-actions.ts` | ✅ | System monitoring (with `lib/observability`). |
| `webhook-actions.ts` | ✅ | Outbound webhook subscriptions (with `lib/webhook-delivery`). |
| `api-key-actions.ts` | ✅ | API key issuance/management. |
| `circuit-breaker-actions.ts` | 🟡 | Circuit-breaker toggles (with `lib/circuit-breaker`). |
| `queue-actions.ts` | ✅ | Background job queue control (BullMQ via `lib/queue`). |

## Security, Identity & Account
| Module | Status | Purpose |
|---|---|---|
| `auth-actions.ts` | ✅ | Auth flows (NextAuth-backed). |
| `session-actions.ts` | ✅ | Session listing/revocation. |
| `mfa-actions.ts` | ✅ | Multi-factor auth (with `lib/mfa`). |
| `profile-actions.ts` | ✅ | User profile management. |
| `address-actions.ts` | ✅ | Address book CRUD. |
| `gdpr-actions.ts` | ✅ | GDPR export/delete (26 DB ops; `api/gdpr/*`). |

## Notifications & Support
| Module | Status | Purpose |
|---|---|---|
| `notification-preference-actions.ts` | ✅ | Notification preferences. |
| `push-notification-actions.ts` | 🟡 | Push send — provider/transport stubbed. |
| `message-centre-actions.ts` | ✅ | In-app message centre. |
| `ticket-actions.ts` | ✅ | Support tickets. |
| `support-actions.ts` | ✅ | Support operations. |
| `feedback-actions.ts` | ✅ | User feedback capture. |
| `chat-actions.ts` | ✅ | Live chat (with `lib/live-chat-server`, `useChat`). |
| `page-content-actions.ts` | ✅ | CMS page content. |

## AI & Agents
| Module | Status | Purpose |
|---|---|---|
| `ai-agent-actions.ts` | 🟡 | AI agent orchestration (`api/ai/agents/run`) — LLM provider-dependent. |
| `ai-config-actions.ts` | ✅ | AI feature configuration. |
| `ai-behavior-actions.ts` | ✅ | Behavior tracking inputs for AI. |
| `ai-prediction-actions.ts` | 🟡 | Predictions (heuristic, 26 DB ops for data). |
| `ai-content-actions.ts` | 🟡 | AI content generation — provider-dependent. |
| `ai-voice-actions.ts` | 🟡 | Voice features — provider-dependent. |
| `ai-video-actions.ts` | 🟡 | Video features — provider-dependent (thin). |
| `agent-actions.ts` | ✅ | Agent/affiliate network ops (23 DB ops). |
| `ai-recommendation-actions.ts` | 🟡 | (See commerce doc) product recs. |

> AI core is in `src/lib/ai/*`. Logic/data plumbing is real; actual model inference depends on a configured LLM/provider.

## Specialized Verticals
| Module | Status | Purpose |
|---|---|---|
| `trading-actions.ts` | ✅ | Trading vertical (stocks/crypto) — very DB-heavy (111 ops). External market data feed likely simulated. |
| `exchange-actions.ts` | ✅ | Exchange/market definitions (with `lib/markets`). |
| `streaming-actions.ts` | ✅ | Media streaming vertical (94 DB ops). Real media CDN/DRM not included. |

## Routes
- **Admin (~85 pages)** under `src/app/admin/*` — one per feature above (e.g. `sites`, `roles`, `commission-chains`, `revenue-share`, `feature-flags`, `queue`, `monitoring`, `webhooks`, `api-keys`, `trading`, `streaming`, `ai/*`, `analytics`, `reports`).
- **Verticals storefront:** `/trading` · `/streaming` · `(agent)` · `affiliate` · `supplier` · `b2b` · `business`.
- **API:** `api/ai/*` · `api/admin/*` · `api/feature-flags` · `api/gdpr/*` · `api/trading/sync` · `api/events`.
