import { prisma } from "@/lib/prisma";

// ===================== PAYMENT PROVIDER INTERFACE =====================

export interface PaymentIntentParams {
  amount: number;
  currency: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface PaymentConfirmParams {
  paymentId: string;
  params?: Record<string, any>;
}

export interface PaymentResult {
  success: boolean;
  paymentId: string;
  providerTxnId?: string;
  status: string;
  clientSecret?: string;
  redirectUrl?: string;
  error?: string;
  metadata?: Record<string, any>;
}

export interface RefundResult {
  success: boolean;
  refundId: string;
  amount: number;
  status: string;
  error?: string;
}

export interface WebhookEvent {
  type: string;
  paymentId: string;
  status: string;
  raw: any;
}

export interface PaymentProvider {
  readonly provider: string;
  createPaymentIntent(params: PaymentIntentParams): Promise<PaymentResult>;
  confirmPayment(paymentId: string, params?: any): Promise<PaymentResult>;
  refund(paymentId: string, amount?: number): Promise<RefundResult>;
  handleWebhook(body: any, signature?: string): Promise<WebhookEvent>;
  getSupportedMethods(): Promise<string[]>;
}

// ===================== GATEWAY REGISTRY =====================

const registry = new Map<string, PaymentProvider>();

export function registerProvider(provider: PaymentProvider) {
  registry.set(provider.provider, provider);
}

export function getProvider(name: string): PaymentProvider | undefined {
  return registry.get(name);
}

export function getAllProviders(): PaymentProvider[] {
  return Array.from(registry.values());
}

// ===================== GATEWAY RESOLUTION =====================

export async function resolveGateways(regionId: string) {
  const gatewayRegions = await prisma.paymentGatewayRegion.findMany({
    where: {
      regionId,
      isActive: true,
    },
    include: {
      gateway: {
        include: {
          methods: { where: { isEnabled: true } },
        },
      },
    },
    orderBy: { priority: "asc" },
  });

  return gatewayRegions.map((gr: any) => ({
    gatewayId: gr.gateway.id,
    provider: gr.gateway.provider,
    name: gr.gateway.name,
    isPrimary: gr.isPrimary,
    priority: gr.priority,
    currency: gr.currency,
    config: gr.config,
    methods: gr.gateway.methods.map((m: any) => ({
      method: m.method,
      name: m.name,
      icon: m.icon,
      config: m.config,
    })),
  }));
}

export async function getGatewayConfig(provider: string, regionId: string) {
  const gr = await prisma.paymentGatewayRegion.findFirst({
    where: {
      gateway: { provider },
      regionId,
      isActive: true,
    },
    include: { gateway: true },
  });

  return gr;
}

// ===================== PAYMENT TRANSACTION MANAGEMENT =====================

export async function createPaymentTransaction(data: {
  orderId: string;
  gatewayId?: string;
  method: string;
  provider: string;
  amount: number;
  currency: string;
  status?: string;
  providerTxnId?: string;
  metadata?: any;
}) {
  return prisma.paymentTransaction.create({
    data: {
      orderId: data.orderId,
      gatewayId: data.gatewayId,
      method: data.method as any,
      provider: data.provider,
      amount: data.amount,
      currency: data.currency,
      status: (data.status || "PENDING") as any,
      providerTxnId: data.providerTxnId,
      metadata: data.metadata,
    },
  });
}

export async function updatePaymentTransaction(
  id: string,
  data: {
    status?: string;
    providerTxnId?: string;
    failureReason?: string;
    metadata?: any;
  }
) {
  const updateData: any = { ...data };
  if (data.status) updateData.status = data.status as any;
  return prisma.paymentTransaction.update({
    where: { id },
    data: updateData,
  });
}

export async function getPaymentTransactions(orderId: string) {
  return prisma.paymentTransaction.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
}
