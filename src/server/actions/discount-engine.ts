"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { hash, encryptPIIFields } from "@/lib/encryption";
import { type CartContext } from "@/server/repositories/promo-repo";
import { evaluatePromotions, type PromotionContext } from "@/server/repositories/promotion-engine";
import { sendOrderNotification } from "@/server/services/notification-service";
import type { Prisma } from "@prisma/client";

// ===================== TYPES =====================

export interface TierDeduction {
  tierId: string;
  tierName: string;
  tierSlug: string;
  deduction: number;
  balanceBefore: number;
  balanceAfter: number;
}

export interface OrderDiscountData {
  subtotal: number;
  promoDiscount: number;
  shippingDiscount: number;
  tierDiscountTotal: number;
  walletDiscount: number;
  totalDiscount: number;
  finalTotal: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
  appliedPromos: any[];
  tierDeductions: TierDeduction[];
}

// ===================== DISCOUNT ORDER =====================
//
// 1. Calculate promo discounts (auto-evaluate + manual code)
// 2. Tier balance deductions (sortOrder priority, maxRedemptionPerOrder enforced)
// 3. Main wallet deduction
// 4. Final total = remaining amount for external payment

export async function orchestrateCheckoutDiscount(
  cart: CartContext,
  manualPromoCode: string | null,
  walletToUse: number,
  tierAmounts: Record<string, number>,
  options?: { isGuest?: boolean; guestUserId?: string },
): Promise<OrderDiscountData> {
  const session = await getSession();
  let userId: string | null = null;

  if (options?.isGuest && options?.guestUserId) {
    userId = options.guestUserId;
  } else if (!session) {
    throw new Error("Unauthorized");
  } else {
    userId = session.user?.id as string;
  }
  // --- Step 1: Evaluate promos ---
  const enrichedCart: CartContext = {
    ...cart,
    items: await enrichCartItems(cart.items),
  };

  // --- Step 0.5: Apply product-level tier pricing (before promos) ---
  const tierPricedItems = await applyProductTierPricing(enrichedCart.items);
  enrichedCart.items = tierPricedItems;

  // --- Step 1: Evaluate promos via unified promotion engine ---
  const promoContext: PromotionContext = {
    items: enrichedCart.items,
    subtotal: cart.subtotal,
    userId,
    paymentMethod: cart.paymentMethod,
    regionId: cart.regionId,
  };

  const promoResult = await evaluatePromotions(promoContext);
  let promoDiscount = promoResult.totalDiscount;
  let appliedPromos = promoResult.applied;
  const shippingDiscount = promoResult.totalShippingDiscount;

  // Apply manual promo code if provided
  if (manualPromoCode) {
    const codeHash = hash(manualPromoCode.toUpperCase().trim());
    const manualPromo = await prisma.promo.findFirst({
      where: { codeHash, isActive: true, status: "ACTIVE" },
    });
    if (manualPromo) {
      const now = new Date();
      const valid = manualPromo.validFrom <= now && (!manualPromo.validUntil || manualPromo.validUntil >= now);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion for Prisma compatibility
      const underLimit = !manualPromo.maxUses || (manualPromo as any).usedCount < (manualPromo as any).maxUses;
      if (valid && underLimit) {
        const manualResult = await evaluatePromotions(promoContext);
        const matched = manualResult.applied.find((p) => p.promotionId === manualPromo.id);
        if (matched) {
          promoDiscount = manualResult.totalDiscount;
          appliedPromos = manualResult.applied;
        }
      }
    }
  }

  const afterPromo = Math.max(0, cart.subtotal - promoDiscount);

  // --- Step 2: Load tier balances (region-filtered) ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
  const tierWhere: any = { isActive: true };
  if (cart.regionId) {
    tierWhere.OR = [{ regionId: null }, { regionId: cart.regionId }];
  } else {
    tierWhere.regionId = null;
  }

  const tiers = await prisma.voucherTier.findMany({
    where: tierWhere,
    orderBy: { sortOrder: "asc" },
  });

  const tierBalances = await prisma.voucherTierBalance.findMany({
    where: { userId, balance: { gt: 0 } },
  });

  const tierBalanceMap = new Map(
    tierBalances.map((tb) => [tb.voucherTierId, tb]),
  );

  // --- Step 3: Calculate tier deductions with maxRedemptionPerOrder ---
  const tierDeductions: TierDeduction[] = [];
  let remaining = afterPromo;

  for (const tier of tiers) {
    if (remaining <= 0) break;

    const balance = tierBalanceMap.get(tier.id);
    if (!balance) continue;

    const available = Number(balance.balance);
    if (available <= 0) continue;

    // Enforce maxRedemptionPerOrder as % of after-promo subtotal
    const maxPerOrder = tier.maxRedemptionPerOrder
      ? (Number(tier.maxRedemptionPerOrder) / 100) * afterPromo
      : afterPromo;

    const requested = tierAmounts[tier.slug] || 0;
    const deduction = Math.min(
      requested,
      available,
      maxPerOrder,
      remaining,
    );

    if (deduction > 0) {
      tierDeductions.push({
        tierId: tier.id,
        tierName: tier.name,
        tierSlug: tier.slug,
        deduction: Math.round(deduction * 100) / 100,
        balanceBefore: available,
        balanceAfter: Math.round((available - deduction) * 100) / 100,
      });
      remaining -= deduction;
    }
  }

  const tierDiscountTotal = tierDeductions.reduce((sum, d) => sum + d.deduction, 0);
  const afterTiers = remaining;

  // --- Step 4: Main wallet deduction ---
  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  let walletDeduction = 0;
  if (wallet) {
    const walletBalance = Number(wallet.balance);
    walletDeduction = Math.min(walletToUse, walletBalance, afterTiers);
    walletDeduction = Math.round(walletDeduction * 100) / 100;
  }

  const finalTotal = Math.max(0, afterTiers - walletDeduction);

  return {
    subtotal: cart.subtotal,
    promoDiscount,
    shippingDiscount,
    tierDiscountTotal,
    walletDiscount: walletDeduction,
    totalDiscount: promoDiscount + shippingDiscount + tierDiscountTotal + walletDeduction,
    finalTotal,
    appliedPromos,
    tierDeductions,
  };
}

// ===================== ATOMIC ORDER PLACEMENT =====================

export async function placeOrderWithDiscounts(
  discountData: OrderDiscountData,
  orderPayload: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
    items: any[];
    tax: number;
    shippingCost: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
    shippingAddress: any;
    paymentMethod: string;
    couponCode?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
    appliedPromos?: any[];
    notes?: string;
    orderNotes?: string;
    isGift?: boolean;
    giftMessage?: string;
    giftWrapFee?: number;
    isExpress?: boolean;
    expressFee?: number;
    codFee?: number;
    isGuestOrder?: boolean;
    guestEmail?: string;
    deliverySlotId?: string;
  }
) {
  const session = await getSession();
  let userId: string;
  let _guestTempUserId: string | null = null;

  if (orderPayload.isGuestOrder) {
    // Create a temporary user for guest checkout
    const tempEmail = orderPayload.guestEmail || `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}@guest.shopease`;
    const tempUser = await prisma.user.create({
      data: {
        email: tempEmail,
        password: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
        name: orderPayload.shippingAddress?.fullName || "Guest",
        phone: orderPayload.shippingAddress?.phone || null,
        role: "CUSTOMER",
      },
    });
    userId = tempUser.id;
    _guestTempUserId = tempUser.id;
  } else if (!session) {
    throw new Error("Unauthorized");
  } else {
    userId = session.user?.id as string;
  }

  return prisma.$transaction(async (tx) => {
    // Get user's region for order tracking
    const user = await tx.user.findUnique({ where: { id: userId }, include: { region: true } });

    // 1. Deduct tier balances
    for (const td of discountData.tierDeductions) {
      if (td.deduction <= 0) continue;
      await tx.voucherTierBalance.update({
        where: { userId_voucherTierId: { userId, voucherTierId: td.tierId } },
        data: { balance: td.balanceAfter },
      });
    }

    // 2. Deduct main wallet
    if (discountData.walletDiscount > 0) {
      const wallet = await tx.wallet.findUnique({ where: { userId } });
      if (!wallet) throw new Error("Wallet not found");

      const balanceBefore = Number(wallet.balance);
      const balanceAfter = balanceBefore - discountData.walletDiscount;

      await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "DEBIT",
          amount: discountData.walletDiscount,
          currency: wallet.currency,
          balanceBefore,
          balanceAfter,
          description: "Order payment (wallet)",
          referenceType: "ORDER",
        },
      });
    }

    // 3. Record promo usage
    for (const promo of discountData.appliedPromos) {
      await tx.promoUsage.create({
        data: {
          promoId: promo.promotionId,
          userId,
          discount: promo.discount || 0,
        },
      });

      await tx.promo.update({
        where: { id: promo.promotionId },
        data: { usedCount: { increment: 1 } },
      });
    }

    // 4. Create order
    const orderCount = await tx.order.count();
    const orderNumber = `ORD-${Date.now().toString().slice(-6)}-${(orderCount + 1).toString().padStart(4, "0")}`;

    // Resolve location names for shipping address
    const shippingAddr = orderPayload.shippingAddress as Record<string, string>;
    const countryLoc = shippingAddr?.countryId
      ? await tx.location.findUnique({ where: { id: shippingAddr.countryId }, select: { name: true } })
      : null;
    const stateLoc = shippingAddr?.stateId
      ? await tx.location.findUnique({ where: { id: shippingAddr.stateId }, select: { name: true } })
      : null;
    const districtLoc = shippingAddr?.districtId
      ? await tx.location.findUnique({ where: { id: shippingAddr.districtId }, select: { name: true } })
      : null;
    const villageLoc = shippingAddr?.villageId
      ? await tx.location.findUnique({ where: { id: shippingAddr.villageId }, select: { name: true } })
      : null;

    const resolvedAddress = shippingAddr ? {
      ...shippingAddr,
      // Encrypt PII fields at rest (GDPR Article 32)
      fullName: encryptPIIFields({ fullName: shippingAddr.fullName || "" }).fullName,
      phone: encryptPIIFields({ phone: shippingAddr.phone || "" }).phone,
      countryName: countryLoc?.name || shippingAddr.country || "",
      stateName: stateLoc?.name || shippingAddr.state || "",
      districtName: districtLoc?.name || "",
      villageName: villageLoc?.name || "",
    } : null;

    const order = await tx.order.create({
      data: {
        userId,
        orderNumber,
        items: orderPayload.items,
        subtotal: discountData.subtotal,
        tax: orderPayload.tax,
        shippingCost: orderPayload.shippingCost,
        discount: discountData.totalDiscount,
        total: discountData.finalTotal,
        shippingAddress: resolvedAddress as unknown as Prisma.InputJsonValue,
        paymentMethod: orderPayload.paymentMethod,
        couponCode: orderPayload.couponCode,
        notes: orderPayload.notes,
        orderNotes: orderPayload.orderNotes,
        isGift: orderPayload.isGift ?? false,
        giftMessage: orderPayload.giftMessage,
        giftWrapFee: orderPayload.giftWrapFee ?? 0,
        isExpress: orderPayload.isExpress ?? false,
        expressFee: orderPayload.expressFee ?? 0,
        codFee: orderPayload.codFee ?? 0,
        isGuestOrder: orderPayload.isGuestOrder ?? false,
        guestEmail: orderPayload.guestEmail,
        deliverySlotId: orderPayload.deliverySlotId,
        regionId: user?.regionId || null,
        currency: user?.region?.currency || "INR",
      },
    });

    await tx.orderStatusHistory.create({
      data: { orderId: order.id, status: "PENDING", message: "Order placed" },
    });

    // Trigger order notification
    try {
      await sendOrderNotification(order.id, "PENDING");
    } catch {
      // Non-critical: notification failure should not block order
    }

    // 5. Deduct stock for each product
    for (const item of orderPayload.items) {
      if (item.variantId) {
        // Deduct from variant stock
        const variant = await tx.productVariant.findUnique({ where: { id: item.variantId } });
        if (variant) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Also deduct from product aggregate stock
      await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });

      // Deduct from inventory if exists (global, no location)
      const inv = await tx.inventory.findFirst({
        where: { productId: item.productId, locationId: null },
      });
      if (inv) {
        const beforeQty = inv.quantity;
        const afterQty = beforeQty - item.quantity;
        await tx.inventory.update({
          where: { id: inv.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Log inventory change
        await tx.inventoryLog.create({
          data: {
            inventoryId: inv.id,
            productId: item.productId,
            supplierId: inv.supplierId,
            locationId: null,
            type: "SALE_DEDUCTION",
            quantity: -item.quantity,
            beforeQuantity: beforeQty,
            afterQuantity: afterQty,
            referenceType: "ORDER",
            reference: `Order #${orderNumber}`,
            notes: `Deducted ${item.quantity} units for order ${orderNumber}`,
          },
        });
      }

      // Record stock movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          supplierId: null,
          locationId: null,
          type: "ORDER_FULFILLMENT",
          quantity: -item.quantity,
          referenceType: "ORDER",
          reference: `Order #${orderNumber}`,
          notes: `Deducted ${item.quantity} units for order ${orderNumber}`,
        },
      });
    }

    // 6. Create payment record for remaining amount
    if (discountData.finalTotal > 0) {
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: discountData.finalTotal,
          method: orderPayload.paymentMethod,
          status: "PENDING",
        },
      });
    }

    // 7. Clear cart
    await tx.cartItem.deleteMany({ where: { userId } });

    return order;
  });
}

// ===================== HELPER =====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic Prisma result serializer
async function enrichCartItems(items: any[]) {
  if (items.length === 0) return items;
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((i) => i.productId) } },
    select: { id: true, brandId: true, categoryId: true },
  });
  const productMap = new Map(products.map((p) => [p.id, p]));
  return items.map((item) => ({
    ...item,
    brandId: productMap.get(item.productId)?.brandId ?? null,
    categoryId: productMap.get(item.productId)?.categoryId ?? "",
  }));
}

// ===================== TIER PRICING =====================

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
async function applyProductTierPricing(items: any[]) {
  if (items.length === 0) return items;

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    include: { tierPrices: { where: { isActive: true }, orderBy: { minQty: "asc" } } },
  });

  const productMap = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const product = productMap.get(item.productId);
    if (!product?.tierPrices?.length) return item;

    const qty = item.quantity || 1;
    // Find applicable tier (highest minQty that qty >= minQty)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic structure
    let applicableTier: any = null;
    for (const tier of product.tierPrices) {
      if (qty >= tier.minQty && (!tier.maxQty || qty <= tier.maxQty)) {
        applicableTier = tier;
      }
    }

    if (!applicableTier) return item;

    // Apply tier price
    const unitPrice = applicableTier.price ? Number(applicableTier.price) : item.price;
    if (applicableTier.discountPercentage) {
      const discount = Number(applicableTier.discountPercentage) / 100;
      return { ...item, price: item.price * (1 - discount), tierDiscount: discount };
    }

    return { ...item, price: unitPrice, tierDiscount: 0 };
  });
}

// ===================== TAX CATEGORY RULES =====================

export async function calculateTaxForCart(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic array from Prisma Json field
  items: any[],
  regionId: string | null,
): Promise<number> {
  if (!regionId || items.length === 0) return 0;

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, taxCategory: true },
  });

  const productTaxMap = new Map(products.map((p) => [p.id, p.taxCategory || "STANDARD"]));

  // Load tax rules for this region
  const taxRules = await prisma.taxCategoryRule.findMany({
    where: { regionId, isActive: true },
  });

  const taxRateMap = new Map(taxRules.map((r) => [r.taxCategory, Number(r.taxRate)]));

  let totalTax = 0;
  for (const item of items) {
    const taxCategory = productTaxMap.get(item.productId) || "STANDARD";
    const taxRate = taxRateMap.get(taxCategory) || taxRateMap.get("STANDARD") || 0.18;
    const itemTotal = Number(item.price) * Number(item.quantity || 1);
    totalTax += itemTotal * taxRate;
  }

  return Math.round(totalTax * 100) / 100;
}
