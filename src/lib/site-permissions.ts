/**
 * Granular permissions for site admins.
 * Master admin (siteId === null) has ALL permissions implicitly.
 * Site admins only have permissions explicitly granted in their SiteAdmin.permissions array.
 * "*" = full access (all permissions).
 * Permissions are hierarchical: parent site can only grant permissions it itself has.
 */

export const SITE_PERMISSIONS = {
  // Products & Catalog
  MANAGE_PRODUCTS: "manage_products",
  MANAGE_CATEGORIES: "manage_categories",
  MANAGE_BRANDS: "manage_brands",
  MANAGE_VARIANTS: "manage_variants",
  MANAGE_INVENTORY: "manage_inventory",

  // Orders & Fulfillment
  MANAGE_ORDERS: "manage_orders",
  MANAGE_RETURNS: "manage_returns",
  MANAGE_SHIPPING: "manage_shipping",

  // Customers
  MANAGE_CUSTOMERS: "manage_customers",
  MANAGE_REVIEWS: "manage_reviews",

  // Marketing & Promotions
  MANAGE_PROMOS: "manage_promos",
  MANAGE_BANNERS: "manage_banners",
  MANAGE_COUPONS: "manage_coupons",

  // Payments & Finance
  MANAGE_PAYMENTS: "manage_payments",
  MANAGE_PRICING: "manage_pricing",
  MANAGE_TAX: "manage_tax",
  VIEW_ANALYTICS: "view_analytics",

  // Site Configuration
  MANAGE_SITE_SETTINGS: "manage_site_settings",
  MANAGE_SITE_BRANDING: "manage_site_branding",
  MANAGE_SITE_DOMAINS: "manage_site_domains",
  MANAGE_SITE_PAGES: "manage_site_pages",
  MANAGE_SITE_MENUS: "manage_site_menus",

  // Advanced
  MANAGE_USERS: "manage_users",
  MANAGE_ROLES: "manage_roles",
  MANAGE_WEBHOOKS: "manage_webhooks",
  MANAGE_API_KEYS: "manage_api_keys",
  MANAGE_INTEGRATIONS: "manage_integrations",

  // ── Platform Modules ───────────────────────────────────────────────────────
  // Each platform module has its own set of permissions
  MANAGE_STREAMING: "manage_streaming",
  MANAGE_STREAMING_CONTENT: "manage_streaming_content",
  MANAGE_STREAMING_PLANS: "manage_streaming_plans",
  MANAGE_STREAMING_SUBSCRIBERS: "manage_streaming_subscribers",

  MANAGE_TRADING: "manage_trading",
  MANAGE_TRADING_INSTRUMENTS: "manage_trading_instruments",
  MANAGE_TRADING_ORDERS: "manage_trading_orders",
  MANAGE_TRADING_PORTFOLIOS: "manage_trading_portfolios",

  MANAGE_ECOMMERCE: "manage_ecommerce",

  // ── Reselling & Sub-Site Management ────────────────────────────────────────
  MANAGE_RESELLING: "manage_reselling",
  CREATE_CHILD_SITES: "create_child_sites",
  MANAGE_CHILD_SITES: "manage_child_sites",
  MANAGE_SITE_PLANS: "manage_site_plans",
  GRANT_PERMISSIONS: "grant_permissions",  // Can grant permissions to child site admins

  // ── Full Access Wildcard ───────────────────────────────────────────────────
  FULL_ACCESS: "*",
} as const;

export type SitePermission = (typeof SITE_PERMISSIONS)[keyof typeof SITE_PERMISSIONS];

/** All available permissions as an array (for "grant all") */
export const ALL_PERMISSIONS: SitePermission[] = Object.values(SITE_PERMISSIONS).filter((p) => p !== "*");

/** Check if a permission array grants a specific permission */
export function permissionGranted(granted: string[], required: string): boolean {
  if (granted.includes("*")) return true;
  return granted.includes(required);
}

/** Permission groups for UI display */
export const PERMISSION_GROUPS = [
  {
    label: "Products & Catalog",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_PRODUCTS, label: "Manage Products" },
      { key: SITE_PERMISSIONS.MANAGE_CATEGORIES, label: "Manage Categories" },
      { key: SITE_PERMISSIONS.MANAGE_BRANDS, label: "Manage Brands" },
      { key: SITE_PERMISSIONS.MANAGE_VARIANTS, label: "Manage Variants" },
      { key: SITE_PERMISSIONS.MANAGE_INVENTORY, label: "Manage Inventory" },
    ],
  },
  {
    label: "Orders & Fulfillment",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_ORDERS, label: "Manage Orders" },
      { key: SITE_PERMISSIONS.MANAGE_RETURNS, label: "Manage Returns" },
      { key: SITE_PERMISSIONS.MANAGE_SHIPPING, label: "Manage Shipping" },
    ],
  },
  {
    label: "Customers",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_CUSTOMERS, label: "Manage Customers" },
      { key: SITE_PERMISSIONS.MANAGE_REVIEWS, label: "Manage Reviews" },
    ],
  },
  {
    label: "Marketing & Promotions",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_PROMOS, label: "Manage Promotions" },
      { key: SITE_PERMISSIONS.MANAGE_BANNERS, label: "Manage Banners" },
      { key: SITE_PERMISSIONS.MANAGE_COUPONS, label: "Manage Coupons" },
    ],
  },
  {
    label: "Payments & Finance",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_PAYMENTS, label: "Manage Payments" },
      { key: SITE_PERMISSIONS.MANAGE_PRICING, label: "Manage Pricing" },
      { key: SITE_PERMISSIONS.MANAGE_TAX, label: "Manage Tax Rules" },
      { key: SITE_PERMISSIONS.VIEW_ANALYTICS, label: "View Analytics" },
    ],
  },
  {
    label: "Site Configuration",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_SITE_SETTINGS, label: "Site Settings" },
      { key: SITE_PERMISSIONS.MANAGE_SITE_BRANDING, label: "Site Branding" },
      { key: SITE_PERMISSIONS.MANAGE_SITE_DOMAINS, label: "Site Domains" },
      { key: SITE_PERMISSIONS.MANAGE_SITE_PAGES, label: "Site Pages" },
      { key: SITE_PERMISSIONS.MANAGE_SITE_MENUS, label: "Site Menus" },
    ],
  },
  {
    label: "Streaming Platform",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_STREAMING, label: "Full Streaming Access" },
      { key: SITE_PERMISSIONS.MANAGE_STREAMING_CONTENT, label: "Manage Content" },
      { key: SITE_PERMISSIONS.MANAGE_STREAMING_PLANS, label: "Manage Plans" },
      { key: SITE_PERMISSIONS.MANAGE_STREAMING_SUBSCRIBERS, label: "Manage Subscribers" },
    ],
  },
  {
    label: "Trading Platform",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_TRADING, label: "Full Trading Access" },
      { key: SITE_PERMISSIONS.MANAGE_TRADING_INSTRUMENTS, label: "Manage Instruments" },
      { key: SITE_PERMISSIONS.MANAGE_TRADING_ORDERS, label: "Manage Orders" },
      { key: SITE_PERMISSIONS.MANAGE_TRADING_PORTFOLIOS, label: "Manage Portfolios" },
    ],
  },
  {
    label: "E-Commerce Platform",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_ECOMMERCE, label: "Full E-Commerce Access" },
    ],
  },
  {
    label: "Reselling & Sub-Sites",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_RESELLING, label: "Manage Reselling" },
      { key: SITE_PERMISSIONS.CREATE_CHILD_SITES, label: "Create Child Sites" },
      { key: SITE_PERMISSIONS.MANAGE_CHILD_SITES, label: "Manage Child Sites" },
      { key: SITE_PERMISSIONS.MANAGE_SITE_PLANS, label: "Manage Site Plans" },
      { key: SITE_PERMISSIONS.GRANT_PERMISSIONS, label: "Grant Permissions to Others" },
    ],
  },
  {
    label: "Advanced",
    permissions: [
      { key: SITE_PERMISSIONS.MANAGE_USERS, label: "Manage Users" },
      { key: SITE_PERMISSIONS.MANAGE_ROLES, label: "Manage Roles" },
      { key: SITE_PERMISSIONS.MANAGE_WEBHOOKS, label: "Manage Webhooks" },
      { key: SITE_PERMISSIONS.MANAGE_API_KEYS, label: "Manage API Keys" },
      { key: SITE_PERMISSIONS.MANAGE_INTEGRATIONS, label: "Manage Integrations" },
      { key: SITE_PERMISSIONS.FULL_ACCESS, label: "⚡ Full Access (All Permissions)" },
    ],
  },
];
