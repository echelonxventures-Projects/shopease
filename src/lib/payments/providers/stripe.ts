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
      this.apiKey = (config?.config as { secretKey?: string })?.secretKey || process.env.STRIPE_SECRET_KEY || null;
    }
    if (!this.apiKey) {
      this.apiKey = process.env.STRIPE_SECRET_KEY || null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe SDK type not available without dependency
  private client: Record<string, any> | null = null;

  /** Lazily construct the real Stripe SDK client (optional dependency). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe SDK type not available without dependency
  private async getClient(): Promise<Record<string, any>> {
    if (this.client) return this.client;
    const moduleName = "stripe";
    const mod = await import(/* webpackIgnore: true */ moduleName);
    const Stripe = (mod as { default?: unknown }).default || mod;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Stripe SDK returns dynamic methods
    this.client = new (Stripe as new (key: string) => Record<string, any>)(this.apiKey as string);
    return this.client;
  }

  async createPaymentIntent(params: PaymentIntentParams): Promise<PaymentResult> {
    await this.init(params.metadata?.regionId as string | undefined);
    if (!this.apiKey) {
      return { success: false, paymentId: "", status: "failed", error: "Stripe API key not configured" };
    }

    try {
      const stripe = await this.getClient();
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(params.amount * 100),
        currency: params.currency.toLowerCase(),
        automatic_payment_methods: { enabled: true },
        metadata: { userId: params.userId ?? "", ...(params.metadata || {}) },
      });
      return {
        success: true,
        paymentId: intent.id,
        providerTxnId: intent.id,
        status: intent.status,
        clientSecret: intent.client_secret,
        metadata: { provider: "stripe", amount: params.amount, currency: params.currency },
      };
    } catch (error) {
      return { success: false, paymentId: "", status: "failed", error: (error instanceof Error ? error.message : String(error)) };
    }
  }

  async confirmPayment(paymentId: string, params?: Record<string, unknown>): Promise<PaymentResult> {
    await this.init();
    if (!this.apiKey) {
      return { success: false, paymentId, status: "failed", error: "Stripe API key not configured" };
    }

    try {
      const stripe = await this.getClient();
      const intent = params?.paymentMethodId
        ? await stripe.paymentIntents.confirm(paymentId, { payment_method: params.paymentMethodId })
        : await stripe.paymentIntents.retrieve(paymentId);
      return {
        success: intent.status === "succeeded" || intent.status === "processing",
        paymentId,
        status: intent.status,
        metadata: { provider: "stripe" },
      };
    } catch (error) {
      return { success: false, paymentId, status: "failed", error: (error instanceof Error ? error.message : String(error)) };
    }
  }

  async refund(paymentId: string, amount?: number): Promise<RefundResult> {
    await this.init();
    if (!this.apiKey) {
      return { success: false, refundId: "", amount: 0, status: "failed", error: "Stripe API key not configured" };
    }

    try {
      const stripe = await this.getClient();
      const refund = await stripe.refunds.create({
        payment_intent: paymentId,
        ...(amount ? { amount: Math.round(amount * 100) } : {}),
      });
      return {
        success: true,
        refundId: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
      };
    } catch (error) {
      return { success: false, refundId: "", amount: 0, status: "failed", error: (error instanceof Error ? error.message : String(error)) };
    }
  }

  async handleWebhook(body: unknown, signature?: string): Promise<WebhookEvent> {
    if (!signature) {
      throw new Error("Stripe webhook requires signature");
    }
    await this.init();
    const secret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: { type?: string; data?: { object?: { id?: string; status?: string } } };
    if (secret && this.apiKey) {
      const stripe = await this.getClient();
      // body must be the raw request string/Buffer for signature verification
      event = stripe.webhooks.constructEvent(body, signature, secret);
    } else {
      event = typeof body === "string" ? JSON.parse(body) : body as typeof event;
    }
    return {
      type: event.type || "unknown",
      paymentId: event.data?.object?.id || "",
      status: event.data?.object?.status || "unknown",
      raw: event,
    };
  }

  async getSupportedMethods(): Promise<string[]> {
    return ["CARD", "APPLE_PAY", "GOOGLE_PAY", "PAYPAL", "KLARNA"];
  }
}

const stripeProvider = new StripeProvider();
registerProvider(stripeProvider);

export { StripeProvider, stripeProvider };
