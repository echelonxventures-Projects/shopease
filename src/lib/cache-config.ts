/**
 * Cache revalidation times in seconds.
 * Apply per-route using `export const revalidate = N`.
 */

export const CACHE_CONFIG = {
  // Product catalog
  products: 60,
  productDetail: 300,
  categories: 3600,
  brands: 3600,
  home: 60,
  featured: 120,

  // User data (never cached on server)
  cart: 0,
  orders: 0,
  profile: 0,

  // Admin (never cached)
  admin: 0,

  // Checkout (never cached)
  checkout: 0,

  // Static pages
  static: 86400,

  // Banners
  banners: 300,
} as const;

export type CacheKey = keyof typeof CACHE_CONFIG;

export function getRevalidate(key: CacheKey): number {
  return CACHE_CONFIG[key];
}
