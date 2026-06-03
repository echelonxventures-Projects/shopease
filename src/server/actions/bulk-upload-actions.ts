"use server";

import { getSession, isAdminRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import {
  parseAndValidateCSV,
  generateProductCSVTemplate,
  type CSVParseResult,
} from "@/lib/bulk-upload/csv-parser";


interface SessionWithUser { user: { id: string; role: string; email?: string; name?: string } }

// ===================== BULK UPLOAD HISTORY (in-memory) =====================

interface BulkUploadRecord {
  id: string;
  fileName: string;
  totalRows: number;
  validRows: number;
  errorRows: number;
  status: "completed" | "partial" | "failed";
  uploadedBy: string;
  uploadedAt: string;
}

const uploadHistory: BulkUploadRecord[] = [];
const MAX_HISTORY = 100;

// ===================== PARSE BULK UPLOAD =====================

export async function parseBulkUpload(csvContent: string): Promise<CSVParseResult | { error: string }> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!csvContent || csvContent.trim().length === 0) {
    return { error: "CSV content is empty" };
  }

  try {
    const result = parseAndValidateCSV(csvContent);
    logger.info(
      { totalRows: result.totalRows, validRows: result.validRows, errors: result.errors.length },
      "CSV parsed and validated"
    );
    return result;
  } catch (error) {
    logger.error({ error }, "Failed to parse CSV");
    return { error: "Failed to parse CSV file" };
  }
}

// ===================== PROCESS BULK UPLOAD =====================

export async function processBulkUpload(
  parsedData: CSVParseResult
): Promise<{ success: number; failed: number; errors: string[] } | { error: string }> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  if (!parsedData.rows || parsedData.rows.length === 0) {
    return { error: "No rows to process" };
  }

  // Determine which rows have errors
  const errorRows = new Set(parsedData.errors.map((e) => e.row));

  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (let i = 0; i < parsedData.rows.length; i++) {
    const row = parsedData.rows[i];
    const rowNumber = i + 2; // +2 for 0-indexed + header row

    if (errorRows.has(rowNumber)) {
      failed++;
      continue;
    }

    try {
      // Find or create category
      let categoryId: string | undefined;
      if (row.category) {
        const slug = row.category.toLowerCase().replace(/\s+/g, "-");
        let category = await prisma.category.findFirst({ where: { slug } });
        if (!category) {
          category = await prisma.category.create({
            data: { name: row.category, slug },
          });
        }
        categoryId = category.id;
      }

      // Find or create brand
      let brandId: string | undefined;
      if (row.brand) {
        const brandSlug = row.brand.toLowerCase().replace(/\s+/g, "-");
        let brand = await prisma.brand.findFirst({ where: { slug: brandSlug } });
        if (!brand) {
          brand = await prisma.brand.create({
            data: { name: row.brand, slug: brandSlug },
          });
        }
        brandId = brand.id;
      }

      const productSlug = row.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

      // Check if SKU already exists
      const existing = await prisma.product.findFirst({
        where: { sku: row.sku },
      });

      if (existing) {
        // Update existing product
        await prisma.product.update({
          where: { id: existing.id },
          data: {
            name: row.name,
            price: parseFloat(row.price),
            comparePrice: row.comparePrice ? parseFloat(row.comparePrice) : undefined,
            stock: parseInt(row.stock, 10),
            description: row.description || undefined,
            shortDesc: row.shortDescription || undefined,
            weight: row.weight || undefined,
            isActive: row.isActive ? row.isActive.toLowerCase() === "true" || row.isActive === "1" : true,
            categoryId: categoryId || undefined,
            brandId: brandId || undefined,
          },
        });
      } else {
        // Create new product
        if (!categoryId) throw new Error(`Row "${row.name}": category is required to create a product`);
        await prisma.product.create({
          data: {
            name: row.name,
            slug: `${productSlug}-${Date.now().toString(36)}`,
            sku: row.sku,
            price: parseFloat(row.price),
            comparePrice: row.comparePrice ? parseFloat(row.comparePrice) : undefined,
            stock: parseInt(row.stock, 10),
            description: row.description || undefined,
            shortDesc: row.shortDescription || undefined,
            weight: row.weight || undefined,
            isActive: row.isActive ? row.isActive.toLowerCase() === "true" || row.isActive === "1" : true,
            categoryId,
            brandId: brandId || undefined,
          },
        });
      }

      success++;
    } catch (error) {
      failed++;
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`Row ${rowNumber}: ${msg}`);
      logger.error({ rowNumber, error: msg, sku: row.sku }, "Bulk upload row failed");
    }
  }

  // Record in history
  const record: BulkUploadRecord = {
    id: `upload-${Date.now().toString(36)}`,
    fileName: `bulk-upload-${new Date().toISOString().slice(0, 10)}.csv`,
    totalRows: parsedData.rows.length,
    validRows: success,
    errorRows: failed,
    status: failed === 0 ? "completed" : success === 0 ? "failed" : "partial",
    uploadedBy: (session as unknown as SessionWithUser).user?.email || "unknown",
    uploadedAt: new Date().toISOString(),
  };

  uploadHistory.unshift(record);
  if (uploadHistory.length > MAX_HISTORY) {
    uploadHistory.pop();
  }

  logger.info(
    { success, failed, total: parsedData.rows.length },
    "Bulk upload processed"
  );

  return { success, failed, errors };
}

// ===================== BULK UPLOAD HISTORY =====================

export async function getBulkUploadHistory(): Promise<BulkUploadRecord[] | { error: string }> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  return uploadHistory;
}

// ===================== DOWNLOAD TEMPLATE =====================

export async function downloadTemplate(): Promise<string | { error: string }> {
  const session = await getSession();
  if (!session || (session as unknown as SessionWithUser).user?.role !== "ADMIN") {
    return { error: "Unauthorized" };
  }

  return generateProductCSVTemplate();
}
