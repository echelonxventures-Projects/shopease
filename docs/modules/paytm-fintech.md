# Domain 3 — Payments & Fintech (Paytm-like)

[← Master Index](./README.md) · Legend: ✅ Real · 🟡 Partial · 🔴 Stub

Wallet, payment gateways, and value-added services (UPI, bills, recharge, BNPL, gold, MF, insurance, tickets). **Wallet & gateway checkout are real; most VAS are provider-pluggable stubs.**

## Wallet & Core Payments
| Module (server action) | Status | Purpose |
|---|---|---|
| `wallet-actions.ts` | ✅ | Wallet balance, ledger, debit/credit, transactions (77 DB ops — fully real). |
| `wallet-kyc-actions.ts` | 🟡 | Wallet KYC tiers — provider-pluggable, no real eKYC. |
| `payment-actions.ts` | ✅* | Order payment orchestration; *requires gateway API keys. |
| `payment-config-actions.ts` | ✅ | Gateway/payment configuration (references Razorpay/Stripe/PayPal). |
| `payment-retry-actions.ts` | 🟡 | Retry failed payments. |
| `saved-payment-actions.ts` | ✅ | Saved cards/methods. |
| `split-payment-actions.ts` | ✅ | Split a payment across methods/parties. |
| `gateway-management-actions.ts` | ✅ | Admin gateway enable/route/manage (21 DB ops). |

### Real gateway integrations (lib)
- `src/lib/payments/providers/razorpay.ts`, `stripe.ts`, `paypal.ts` — real SDK usage.
- Webhooks: `api/razorpay/webhook`, `api/stripe/webhook`, `api/paypal/webhook`.
- `src/lib/razorpay.ts` helper.

## UPI & Merchant
| Module | Status | Purpose |
|---|---|---|
| `upi-actions.ts` | 🟡 | Generates valid `upi://` intent + QR; **no PSP settlement**. UPI mandate writes DB record only. |
| `qr-payment-actions.ts` | 🟡 | QR-based payment flow. |
| `merchant-payment-actions.ts` | 🟡 | Merchant/P2M payments (7 DB ops). |

## Bills, Recharge & Credit (BBPS-style)
| Module | Status | Purpose |
|---|---|---|
| `bill-payment-actions.ts` | 🟡 | Bill pay — debits wallet (real), BBPS provider stubbed. |
| `recharge-actions.ts` | 🟡 | Mobile/DTH recharge — provider stubbed. |
| `bnpl-actions.ts` | 🟡 | Buy-now-pay-later basics. |
| `bnpl-full-actions.ts` | 🟡 | Extended BNPL (limits/EMI) — provider-pluggable. |
| `cashback-actions.ts` | 🟡 | Cashback rules/credit — provider-pluggable. |
| `credit-score-actions.ts` | 🔴 | Credit score — stub/mock. |
| `instant-refund-actions.ts` | 🟡 | Instant refund to wallet — provider-pluggable. |

## Wealth & Services (demo stubs)
| Module | Status | Purpose |
|---|---|---|
| `gold-actions.ts` | 🟡 | Digital gold buy/sell — provider stub, mock prices. |
| `mutual-fund-actions.ts` | 🔴 | MF search/SIP/lumpsum — hardcoded funds, empty portfolio. |
| `insurance-actions.ts` | 🔴 | Insurance plans/purchase — hardcoded plans, fake policy IDs. |
| `movie-booking-actions.ts` | 🔴 | Movie listings/booking — hardcoded data. |
| `travel-actions.ts` | 🔴 | Travel booking — stub. |

## Risk
| Module | Status | Purpose |
|---|---|---|
| `fraud-actions.ts` | 🟡 | Fraud checks — rule-based, not ML risk engine (11 DB ops). |

## To productionize the 🟡 services
Implement real providers behind `getServiceProvider(...)` / `ServicesConfig` in `src/lib/config/services-config.ts` (e.g. a BBPS aggregator for bills/recharge, a PSP for UPI settlement, MF/insurance aggregators). The action layer and wallet ledger already work; only the external connector is missing.

## Routes
- **Storefront:** `/pay` · `/services`.
- **Admin:** `admin/payments` · `admin/payment-config` · `admin/gateways` · `admin/wallets`.
- **API:** `api/razorpay/webhook` · `api/stripe/webhook` · `api/paypal/webhook`.
