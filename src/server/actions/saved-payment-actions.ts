"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";

/**
 * Get all saved payment methods for the current user.
 */
export const getSavedPaymentMethods = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // Using raw query since SavedPaymentMethod may not be in the schema yet.
  // Fallback: return empty array if the table does not exist.
  try {
    const methods = await prisma.$queryRawUnsafe(
      `SELECT id, "userId", "cardType", "lastFour", "expiryMonth", "expiryYear", "cardholderName", "isDefault", "paymentToken", "createdAt"
       FROM saved_payment_methods
       WHERE "userId" = $1
       ORDER BY "isDefault" DESC, "createdAt" DESC`,
      session.user.id,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    return (methods as any[]).map((m) => ({
      id: m.id,
      cardType: m.cardType,
      lastFour: m.lastFour,
      expiryMonth: m.expiryMonth,
      expiryYear: m.expiryYear,
      cardholderName: m.cardholderName,
      isDefault: m.isDefault,
      createdAt: m.createdAt,
    }));
  } catch {
    // Table may not exist yet
    return [];
  }
});

/**
 * Save a new payment method.
 * token: payment gateway token (e.g., Razorpay token)
 */
export const savePaymentMethod = withErrorHandling(
  async (token: string) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Parse the token (expected to be JSON with card details from gateway)
    let cardDetails: {
      cardType?: string;
      lastFour?: string;
      expiryMonth?: string;
      expiryYear?: string;
      cardholderName?: string;
    };

    try {
      cardDetails = JSON.parse(token);
    } catch {
      throw new Error("Invalid payment token format");
    }

    if (!cardDetails.lastFour) {
      throw new Error("Card details are incomplete");
    }

    try {
      // Check if this card already exists
      const existing = await prisma.$queryRawUnsafe(
        `SELECT id FROM saved_payment_methods WHERE "userId" = $1 AND "lastFour" = $2`,
        session.user.id,
        cardDetails.lastFour,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
      if ((existing as any[]).length > 0) {
        throw new Error("This card is already saved");
      }

      // Check if user has any existing methods (to set first as default)
      const count = await prisma.$queryRawUnsafe(
        `SELECT COUNT(*) as count FROM saved_payment_methods WHERE "userId" = $1`,
        session.user.id,
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
      const isFirst = (count as any[])[0]?.count === "0" || (count as any[])[0]?.count === 0;

      const result = await prisma.$queryRawUnsafe(
        `INSERT INTO saved_payment_methods (id, "userId", "cardType", "lastFour", "expiryMonth", "expiryYear", "cardholderName", "isDefault", "paymentToken", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING id, "cardType", "lastFour", "expiryMonth", "expiryYear", "cardholderName", "isDefault"`,
        session.user.id,
        cardDetails.cardType || "CARD",
        cardDetails.lastFour,
        cardDetails.expiryMonth || null,
        cardDetails.expiryYear || null,
        cardDetails.cardholderName || null,
        isFirst,
        token,
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
      return (result as any[])[0];
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already saved")) throw err;
      // Table may not exist yet
      throw new Error("Unable to save payment method");
    }
  },
);

/**
 * Delete a saved payment method.
 */
export const deletePaymentMethod = withErrorHandling(async (id: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    const method = await prisma.$queryRawUnsafe(
      `SELECT id, "userId", "isDefault" FROM saved_payment_methods WHERE id = $1`,
      id,
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    if (!(method as any[]).length) throw new Error("Payment method not found");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    if ((method as any[])[0].userId !== session.user.id) throw new Error("Unauthorized");

    await prisma.$queryRawUnsafe(
      `DELETE FROM saved_payment_methods WHERE id = $1`,
      id,
    );

    // If deleted method was default, set next available as default
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
    if ((method as any[])[0].isDefault) {
      await prisma.$queryRawUnsafe(
        `UPDATE saved_payment_methods SET "isDefault" = true
         WHERE "userId" = $1
         ORDER BY "createdAt" DESC LIMIT 1`,
        session.user.id,
      );
    }

    return { success: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("not found") || msg.includes("Unauthorized")) throw err;
    throw new Error("Unable to delete payment method");
  }
});

/**
 * Set a payment method as the default.
 */
export const setDefaultMethod = withErrorHandling(async (id: string) => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  try {
    // Reset all to non-default
    await prisma.$queryRawUnsafe(
      `UPDATE saved_payment_methods SET "isDefault" = false WHERE "userId" = $1`,
      session.user.id,
    );

    // Set the selected one as default
    await prisma.$queryRawUnsafe(
      `UPDATE saved_payment_methods SET "isDefault" = true WHERE id = $1 AND "userId" = $2`,
      id,
      session.user.id,
    );

    return { success: true };
  } catch {
    throw new Error("Unable to set default payment method");
  }
});
