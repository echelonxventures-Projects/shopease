"use server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function getStateTaxRules(country?: string, state?: string) {
  const where: any = {};
  if (country) where.country = country;
  if (state) where.state = state;

  return prisma.stateTaxRule.findMany({
    where,
    orderBy: [{ country: "asc" }, { state: "asc" }],
  });
}

export async function createStateTaxRule(data: {
  country: string;
  state?: string;
  taxType: string;
  cgstRate?: number;
  sgstRate?: number;
  igstRate?: number;
  totalRate: number;
  effectiveFrom?: Date;
  effectiveTo?: Date;
  notes?: string;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  return prisma.stateTaxRule.create({ data });
}

export async function updateStateTaxRule(id: string, data: Partial<{
  country: string;
  state: string;
  taxType: string;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  totalRate: number;
  effectiveFrom: Date;
  effectiveTo: Date;
  notes: string;
}>) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  return prisma.stateTaxRule.update({ where: { id }, data });
}

export async function calculateBusinessTax(data: {
  items: Array<{ price: number; quantity: number; taxCategoryId?: string }>;
  country: string;
  state: string;
  isTaxExempt?: boolean;
}) {
  if (data.isTaxExempt) {
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    return { subtotal, tax: 0, total: subtotal, breakdown: [], jurisdiction: `${data.country}/${data.state}`, taxExempt: true };
  }

  const rules = await prisma.stateTaxRule.findMany({
    where: { country: data.country, state: { equals: data.state || undefined } },
    orderBy: { totalRate: "desc" },
    take: 5,
  });

  if (rules.length === 0) {
    // Default 18% tax
    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    return { subtotal, tax: Number(tax), total: subtotal + Number(tax), breakdown: [], jurisdiction: `${data.country}/${data.state}`, taxExempt: false };
  }

  const totalRate = Number(rules[0].totalRate || 0.18);
  const breakdown = rules.map((r) => ({
    type: r.taxType,
    rate: Number(r.totalRate),
    cgstRate: r.cgstRate ? Number(r.cgstRate) : null,
    sgstRate: r.sgstRate ? Number(r.sgstRate) : null,
    igstRate: r.igstRate ? Number(r.igstRate) : null,
  }));

  const lineItems = data.items.map((item) => {
    const subtotal = item.price * item.quantity;
    const tax = Math.round(subtotal * totalRate);
    return { price: item.price, quantity: item.quantity, subtotal, tax: Number(tax), total: subtotal + Number(tax) };
  });

  const subtotal = lineItems.reduce((sum, l) => sum + l.subtotal, 0);
  const totalTax = lineItems.reduce((sum, l) => sum + l.tax, 0);

  return {
    subtotal,
    tax: totalTax,
    total: subtotal + totalTax,
    breakdown,
    jurisdiction: `${data.country}/${data.state}`,
    taxExempt: false,
  };
}

export async function getTaxExemption(businessId: string, regionCode: string) {
  const exemption = await prisma.businessTaxExemption.findFirst({
    where: {
      businessId,
      regionCode,
      status: "ACTIVE",
      OR: [
        { validUntil: { gte: new Date() } },
        { validUntil: null },
      ],
    },
  });

  return exemption ? { exempt: true, type: exemption.exemptionType, certificateNumber: exemption.certificateNumber } : { exempt: false };
}

export async function seedDefaultTaxRules() {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN") throw new Error("Unauthorized");

  const defaultRules = [
    // India - GST
    { country: "IN", state: null, taxType: "GST", totalRate: 0.18, notes: "Default GST rate for India" },
    { country: "IN", state: "MH", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18, notes: "Maharashtra CGST+SGST" },
    { country: "IN", state: "MH", taxType: "IGST", igstRate: 0.18, totalRate: 0.18, notes: "Maharashtra IGST (inter-state)" },
    { country: "IN", state: "KA", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "KA", taxType: "IGST", igstRate: 0.18, totalRate: 0.18 },
    { country: "IN", state: "TN", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "TN", taxType: "IGST", igstRate: 0.18, totalRate: 0.18 },
    { country: "IN", state: "DL", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "DL", taxType: "IGST", igstRate: 0.18, totalRate: 0.18 },
    { country: "IN", state: "GJ", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "GJ", taxType: "IGST", igstRate: 0.18, totalRate: 0.18 },
    { country: "IN", state: "TS", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "RJ", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "WB", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "UP", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "AP", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "KL", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "BR", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    { country: "IN", state: "MP", taxType: "CGST", cgstRate: 0.09, sgstRate: 0.09, totalRate: 0.18 },
    // US - State Sales Tax
    { country: "US", state: "CA", taxType: "SALES_TAX", totalRate: 0.0725, notes: "California base rate" },
    { country: "US", state: "NY", taxType: "SALES_TAX", totalRate: 0.04, notes: "New York state rate" },
    { country: "US", state: "TX", taxType: "SALES_TAX", totalRate: 0.0625, notes: "Texas state rate" },
    { country: "US", state: "FL", taxType: "SALES_TAX", totalRate: 0.06, notes: "Florida state rate" },
    { country: "US", state: "WA", taxType: "SALES_TAX", totalRate: 0.065, notes: "Washington state rate" },
    { country: "US", state: "IL", taxType: "SALES_TAX", totalRate: 0.0625, notes: "Illinois state rate" },
    { country: "US", state: "OR", taxType: "SALES_TAX", totalRate: 0, notes: "Oregon - no sales tax" },
    { country: "US", state: "DE", taxType: "SALES_TAX", totalRate: 0, notes: "Delaware - no sales tax" },
    { country: "US", state: "NV", taxType: "SALES_TAX", totalRate: 0.0685, notes: "Nevada state rate" },
    // UK - VAT
    { country: "GB", state: null, taxType: "VAT", totalRate: 0.2, notes: "UK standard VAT rate" },
    // EU - VAT
    { country: "DE", state: null, taxType: "VAT", totalRate: 0.19, notes: "Germany standard VAT" },
    { country: "FR", state: null, taxType: "VAT", totalRate: 0.2, notes: "France standard VAT" },
    { country: "IT", state: null, taxType: "VAT", totalRate: 0.22, notes: "Italy standard VAT" },
    { country: "ES", state: null, taxType: "VAT", totalRate: 0.21, notes: "Spain standard VAT" },
    { country: "NL", state: null, taxType: "VAT", totalRate: 0.21, notes: "Netherlands standard VAT" },
    // Australia - GST
    { country: "AU", state: null, taxType: "GST", totalRate: 0.1, notes: "Australia GST" },
    { country: "AU", state: "NSW", taxType: "GST", totalRate: 0.1, notes: "New South Wales GST" },
    { country: "AU", state: "VIC", taxType: "GST", totalRate: 0.1, notes: "Victoria GST" },
    { country: "AU", state: "QLD", taxType: "GST", totalRate: 0.1, notes: "Queensland GST" },
  ];

  let created = 0;
  for (const rule of defaultRules) {
    await prisma.stateTaxRule.upsert({
      where: {
        country_state_taxType_effectiveFrom: {
          country: rule.country,
          state: rule.state || "",
          taxType: rule.taxType,
          effectiveFrom: new Date("2024-01-01"),
        },
      },
      update: rule,
      create: { ...rule, effectiveFrom: new Date("2024-01-01") },
    });
    created++;
  }

  return { created };
}
