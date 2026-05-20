"use server";

import { prisma } from "@/lib/prisma";

export async function calculateTax(order: {
  items: Array<{ productId: string; quantity: number; price: number; taxCategoryId?: string }>;
  shippingCountry: string;
  shippingState: string;
  shippingZip?: string;
}) {
  // Get tax rates for the jurisdiction
  const taxCategoryOverrides = await prisma.taxRate.findMany({
    where: {
      country: order.shippingCountry,
      state: order.shippingState || undefined,
      isActive: true,
    },
  });

  const defaultRate = taxCategoryOverrides.find((t: any) => !t.taxCategoryId);
  const defaultRateValue = Number(defaultRate?.rate || 0.18);

  const lineItems = order.items.map((item) => {
    const rate = Number((taxCategoryOverrides.find((t: any) => t.taxCategoryId === item.taxCategoryId) || defaultRate)?.rate || defaultRateValue);
    const subtotal = item.price * item.quantity;
    const tax = Math.round(subtotal * rate);

    return {
      productId: item.productId,
      subtotal,
      taxRate: rate * 100,
      tax,
      total: subtotal + tax,
    };
  });

  const totalTax = lineItems.reduce((sum, item) => sum + item.tax, 0);
  const totalWithTax = lineItems.reduce((sum, item) => sum + item.total, 0);

  return {
    lineItems,
    totalTax,
    totalWithTax,
    jurisdiction: `${order.shippingCountry}/${order.shippingState}`,
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
