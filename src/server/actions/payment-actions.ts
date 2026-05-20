"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import {
  resolveGateways,
  createPaymentTransaction,
  updatePaymentTransaction,
  getPaymentTransactions,
  getProvider,
} from "@/lib/payments";

// ===================== GATEWAY MANAGEMENT =====================

export async function getPaymentGateways() {
  return prisma.paymentGateway.findMany({
    include: {
      regions: { include: { region: true } },
      methods: true,
    },
    orderBy: { name: "asc" },
  });
}

export async function getGatewayById(id: string) {
  return prisma.paymentGateway.findUnique({
    where: { id },
    include: {
      regions: { include: { region: true } },
      methods: true,
    },
  });
}

export async function createPaymentGateway(data: {
  provider: string;
  name: string;
  logo?: string;
  description?: string;
  isActive?: boolean;
}) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.paymentGateway.create({ data });
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
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.paymentGateway.update({ where: { id }, data });
}

export async function toggleGatewayActive(id: string, isActive: boolean) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.paymentGateway.update({ where: { id }, data: { isActive } });
}

// ===================== GATEWAY REGION CONFIG =====================

export async function getGatewayRegions(gatewayId: string) {
  return prisma.paymentGatewayRegion.findMany({
    where: { gatewayId },
    include: { region: true },
  });
}

export async function setGatewayRegion(
  gatewayId: string,
  regionId: string,
  data: {
    isActive?: boolean;
    isPrimary?: boolean;
    priority?: number;
    config?: any;
    currency?: string;
  }
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
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
  if (!session || (session as any).user?.role !== "ADMIN")
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
    config?: any;
  }
) {
  const session = await getSession();
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.paymentGatewayMethod.upsert({
    where: { gatewayId_method: { gatewayId, method: method as any } },
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
  if (!session || (session as any).user?.role !== "ADMIN")
    throw new Error("Unauthorized");

  return prisma.paymentGatewayMethod.update({
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
  if (!session || (session as any).user?.role !== "ADMIN")
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
