"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { UserRole, OrderStatus, Prisma } from "@prisma/client";
import { validate, vId, vStr, vOptStr, vUrl } from "@/lib/validate";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic Prisma result serializer
function serializeProduct(p: any) {
  if (!p) return p;
  return {
    ...p,
    price: typeof p.price?.toNumber === 'function' ? p.price.toNumber() : p.price,
    comparePrice: typeof p.comparePrice?.toNumber === 'function' ? p.comparePrice.toNumber() : p.comparePrice,
    avgRating: typeof p.avgRating?.toNumber === 'function' ? p.avgRating.toNumber() : p.avgRating,
  };
}

export async function getDashboardStats() {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const [totalRevenue, totalOrders, totalCustomers, pendingOrders, lowStockProducts, outOfStockProducts, pendingPOs] = await Promise.all([
    prisma.order.aggregate({
      where: { paymentStatus: "PAID" },
      _sum: { total: true },
    }),
    prisma.order.count(),
    prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { stock: { lte: 5 } } }),
    prisma.inventory.count({ where: { quantity: 0 } }),
    prisma.purchaseOrder.count({ where: { status: { in: ["DRAFT", "SUBMITTED"] } } }),
  ]);

  // Calculate total inventory value
  const inventoryItems = await prisma.inventory.findMany({
    select: { quantity: true, avgCost: true },
  });
  const inventoryValue = inventoryItems.reduce(
    (sum, item) => sum + item.quantity * Number(item.avgCost),
    0,
  );

  return {
    totalRevenue: totalRevenue._sum.total?.toNumber() || 0,
    totalOrders,
    totalCustomers,
    pendingOrders,
    lowStockProducts,
    outOfStockProducts,
    inventoryValue: Math.round(inventoryValue * 100) / 100,
    pendingPurchaseOrders: pendingPOs,
  };
}

export async function getSalesData() {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const orders = await prisma.order.findMany({
    where: { paymentStatus: "PAID" },
    select: { total: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by day
  const dailySales: Record<string, number> = {};
  for (const order of orders) {
    const day = order.createdAt.toISOString().split("T")[0];
    dailySales[day] = (dailySales[day] || 0) + order.total.toNumber();
  }

  return Object.entries(dailySales).map(([date, total]) => ({ date, total }));
}

// Order management
export async function getAllOrders({ page = 1, limit = 20, status }: { page?: number; limit?: number; status?: string }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where = status && status !== "ALL" ? { status: status as OrderStatus } : {};

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: { user: { select: { name: true, email: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.order.count({ where }),
  ]);

  return { orders, total, totalPages: Math.ceil(total / limit) };
}

export async function updateOrderStatus(orderId: string, status: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const input = validate(z.object({
    orderId: vId,
    status: z.enum(["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED", "REFUNDED"]),
  }), { orderId, status });

  await prisma.order.update({
    where: { id: input.orderId },
    data: { status: input.status as OrderStatus },
  });

  await prisma.orderStatusHistory.create({
    data: { orderId: input.orderId, status: input.status as OrderStatus, message: `Status changed to ${input.status}` },
  });

  return { success: true };
}

// Customer management
export async function getAllCustomers({ page = 1, limit = 20 }: { page?: number; limit?: number }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const [customers, total] = await Promise.all([
    prisma.user.findMany({
      where: { role: UserRole.CUSTOMER },
      select: { id: true, name: true, email: true, phone: true, createdAt: true, isBlocked: true, orders: { select: { id: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
  ]);

  return { customers, total, totalPages: Math.ceil(total / limit) };
}

export async function toggleBlockCustomer(userId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  return prisma.user.update({ where: { id: userId }, data: { isBlocked: !user.isBlocked } });
}

// Category management
export async function createCategory(data: { name: string; description?: string; parentId?: string }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const input = validate(z.object({
    name: vStr(200),
    description: vOptStr(2000),
    parentId: z.string().trim().optional().or(z.literal("")),
  }), data);

  const slug = (input.name as string).toLowerCase().replace(/\s+/g, "-");
  return prisma.category.create({ data: { name: input.name as string, description: input.description as string | undefined, parentId: input.parentId || undefined, slug } });
}

export async function updateCategory(id: string, data: { name?: string; description?: string; slug?: string; parentId?: string; position?: number }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.category.delete({ where: { id } });
}

// ===================== PROMO MIGRATION =====================
// Use promo-actions.ts migrateCouponToPromo instead

// Banner management
export async function createBanner(data: { title: string; imageUrl: string; description?: string; link?: string }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const input = validate(z.object({
    title: vStr(200),
    imageUrl: z.string().trim().url().max(2048),
    description: vOptStr(1000),
    link: z.string().trim().max(2048).refine((v) => !v || /^https?:\/\//.test(v) || v.startsWith("/"), "Invalid link").optional().or(z.literal("")),
  }), data);

  const maxPosition = await prisma.banner.aggregate({ _max: { position: true } });
  return prisma.banner.create({ data: { title: input.title as string, imageUrl: input.imageUrl, description: input.description as string | undefined, link: input.link || undefined, position: (maxPosition._max.position || 0) + 1 } });
}

export async function updateBanner(id: string, data: { title?: string; imageUrl?: string; description?: string; link?: string; position?: number; isActive?: boolean }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.banner.update({ where: { id }, data });
}

export async function deleteBanner(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.banner.delete({ where: { id } });
}

export async function getBanners() {
  return prisma.banner.findMany({ where: { isActive: true }, orderBy: { position: "asc" } });
}

// Inventory
export async function getInventory(locationId?: string | null) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.InventoryWhereInput = {};
  if (locationId) where.locationId = locationId;

  const items = await prisma.inventory.findMany({
    where,
    include: { product: true, location: { select: { name: true, code: true, type: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return items.map(item => ({
    id: item.id,
    productId: item.productId,
    locationId: item.locationId,
    quantity: item.quantity,
    lowStock: item.lowStock,
    updatedAt: item.updatedAt.toISOString(),
    product: serializeProduct(item.product),
    location: item.location,
  }));
}

export async function getAllInventory() {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const items = await prisma.inventory.findMany({
    include: { product: true, location: { select: { name: true, code: true, type: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return items.map(item => ({
    id: item.id,
    productId: item.productId,
    locationId: item.locationId,
    quantity: item.quantity,
    lowStock: item.lowStock,
    updatedAt: item.updatedAt.toISOString(),
    product: serializeProduct(item.product),
    location: item.location,
  }));
}

export async function updateStock(productId: string, quantity: number, locationId?: string | null) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const locId = locationId || null;

  // Update product-level stock only when no location is specified
  if (!locId) {
    await prisma.product.update({ where: { id: productId }, data: { stock: quantity } });
  }

  // Find existing inventory record
  const existing = await prisma.inventory.findFirst({
    where: { productId, locationId: locId },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic result accumulator
  let result: any;
  if (existing) {
    result = await prisma.inventory.update({
      where: { id: existing.id },
      data: { quantity },
    });
  } else {
    result = await prisma.inventory.create({
      data: { productId, locationId: locId, quantity },
    });
  }

  // Record the stock movement
  await prisma.stockMovement.create({
    data: {
      productId,
      locationId: locId,
      type: "ADJUSTMENT",
      quantity,
      notes: locId ? `Stock adjusted for location ${locId}` : "Stock adjusted",
    },
  });

  return result;
}

export async function getStockMovements(productId?: string, locationId?: string, limit = 50) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.StockMovementWhereInput = {};
  if (productId) where.productId = productId;
  if (locationId) where.locationId = locationId;

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: { select: { name: true, sku: true } },
      location: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return movements.map((m) => ({
    id: m.id,
    productId: m.productId,
    locationId: m.locationId,
    type: m.type,
    quantity: m.quantity,
    reference: m.reference,
    notes: m.notes,
    createdAt: m.createdAt.toISOString(),
    product: m.product,
    location: m.location,
  }));
}

export async function createStockMovement(data: {
  productId: string;
  locationId?: string | null;
  type: string;
  quantity: number;
  reference?: string;
  notes?: string;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  if (!["IN", "OUT", "TRANSFER", "ADJUSTMENT", "ORDER_FULFILLMENT"].includes(data.type)) {
    throw new Error("Invalid movement type");
  }

  const locId = data.locationId || null;

  // Update inventory quantity
  const inv = await prisma.inventory.findFirst({
    where: { productId: data.productId, locationId: locId },
  });

  const currentQty = inv?.quantity || 0;
  const newQty = currentQty + data.quantity; // positive for IN, negative for OUT

  if (inv) {
    await prisma.inventory.update({
      where: { id: inv.id },
      data: { quantity: newQty },
    });
  } else if (data.quantity > 0) {
    await prisma.inventory.create({
      data: { productId: data.productId, locationId: locId, quantity: newQty },
    });
  }

  // Update product stock (only if no location specified)
  if (!locId) {
    await prisma.product.update({
      where: { id: data.productId },
      data: { stock: newQty },
    });
  }

  return prisma.stockMovement.create({
    data: {
      productId: data.productId,
      locationId: locId,
      type: data.type,
      quantity: data.quantity,
      reference: data.reference || null,
      notes: data.notes || null,
    },
  });
}

// Brand management
export async function getBrands({ page = 1, limit = 20 }: { page?: number; limit?: number } = {}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.brand.count(),
  ]);

  return { brands, total, totalPages: Math.ceil(total / limit) };
}

export async function createBrand(data: { name: string; slug: string; logo?: string; description?: string; isActive?: boolean }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const input = validate(z.object({
    name: vStr(200),
    slug: z.string().trim().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    logo: z.string().trim().url().max(2048).optional().or(z.literal("")),
    description: vOptStr(2000),
    isActive: z.boolean().optional(),
  }), data);
  return prisma.brand.create({ data: { name: input.name as string, slug: input.slug, logo: input.logo || undefined, description: input.description as string | undefined, isActive: input.isActive ?? true } });
}

export async function updateBrand(id: string, data: { name?: string; slug?: string; logo?: string; description?: string; isActive?: boolean }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  validate(z.object({ id: vId }), { id });
  return prisma.brand.update({ where: { id }, data });
}

export async function deleteBrand(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.brand.delete({ where: { id } });
}

// Admin product list with pagination
export async function getAllProducts({ page = 1, limit = 20, search, category, status }: { page?: number; limit?: number; search?: string; category?: string; status?: string }) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.ProductWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
    ];
  }
  if (category) where.categoryId = category;
  if (status === "active") where.isActive = true;
  if (status === "inactive") where.isActive = false;

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true, brand: true },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  const serializeProduct = (p: any) => {
    if (!p) return p;
    return {
      ...p,
      price: typeof p.price?.toNumber === "function" ? p.price.toNumber() : p.price,
      comparePrice: typeof p.comparePrice?.toNumber === "function" ? p.comparePrice.toNumber() : p.comparePrice,
      avgRating: typeof p.avgRating?.toNumber === "function" ? p.avgRating.toNumber() : p.avgRating,
    };
  };

  return { products: products.map(serializeProduct), total, totalPages: Math.ceil(total / limit) };
}

export async function deleteProduct(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  return prisma.product.delete({ where: { id } });
}
