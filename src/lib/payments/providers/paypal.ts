import {
  PaymentProvider,
  PaymentIntentParams,
  PaymentResult,
  RefundResult,
  WebhookEvent,
  registerProvider,
  getGatewayConfig,
} from "../gateway-registry";

class PayPalProvider implements PaymentProvider {
  readonly provider = "paypal";
  private clientId: string | null = null;
  private clientSecret: string | null = null;

  private async init(regionId?: string) {
    if (this.clientId) return;
    if (regionId) {
      const config = await getGatewayConfig("paypal", regionId);
      this.clientId = (config?.config as any)?.clientId || process.env.PAYPAL_CLIENT_ID || null;
      this.clientSecret = (config?.config as any)?.clientSecret || process.env.PAYPAL_CLIENT_SECRET || null;
    }
    if (!this.clientId) {
      this.clientId = process.env.PAYPAL_CLIENT_ID || null;
      this.clientSecret = process.env.PAYPAL_CLIENT_SECRET || null;
    }
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentResult> {
    await this.init(params.metadata?.regionId);
    if (!this.clientId) {
      return { success: false, paymentId: "", status: "failed", error: "PayPal credentials not configured" };
    }

    try {
      // In production: use @paypal/paypal-server-sdk or @paypal/checkout-server-sdk
      return {
        success: true,
        paymentId: `pp_order_${Date.now()}`,
        providerTxnId: `${Math.random().toString(36).slice(2, 15)}`,
        status: "created",
        redirectUrl: `https://www.paypal.com/checkoutnow?token=${Math.random().toString(36).slice(2, 15)}`,
        metadata: { provider: "paypal", amount: params.amount, currency: params.currency },
      };
    } catch (error: any) {
      return { success: false, paymentId: "", status: "failed", error: error.message };
    }
  }

  async confirmPayment(paymentId: string, params?: any): Promise<PaymentResult> {
    await this.init();
    if (!this.clientId) {
      return { success: false, paymentId, status: "failed", error: "PayPal credentials not configured" };
    }

    try {
      // In production: const approval = await paypalClient.ordersConfirm(paymentId, params);
      return {
        success: true,
        paymentId,
        status: "succeeded",
        metadata: { provider: "paypal" },
      };
    } catch (error: any) {
      return { success: false, paymentId, status: "failed", error: error.message };
    }
  }

  async refund(paymentId: string, amount?: number): Promise<RefundResult> {
    await this.init();
    if (!this.clientId) {
      return { success: false, refundId: "", amount: 0, status: "failed", error: "PayPal credentials not configured" };
    }

    try {
      // In production: await paypalClient.paymentsRefund(paymentId, { amount });
      return {
        success: true,
        refundId: `${Math.random().toString(36).slice(2, 15)}`,
        amount: amount || 0,
        status: "completed",
      };
    } catch (error: any) {
      return { success: false, refundId: "", amount: 0, status: "failed", error: error.message };
    }
  }

  async handleWebhook(body: any, signature?: string): Promise<WebhookEvent> {
    const raw = typeof body === "string" ? JSON.parse(body) : body;
    return {
      type: raw.event_type || "unknown",
      paymentId: raw.resource?.id || "",
      status: raw.resource?.status || "unknown",
      raw,
    };
  }

  async getSupportedMethods(): Promise<string[]> {
    return ["PAYPAL", "CARD"];
  }
}

const paypalProvider = new PayPalProvider();
registerProvider(paypalProvider);

export { PayPalProvider, paypalProvider };
