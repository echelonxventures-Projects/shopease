import {
  PaymentProvider,
  PaymentIntentParams,
  PaymentResult,
  RefundResult,
  WebhookEvent,
  registerProvider,
  getGatewayConfig,
} from "../gateway-registry";

class StripeProvider implements PaymentProvider {
  readonly provider = "stripe";
  private apiKey: string | null = null;

  private async init(regionId?: string) {
    if (this.apiKey) return;
    if (regionId) {
      const config = await getGatewayConfig("stripe", regionId);
      this.apiKey = (config?.config as any)?.secretKey || process.env.STRIPE_SECRET_KEY || null;
    }
    if (!this.apiKey) {
      this.apiKey = process.env.STRIPE_SECRET_KEY || null;
    }
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentResult> {
    await this.init(params.metadata?.regionId);
    if (!this.apiKey) {
      return { success: false, paymentId: "", status: "failed", error: "Stripe API key not configured" };
    }

    try {
      // In production, use: const stripe = new Stripe(this.apiKey);
      // const intent = await stripe.paymentIntents.create({ ... });
      // For now, return a mock response
      return {
        success: true,
        paymentId: `pi_stripe_${Date.now()}`,
        providerTxnId: `pi_${Math.random().toString(36).slice(2, 15)}`,
        status: "requires_payment_method",
        clientSecret: `pi_${Math.random().toString(36).slice(2, 15)}_secret_${Math.random().toString(36).slice(2, 10)}`,
        metadata: { provider: "stripe", amount: params.amount, currency: params.currency },
      };
    } catch (error: any) {
      return { success: false, paymentId: "", status: "failed", error: error.message };
    }
  }

  async confirmPayment(paymentId: string, params?: any): Promise<PaymentResult> {
    await this.init();
    if (!this.apiKey) {
      return { success: false, paymentId, status: "failed", error: "Stripe API key not configured" };
    }

    try {
      // In production: const confirmation = await stripe.paymentIntents.confirm(paymentId, params);
      return {
        success: true,
        paymentId,
        status: "succeeded",
        metadata: { provider: "stripe" },
      };
    } catch (error: any) {
      return { success: false, paymentId, status: "failed", error: error.message };
    }
  }

  async refund(paymentId: string, amount?: number): Promise<RefundResult> {
    await this.init();
    if (!this.apiKey) {
      return { success: false, refundId: "", amount: 0, status: "failed", error: "Stripe API key not configured" };
    }

    try {
      // In production: const refund = await stripe.refunds.create({ payment_intent: paymentId, amount });
      return {
        success: true,
        refundId: `re_${Math.random().toString(36).slice(2, 15)}`,
        amount: amount || 0,
        status: "succeeded",
      };
    } catch (error: any) {
      return { success: false, refundId: "", amount: 0, status: "failed", error: error.message };
    }
  }

  async handleWebhook(body: any, signature?: string): Promise<WebhookEvent> {
    if (!signature) {
      throw new Error("Stripe webhook requires signature");
    }
    // In production: const event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
    const raw = typeof body === "string" ? JSON.parse(body) : body;
    return {
      type: raw.type || "unknown",
      paymentId: raw.data?.object?.id || "",
      status: raw.data?.object?.status || "unknown",
      raw,
    };
  }

  async getSupportedMethods(): Promise<string[]> {
    return ["CARD", "APPLE_PAY", "GOOGLE_PAY", "PAYPAL", "KLARNA"];
  }
}

const stripeProvider = new StripeProvider();
registerProvider(stripeProvider);

export { StripeProvider, stripeProvider };
