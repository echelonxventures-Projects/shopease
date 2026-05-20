import { z } from "zod";

const PRODUCT_TYPES = ["PHYSICAL", "DIGITAL", "SUBSCRIPTION", "SERVICE", "BUNDLE", "COMBO"] as const;
const TAX_CATEGORIES = ["STANDARD", "FOOD", "BOOKS", "PHARMA", "CLOTHING", "LUXURY", "ALCOHOL", "TOBACCO"] as const;
const UOM_VALUES = ["GM","KG","TON","MM","CM","METER","INCH","FT","ML","LITER","SQ_M","SQ_FT","PIECE","DOZEN","PACK","SET","BOX","BUNDLE","CAN","BAG","ROLL","SHEET","KB","MB","GB","TB","HOUR","DAY","MONTH","YEAR"] as const;
const FREIGHT_CLASSES = ["STANDARD","OVERSIZED","FRAGILE","HAZARDOUS","PERISHABLE","REFRIGERATED"] as const;
const TRACKING_TYPES = ["NONE","SERIAL","LOT"] as const;

export const productSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  shortDesc: z.string().max(200).optional(),
  price: z.coerce.number().positive("Price must be positive"),
  comparePrice: z.coerce.number().positive().optional(),
  categoryId: z.string().min(1, "Category is required"),
  brandId: z.string().optional().or(z.literal("")),
  sku: z.string().optional().or(z.literal("")),
  stock: z.coerce.number().int().min(0),
  weight: z.string().optional(),
  dimensions: z.string().optional(),
  specs: z.string().optional(),
  tags: z.string().optional(),
  images: z.array(z.string()).min(1, "At least one image is required"),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  discountType: z.string().optional(),
  discountValue: z.coerce.number().optional(),
  offerStartDate: z.any().optional(),
  offerEndDate: z.any().optional(),

  // Global product catalogue fields
  productType: z.enum(PRODUCT_TYPES).optional().default("PHYSICAL"),
  barcodes: z.array(z.string()).optional().default([]),
  hsCode: z.string().nullable().optional(),
  taxCategory: z.enum(TAX_CATEGORIES).optional().default("STANDARD"),
  uom: z.enum(UOM_VALUES).nullable().optional(),
  uomMultiplier: z.coerce.number().positive().nullable().optional(),
  freightClass: z.enum(FREIGHT_CLASSES).nullable().optional(),
  trackingType: z.enum(TRACKING_TYPES).optional().default("NONE"),
  expiryDays: z.coerce.number().int().positive().nullable().optional(),
  minShelfLife: z.coerce.number().int().positive().nullable().optional(),
  isSnappable: z.boolean().optional().default(false),
  digitalUrl: z.string().nullable().optional(),
  maxDownloads: z.coerce.number().int().positive().nullable().optional(),
  downloadExpiry: z.string().nullable().optional(),
  subscriptionInterval: z.string().nullable().optional(),
  subscriptionDuration: z.coerce.number().int().positive().nullable().optional(),
  subscriptionTrialDays: z.coerce.number().int().nonnegative().nullable().optional(),
  bundleItems: z.array(z.any()).nullable().optional(),
  tierPricing: z.array(z.any()).nullable().optional(),
});
export type ProductInput = z.infer<typeof productSchema>;
