/** Catalog of permissions assignable to roles. Plain module (importable by client + server). */
export const AVAILABLE_PERMISSIONS = [
  // Admin
  "admin.dashboard", "admin.settings",
  // Products
  "products.view", "products.create", "products.edit", "products.delete",
  // Orders
  "orders.view", "orders.edit", "orders.cancel", "orders.refund",
  // Customers
  "customers.view", "customers.edit", "customers.block",
  // Inventory
  "inventory.view", "inventory.edit", "inventory.purchase_orders",
  // Suppliers
  "suppliers.view", "suppliers.manage", "suppliers.portal", "suppliers.listings", "suppliers.purchase_orders", "suppliers.returns",
  // Sellers
  "sellers.view", "sellers.approve", "sellers.payouts", "sellers.portal", "sellers.products", "sellers.orders", "sellers.analytics",
  // Affiliates
  "affiliates.view", "affiliates.manage", "affiliates.commissions", "affiliates.links", "affiliates.analytics", "affiliates.payouts",
  // Promotions
  "promotions.view", "promotions.create", "promotions.edit", "promotions.delete",
  // Payments
  "payments.view", "payments.configure",
  // Shipping
  "shipping.view", "shipping.configure",
  // Delivery
  "delivery.view", "delivery.assign", "delivery.agents", "delivery.accept", "delivery.pickup", "delivery.complete", "delivery.earnings",
  // Warehouse
  "warehouse.view", "warehouse.pick", "warehouse.pack", "warehouse.dispatch", "warehouse.receive", "warehouse.audit",
  // Sites
  "sites.view", "sites.create", "sites.edit", "sites.delete",
  // Reports
  "reports.view", "reports.export",
  // Support
  "support.tickets", "support.chat",
  // Finance
  "finance.wallets", "finance.refunds", "finance.payouts",
  // Content
  "content.banners", "content.pages", "content.faq",
  // B2B
  "b2b.view", "b2b.rfq", "b2b.orders", "b2b.team", "b2b.approvals",
  // System
  "system.roles", "system.users", "system.config", "system.monitoring",
] as const;

export type Permission = (typeof AVAILABLE_PERMISSIONS)[number];
