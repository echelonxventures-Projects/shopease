/**
 * Typed cache key builder.
 * All cache keys go through this module for consistency and discoverability.
 *
 * Convention: `domain:entity:identifier`
 */

function buildKey(...parts: (string | number)[]): string {
  return parts.map(String).join(":");
}

export const cacheKeys = {
  // ── Products ──────────────────────────────────────────────────────────────────
  product: (id: string) => buildKey("product", id),
  productList: (page: number, filters?: string) =>
    buildKey("product", "list", String(page), filters || "all"),
  productSlug: (slug: string) => buildKey("product", "slug", slug),
  productVariants: (productId: string) => buildKey("product", productId, "variants"),
  productReviews: (productId: string, page: number) =>
    buildKey("product", productId, "reviews", String(page)),

  // ── Categories ────────────────────────────────────────────────────────────────
  category: (id: string) => buildKey("category", id),
  categoryTree: () => buildKey("category", "tree"),
  categoryProducts: (categoryId: string, page: number) =>
    buildKey("category", categoryId, "products", String(page)),

  // ── Search ────────────────────────────────────────────────────────────────────
  search: (query: string, filters?: string) =>
    buildKey("search", encodeURIComponent(query), filters || "all"),
  searchSuggestions: (prefix: string) => buildKey("search", "suggestions", prefix),
  searchTrending: () => buildKey("search", "trending"),

  // ── Sessions / Users ──────────────────────────────────────────────────────────
  session: (userId: string) => buildKey("session", userId),
  user: (userId: string) => buildKey("user", userId),
  userProfile: (userId: string) => buildKey("user", userId, "profile"),
  userPreferences: (userId: string) => buildKey("user", userId, "preferences"),

  // ── Cart ──────────────────────────────────────────────────────────────────────
  cart: (userId: string) => buildKey("cart", userId),
  cartGuest: (sessionId: string) => buildKey("cart", "guest", sessionId),

  // ── Orders ────────────────────────────────────────────────────────────────────
  order: (orderId: string) => buildKey("order", orderId),
  orderList: (userId: string, page: number) =>
    buildKey("order", "list", userId, String(page)),

  // ── Inventory ─────────────────────────────────────────────────────────────────
  inventory: (productId: string) => buildKey("inventory", productId),
  inventoryBatch: (warehouseId: string) => buildKey("inventory", "batch", warehouseId),

  // ── Pricing ───────────────────────────────────────────────────────────────────
  pricing: (productId: string) => buildKey("pricing", productId),
  surgeMultiplier: (regionId: string) => buildKey("pricing", "surge", regionId),

  // ── Configuration ─────────────────────────────────────────────────────────────
  config: (key: string) => buildKey("config", key),
  featureFlags: () => buildKey("config", "feature_flags"),
  abTests: () => buildKey("config", "ab_tests"),

  // ── Rate Limiting ─────────────────────────────────────────────────────────────
  rateLimit: (action: string, identifier: string) =>
    buildKey("ratelimit", action, identifier),

  // ── Circuit Breaker ───────────────────────────────────────────────────────────
  circuitBreaker: (name: string) => buildKey("circuitbreaker", name),

  // ── Recommendations / AI ──────────────────────────────────────────────────────
  recommendations: (userId: string, type: string) =>
    buildKey("recommendations", userId, type),

  // ── Geocoding ─────────────────────────────────────────────────────────────────
  geocode: (address: string) => buildKey("geocode", encodeURIComponent(address)),
  reverseGeocode: (lat: number, lng: number) =>
    buildKey("geocode", "reverse", String(lat), String(lng)),

  // ── Notifications ─────────────────────────────────────────────────────────────
  notificationCount: (userId: string) => buildKey("notifications", userId, "count"),
} as const;
