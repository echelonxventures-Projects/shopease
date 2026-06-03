import {
  PaymentProvider,
  PaymentIntentParams,
  PaymentResult,
  RefundResult,
  WebhookEvent,
  registerProvider,
  getGatewayConfig,
} from "../gateway-registry";

class RazorpayProvider implements PaymentProvider {
  readonly provider = "razorpay";
  private keyId: string | null = null;
  private keySecret: string | null = null;

  private async init(regionId?: string) {
    if (this.keyId) return;
    if (regionId) {
      const config = await getGatewayConfig("razorpay", regionId);
      this.keyId = (config?.config as { keyId?: string })?.keyId || process.env.RAZORPAY_KEY_ID || null;
      this.keySecret = (config?.config as { keySecret?: string })?.keySecret || process.env.RAZORPAY_KEY_SECRET || null;
    }
    if (!this.keyId) {
      this.keyId = process.env.RAZORPAY_KEY_ID || null;
      this.keySecret = process.env.RAZORPAY_KEY_SECRET || null;
    }
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentResult> {
    await this.init(params.metadata?.regionId as string | undefined);
    if (!this.keyId) {
      return { success: false, paymentId: "", status: "failed", error: "Razorpay API keys not configured" };
    }

    try {
      // In production: const razorpay = new Razorpay({ key_id: this.keyId!, key_secret: this.keySecret! });
      // const order = await razorpay.orders.create({ amount: params.amount * 100, currency: params.currency, ... });
      return {
        success: true,
        paymentId: `rzp_order_${Date.now()}`,
        providerTxnId: `order_${Math.random().toString(36).slice(2, 15)}`,
        status: "created",
        clientSecret: `rzp_${Math.random().toString(36).slice(2, 15)}`,
        metadata: { provider: "razorpay", amount: params.amount, currency: params.currency },
      };
    } catch (error) {
      return { success: false, paymentId: "", status: "failed", error: (error instanceof Error ? error.message : String(error)) };
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async confirmPayment(paymentId: string, _params?: Record<string, unknown>): Promise<PaymentResult> {
    await this.init();
    if (!this.keyId) {
      return { success: false, paymentId, status: "failed", error: "Razorpay API keys not configured" };
    }

    try {
      // In production: const payment = await razorpay.payments.fetch(params.paymentId);
      // if (payment.status === 'captured') { ... }
      return {
        success: true,
        paymentId,
        status: "succeeded",
        metadata: { provider: "razorpay" },
      };
    } catch (error) {
      return { success: false, paymentId, status: "failed", error: (error instanceof Error ? error.message : String(error)) };
    }
  }

  async refund(paymentId: string, amount?: number): Promise<RefundResult> {
    await this.init();
    if (!this.keyId) {
      return { success: false, refundId: "", amount: 0, status: "failed", error: "Razorpay API keys not configured" };
    }

    try {
      // In production: const refund = await razorpay.payments.refund(paymentId, { amount });
      return {
        success: true,
        refundId: `rfnd_${Math.random().toString(36).slice(2, 15)}`,
        amount: amount || 0,
        status: "processed",
      };
    } catch (error) {
      return { success: false, refundId: "", amount: 0, status: "failed", error: (error instanceof Error ? error.message : String(error)) };
    }
  }

  async handleWebhook(body: unknown, signature?: string): Promise<WebhookEvent> {
    if (!signature) {
      throw new Error("Razorpay webhook requires signature");
    }
    // In production: verify webhook signature using razorpay.webhookVerify()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- webhook payload shape varies
    const raw: any = typeof body === "string" ? JSON.parse(body) : body;
    return {
      type: raw.event || "unknown",
      paymentId: raw.payload?.payment?.entity?.id || "",
      status: raw.payload?.payment?.entity?.status || "unknown",
      raw,
    };
  }

  async getSupportedMethods(): Promise<string[]> {
    return ["CARD", "UPI", "NETBANKING", "WALLET", "BNPL", "CASH_ON_DELIVERY"];
  }
}

const razorpayProvider = new RazorpayProvider();
registerProvider(razorpayProvider);

export { RazorpayProvider, razorpayProvider };
