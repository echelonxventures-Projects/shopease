import { describe, it, expect } from "vitest";
import { addToCartSchema, updateCartSchema, removeFromCartSchema } from "@/lib/validations/cart";
import { addressSchema } from "@/lib/validations/address";
import { paymentSchema } from "@/lib/validations/payment";
import { reviewSchema } from "@/lib/validations/review";
import { walletSchema, voucherRedeemSchema } from "@/lib/validations/wallet";
import { paginationSchema } from "@/lib/validations/common";

describe("Cart Validation Schemas", () => {
  it("accepts valid addToCart input", () => {
    const result = addToCartSchema.safeParse({ productId: "abc123", quantity: 2 });
    expect(result.success).toBe(true);
  });

  it("rejects zero quantity", () => {
    const result = addToCartSchema.safeParse({ productId: "abc", quantity: 0 });
    expect(result.success).toBe(false);
  });

  it("rejects excessive quantity", () => {
    const result = addToCartSchema.safeParse({ productId: "abc", quantity: 100 });
    expect(result.success).toBe(false);
  });

  it("rejects empty productId", () => {
    const result = addToCartSchema.safeParse({ productId: "", quantity: 1 });
    expect(result.success).toBe(false);
  });
});

describe("Address Validation Schemas", () => {
  const validAddress = {
    fullName: "John Doe",
    phone: "+91 9876543210",
    street: "123 Main St",
    city: "Mumbai",
    state: "MH",
    zipCode: "400001",
    country: "India",
  };

  it("accepts valid address", () => {
    const result = addressSchema.safeParse(validAddress);
    expect(result.success).toBe(true);
  });

  it("rejects invalid phone", () => {
    const result = addressSchema.safeParse({ ...validAddress, phone: "abc" });
    expect(result.success).toBe(false);
  });

  it("rejects short name", () => {
    const result = addressSchema.safeParse({ ...validAddress, fullName: "J" });
    expect(result.success).toBe(false);
  });
});

describe("Payment Validation Schemas", () => {
  it("accepts valid payment", () => {
    const result = paymentSchema.safeParse({
      amount: 500,
      currency: "INR",
      method: "razorpay",
      orderId: "ord_123",
    });
    expect(result.success).toBe(true);
  });

  it("rejects negative amount", () => {
    const result = paymentSchema.safeParse({
      amount: -100,
      currency: "INR",
      method: "razorpay",
      orderId: "ord_123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid payment method", () => {
    const result = paymentSchema.safeParse({
      amount: 100,
      currency: "INR",
      method: "bitcoin",
      orderId: "ord_123",
    });
    expect(result.success).toBe(false);
  });
});

describe("Review Validation Schemas", () => {
  it("accepts valid review", () => {
    const result = reviewSchema.safeParse({ productId: "abc", rating: 5, comment: "Great!" });
    expect(result.success).toBe(true);
  });

  it("rejects rating out of range", () => {
    const result = reviewSchema.safeParse({ productId: "abc", rating: 6 });
    expect(result.success).toBe(false);
  });
});

describe("Wallet/Voucher Validation", () => {
  it("accepts valid voucher redeem", () => {
    const result = voucherRedeemSchema.safeParse({ code: "SAVE20" });
    expect(result.success).toBe(true);
  });

  it("rejects empty voucher code", () => {
    const result = voucherRedeemSchema.safeParse({ code: "" });
    expect(result.success).toBe(false);
  });
});

describe("Pagination Schema", () => {
  it("defaults page to 1 and limit to 20", () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.page).toBe(1);
      expect(result.data.limit).toBe(20);
    }
  });

  it("rejects limit above 100", () => {
    const result = paginationSchema.safeParse({ limit: 101 });
    expect(result.success).toBe(false);
  });
});
