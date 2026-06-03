"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import type { Prisma, InventoryLogType, SupplierIdType } from "@prisma/client";

// ===================== TYPE HELPERS =====================

function serializeDecimal(obj: unknown): unknown {
  if (!obj) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeDecimal(item));
  }
  if (typeof obj === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val && typeof val === "object" && "toNumber" in val) {
        result[key] = (val as { toNumber(): number }).toNumber();
      } else {
        result[key] = serializeDecimal(val);
      }
    }
    return result;
  }
  return obj;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic Prisma result serializer for Decimal/Date fields
function serializeInventory(item: any) {
  return {
    ...item,
    avgCost: typeof item.avgCost?.toNumber === "function" ? item.avgCost.toNumber() : item.avgCost,
    updatedAt: item.updatedAt?.toISOString(),
    product: item.product ? {
      ...item.product,
      price: typeof item.product.price?.toNumber === "function" ? item.product.price.toNumber() : item.product.price,
    } : null,
    supplier: item.supplier || null,
    location: item.location || null,
  };
}

// ===================== ID FORMAT VALIDATION =====================

const ID_FORMATS: Record<string, RegExp> = {
  GSTIN: /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/,
  PAN: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/,
  EIN: /^\d{2}-\d{7}$/,
  VAT: /^[A-Z]{2}\d+$/,
  ABN: /^\d{11}$/,
  SST: /^(\d{6}|\d{12})[A-Z]{3}$/,
  BUSINESS_REG: /^[A-Za-z0-9\/\-]{4,20}$/,
  TAX_ID: /^[A-Za-z0-9\-]{3,20}$/,
  OTHER: /^.{3,50}$/,
};

function generateUniqueId(countryIsoCode?: string): string {
  const code = (countryIsoCode || "XX").toUpperCase().slice(0, 2);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `SUP-${code}-${random}`;
}

// ===================== INVENTORY LOG HELPER =====================

async function logInventoryChange(params: {
  inventoryId: string;
  productId: string;
  supplierId?: string | null;
  locationId?: string | null;
  type: InventoryLogType;
  quantity: number;
  beforeQuantity: number;
  afterQuantity: number;
  referenceId?: string | null;
  referenceType?: string | null;
  reference?: string | null;
  userId?: string | null;
  notes?: string | null;
  tx?: Prisma.TransactionClient;
}) {
  const client = params.tx ?? prisma;
  await client.inventoryLog.create({
    data: {
      inventoryId: params.inventoryId,
      productId: params.productId,
      supplierId: params.supplierId || null,
      locationId: params.locationId || null,
      type: params.type,
      quantity: params.quantity,
      beforeQuantity: params.beforeQuantity,
      afterQuantity: params.afterQuantity,
      referenceId: params.referenceId || null,
      referenceType: params.referenceType || null,
      reference: params.reference || null,
      userId: params.userId || null,
      notes: params.notes || null,
    },
  });
}

// ===================== SUPPLIER CRUD =====================

export async function getSuppliers({ page = 1, limit = 20, search }: { page?: number; limit?: number; search?: string } = {}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.SupplierWhereInput = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { uniqueId: { contains: search, mode: "insensitive" } },
      { contactPerson: { contains: search, mode: "insensitive" } },
    ];
  }

  const [suppliers, total] = await Promise.all([
    prisma.supplier.findMany({
      where,
      include: { _count: { select: { productSuppliers: true, inventoryItems: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supplier.count({ where }),
  ]);

  return {
    suppliers: suppliers.map((s) => serializeDecimal(s)),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getSupplierById(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      _count: { select: { productSuppliers: true, inventoryItems: true } },
      countryLoc: { select: { name: true, code: true } },
      verifiedBy: { select: { id: true, name: true, email: true } },
    },
  });
  return supplier ? serializeDecimal(supplier) : null;
}

export async function validateSupplierId(idType: string, idValue: string) {
  const format = ID_FORMATS[idType];
  if (!format) {
    return { valid: false, message: `Unknown ID type: ${idType}` };
  }
  if (!format.test(idValue.trim().toUpperCase())) {
    const hints: Record<string, string> = {
      GSTIN: "Format: XX XXXXX XXXX X ZX9 (15 chars, e.g. 22AAAAA0000A1Z9)",
      PAN: "Format: AAAAA9999A (10 chars)",
      EIN: "Format: XX-XXXXXXX",
      VAT: "Format: XX followed by digits (e.g. DE123456789)",
      ABN: "11 digits",
      SST: "6 or 12 digits + 3 letters",
      BUSINESS_REG: "4-20 alphanumeric characters",
      TAX_ID: "3-20 alphanumeric characters, hyphens allowed",
    };
    return { valid: false, message: hints[idType] || `Invalid ${idType} format` };
  }
  return { valid: true };
}

export async function createSupplier(data: {
  name: string; code?: string; contactPerson?: string; email?: string; phone?: string;
  address?: string; city?: string; state?: string; country?: string; zipCode?: string;
  gstin?: string; taxId?: string; paymentTerms?: string; notes?: string;
  countryId?: string; stateId?: string;
  idType?: string;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  // Look up country ISO code for uniqueId generation
  let countryIso = "";
  if (data.countryId) {
    const loc = await prisma.location.findUnique({
      where: { id: data.countryId },
      select: { code: true },
    });
    countryIso = loc?.code || "";
  }

  // Generate uniqueId
  const uniqueId = generateUniqueId(countryIso);

  // Validate GSTIN/ID value if provided
  if (data.gstin && data.idType) {
    const validation = await validateSupplierId(data.idType, data.gstin);
    if (!validation.valid) throw new Error(validation.message);
  }

  return prisma.supplier.create({
    data: {
      name: data.name,
      code: data.code || `SUP-${Date.now().toString().slice(-4)}`,
      uniqueId,
      contactPerson: data.contactPerson || null,
      email: data.email || null,
      phone: data.phone || null,
      address: data.address || null,
      city: data.city || null,
      state: data.state || null,
      country: data.country || null,
      zipCode: data.zipCode || null,
      countryId: data.countryId || null,
      stateId: data.stateId || null,
      idType: (data.idType as SupplierIdType) || "TAX_ID",
      gstin: data.gstin || null,
      taxId: data.taxId || null,
      paymentTerms: data.paymentTerms || null,
      notes: data.notes || null,
    },
  });
}

export async function updateSupplier(id: string, data: {
  name?: string; code?: string; contactPerson?: string; email?: string; phone?: string;
  address?: string; city?: string; state?: string; country?: string; zipCode?: string;
  gstin?: string; taxId?: string; paymentTerms?: string; notes?: string;
  countryId?: string; stateId?: string;
  idType?: string;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  // If gstin and idType are provided, validate
  if (data.gstin && data.idType) {
    const validation = await validateSupplierId(data.idType, data.gstin);
    if (!validation.valid) throw new Error(validation.message);
  }

  // Regenerate uniqueId if it's still the default cuid (existing supplier without proper ID)
  const existing = await prisma.supplier.findUnique({ where: { id }, select: { uniqueId: true } });
  const updateData: Record<string, unknown> = { ...data };
  if (existing && existing.uniqueId && !existing.uniqueId.startsWith("SUP-")) {
    let countryIso = "";
    if (data.countryId) {
      const loc = await prisma.location.findUnique({
        where: { id: data.countryId },
        select: { code: true },
      });
      countryIso = loc?.code || "";
    }
    updateData.uniqueId = generateUniqueId(countryIso);
  }

  return prisma.supplier.update({ where: { id }, data: updateData });
}

export async function toggleSupplierActive(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.supplier.update({ where: { id }, data: { isActive } });
}

export async function verifySupplier(id: string, status: "VERIFIED" | "REJECTED", notes?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const supplier = await prisma.supplier.findUnique({ where: { id } });
  if (!supplier) throw new Error("Supplier not found");
  if (supplier.verificationStatus !== "PENDING") throw new Error("Supplier already verified/rejected");

  const userId = session!.user?.id;

  return prisma.supplier.update({
    where: { id },
    data: {
      verificationStatus: status,
      verifiedById: userId,
      verifiedAt: new Date(),
      verificationNotes: notes || null,
    },
  });
}

// ===================== PRODUCT-SUPPLIER MANAGEMENT =====================

export async function assignSupplierToProduct(productId: string, supplierId: string, data: {
  supplierSku?: string; costPrice?: number; leadTimeDays?: number; isPreferred?: boolean;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.productSupplier.upsert({
    where: { productId_supplierId: { productId, supplierId } },
    update: {
      supplierSku: data.supplierSku,
      costPrice: data.costPrice,
      leadTimeDays: data.leadTimeDays,
      isPreferred: data.isPreferred,
    },
    create: {
      productId,
      supplierId,
      supplierSku: data.supplierSku || null,
      costPrice: data.costPrice,
      leadTimeDays: data.leadTimeDays,
      isPreferred: data.isPreferred || false,
    },
  });
}

export async function removeSupplierFromProduct(productId: string, supplierId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.productSupplier.deleteMany({
    where: { productId, supplierId },
  });
}

export async function getProductSuppliers(productId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const items = await prisma.productSupplier.findMany({
    where: { productId, isActive: true },
    include: { supplier: true },
    orderBy: { isPreferred: "desc" },
  });
  return items.map((i) => serializeDecimal(i));
}

export async function getSupplierProducts(supplierId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const items = await prisma.productSupplier.findMany({
    where: { supplierId, isActive: true },
    include: { product: true },
    orderBy: { product: { name: "asc" } },
  });
  return items.map((i) => serializeDecimal(i));
}

// ===================== PURCHASE ORDER MANAGEMENT =====================

export async function createPurchaseOrder(data: {
  supplierId: string; locationId?: string;
  items: { productId: string; quantity: number; unitPrice: number; notes?: string }[];
  expectedDate?: string; notes?: string;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const userId = session!.user?.id as string;

  const poCount = await prisma.purchaseOrder.count();
  const poNumber = `PO-${Date.now().toString().slice(-6)}-${(poCount + 1).toString().padStart(4, "0")}`;

  let subtotal = 0;
  const orderItems = data.items.map((item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    subtotal += itemSubtotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      receivedQuantity: 0,
      unitPrice: item.unitPrice,
      subtotal: itemSubtotal,
      notes: item.notes || null,
    };
  });

  return prisma.purchaseOrder.create({
    data: {
      poNumber,
      supplierId: data.supplierId,
      locationId: data.locationId || null,
      status: "DRAFT",
      subtotal,
      tax: 0,
      total: subtotal,
      expectedDate: data.expectedDate ? new Date(data.expectedDate) : null,
      notes: data.notes || null,
      createdBy: userId,
      items: { create: orderItems },
    },
    include: { items: true, supplier: true },
  });
}

export async function updatePurchaseOrder(id: string, data: {
  expectedDate?: string; notes?: string; tax?: number;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const updateData: Prisma.PurchaseOrderUpdateInput = {
    expectedDate: data.expectedDate ? new Date(data.expectedDate) : undefined,
    notes: data.notes,
    tax: data.tax,
  };

  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!po) throw new Error("Purchase order not found");

  const newSubtotal = po.items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
  const newTax = data.tax ?? Number(po.tax);
  updateData.total = newSubtotal + newTax;

  return prisma.purchaseOrder.update({
    where: { id },
    data: updateData,
    include: { items: true, supplier: true },
  });
}

export async function submitPurchaseOrder(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new Error("Purchase order not found");
  if (po.status !== "DRAFT") throw new Error("Can only submit draft purchase orders");

  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "SUBMITTED" },
  });
}

export async function approvePurchaseOrder(id: string, notes?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const userId = session!.user?.id as string;

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new Error("Purchase order not found");
  if (po.status !== "SUBMITTED") throw new Error("Can only approve submitted purchase orders");

  await prisma.auditLog.create({
    data: {
      userId,
      action: "APPROVE",
      entityType: "PurchaseOrder",
      entityId: id,
      details: { poNumber: po.poNumber, notes: notes || null },
    },
  });

  return prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: userId,
      approvedAt: new Date(),
      approvalNotes: notes || null,
    },
  });
}

export async function rejectPurchaseOrder(id: string, notes: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const userId = session!.user?.id as string;

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new Error("Purchase order not found");
  if (po.status !== "SUBMITTED") throw new Error("Can only reject submitted purchase orders");

  await prisma.auditLog.create({
    data: {
      userId,
      action: "REJECT",
      entityType: "PurchaseOrder",
      entityId: id,
      details: { poNumber: po.poNumber, notes },
    },
  });

  return prisma.purchaseOrder.update({
    where: { id },
    data: {
      status: "CANCELLED",
      approvedById: userId,
      approvedAt: new Date(),
      approvalNotes: `Rejected: ${notes}`,
    },
  });
}

export async function markPurchaseOrderSent(id: string, sentItems?: { productId: string; sentQuantity: number }[]) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const po = await prisma.purchaseOrder.findUnique({ where: { id }, include: { items: true } });
  if (!po) throw new Error("Purchase order not found");
  if (po.status !== "APPROVED") throw new Error("Can only mark approved orders as sent");

  // Update sentQuantity on PO items
  if (sentItems && sentItems.length > 0) {
    for (const item of sentItems) {
      const poItem = po.items.find((i) => i.productId === item.productId);
      if (poItem) {
        await prisma.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { sentQuantity: item.sentQuantity },
        });
      }
    }
  } else {
    // Default: sentQuantity = ordered quantity
    for (const poItem of po.items) {
      await prisma.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { sentQuantity: poItem.quantity },
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: session!.user?.id as string,
      action: "SENT",
      entityType: "PurchaseOrder",
      entityId: id,
      details: { poNumber: po.poNumber },
    },
  });

  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "SENT", sentDate: new Date() },
  });
}

export async function receivePurchaseOrder(id: string, items: { productId: string; quantity: number }[]) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!po) throw new Error("Purchase order not found");
    if (po.status === "CANCELLED") throw new Error("Cannot receive cancelled order");

    let _anyUpdated = false;
    for (const recv of items) {
      if (recv.quantity <= 0) continue;

      // Update PO item received quantity
      const poItem = po.items.find((i) => i.productId === recv.productId);
      if (!poItem) continue;

      const newReceived = poItem.receivedQuantity + recv.quantity;
      await tx.purchaseOrderItem.update({
        where: { id: poItem.id },
        data: { receivedQuantity: newReceived },
      });

      // Create or update inventory record (supplier-specific)
      const inv = await tx.inventory.findFirst({
        where: { productId: recv.productId, supplierId: po.supplierId, locationId: po.locationId },
      });

      if (inv) {
        // Weighted average cost update
        const currentTotal = Number(inv.avgCost) * inv.quantity + Number(poItem.unitPrice) * recv.quantity;
        const newTotalQty = inv.quantity + recv.quantity;
        const beforeQty = inv.quantity;
        await tx.inventory.update({
          where: { id: inv.id },
          data: {
            quantity: newTotalQty,
            avgCost: Math.round((currentTotal / newTotalQty) * 100) / 100,
          },
        });

        // Log inventory change
        await logInventoryChange({
          inventoryId: inv.id,
          productId: recv.productId,
          supplierId: po.supplierId,
          locationId: po.locationId,
          type: "PURCHASE_RECEIPT",
          quantity: recv.quantity,
          beforeQuantity: beforeQty,
          afterQuantity: newTotalQty,
          referenceId: id,
          referenceType: "PURCHASE_ORDER",
          reference: po.poNumber,
          userId: session!.user?.id,
          notes: `Received ${recv.quantity} units from PO ${po.poNumber}`,
          tx,
        });
      } else {
        const newInv = await tx.inventory.create({
          data: {
            productId: recv.productId,
            supplierId: po.supplierId,
            locationId: po.locationId,
            quantity: recv.quantity,
            lowStock: 10,
            avgCost: Number(poItem.unitPrice),
          },
        });

        // Log initial inventory entry
        await logInventoryChange({
          inventoryId: newInv.id,
          productId: recv.productId,
          supplierId: po.supplierId,
          locationId: po.locationId,
          type: "PURCHASE_RECEIPT",
          quantity: recv.quantity,
          beforeQuantity: 0,
          afterQuantity: recv.quantity,
          referenceId: id,
          referenceType: "PURCHASE_ORDER",
          reference: po.poNumber,
          userId: session!.user?.id,
          notes: `Received ${recv.quantity} units from PO ${po.poNumber}`,
          tx,
        });
      }

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          productId: recv.productId,
          supplierId: po.supplierId,
          locationId: po.locationId,
          type: "IN",
          quantity: recv.quantity,
          referenceType: "PURCHASE_ORDER",
          reference: po.poNumber,
          notes: `Received ${recv.quantity} units from PO ${po.poNumber}`,
        },
      });

      _anyUpdated = true;
    }

    // Check if all items fully received
    const updatedPo = await tx.purchaseOrder.findUnique({
      where: { id },
      include: { items: true },
    });

    const allReceived = updatedPo!.items.every((i) => i.receivedQuantity >= i.quantity);
    const partial = updatedPo!.items.some((i) => i.receivedQuantity > 0);

    const newStatus = allReceived ? "RECEIVED" : partial ? "PARTIALLY_RECEIVED" : po.status;

    return tx.purchaseOrder.update({
      where: { id },
      data: {
        status: newStatus,
        receivedDate: allReceived ? new Date() : null,
      },
      include: { items: true, supplier: true },
    });
  });
}

export async function cancelPurchaseOrder(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const po = await prisma.purchaseOrder.findUnique({ where: { id } });
  if (!po) throw new Error("Purchase order not found");
  if (po.status === "RECEIVED") throw new Error("Cannot receive order that has been received");

  return prisma.purchaseOrder.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

export async function getPurchaseOrder(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const po = await prisma.purchaseOrder.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      supplier: true,
      location: true,
    },
  });
  return po ? serializeDecimal(po) : null;
}

export async function getAllPurchaseOrders({ page = 1, limit = 20, status, supplierId }: {
  page?: number; limit?: number; status?: string; supplierId?: string;
} = {}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.PurchaseOrderWhereInput = {};
  if (status && status !== "ALL") where.status = status as Prisma.PurchaseOrderWhereInput["status"];
  if (supplierId) where.supplierId = supplierId;

  const [orders, total] = await Promise.all([
    prisma.purchaseOrder.findMany({
      where,
      include: { supplier: true, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.purchaseOrder.count({ where }),
  ]);

  return {
    orders: orders.map((o) => serializeDecimal(o)),
    total,
    totalPages: Math.ceil(total / limit),
  };
}

// ===================== INVENTORY QUERIES =====================

export async function getAllInventory({ supplierId, locationId }: { supplierId?: string; locationId?: string } = {}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.InventoryWhereInput = {};
  if (supplierId) where.supplierId = supplierId;
  if (locationId) where.locationId = locationId;

  const items = await prisma.inventory.findMany({
    where,
    include: {
      product: true,
      supplier: true,
      location: true,
    },
    orderBy: [{ product: { name: "asc" } }, { supplier: { name: "asc" } }],
  });

  return items.map(serializeInventory);
}

export async function getInventoryBySupplier(supplierId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const items = await prisma.inventory.findMany({
    where: { supplierId },
    include: { product: true, location: true },
    orderBy: { product: { name: "asc" } },
  });

  return items.map(serializeInventory);
}

export async function getStockValuation({ supplierId, locationId }: { supplierId?: string; locationId?: string } = {}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.InventoryWhereInput = {};
  if (supplierId) where.supplierId = supplierId;
  if (locationId) where.locationId = locationId;

  const items = await prisma.inventory.findMany({
    where,
    include: { supplier: true, location: true },
  });

  let totalValue = 0;
  const bySupplier: Record<string, { supplierId: string; supplierName: string; value: number }> = {};
  const byLocation: Record<string, { locationId: string; locationName: string; value: number }> = {};

  for (const item of items) {
    const value = item.quantity * Number(item.avgCost);
    totalValue += value;

    if (item.supplierId) {
      const key = item.supplierId;
      if (!bySupplier[key]) {
        bySupplier[key] = {
          supplierId: item.supplierId,
          supplierName: item.supplier?.name || "Unknown",
          value: 0,
        };
      }
      bySupplier[key].value += value;
    }

    if (item.locationId) {
      const key = item.locationId;
      if (!byLocation[key]) {
        byLocation[key] = {
          locationId: item.locationId,
          locationName: item.location?.name || "Unknown",
          value: 0,
        };
      }
      byLocation[key].value += value;
    }
  }

  return {
    totalValue,
    bySupplier: Object.values(bySupplier).map((s) => ({ ...s, value: Math.round(s.value * 100) / 100 })),
    byLocation: Object.values(byLocation).map((l) => ({ ...l, value: Math.round(l.value * 100) / 100 })),
  };
}

// ===================== STOCK MOVEMENTS (ENHANCED) =====================

export async function getStockMovements(productId?: string, supplierId?: string, locationId?: string, limit = 50) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.StockMovementWhereInput = {};
  if (productId) where.productId = productId;
  if (supplierId) where.supplierId = supplierId;
  if (locationId) where.locationId = locationId;

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      product: { select: { name: true, sku: true } },
      supplier: { select: { name: true } },
      location: { select: { name: true, code: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return movements.map((m) => ({
    id: m.id,
    productId: m.productId,
    supplierId: m.supplierId,
    locationId: m.locationId,
    type: m.type,
    quantity: m.quantity,
    reference: m.reference,
    referenceType: m.referenceType,
    notes: m.notes,
    createdAt: m.createdAt?.toISOString(),
    product: m.product,
    supplier: m.supplier,
    location: m.location,
  }));
}

export async function createStockMovement(data: {
  productId: string; supplierId?: string | null; locationId?: string | null;
  type: string; quantity: number; reference?: string; referenceType?: string; notes?: string;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  if (!["IN", "OUT", "TRANSFER", "ADJUSTMENT", "ORDER_FULFILLMENT", "PURCHASE", "RETURN"].includes(data.type)) {
    throw new Error("Invalid movement type");
  }

  const supId = data.supplierId || null;
  const locId = data.locationId || null;

  // Update inventory quantity
  const inv = await prisma.inventory.findFirst({
    where: { productId: data.productId, supplierId: supId, locationId: locId },
  });

  const currentQty = inv?.quantity || 0;
  const newQty = currentQty + data.quantity;

  if (inv) {
    await prisma.inventory.update({
      where: { id: inv.id },
      data: { quantity: newQty },
    });

    // Log inventory change
    await logInventoryChange({
      inventoryId: inv.id,
      productId: data.productId,
      supplierId: supId,
      locationId: locId,
      type: "ADJUSTMENT",
      quantity: data.quantity,
      beforeQuantity: currentQty,
      afterQuantity: newQty,
      referenceType: data.referenceType || "STOCK_MOVEMENT",
      reference: data.reference,
      userId: session!.user?.id,
      notes: data.notes || undefined,
    });
  } else if (data.quantity > 0) {
    const newInv = await prisma.inventory.create({
      data: {
        productId: data.productId,
        supplierId: supId,
        locationId: locId,
        quantity: newQty,
      },
    });

    await logInventoryChange({
      inventoryId: newInv.id,
      productId: data.productId,
      supplierId: supId,
      locationId: locId,
      type: "ADJUSTMENT",
      quantity: data.quantity,
      beforeQuantity: 0,
      afterQuantity: newQty,
      referenceType: data.referenceType || "STOCK_MOVEMENT",
      reference: data.reference,
      userId: session!.user?.id,
      notes: data.notes || undefined,
    });
  }

  return prisma.stockMovement.create({
    data: {
      productId: data.productId,
      supplierId: supId,
      locationId: locId,
      type: data.type,
      quantity: data.quantity,
      reference: data.reference || null,
      referenceType: data.referenceType || null,
      notes: data.notes || null,
    },
  });
}

// ===================== STOCK ADJUSTMENT (WITH LOG) =====================

export async function adjustStock(inventoryId: string, delta: number, notes?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const inv = await prisma.inventory.findUnique({ where: { id: inventoryId } });
  if (!inv) throw new Error("Inventory record not found");

  const newQty = inv.quantity + delta;
  if (newQty < 0) throw new Error("Cannot reduce stock below zero");

  const beforeQty = inv.quantity;
  await prisma.inventory.update({
    where: { id: inventoryId },
    data: { quantity: newQty },
  });

  // Log the adjustment
  await logInventoryChange({
    inventoryId,
    productId: inv.productId,
    supplierId: inv.supplierId,
    locationId: inv.locationId,
    type: "ADJUSTMENT",
    quantity: delta,
    beforeQuantity: beforeQty,
    afterQuantity: newQty,
    referenceType: "ADJUSTMENT",
    userId: session!.user?.id,
    notes,
  });

  // Also create stock movement
  return prisma.stockMovement.create({
    data: {
      productId: inv.productId,
      supplierId: inv.supplierId,
      locationId: inv.locationId,
      type: "ADJUSTMENT",
      quantity: delta,
      referenceType: "ADJUSTMENT",
      notes: notes || `Stock adjustment: ${delta > 0 ? "+" : ""}${delta}`,
    },
  });
}

// ===================== INVENTORY LOGS =====================

export async function getInventoryLogs({ productId, inventoryId, type, limit = 50 }: {
  productId?: string; inventoryId?: string; type?: string; limit?: number;
} = {}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.InventoryLogWhereInput = {};
  if (productId) where.productId = productId;
  if (inventoryId) where.inventoryId = inventoryId;
  if (type) where.type = type as InventoryLogType;

  const logs = await prisma.inventoryLog.findMany({
    where,
    include: {
      product: { select: { name: true, sku: true } },
      supplier: { select: { name: true } },
      location: { select: { name: true, code: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return logs.map((l) => ({
    id: l.id,
    inventoryId: l.inventoryId,
    productId: l.productId,
    supplierId: l.supplierId,
    locationId: l.locationId,
    type: l.type,
    quantity: l.quantity,
    beforeQuantity: l.beforeQuantity,
    afterQuantity: l.afterQuantity,
    referenceId: l.referenceId,
    referenceType: l.referenceType,
    reference: l.reference,
    userId: l.userId,
    notes: l.notes,
    createdAt: l.createdAt?.toISOString(),
    product: l.product,
    supplier: l.supplier,
    location: l.location,
    user: l.user,
  }));
}

// ===================== SUPPLIER RETURNS =====================

export async function createSupplierReturn(data: {
  purchaseOrderId: string; reason?: string;
  items: { productId: string; quantity: number; notes?: string }[];
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const userId = session!.user?.id as string;

  const po = await prisma.purchaseOrder.findUnique({
    where: { id: data.purchaseOrderId },
    include: { items: true },
  });
  if (!po) throw new Error("Purchase order not found");
  if (po.status !== "RECEIVED" && po.status !== "PARTIALLY_RECEIVED") {
    throw new Error("Can only return from received or partially received orders");
  }

  const retCount = await prisma.supplierReturn.count();
  const returnNumber = `RET-${Date.now().toString().slice(-6)}-${(retCount + 1).toString().padStart(4, "0")}`;

  let _total = 0;
  const returnItems = data.items.map((item) => {
    const poItem = po.items.find((i) => i.productId === item.productId);
    if (!poItem) throw new Error(`Product ${item.productId} not found in PO`);

    // Validate: return quantity cannot exceed (received - already-returned - already-being-returned)
    const returned = poItem.returnQuantity;
    const available = poItem.receivedQuantity - returned;
    if (item.quantity > available) {
      throw new Error(`Cannot return ${item.quantity} — only ${available} available (received: ${poItem.receivedQuantity}, already returned: ${returned})`);
    }

    const subtotal = item.quantity * Number(poItem.unitPrice);
    _total += subtotal;
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: poItem.unitPrice,
      subtotal,
      notes: item.notes || null,
    };
  });

  return prisma.supplierReturn.create({
    data: {
      returnNumber,
      purchaseOrderId: data.purchaseOrderId,
      supplierId: po.supplierId,
      status: "DRAFT",
      reason: data.reason || null,
      createdBy: userId,
      items: { create: returnItems },
    },
    include: { items: { include: { product: true } }, supplier: true },
  });
}

export async function submitSupplierReturn(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const ret = await prisma.supplierReturn.findUnique({ where: { id } });
  if (!ret) throw new Error("Return not found");
  if (ret.status !== "DRAFT") throw new Error("Can only submit draft returns");

  return prisma.supplierReturn.update({
    where: { id },
    data: { status: "SUBMITTED" },
  });
}

export async function approveSupplierReturn(id: string, notes?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const userId = session!.user?.id as string;

  const ret = await prisma.supplierReturn.findUnique({ where: { id } });
  if (!ret) throw new Error("Return not found");
  if (ret.status !== "SUBMITTED") throw new Error("Can only approve submitted returns");

  await prisma.auditLog.create({
    data: { userId, action: "APPROVE", entityType: "SupplierReturn", entityId: id, details: { returnNumber: ret.returnNumber, notes: notes || null } },
  });

  return prisma.supplierReturn.update({
    where: { id },
    data: {
      status: "APPROVED",
      approvedById: userId,
      approvedAt: new Date(),
      approvalNotes: notes || null,
    },
  });
}

export async function rejectSupplierReturn(id: string, notes: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");
  const userId = session!.user?.id as string;

  const ret = await prisma.supplierReturn.findUnique({ where: { id } });
  if (!ret) throw new Error("Return not found");
  if (ret.status !== "SUBMITTED") throw new Error("Can only reject submitted returns");

  await prisma.auditLog.create({
    data: { userId, action: "REJECT", entityType: "SupplierReturn", entityId: id, details: { returnNumber: ret.returnNumber, notes } },
  });

  return prisma.supplierReturn.update({
    where: { id },
    data: {
      status: "REJECTED",
      approvedById: userId,
      approvedAt: new Date(),
      approvalNotes: `Rejected: ${notes}`,
    },
  });
}

export async function shipSupplierReturn(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  return prisma.$transaction(async (tx) => {
    const ret = await tx.supplierReturn.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!ret) throw new Error("Return not found");
    if (ret.status !== "APPROVED") throw new Error("Can only ship approved returns");

    // Deduct returned items from inventory and update PO item returnQuantity
    for (const item of ret.items) {
      const inv = await tx.inventory.findFirst({
        where: { productId: item.productId, supplierId: ret.supplierId, locationId: null },
      });

      const beforeQty = inv?.quantity || 0;
      const newQty = beforeQty - item.quantity;

      if (inv) {
        if (newQty < 0) throw new Error(`Insufficient stock for product ${item.productId} — available: ${beforeQty}`);
        await tx.inventory.update({
          where: { id: inv.id },
          data: { quantity: newQty },
        });

        await logInventoryChange({
          inventoryId: inv.id,
          productId: item.productId,
          supplierId: ret.supplierId,
          locationId: null,
          type: "RETURN",
          quantity: -item.quantity,
          beforeQuantity: beforeQty,
          afterQuantity: newQty,
          referenceId: id,
          referenceType: "SUPPLIER_RETURN",
          reference: ret.returnNumber,
          userId: session!.user?.id,
          notes: `Returned ${item.quantity} units to supplier (Return ${ret.returnNumber})`,
          tx,
        });
      }

      // Update PO item returnQuantity
      const poItem = await tx.purchaseOrderItem.findFirst({
        where: { purchaseOrderId: ret.purchaseOrderId, productId: item.productId },
      });
      if (poItem) {
        await tx.purchaseOrderItem.update({
          where: { id: poItem.id },
          data: { returnQuantity: poItem.returnQuantity + item.quantity },
        });
      }
    }

    await prisma.auditLog.create({
      data: {
        userId: session!.user?.id as string,
        action: "SHIP_RETURN",
        entityType: "SupplierReturn",
        entityId: id,
        details: { returnNumber: ret.returnNumber },
      },
    });

    return prisma.supplierReturn.update({
      where: { id },
      data: { status: "SHIPPED", shippedDate: new Date() },
      include: { items: { include: { product: true } }, supplier: true },
    });
  });
}

export async function completeSupplierReturn(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const ret = await prisma.supplierReturn.findUnique({ where: { id } });
  if (!ret) throw new Error("Return not found");
  if (ret.status !== "SHIPPED") throw new Error("Can only complete shipped returns");

  await prisma.auditLog.create({
    data: {
      userId: session!.user?.id as string,
      action: "COMPLETE_RETURN",
      entityType: "SupplierReturn",
      entityId: id,
      details: { returnNumber: ret.returnNumber },
    },
  });

  return prisma.supplierReturn.update({
    where: { id },
    data: { status: "COMPLETED", receivedBySupplierDate: new Date() },
  });
}

export async function cancelSupplierReturn(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const ret = await prisma.supplierReturn.findUnique({ where: { id } });
  if (!ret) throw new Error("Return not found");
  if (ret.status === "SHIPPED" || ret.status === "COMPLETED") {
    throw new Error("Cannot cancel shipped or completed returns");
  }

  return prisma.supplierReturn.update({
    where: { id },
    data: { status: "CANCELLED" },
  });
}

export async function getSupplierReturn(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const ret = await prisma.supplierReturn.findUnique({
    where: { id },
    include: {
      items: { include: { product: true } },
      supplier: true,
      purchaseOrder: true,
      approvedBy: { select: { name: true, email: true } },
    },
  });
  return ret ? serializeDecimal(ret) : null;
}

export async function getAllSupplierReturns({ status, supplierId, page = 1, limit = 20 }: {
  status?: string; supplierId?: string; page?: number; limit?: number;
} = {}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role)) throw new Error("Unauthorized");

  const where: Prisma.SupplierReturnWhereInput = {};
  if (status && status !== "ALL") where.status = status as Prisma.SupplierReturnWhereInput["status"];
  if (supplierId) where.supplierId = supplierId;

  const [returns, total] = await Promise.all([
    prisma.supplierReturn.findMany({
      where,
      include: { supplier: true, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.supplierReturn.count({ where }),
  ]);

  return {
    returns: returns.map((r) => serializeDecimal(r)),
    total,
    totalPages: Math.ceil(total / limit),
  };
}
