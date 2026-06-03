import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { generateStandardTemplate, StandardInvoiceData } from "./templates/standard-template";
import { generateGSTTemplate, GSTInvoiceData } from "./templates/gst-template";
import { APP_NAME, COMPANY_EMAIL, COMPANY_WEBSITE } from "@/lib/app-config";

export interface InvoiceOptions {
  template?: "standard" | "gst";
  companyInfo?: Partial<StandardInvoiceData["company"]>;
  notes?: string;
  terms?: string;
}

const DEFAULT_COMPANY: StandardInvoiceData["company"] = {
  name: process.env.COMPANY_NAME || APP_NAME,
  address: process.env.COMPANY_ADDRESS || "",
  email: COMPANY_EMAIL,
  phone: process.env.COMPANY_PHONE || "",
  website: COMPANY_WEBSITE,
};

function formatDate(date: Date): string {
  return date.toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatAddress(shippingAddress: Record<string, string | undefined> | string): string {
  let addr: Record<string, string | undefined>;
  if (typeof shippingAddress === "string") {
    try {
      addr = JSON.parse(shippingAddress);
    } catch {
      return shippingAddress;
    }
  } else {
    addr = shippingAddress;
  }
  const parts = [
    addr.fullName || addr.name,
    addr.street,
    addr.city,
    addr.state,
    addr.zipCode || addr.zip || addr.pincode,
    addr.country,
  ].filter(Boolean);
  return parts.join(", ");
}

export async function generateInvoiceHtml(
  orderId: string,
  options: InvoiceOptions = {}
): Promise<string> {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!order) throw new Error(`Order ${orderId} not found`);

  const items = order.items as { name?: string; productName?: string; description?: string; variantName?: string; quantity?: number; price?: number; unitPrice?: number }[];
  const subtotal = typeof order.subtotal?.toNumber === "function" ? order.subtotal.toNumber() : Number(order.subtotal);
  const tax = typeof order.tax?.toNumber === "function" ? order.tax.toNumber() : Number(order.tax);
  const shippingCost = typeof order.shippingCost?.toNumber === "function" ? order.shippingCost.toNumber() : Number(order.shippingCost);
  const discount = typeof order.discount?.toNumber === "function" ? order.discount.toNumber() : Number(order.discount);
  const total = typeof order.total?.toNumber === "function" ? order.total.toNumber() : Number(order.total);
  const shippingAddress = order.shippingAddress as Record<string, string | undefined>;

  const invoiceNumber = `INV-${order.orderNumber.replace("ORD-", "")}`;
  const taxRate = subtotal > 0 ? Math.round((tax / subtotal) * 100 * 100) / 100 : 0;

  const invoiceItems = items.map((item) => ({
    name: item.name || item.productName || "Product",
    description: item.description || item.variantName,
    quantity: item.quantity || 1,
    unitPrice: Number(item.price || item.unitPrice || 0),
    total: Number((item.price || item.unitPrice || 0) * (item.quantity || 1)),
  }));

  const company = { ...DEFAULT_COMPANY, ...options.companyInfo };

  const template = options.template || detectTemplate(shippingAddress);

  if (template === "gst") {
    const isInterState = (shippingAddress.state || "").toLowerCase() !== "karnataka";
    const gstData: GSTInvoiceData = {
      invoiceNumber,
      orderNumber: order.orderNumber,
      date: formatDate(order.createdAt),
      dueDate: formatDate(new Date(order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)),
      company,
      customer: {
        name: shippingAddress.fullName || order.user.name || "Customer",
        email: order.user.email,
        phone: shippingAddress.phone || order.user.phone || undefined,
        address: formatAddress(shippingAddress),
      },
      items: invoiceItems,
      subtotal,
      tax,
      taxRate,
      shippingCost,
      discount,
      total,
      currency: order.currency || "INR",
      paymentMethod: order.paymentMethod || "N/A",
      paymentStatus: order.paymentStatus,
      notes: options.notes,
      terms: options.terms || "Goods once sold will not be taken back. Interest @18% p.a. will be charged on overdue invoices.",
      gstin: process.env.GSTIN || "29AABCU9603R1ZM",
      customerGstin: shippingAddress.gstin,
      hsnCode: "998314",
      placeOfSupply: shippingAddress.state || "Karnataka",
      stateCode: shippingAddress.stateCode || "29",
      isInterState,
      cgst: isInterState ? 0 : tax / 2,
      sgst: isInterState ? 0 : tax / 2,
      igst: isInterState ? tax : 0,
      reverseCharge: false,
    };

    logger.info({ orderId, template: "gst" }, "Generated GST invoice");
    return generateGSTTemplate(gstData);
  }

  // Standard template
  const standardData: StandardInvoiceData = {
    invoiceNumber,
    orderNumber: order.orderNumber,
    date: formatDate(order.createdAt),
    dueDate: formatDate(new Date(order.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000)),
    company,
    customer: {
      name: shippingAddress.fullName || order.user.name || "Customer",
      email: order.user.email,
      phone: shippingAddress.phone || order.user.phone || undefined,
      address: formatAddress(shippingAddress),
    },
    items: invoiceItems,
    subtotal,
    tax,
    taxRate,
    shippingCost,
    discount,
    total,
    currency: order.currency || "INR",
    paymentMethod: order.paymentMethod || "N/A",
    paymentStatus: order.paymentStatus,
    notes: options.notes,
    terms: options.terms || "Payment is due within 30 days of invoice date.",
  };

  logger.info({ orderId, template: "standard" }, "Generated standard invoice");
  return generateStandardTemplate(standardData);
}

function detectTemplate(shippingAddress: Record<string, string | undefined>): "standard" | "gst" {
  const country = (shippingAddress?.country || "India").toLowerCase();
  if (country === "india" || country === "in") return "gst";
  return "standard";
}

export async function generateInvoiceBuffer(orderId: string, options?: InvoiceOptions): Promise<Buffer> {
  const html = await generateInvoiceHtml(orderId, options);
  return Buffer.from(html, "utf-8");
}

export { generateStandardTemplate, generateGSTTemplate };
export type { StandardInvoiceData, GSTInvoiceData };
