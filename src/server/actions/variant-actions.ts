"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DiscountType } from "@prisma/client";

// ===================== OPTION TYPE CRUD =====================

export async function createOptionType(productId: string, data: {
  name: string;
  label?: string;
  sortOrder?: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Enable hasVariants on the product
  await prisma.product.update({
    where: { id: productId },
    data: { hasVariants: true },
  });

  return prisma.productOptionType.create({
    data: {
      productId,
      name: data.name,
      label: data.label,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateOptionType(id: string, data: {
  name?: string;
  label?: string;
  sortOrder?: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.productOptionType.update({ where: { id }, data });
}

export async function deleteOptionType(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.productOptionType.delete({ where: { id } });
}

export async function getOptionTypes(productId: string) {
  return prisma.productOptionType.findMany({
    where: { productId },
    include: { values: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });
}

// ===================== OPTION VALUE CRUD =====================

export async function createOptionValue(optionTypeId: string, data: {
  value: string;
  hexColor?: string;
  image?: string;
  sortOrder?: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.productOptionValue.create({
    data: {
      optionTypeId,
      value: data.value,
      hexColor: data.hexColor,
      image: data.image,
      sortOrder: data.sortOrder ?? 0,
    },
  });
}

export async function updateOptionValue(id: string, data: {
  value?: string;
  hexColor?: string | null;
  image?: string | null;
  sortOrder?: number;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.productOptionValue.update({ where: { id }, data });
}

export async function deleteOptionValue(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.productOptionValue.delete({ where: { id } });
}

// ===================== VARIANT GENERATION =====================

export async function generateVariants(productId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const optionTypes = await prisma.productOptionType.findMany({
    where: { productId },
    include: { values: { orderBy: { sortOrder: "asc" } } },
    orderBy: { sortOrder: "asc" },
  });

  if (optionTypes.length === 0) throw new Error("No option types defined");

  const allValues = optionTypes.map((ot) => ot.values);

  // Cartesian product
  const combinations: { valueId: string }[][] = allValues.reduce(
    (acc, vals) =>
      acc.flatMap((combo) => vals.map((v) => [...combo, { valueId: v.id }])),
    [[] as { valueId: string }[]]
  );

  // Delete existing variants
  await prisma.productVariant.deleteMany({ where: { productId } });

  // Create variants
  const created: any[] = [];
  for (const combo of combinations) {
    const variant = await prisma.productVariant.create({
      data: {
        productId,
        price: 0,
        stock: 0,
        images: [],
        options: {
          create: combo.map((c) => ({ optionValueId: c.valueId })),
        },
      },
    });
    created.push(variant);
  }

  return { count: created.length, variants: created };
}

// ===================== VARIANT CRUD =====================

export async function upsertVariant(data: {
  id?: string;
  productId: string;
  sku?: string;
  price: number;
  comparePrice?: number;
  discountType?: DiscountType;
  discountValue?: number;
  stock: number;
  weight?: string;
  images?: string[];
  isActive?: boolean;
}) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  if (data.id) {
    return prisma.productVariant.update({
      where: { id: data.id },
      data: {
        sku: data.sku,
        price: data.price,
        comparePrice: data.comparePrice,
        discountType: data.discountType,
        discountValue: data.discountValue,
        stock: data.stock,
        weight: data.weight,
        images: data.images,
        isActive: data.isActive,
      },
    });
  }

  return prisma.productVariant.create({
    data: {
      productId: data.productId,
      sku: data.sku,
      price: data.price,
      comparePrice: data.comparePrice,
      discountType: data.discountType,
      discountValue: data.discountValue,
      stock: data.stock,
      weight: data.weight,
      images: data.images || [],
      isActive: data.isActive ?? true,
    },
  });
}

export async function deleteVariant(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.productVariant.delete({ where: { id } });
}

export async function getVariant(id: string) {
  return prisma.productVariant.findUnique({
    where: { id },
    include: {
      options: {
        include: { optionValue: { include: { optionType: true } } },
      },
    },
  });
}

export async function getVariantsForProduct(productId: string) {
  return prisma.productVariant.findMany({
    where: { productId },
    include: {
      options: {
        include: { optionValue: { include: { optionType: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });
}

export async function getVariantBySku(productId: string, sku: string) {
  return prisma.productVariant.findFirst({
    where: { productId, sku },
    include: {
      options: {
        include: { optionValue: { include: { optionType: true } } },
      },
    },
  });
}

// ===================== STOREFRONT QUERIES =====================

export async function getVariantOptions(productId: string) {
  const optionTypes = await prisma.productOptionType.findMany({
    where: { productId },
    include: {
      values: {
        include: {
          variants: {
            include: { variant: { select: { id: true, stock: true, isActive: true } } },
          },
        },
        orderBy: { sortOrder: "asc" },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  // Flatten variant options for frontend use
  return optionTypes.map((ot) => ({
    id: ot.id,
    name: ot.name,
    label: ot.label,
    values: ot.values.map((v) => ({
      id: v.id,
      value: v.value,
      hexColor: v.hexColor,
      image: v.image,
      inStock: v.variants.some((vw) => vw.variant.stock > 0 && vw.variant.isActive),
    })),
  }));
}

export async function getVariantById(id: string) {
  const variant = await prisma.productVariant.findUnique({
    where: { id },
    include: {
      options: {
        include: { optionValue: { include: { optionType: true } } },
      },
    },
  });

  if (!variant) return null;

  return {
    id: variant.id,
    sku: variant.sku,
    price: Number(variant.price),
    comparePrice: variant.comparePrice ? Number(variant.comparePrice) : null,
    discountType: variant.discountType,
    discountValue: variant.discountValue ? Number(variant.discountValue) : null,
    stock: variant.stock,
    weight: variant.weight,
    images: variant.images,
    isActive: variant.isActive,
    options: variant.options.map((o) => ({
      optionName: o.optionValue.optionType.name,
      value: o.optionValue.value,
      hexColor: o.optionValue.hexColor,
    })),
    optionLabel: variant.options
      .map((o) => o.optionValue.value)
      .join(" · "),
  };
}

export async function findVariantByOptions(productId: string, valueIds: string[]) {
  // Find variant that has exactly the given option values
  const variants = await prisma.productVariant.findMany({
    where: { productId, isActive: true },
    include: { options: { select: { optionValueId: true } } },
  });

  const targetSet = new Set(valueIds);
  return variants.find((v) => {
    const vSet = new Set(v.options.map((o) => o.optionValueId));
    return targetSet.size === vSet.size && [...targetSet].every((id) => vSet.has(id));
  }) ?? null;
}

// ===================== BULK OPERATIONS =====================

export async function bulkUpdateVariants(
  variantIds: string[],
  fields: {
    price?: number;
    stock?: number;
    isActive?: boolean;
    discountType?: DiscountType;
    discountValue?: number;
    weight?: string;
    sku?: string;
    comparePrice?: number;
  },
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const cleanFields: any = {};
  if (fields.price !== undefined) cleanFields.price = fields.price;
  if (fields.stock !== undefined) cleanFields.stock = fields.stock;
  if (fields.isActive !== undefined) cleanFields.isActive = fields.isActive;
  if (fields.discountType !== undefined) cleanFields.discountType = fields.discountType;
  if (fields.discountValue !== undefined) cleanFields.discountValue = fields.discountValue;
  if (fields.weight !== undefined) cleanFields.weight = fields.weight;
  if (fields.sku !== undefined) cleanFields.sku = fields.sku;
  if (fields.comparePrice !== undefined) cleanFields.comparePrice = fields.comparePrice;

  return prisma.productVariant.updateMany({
    where: { id: { in: variantIds } },
    data: cleanFields,
  });
}

export async function bulkUpdateVariantPrices(
  variantIds: string[],
  operation: "add" | "subtract" | "multiply" | "set",
  value: number,
) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const variants = await prisma.productVariant.findMany({
    where: { id: { in: variantIds } },
    select: { id: true, price: true },
  });

  return prisma.$transaction(
    variants.map((v) => {
      let newPrice: number;
      const current = Number(v.price);
      switch (operation) {
        case "add": newPrice = current + value; break;
        case "subtract": newPrice = current - value; break;
        case "multiply": newPrice = current * value; break;
        case "set": newPrice = value; break;
        default: newPrice = current;
      }
      return prisma.productVariant.update({
        where: { id: v.id },
        data: { price: newPrice },
      });
    }),
  );
}

// ===================== SKU GENERATION =====================

export async function autoGenerateSKUs(productId: string, pattern: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { name: true, sku: true },
  });
  if (!product) throw new Error("Product not found");

  const baseSku = (product.sku || product.name).replace(/[^a-zA-Z0-9]/g, "-").toUpperCase();

  const variants = await prisma.productVariant.findMany({
    where: { productId },
    include: {
      options: {
        include: { optionValue: { include: { optionType: true } } },
      },
    },
  });

  return prisma.$transaction(
    variants.map((v) => {
      const optionsMap: Record<string, string> = {};
      for (const opt of v.options) {
        const key = opt.optionValue.optionType.name.toLowerCase();
        optionsMap[key] = opt.optionValue.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
        // Also store the original value
        optionsMap[`${key}_raw`] = opt.optionValue.value.replace(/[^a-zA-Z0-9]/g, "");
      }

      let sku = pattern
        .replace("{base}", baseSku)
        .replace("{productId}", productId.slice(-4).toUpperCase());

      for (const [key, val] of Object.entries(optionsMap)) {
        sku = sku.replace(new RegExp(`{${key}}`, "gi"), val);
      }

      return prisma.productVariant.update({
        where: { id: v.id },
        data: { sku },
      });
    }),
  ).then(() => ({ count: variants.length }));
}

// ===================== IMAGE ASSIGNMENT =====================

export async function setVariantImages(variantId: string, images: string[]) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.productVariant.update({
    where: { id: variantId },
    data: { images },
  });
}

// ===================== DEFAULT VARIANT =====================

export async function setDefaultVariant(variantId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant) throw new Error("Variant not found");

  return prisma.$transaction([
    prisma.productVariant.updateMany({
      where: { productId: variant.productId },
      data: { isDefault: false },
    }),
    prisma.productVariant.update({
      where: { id: variantId },
      data: { isDefault: true },
    }),
  ]);
}

// ===================== BULK DELETE =====================

export async function bulkDeleteVariants(variantIds: string[]) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.productVariant.deleteMany({
    where: { id: { in: variantIds } },
  });
}

// ===================== DUPLICATE VARIANT =====================

export async function duplicateVariant(variantId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: { options: { include: { optionValue: true } } },
  });
  if (!variant) throw new Error("Variant not found");

  const newVariant = await prisma.productVariant.create({
    data: {
      productId: variant.productId,
      sku: `${variant.sku}-COPY`,
      price: variant.price,
      comparePrice: variant.comparePrice,
      discountType: variant.discountType,
      discountValue: variant.discountValue,
      stock: variant.stock,
      weight: variant.weight,
      images: variant.images,
      barcodes: variant.barcodes,
      options: {
        create: variant.options.map((o) => ({
          optionValueId: o.optionValueId,
        })),
      },
    },
  });

  return newVariant;
}

// ===================== BULK ADD OPTION VALUES =====================

export async function bulkAddOptionValues(optionTypeId: string, values: { value: string; hexColor?: string }[]) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const existingCount = await prisma.productOptionValue.count({ where: { optionTypeId } });

  return prisma.productOptionValue.createMany({
    data: values.map((v, i) => ({
      optionTypeId,
      value: v.value,
      hexColor: v.hexColor,
      sortOrder: existingCount + i,
    })),
  });
}

// ===================== REORDER OPTION VALUES =====================

export async function reorderOptionValues(valueIds: string[]) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.$transaction(
    valueIds.map((id, i) =>
      prisma.productOptionValue.update({
        where: { id },
        data: { sortOrder: i },
      }),
    ),
  );
}

// ===================== VARIANT FILTERING =====================

export async function getVariantsWithFilters(
  productId: string,
  filters?: {
    search?: string;
    optionValueId?: string;
    status?: "active" | "inactive" | "out-of-stock";
    sortBy?: "price" | "stock" | "sku" | "createdAt";
    sortOrder?: "asc" | "desc";
    page?: number;
    pageSize?: number;
  },
) {
  const where: any = { productId };

  if (filters?.search) {
    where.OR = [
      { sku: { contains: filters.search, mode: "insensitive" } },
      { barcodes: { has: filters.search } },
    ];
  }

  if (filters?.status) {
    if (filters.status === "active") where.isActive = true;
    if (filters.status === "inactive") where.isActive = false;
    if (filters.status === "out-of-stock") where.stock = 0;
  }

  if (filters?.optionValueId) {
    where.options = { some: { optionValueId: filters.optionValueId } };
  }

  const orderBy: any = {};
  if (filters?.sortBy) {
    orderBy[filters.sortBy] = filters.sortOrder || "asc";
  } else {
    orderBy.createdAt = "asc";
  }

  const page = filters?.page || 1;
  const pageSize = filters?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  const [variants, total] = await Promise.all([
    prisma.productVariant.findMany({
      where,
      include: {
        options: {
          include: { optionValue: { include: { optionType: true } } },
        },
      },
      orderBy,
      skip,
      take: pageSize,
    }),
    prisma.productVariant.count({ where }),
  ]);

  return { variants, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// ===================== CSV IMPORT/EXPORT =====================

export async function exportVariantsCSV(productId: string) {
  const variants = await prisma.productVariant.findMany({
    where: { productId },
    include: {
      options: {
        include: { optionValue: { include: { optionType: true } } },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const optionTypes = await prisma.productOptionType.findMany({
    where: { productId },
    orderBy: { sortOrder: "asc" },
  });

  // Build header
  const headers = ["id", "sku", "price", "comparePrice", "stock", "isActive", "isDefault", "discountType", "discountValue", "weight", "images", "barcodes", ...optionTypes.map((ot) => ot.name)];
  const rows = [headers.join(",")];

  for (const v of variants) {
    const optionMap: Record<string, string> = {};
    for (const opt of v.options) {
      optionMap[opt.optionValue.optionType.name] = opt.optionValue.value;
    }

    const row = [
      v.id,
      v.sku || "",
      String(v.price),
      v.comparePrice ? String(v.comparePrice) : "",
      String(v.stock),
      String(v.isActive),
      String(v.isDefault),
      v.discountType,
      v.discountValue ? String(v.discountValue) : "",
      v.weight || "",
      (v.images || []).join(";"),
      (v.barcodes || []).join(";"),
      ...optionTypes.map((ot) => optionMap[ot.name] || ""),
    ];
    rows.push(row.map((r) => `"${String(r).replace(/"/g, '""')}"`).join(","));
  }

  return { csv: rows.join("\n"), filename: `variants-${productId.slice(-6)}.csv` };
}

export async function importVariantsCSV(productId: string, csvContent: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) throw new Error("CSV must have header and at least one data row");

  const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
  const optionTypeColumns = headers.filter(
    (h) => !["id", "sku", "price", "comparePrice", "stock", "isActive", "isDefault", "discountType", "discountValue", "weight", "images", "barcodes"].includes(h),
  );

  const optionTypes = await prisma.productOptionType.findMany({
    where: { productId },
    include: { values: true },
  });

  const results: { success: number; errors: string[] } = { success: 0, errors: [] };

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = lines[i].split(",").map((v) => v.replace(/"/g, "").trim());
      const row: Record<string, string> = {};
      headers.forEach((h, idx) => { row[h] = values[idx] || ""; });

      // Find or create variant by ID
      const variantId = row.id;
      if (variantId) {
        const existing = await prisma.productVariant.findUnique({ where: { id: variantId } });
        if (existing) {
          // Update existing variant
          const updateData: any = {};
          if (row.sku) updateData.sku = row.sku;
          if (row.price) updateData.price = parseFloat(row.price);
          if (row.comparePrice) updateData.comparePrice = parseFloat(row.comparePrice);
          if (row.stock) updateData.stock = parseInt(row.stock);
          if (row.isActive) updateData.isActive = row.isActive === "true";
          if (row.isDefault) updateData.isDefault = row.isDefault === "true";
          if (row.discountType && row.discountType !== "NONE") updateData.discountType = row.discountType as DiscountType;
          if (row.discountValue) updateData.discountValue = parseFloat(row.discountValue);
          if (row.weight) updateData.weight = row.weight;
          if (row.images) updateData.images = row.images.split(";");

          await prisma.productVariant.update({
            where: { id: variantId },
            data: updateData,
          });
          results.success++;
        } else {
          results.errors.push(`Row ${i + 1}: Variant ${variantId} not found`);
        }
      }
    } catch {
      results.errors.push(`Row ${i + 1}: Failed to parse`);
    }
  }

  return results;
}
