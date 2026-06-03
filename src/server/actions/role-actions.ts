"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { validate, vId, vStr } from "@/lib/validate";
import { AVAILABLE_PERMISSIONS } from "@/lib/permissions";

async function requireSuperAdmin() {
  const session = await getSession();
  if (!session || session.user?.role !== "SUPER_ADMIN") throw new Error("Only Super Admin can manage roles");
  return session;
}

// ── CRUD ──

export async function getRoles() {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.role.findMany({ orderBy: { createdAt: "asc" }, include: { _count: { select: { users: true } } } });
}

export async function getRole(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
}

export async function createRole(data: { name: string; displayName: string; description?: string; permissions: string[]; routes: string[] }) {
  await requireSuperAdmin();
  const input = validate(z.object({
    name: z.string().trim().min(1).max(100).regex(/^[a-zA-Z0-9_\-\s]+$/, "Name can only contain letters, numbers, underscores, hyphens"),
    displayName: vStr(200),
    description: z.string().trim().max(500).optional(),
    permissions: z.array(z.string().trim().max(100)).max(200),
    routes: z.array(z.string().trim().max(200).regex(/^\//, "Routes must start with /")).max(50),
  }), data);
  return prisma.role.create({ data: { name: input.name.toLowerCase().replace(/\s+/g, "_"), displayName: input.displayName as string, description: input.description, permissions: input.permissions, routes: input.routes } });
}

export async function updateRole(id: string, data: { displayName?: string; description?: string; permissions?: string[]; routes?: string[] }) {
  await requireSuperAdmin();
  const role = await prisma.role.findUnique({ where: { id } });
  if (role?.isSystem) throw new Error("Cannot modify system roles");
  return prisma.role.update({ where: { id }, data });
}

export async function deleteRole(id: string) {
  await requireSuperAdmin();
  const role = await prisma.role.findUnique({ where: { id }, include: { _count: { select: { users: true } } } });
  if (!role) throw new Error("Role not found");
  if (role.isSystem) throw new Error("Cannot delete system roles");
  if (role._count.users > 0) throw new Error("Cannot delete role with assigned users. Reassign them first.");
  return prisma.role.delete({ where: { id } });
}

export async function assignRoleToUser(userId: string, roleId: string) {
  await requireSuperAdmin();
  const role = await prisma.role.findUnique({ where: { id: roleId } });
  if (!role) throw new Error("Role not found");
  return prisma.user.update({ where: { id: userId }, data: { roleId, role: role.name === "super_admin" ? "SUPER_ADMIN" : role.name === "customer" ? "CUSTOMER" : role.name === "customer_care" ? "CUSTOMER_CARE" : role.name === "support" ? "SUPPORT" : "ADMIN" } });
}

export async function removeRoleFromUser(userId: string) {
  await requireSuperAdmin();
  return prisma.user.update({ where: { id: userId }, data: { roleId: null, role: "CUSTOMER" } });
}

export async function getUsersWithRole(roleId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.user.findMany({ where: { roleId }, select: { id: true, name: true, email: true, role: true } });
}

// ── Seed default system roles ──
export async function seedDefaultRoles() {
  await requireSuperAdmin();
  const defaults = [
    { name: "super_admin", displayName: "Super Admin", description: "Full unrestricted access to all modules and sites", isSystem: true, permissions: [...AVAILABLE_PERMISSIONS], routes: ["/admin", "/support", "/customer-care", "/agent", "/business", "/seller", "/supplier", "/affiliate"] },
    { name: "admin", displayName: "Admin", description: "Site administrator with configurable permissions", isSystem: true, permissions: ["admin.dashboard", "admin.settings", "products.view", "products.create", "products.edit", "orders.view", "orders.edit", "customers.view", "inventory.view", "reports.view", "promotions.view", "sellers.view", "suppliers.view"], routes: ["/admin"] },
    { name: "customer", displayName: "Customer", description: "Regular customer with storefront access", isSystem: true, permissions: [], routes: [] },
    { name: "customer_care", displayName: "Customer Care", description: "Support agent handling tickets and chats", isSystem: true, permissions: ["support.tickets", "support.chat", "orders.view", "customers.view", "finance.refunds"], routes: ["/customer-care"] },
    { name: "support", displayName: "Technical Support", description: "Technical support with system monitoring access", isSystem: true, permissions: ["support.tickets", "system.monitoring", "system.config"], routes: ["/support"] },
    { name: "seller", displayName: "Seller", description: "Marketplace seller managing their own products and orders", isSystem: true, permissions: ["sellers.portal", "sellers.products", "sellers.orders", "sellers.analytics", "sellers.payouts"], routes: ["/seller"] },
    { name: "supplier", displayName: "Supplier", description: "Supplier managing catalog listings, purchase orders, and returns", isSystem: true, permissions: ["suppliers.portal", "suppliers.listings", "suppliers.purchase_orders", "suppliers.returns"], routes: ["/supplier"] },
    { name: "affiliate", displayName: "Affiliate", description: "Affiliate partner managing referral links and earning commissions", isSystem: true, permissions: ["affiliates.links", "affiliates.analytics", "affiliates.commissions", "affiliates.payouts"], routes: ["/affiliate"] },
    { name: "delivery_agent", displayName: "Delivery Agent", description: "Delivery partner accepting and completing deliveries", isSystem: true, permissions: ["delivery.accept", "delivery.pickup", "delivery.complete", "delivery.earnings"], routes: ["/agent"] },
    { name: "warehouse_staff", displayName: "Warehouse Staff", description: "Warehouse picker/packer handling fulfillment", isSystem: true, permissions: ["warehouse.pick", "warehouse.pack", "warehouse.dispatch", "warehouse.receive", "inventory.view"], routes: ["/admin"] },
    { name: "finance_manager", displayName: "Finance Manager", description: "Manages payouts, refunds, wallets, and financial reports", isSystem: true, permissions: ["finance.wallets", "finance.refunds", "finance.payouts", "payments.view", "reports.view", "reports.export", "sellers.payouts", "affiliates.payouts"], routes: ["/admin"] },
    { name: "content_manager", displayName: "Content Manager", description: "Manages banners, pages, FAQ, and promotional content", isSystem: true, permissions: ["content.banners", "content.pages", "content.faq", "promotions.view", "promotions.create", "promotions.edit"], routes: ["/admin"] },
    { name: "catalog_manager", displayName: "Catalog Manager", description: "Manages products, categories, brands, and inventory", isSystem: true, permissions: ["products.view", "products.create", "products.edit", "products.delete", "inventory.view", "inventory.edit"], routes: ["/admin"] },
    { name: "b2b_buyer", displayName: "B2B Buyer", description: "Business buyer with RFQ, bulk orders, and team management", isSystem: true, permissions: ["b2b.view", "b2b.rfq", "b2b.orders", "b2b.team", "b2b.approvals"], routes: ["/business"] },
    { name: "regional_manager", displayName: "Regional Manager", description: "Manages operations for a specific region/zone", isSystem: true, permissions: ["admin.dashboard", "orders.view", "orders.edit", "delivery.view", "delivery.assign", "inventory.view", "reports.view", "warehouse.view"], routes: ["/admin"] },
  ];
  for (const role of defaults) {
    await prisma.role.upsert({ where: { name: role.name }, create: role, update: { displayName: role.displayName, description: role.description, permissions: role.permissions, routes: role.routes } });
  }
  return { success: true, count: defaults.length };
}
