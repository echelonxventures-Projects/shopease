# Domain 2 — Quick Commerce (Blinkit / Instamart-like)

[← Master Index](./README.md) · Legend: ✅ Real · 🟡 Partial · 🔴 Stub

Hyperlocal q-grocery & rapid delivery: dark stores, per-store inventory, delivery slots, surge/dynamic pricing, order batching, picking, fleet/rider assignment, geo. Blinkit and Instamart share the **same engine** here.

## Dark Stores & Inventory
| Module (server action) | Status | Purpose |
|---|---|---|
| `dark-store-actions.ts` | ✅ | Dark-store CRUD, store-level config. |
| `hyperlocal-inventory-actions.ts` | 🟡 | Per-store/zone stock view (thin implementation). |
| `inventory-actions.ts` | ✅ | Inventory management — strongest module (83 DB ops): stock, adjustments, movements. |
| `forecast-actions.ts` | 🟡 | Demand forecasting (heuristic, not ML). |
| `replenishment-actions.ts` | 🟡 | Restock suggestions (thin). |
| `smart-reorder-actions.ts` | 🟡 | Auto/smart reorder triggers (thin). |

## Slots, Pricing & Deals
| Module | Status | Purpose |
|---|---|---|
| `slot-actions.ts` | ✅ | Delivery time-slot management/booking. |
| `surge-actions.ts` | ✅ | Surge pricing rules/computation. |
| `surge-display-actions.ts` | 🔴 | Surge banner/display data (mock). |
| `dynamic-pricing-actions.ts` | 🟡 | Dynamic price adjustments (simplified). |
| `lightning-actions.ts` | ✅ | Lightning/express deals. |

## Fulfillment: Batching, Picking, Fleet
| Module | Status | Purpose |
|---|---|---|
| `batch-assignment-actions.ts` | ✅ | Group orders into delivery batches. |
| `picker-actions.ts` | 🟡 | In-store picker/packing workflow (thin). |
| `fleet-actions.ts` | ✅ | Fleet/rider management (16 DB ops). |
| `delivery-actions.ts` | ✅ | Delivery lifecycle, agent assignment (30 DB ops). |
| `delivery-otp-actions.ts` | 🟡 | Delivery OTP verification — provider-pluggable. |

## Grocery & Geo
| Module | Status | Purpose |
|---|---|---|
| `grocery-actions.ts` | ✅ | Grocery storefront/catalog (17 DB ops); powers `/groceries`. |
| `location-actions.ts` | ✅ | Serviceable-area / location resolution (20 DB ops). |
| `location-lookup-actions.ts` | ✅ | Pincode/geo lookup. |

## Real-time tracking (limitation)
- Rider/order location is **persisted** and exposed via API (`api/delivery/track/[assignmentId]`, `api/delivery/live`), but there is **no real-time socket/maps streaming** — tracking is poll/snapshot based. Rated 🟡.

## Instamart vs Blinkit
No Instamart-specific module set exists; both are served by the grocery + dark-store + slot + delivery stack above. Item **substitution on out-of-stock** is only partially covered (via inventory/reorder), not a dedicated swap flow.

## Routes
- **Storefront:** `/groceries`.
- **Admin:** `admin/dark-stores` · `admin/slots` · `admin/fleet` · `admin/delivery-agents` · `admin/delivery-zones` · `admin/surge-pricing` · `admin/dynamic-pricing` · `admin/batch-assignment` · `admin/forecasting` · `admin/inventory`.
- **API:** `api/delivery/track/[assignmentId]` · `api/delivery/live` · `api/location`.
