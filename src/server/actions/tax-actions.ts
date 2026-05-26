"use server";

import { prisma } from "@/lib/prisma";
import { getProvider, TaxResult as ProviderTaxResult } from "@/lib/tax/tax-provider";
import "@/lib/tax/providers/india-gst-provider"; // auto-registers India GST provider

/**
 * Calculate tax for an order using country-specific tax providers (GST, VAT, Sales Tax, etc.)
 * Fetches product taxCategory/hsCode from DB automatically.
 * Returns per-line tax breakdown (CGST+SGST or IGST).
 */
export async function calculateTax(order: {
  items: Array<{
    productId: string;
    quantity: number;
    price: number;
    taxCategoryId?: string;
    hsCode?: string | null;
  }>;
  shippingCountry: string;
  shippingState: string;
  shippingZip?: string;
}) {
  // Fetch product tax info from DB for items that don't provide it
  const productIds = order.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, taxCategory: true, hsCode: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));

  // Try provider-based calculation
  const provider = getProvider(order.shippingCountry);

  // Determine if inter-state (India-specific: check if shipping state matches business state)
  // For now, assume all shipments within India are intra-state (CGST+SGST)
  // If shipping to a different state, it would be IGST
  // We'll default to intra-state; this can be made configurable per region
  const isInterState = false; // TODO: configurable per business region vs shipping region

  const lineItems = await Promise.all(
    order.items.map(async (item) => {
      const subtotal = item.price * item.quantity;

      // Get tax info — prefer client-provided, fall back to DB lookup
      const taxCategoryId = item.taxCategoryId || productMap.get(item.productId)?.taxCategory || "STANDARD";
      const hsCode = item.hsCode !== undefined ? item.hsCode : productMap.get(item.productId)?.hsCode;

      if (provider) {
        const result: ProviderTaxResult = provider.calculateTax(
          taxCategoryId,
          hsCode ?? null,
          order.shippingState ?? null,
          !isInterState // isSameState = not inter-state
        );

        const tax = Math.round(subtotal * result.totalRate);
        return {
          productId: item.productId,
          subtotal,
          taxRate: result.totalRate * 100,
          tax,
          total: subtotal + tax,
          breakdown: result.breakdown,
          source: result.source,
        };
      }

      // Fallback: query StateTaxRule or default rate
      const rules = await prisma.stateTaxRule.findMany({
        where: {
          country: order.shippingCountry,
          state: order.shippingState || null,
          effectiveFrom: { lte: new Date() },
        },
        orderBy: { effectiveFrom: "desc" },
        take: 5,
      });

      const rule = rules[0];
      const rate = rule ? Number(rule.totalRate) : 0.18;
      const tax = Math.round(subtotal * rate);

      return {
        productId: item.productId,
        subtotal,
        taxRate: rate * 100,
        tax,
        total: subtotal + tax,
        breakdown: rule
          ? [{ type: rule.taxType, rate, description: rule.notes ?? "" }]
          : undefined,
        source: rule?.notes ?? "Default rate",
      };
    })
  );

  const totalTax = lineItems.reduce((sum, item) => sum + item.tax, 0);
  const totalWithTax = lineItems.reduce((sum, item) => sum + item.total, 0);

  return {
    lineItems,
    totalTax,
    totalWithTax,
    jurisdiction: `${order.shippingCountry}/${order.shippingState}`,
    provider: provider?.name ?? "default",
    isInterState,
  };
}

/**
 * Get tax info for a single product by ID — useful for product detail page tax display.
 */
export async function getProductTaxInfo(productId: string, country: string = "IN") {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { taxCategory: true, hsCode: true },
  });

  if (!product) return null;

  const provider = getProvider(country);
  if (!provider) {
    return { taxCategory: product.taxCategory, hsCode: product.hsCode, rate: 0.18 };
  }

  const result = provider.calculateTax(
    product.taxCategory ?? "STANDARD",
    product.hsCode ?? null,
    null,
    true
  );

  return {
    taxCategory: product.taxCategory,
    hsCode: product.hsCode,
    ...result,
  };
}

export async function listTaxRates() {
  const rates = await prisma.taxRate.findMany({
    where: { isActive: true },
    orderBy: [{ country: "asc" }, { state: "asc" }],
  });

  return rates.map((r: any) => ({
    ...r,
    rate: typeof r.rate?.toNumber === "function" ? r.rate.toNumber() : r.rate,
  }));
}
