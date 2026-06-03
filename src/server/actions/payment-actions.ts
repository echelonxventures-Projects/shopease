"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { isRazorpayConfigured } from "@/lib/razorpay";
import {
  resolveGateways,
  createPaymentTransaction,
  updatePaymentTransaction,
  getPaymentTransactions,
  getProvider,
} from "@/lib/payments";
import { validate, vId, vStr, vOptStr } from "@/lib/validate";
import { evaluateAdvancedFraud } from "@/lib/fraud/advanced-detection";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
const toNum = (v: any) =>
  v != null && typeof v === "object" && "toNumber" in v && typeof v.toNumber === "function"
    ? v.toNumber()
    : v;

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic Prisma result serializer
function serializeGateway(gw: any) {
  if (!gw) return gw;
  return {
    ...gw,
    regions: (gw.regions || []).map((r: { region?: { taxRate?: unknown } }) => ({
      ...r,
      region: r.region ? { ...r.region, taxRate: toNum(r.region.taxRate) } : null,
    })),
    methods: gw.methods || [],
  };
}

// ===================== GATEWAY MANAGEMENT =====================

export async function getPaymentGateways() {
  const gateways = await prisma.paymentGateway.findMany({
    include: {
      regions: { include: { region: true } },
      methods: true,
    },
    orderBy: { name: "asc" },
  });
  return gateways.map(serializeGateway);
}

export async function getGatewayById(id: string) {
  const gw = await prisma.paymentGateway.findUnique({
    where: { id },
    include: {
      regions: { include: { region: true } },
      methods: true,
    },
  });
  return serializeGateway(gw);
}

export async function createPaymentGateway(data: {
  provider: string;
  name: string;
  logo?: string;
  description?: string;
  isActive?: boolean;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  const input = validate(z.object({
    provider: z.string().trim().min(1).max(100),
    name: vStr(200),
    logo: z.string().trim().url().max(2048).optional().or(z.literal("")),
    description: vOptStr(1000),
    isActive: z.boolean().optional(),
  }), data);

  return prisma.paymentGateway.create({ data: { provider: input.provider, name: input.name as string, logo: input.logo || undefined, description: input.description as string | undefined, isActive: input.isActive ?? true } });
}

export async function updatePaymentGateway(
  id: string,
  data: {
    name?: string;
    logo?: string;
    description?: string;
    isActive?: boolean;
  }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  return prisma.paymentGateway.update({ where: { id }, data });
}

export async function toggleGatewayActive(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  return prisma.paymentGateway.update({ where: { id }, data: { isActive } });
}

// ===================== GATEWAY REGION CONFIG =====================

export async function getGatewayRegions(gatewayId: string) {
  const regions = await prisma.paymentGatewayRegion.findMany({
    where: { gatewayId },
    include: { region: true },
  });
  return regions.map((r) => ({
    ...r,
    region: r.region ? { ...r.region, taxRate: toNum(r.region.taxRate) } : null,
  }));
}

export async function setGatewayRegion(
  gatewayId: string,
  regionId: string,
  data: {
    isActive?: boolean;
    isPrimary?: boolean;
    priority?: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
    config?: any;
    currency?: string;
  }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  // If setting as primary, unset other primary for this region
  if (data.isPrimary) {
    await prisma.paymentGatewayRegion.updateMany({
      where: { regionId, isPrimary: true },
      data: { isPrimary: false },
    });
  }

  return prisma.paymentGatewayRegion.upsert({
    where: { gatewayId_regionId: { gatewayId, regionId } },
    create: { gatewayId, regionId, ...data },
    update: data,
  });
}

export async function removeGatewayRegion(gatewayId: string, regionId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  return prisma.paymentGatewayRegion.delete({
    where: { gatewayId_regionId: { gatewayId, regionId } },
  });
}

// ===================== GATEWAY METHODS =====================

export async function getGatewayMethods(gatewayId: string) {
  return prisma.paymentGatewayMethod.findMany({
    where: { gatewayId },
  });
}

export async function setGatewayMethod(
  gatewayId: string,
  method: string,
  data: {
    name?: string;
    icon?: string;
    isEnabled?: boolean;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
    config?: any;
  }
) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  return prisma.paymentGatewayMethod.upsert({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    where: { gatewayId_method: { gatewayId, method: method as any } },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    create: { gatewayId, method: method as any, name: data.name || method, ...data },
    update: data,
  });
}

export async function toggleGatewayMethod(
  gatewayId: string,
  method: string,
  isEnabled: boolean
) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  return prisma.paymentGatewayMethod.update({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    where: { gatewayId_method: { gatewayId, method: method as any } },
    data: { isEnabled },
  });
}

// ===================== RESOLUTION =====================

export async function getAvailableGateways(regionId: string) {
  return resolveGateways(regionId);
}

// ===================== PAYMENT PROCESSING =====================

export async function createPaymentIntent(
  orderId: string,
  provider: string,
  method: string,
  amount: number,
  currency: string,
  regionId?: string
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  // Prevent double-charge: check if a successful payment already exists for this order
  const existingSuccess = await prisma.paymentTransaction.findFirst({
    where: { orderId, status: "COMPLETED" as never },
    select: { id: true },
  });
  if (existingSuccess) throw new Error("Payment already completed for this order");

  // Fraud detection for high-value payments
  if (amount > 10000) {
    const verdict = await evaluateAdvancedFraud(session.user?.id as string, "PAYMENT", { timestamp: new Date() });
    if (verdict.action === "BLOCK") {
      throw new Error("Payment blocked: suspicious activity detected. Contact support.");
    }
  }

  if (provider === "razorpay" && !isRazorpayConfigured()) {
    throw new Error("Payment provider not configured");
  }

  const gateway = await prisma.paymentGateway.findUnique({ where: { provider } });
  if (!gateway) throw new Error("Gateway not found");

  const providerInstance = getProvider(provider);
  if (!providerInstance) throw new Error("Provider not registered");

  const transaction = await createPaymentTransaction({
    orderId,
    gatewayId: gateway.id,
    method,
    provider,
    amount,
    currency,
  });

  const result = await providerInstance.createPaymentIntent({
    amount,
    currency,
    userId: session.user?.id as string,
    metadata: { orderId, regionId, transactionId: transaction.id },
  });

  if (result.success) {
    await updatePaymentTransaction(transaction.id, {
      providerTxnId: result.providerTxnId,
      metadata: result.metadata,
    });
  }

  return { transactionId: transaction.id, ...result };
}

export async function confirmPaymentAction(
  transactionId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  params?: any
) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
    include: { gateway: true },
  });

  if (!transaction) throw new Error("Transaction not found");

  const providerInstance = getProvider(transaction.provider);
  if (!providerInstance) throw new Error("Provider not registered");

  const result = await providerInstance.confirmPayment(transaction.providerTxnId || transactionId, params);

  if (result.success) {
    await updatePaymentTransaction(transactionId, {
      status: "PAID",
      providerTxnId: result.providerTxnId,
      metadata: result.metadata,
    });
  } else {
    await updatePaymentTransaction(transactionId, {
      status: "FAILED",
      failureReason: result.error,
    });
  }

  return result;
}

export async function refundPaymentAction(
  transactionId: string,
  amount?: number
) {
  const session = await getSession();
  if (!session || !isAdminRole(session!.user?.role))
    throw new Error("Unauthorized");

  const transaction = await prisma.paymentTransaction.findUnique({
    where: { id: transactionId },
    include: { gateway: true },
  });

  if (!transaction) throw new Error("Transaction not found");

  const providerInstance = getProvider(transaction.provider);
  if (!providerInstance) throw new Error("Provider not registered");

  const result = await providerInstance.refund(transaction.providerTxnId || transactionId, amount);

  if (result.success) {
    await updatePaymentTransaction(transactionId, { status: "REFUNDED" });
  }

  return result;
}

export async function getOrderTransactions(orderId: string) {
  return getPaymentTransactions(orderId);
}
