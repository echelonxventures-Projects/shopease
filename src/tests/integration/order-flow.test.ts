import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { prisma } from "@/lib/prisma";

/**
 * Integration test: Full order lifecycle
 *
 * Tests: product creation → cart → checkout → payment → fulfillment → delivery → feedback
 *
 * NOTE: These tests require a real test database. Set DATABASE_URL in .env.test
 * and run with: DATABASE_URL=<test-db-url> npx vitest run integration/
 */

// Test data factory
function createTestProduct(overrides = {}) {
  return {
    name: `Test Product ${Date.now()}`,
    slug: `test-product-${Date.now()}`,
    description: "Integration test product",
    price: 99.99,
    compareAtPrice: 149.99,
    stock: 100,
    isActive: true,
    sku: `SKU-${Date.now()}`,
    ...overrides,
  };
}

function createTestUser(overrides = {}) {
  return {
    name: "Test User",
    email: `test-${Date.now()}@example.com`,
    password: "hashedpassword123",
    phone: "+1234567890",
    ...overrides,
  };
}

// NOTE: These integration tests require a real database connection. The global
// test setup mocks Prisma, so the suite is skipped here. Run against a real DB
// with a dedicated integration config when needed.
describe("Order Flow Integration", () => {
  let testUserId: string;
  let testProductId: string;
  let testOrderId: string;

  beforeAll(async () => {
    // Create test user
    const user = await prisma.user.create({
      data: createTestUser(),
    });
    testUserId = user.id;

    // Create test product (need a category first)
    const category = await prisma.category.create({
      data: {
        name: `Test Category ${Date.now()}`,
        slug: `test-cat-${Date.now()}`,
      },
    });

    const product = await prisma.product.create({
      data: createTestProduct({ categoryId: category.id }),
    });
    testProductId = product.id;
  });

  afterAll(async () => {
    // Cleanup in reverse dependency order
    if (testOrderId) {
      await prisma.deliveryFeedback.deleteMany({ where: { orderId: testOrderId } });
      await prisma.orderItem.deleteMany({ where: { orderId: testOrderId } });
      await prisma.order.deleteMany({ where: { id: testOrderId } });
    }
    if (testProductId) {
      await prisma.product.deleteMany({ where: { id: testProductId } });
    }
    if (testUserId) {
      await prisma.browseHistory.deleteMany({ where: { userId: testUserId } });
      await prisma.wishlist.deleteMany({ where: { userId: testUserId } });
      await prisma.cartItem.deleteMany({ where: { userId: testUserId } });
      await prisma.user.deleteMany({ where: { id: testUserId } });
    }
  });

  describe("Step 1: Browse & Discovery", () => {
    it("should record browse history when user views a product", async () => {
      await prisma.browseHistory.create({
        data: {
          userId: testUserId,
          productId: testProductId,
          viewedAt: new Date(),
        },
      });

      const history = await prisma.browseHistory.findMany({
        where: { userId: testUserId, productId: testProductId },
      });

      expect(history).toHaveLength(1);
    });

    it("should allow adding product to wishlist", async () => {
      await prisma.wishlist.create({
        data: {
          userId: testUserId,
          productId: testProductId,
        },
      });

      const wishlist = await prisma.wishlist.findMany({
        where: { userId: testUserId },
      });

      expect(wishlist).toHaveLength(1);
      expect(wishlist[0].productId).toBe(testProductId);
    });
  });

  describe("Step 2: Cart Operations", () => {
    it("should add item to cart", async () => {
      await prisma.cartItem.create({
        data: {
          userId: testUserId,
          productId: testProductId,
          quantity: 2,
          price: 99.99,
        },
      });

      const cartItems = await prisma.cartItem.findMany({
        where: { userId: testUserId },
      });

      expect(cartItems).toHaveLength(1);
      expect(cartItems[0].quantity).toBe(2);
    });

    it("should update cart item quantity", async () => {
      const cartItem = await prisma.cartItem.findFirst({
        where: { userId: testUserId, productId: testProductId },
      });

      expect(cartItem).toBeDefined();

      const updated = await prisma.cartItem.update({
        where: { id: cartItem!.id },
        data: { quantity: 3 },
      });

      expect(updated.quantity).toBe(3);
    });

    it("should validate stock availability", async () => {
      const product = await prisma.product.findUnique({
        where: { id: testProductId },
      });

      expect(product).toBeDefined();
      expect(product!.stock).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Step 3: Order Creation", () => {
    it("should create an order from cart", async () => {
      const order = await prisma.order.create({
        data: {
          userId: testUserId,
          orderNumber: `ORD-${Date.now()}`,
          status: "CONFIRMED",
          paymentStatus: "PENDING",
          subtotal: 299.97,
          tax: 54.0,
          total: 353.97,
          currency: "USD",
          items: {
            create: {
              productId: testProductId,
              quantity: 3,
              price: 99.99,
              total: 299.97,
            },
          },
        },
      });

      testOrderId = order.id;
      expect(order.status).toBe("CONFIRMED");
      expect(order.paymentStatus).toBe("PENDING");
      expect(order.total).toBe(353.97);
    });

    it("should have order items linked correctly", async () => {
      const orderWithItems = await prisma.order.findUnique({
        where: { id: testOrderId },
        include: { items: true },
      });

      expect(orderWithItems!.items).toHaveLength(1);
      expect(orderWithItems!.items[0].productId).toBe(testProductId);
      expect(orderWithItems!.items[0].quantity).toBe(3);
    });

    it("should decrement product stock", async () => {
      await prisma.product.update({
        where: { id: testProductId },
        data: { stock: { decrement: 3 } },
      });

      const product = await prisma.product.findUnique({
        where: { id: testProductId },
      });

      expect(product!.stock).toBe(97);
    });
  });

  describe("Step 4: Payment Processing", () => {
    it("should update payment status to PAID", async () => {
      const updated = await prisma.order.update({
        where: { id: testOrderId },
        data: { paymentStatus: "PAID" },
      });

      expect(updated.paymentStatus).toBe("PAID");
    });

    it("should create payment record", async () => {
      const payment = await prisma.payment.create({
        data: {
          orderId: testOrderId,
          amount: 353.97,
          currency: "USD",
          method: "CARD",
          status: "CAPTURED",
          transactionId: `txn_${Date.now()}`,
        },
      });

      expect(payment.status).toBe("CAPTURED");
      expect(payment.amount).toBe(353.97);
    });
  });

  describe("Step 5: Fulfillment", () => {
    it("should transition order to SHIPPED", async () => {
      const updated = await prisma.order.update({
        where: { id: testOrderId },
        data: {
          status: "SHIPPED",
          shippingMethod: "EXPRESS",
        },
      });

      expect(updated.status).toBe("SHIPPED");
    });

    it("should transition order to OUT_FOR_DELIVERY", async () => {
      const updated = await prisma.order.update({
        where: { id: testOrderId },
        data: { status: "OUT_FOR_DELIVERY" },
      });

      expect(updated.status).toBe("OUT_FOR_DELIVERY");
    });
  });

  describe("Step 6: Delivery", () => {
    it("should transition order to DELIVERED", async () => {
      const updated = await prisma.order.update({
        where: { id: testOrderId },
        data: {
          status: "DELIVERED",
          deliveredAt: new Date(),
        },
      });

      expect(updated.status).toBe("DELIVERED");
      expect(updated.deliveredAt).toBeDefined();
    });
  });

  describe("Step 7: Post-Delivery Feedback", () => {
    it("should accept delivery feedback", async () => {
      const feedback = await prisma.deliveryFeedback.create({
        data: {
          orderId: testOrderId,
          rating: 5,
          comment: "Excellent delivery, very fast!",
          tags: ["On Time", "Polite", "Careful Handling"],
        },
      });

      expect(feedback.rating).toBe(5);
      expect(feedback.tags).toContain("On Time");
    });

    it("should prevent duplicate feedback", async () => {
      await expect(
        prisma.deliveryFeedback.create({
          data: {
            orderId: testOrderId,
            rating: 4,
          },
        })
      ).rejects.toThrow();
    });

    it("should calculate average agent rating", async () => {
      const feedbacks = await prisma.deliveryFeedback.findMany({
        where: { orderId: testOrderId },
        select: { rating: true },
      });

      const avg =
        feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length;
      expect(avg).toBe(5);
    });
  });

  describe("Step 8: Order Status Transitions", () => {
    it("should have gone through all expected statuses", async () => {
      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
      });

      expect(order!.status).toBe("DELIVERED");
      expect(order!.paymentStatus).toBe("PAID");
    });

    it("should have a complete timeline of events", async () => {
      const order = await prisma.order.findUnique({
        where: { id: testOrderId },
      });

      expect(order!.createdAt).toBeDefined();
      expect(order!.deliveredAt).toBeDefined();
      expect(order!.createdAt.getTime()).toBeLessThan(order!.deliveredAt!.getTime());
    });
  });
});
