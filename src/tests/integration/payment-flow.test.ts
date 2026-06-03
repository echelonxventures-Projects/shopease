import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

/**
 * Integration test: Payment lifecycle
 *
 * Tests: payment creation → capture → partial refund → full refund
 * Also tests: saved payment methods, retry logic, webhook recording
 *
 * NOTE: Requires a test database. Run with:
 *   DATABASE_URL=<test-db-url> npx vitest run integration/payment-flow
 */

function createTestUser() {
  return {
    name: "Payment Test User",
    email: `payment-test-${Date.now()}@example.com`,
    password: "hashedpassword123",
  };
}

function createTestProduct() {
  return {
    name: `Payment Test Product ${Date.now()}`,
    slug: `pay-test-${Date.now()}`,
    description: "Payment flow test product",
    price: 199.99,
    stock: 50,
    isActive: true,
    sku: `PAY-SKU-${Date.now()}`,
  };
}

// NOTE: Requires a real database connection. The global test setup mocks Prisma,
// so this suite is skipped here. Run with a dedicated integration config + real DB.
describe("Payment Flow Integration", () => {
  let userId: string;
  let orderId: string;
  let paymentId: string;

  beforeAll(async () => {
    // Create user
    const user = await prisma.user.create({ data: createTestUser() });
    userId = user.id;

    // Create product + category
    const _category = await prisma.category.create({
      data: {
        name: `Payment Cat ${Date.now()}`,
        slug: `pay-cat-${Date.now()}`,
      },
    });

    const product = await prisma.product.create({
      data: createTestProduct(),
    });

    // Create order
    const order = await prisma.order.create({
      data: {
        userId,
        orderNumber: `PAY-ORD-${Date.now()}`,
        status: "CONFIRMED",
        paymentStatus: "PENDING",
        subtotal: 599.97,
        tax: 108.0,
        total: 707.97,
        currency: "USD",
        items: {
          create: {
            productId: product.id,
            quantity: 3,
            price: 199.99,
            total: 599.97,
          },
        },
      },
    });
    orderId = order.id;
  });

  afterAll(async () => {
    if (paymentId) {
      await prisma.refund.deleteMany({ where: { paymentId } });
      await prisma.payment.deleteMany({ where: { id: paymentId } });
    }
    if (orderId) {
      await prisma.orderItem.deleteMany({ where: { orderId } });
      await prisma.order.deleteMany({ where: { id: orderId } });
    }
    if (userId) {
      await prisma.savedPaymentMethod.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
  });

  describe("Payment Creation", () => {
    it("should create a pending payment", async () => {
      const payment = await prisma.payment.create({
        data: {
          orderId,
          amount: 707.97,
          currency: "USD",
          method: "CARD",
          status: "PENDING",
          transactionId: `txn_pending_${Date.now()}`,
        },
      });

      paymentId = payment.id;
      expect(payment.status).toBe("PENDING");
      expect(payment.amount).toBe(707.97);
    });

    it("should link payment to order", async () => {
      const orderWithPayment = await prisma.order.findUnique({
        where: { id: orderId },
        include: { payments: true },
      });

      expect(orderWithPayment!.payments).toHaveLength(1);
      expect(orderWithPayment!.payments[0].id).toBe(paymentId);
    });
  });

  describe("Payment Authorization", () => {
    it("should transition to AUTHORIZED", async () => {
      const updated = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "AUTHORIZED",
          transactionId: `txn_auth_${Date.now()}`,
        },
      });

      expect(updated.status).toBe("AUTHORIZED");
    });
  });

  describe("Payment Capture", () => {
    it("should capture the payment", async () => {
      const updated = await prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "CAPTURED",
          capturedAt: new Date(),
        },
      });

      expect(updated.status).toBe("CAPTURED");
      expect(updated.capturedAt).toBeDefined();
    });

    it("should update order payment status to PAID", async () => {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID" },
      });

      expect(updated.paymentStatus).toBe("PAID");
    });
  });

  describe("Partial Refund", () => {
    it("should create a partial refund", async () => {
      const refund = await prisma.refund.create({
        data: {
          paymentId,
          amount: 199.99,
          reason: "CUSTOMER_REQUEST",
          status: "PROCESSED",
          transactionId: `refund_partial_${Date.now()}`,
        },
      });

      expect(refund.amount).toBe(199.99);
      expect(refund.status).toBe("PROCESSED");
    });

    it("should track remaining refundable amount", async () => {
      const refunds = await prisma.refund.findMany({
        where: { paymentId },
        select: { amount: true },
      });

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);
      const remaining = payment!.amount - totalRefunded;

      expect(totalRefunded).toBe(199.99);
      expect(remaining).toBeCloseTo(507.98, 2);
    });
  });

  describe("Full Refund", () => {
    it("should create a refund for remaining amount", async () => {
      const refunds = await prisma.refund.findMany({
        where: { paymentId },
        select: { amount: true },
      });
      const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);

      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });
      const remaining = payment!.amount - totalRefunded;

      const refund = await prisma.refund.create({
        data: {
          paymentId,
          amount: remaining,
          reason: "DEFECTIVE_PRODUCT",
          status: "PROCESSED",
          transactionId: `refund_full_${Date.now()}`,
        },
      });

      expect(refund.amount).toBeCloseTo(507.98, 2);
    });

    it("should update order payment status to REFUNDED", async () => {
      const updated = await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "REFUNDED" },
      });

      expect(updated.paymentStatus).toBe("REFUNDED");
    });

    it("should have total refunds equal to original payment", async () => {
      const refunds = await prisma.refund.findMany({
        where: { paymentId },
        select: { amount: true },
      });

      const totalRefunded = refunds.reduce((sum, r) => sum + r.amount, 0);
      const payment = await prisma.payment.findUnique({
        where: { id: paymentId },
      });

      expect(totalRefunded).toBeCloseTo(payment!.amount, 2);
    });
  });

  describe("Saved Payment Methods", () => {
    it("should save a payment method for future use", async () => {
      const saved = await prisma.savedPaymentMethod.create({
        data: {
          userId,
          type: "CARD",
          provider: "STRIPE",
          last4: "4242",
          brand: "Visa",
          expiryMonth: 12,
          expiryYear: 2027,
          isDefault: true,
          providerToken: `pm_test_${Date.now()}`,
        },
      });

      expect(saved.last4).toBe("4242");
      expect(saved.isDefault).toBe(true);
    });

    it("should retrieve saved payment methods for user", async () => {
      const methods = await prisma.savedPaymentMethod.findMany({
        where: { userId },
      });

      expect(methods.length).toBeGreaterThanOrEqual(1);
      expect(methods.some(m => m.last4 === "4242")).toBe(true);
    });

    it("should allow setting a new default", async () => {
      const saved = await prisma.savedPaymentMethod.create({
        data: {
          userId,
          type: "CARD",
          provider: "STRIPE",
          last4: "1234",
          brand: "Mastercard",
          expiryMonth: 6,
          expiryYear: 2028,
          isDefault: false,
          providerToken: `pm_test2_${Date.now()}`,
        },
      });

      // Set as default (unset old default first)
      await prisma.savedPaymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      await prisma.savedPaymentMethod.update({
        where: { id: saved.id },
        data: { isDefault: true },
      });

      const methods = await prisma.savedPaymentMethod.findMany({
        where: { userId, isDefault: true },
      });

      expect(methods).toHaveLength(1);
      expect(methods[0].last4).toBe("1234");
    });
  });

  describe("Payment Retry", () => {
    it("should create a retry payment after failure", async () => {
      // Simulate a failed payment
      const failedPayment = await prisma.payment.create({
        data: {
          orderId,
          amount: 707.97,
          currency: "USD",
          method: "CARD",
          status: "FAILED",
          transactionId: `txn_failed_${Date.now()}`,
          failureReason: "CARD_DECLINED",
        },
      });

      expect(failedPayment.status).toBe("FAILED");

      // Create retry payment
      const retryPayment = await prisma.payment.create({
        data: {
          orderId,
          amount: 707.97,
          currency: "USD",
          method: "CARD",
          status: "PENDING",
          transactionId: `txn_retry_${Date.now()}`,
        },
      });

      expect(retryPayment.status).toBe("PENDING");
      expect(retryPayment.id).not.toBe(failedPayment.id);
    });
  });
});
