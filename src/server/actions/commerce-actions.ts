"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { validate, vId, vStr } from "@/lib/validate";

// ===================== REVIEW VOTING =====================

export async function voteReviewHelpful(reviewId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  try {
    await prisma.reviewVote.create({
      data: { reviewId, userId: session.user.id },
    });
    await prisma.review.update({
      where: { id: reviewId },
      data: { helpfulVotes: { increment: 1 } },
    });
    return { voted: true };
  } catch (err) {
    if (err instanceof Error && "code" in err && (err as { code: string }).code === "P2002") throw new Error("Already voted");
    throw err;
  }
}

export async function getReviewVotes(reviewId: string) {
  const review = await prisma.review.findUnique({
    where: { id: reviewId },
    select: { helpfulVotes: true },
  });
  return { helpfulVotes: review?.helpfulVotes ?? 0 };
}

// ===================== PRODUCT Q&A =====================

export async function createQuestion(data: {
  productId: string; question: string; userName?: string;
}) {
  const session = await getSession();
  const input = validate(z.object({
    productId: vId,
    question: vStr(2000),
    userName: z.string().trim().max(100).optional(),
  }), data);
  return prisma.productQuestion.create({
    data: {
      productId: input.productId,
      userId: session?.user.id,
      userName: (input.userName as string) || session?.user?.name || "Anonymous",
      question: input.question as string,
    },
  });
}

export async function createAnswer(data: {
  questionId: string; answer: string; isSeller?: boolean;
}) {
  const session = await getSession();
  const input = validate(z.object({
    questionId: vId,
    answer: vStr(5000),
    isSeller: z.boolean().optional(),
  }), data);
  return prisma.productAnswer.create({
    data: {
      questionId: input.questionId,
      userId: session?.user.id,
      isSeller: input.isSeller ?? false,
      answer: input.answer as string,
    },
  });
}

export async function listQuestions(productId: string) {
  return prisma.productQuestion.findMany({
    where: { productId, isPublic: true },
    include: {
      answers: { orderBy: { createdAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });
}

// ===================== PRICE HISTORY =====================

export async function recordPriceHistory(productId: string, price: number, oldPrice?: number, regionId?: string) {
  return prisma.priceHistory.create({
    data: { productId, price, oldPrice, regionId },
  });
}

export async function getPriceHistory(productId: string, days = 30) {
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.priceHistory.findMany({
    where: { productId, recordedAt: { gte: since } },
    orderBy: { recordedAt: "asc" },
  });
}

// ===================== PRICE DROP ALERTS =====================

export async function createPriceDropAlert(productId: string, targetPrice: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.priceDropAlert.create({
    data: {
      userId: session.user.id,
      productId,
      targetPrice,
    },
  });
}

export async function listPriceAlerts() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.priceDropAlert.findMany({
    where: { userId: session.user.id, isActive: true },
    include: { product: { select: { name: true, price: true } } },
  });
}

export async function cancelPriceAlert(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.priceDropAlert.update({
    where: { id },
    data: { isActive: false },
  });
}

// ===================== DAILY DEALS =====================

export async function listDailyDeals(date?: string) {
  const dealDate = date ? new Date(date) : new Date();
  const start = new Date(dealDate);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dealDate);
  end.setHours(23, 59, 59, 999);

  return prisma.dailyDeal.findMany({
    where: {
      isActive: true,
      dealDate: { gte: start, lte: end },
    },
    include: { product: true },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createDailyDeal(data: {
  productId: string; discountType: string; discountValue: number;
  dealDate: string; bannerImage?: string; description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.dailyDeal.create({
    data: {
      productId: data.productId,
      discountType: data.discountType,
      discountValue: data.discountValue,
      dealDate: new Date(data.dealDate),
      bannerImage: data.bannerImage,
      description: data.description,
    },
  });
}

export async function updateDailyDeal(id: string, data: {
  discountType?: string; discountValue?: number; isActive?: boolean;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.dailyDeal.update({
    where: { id },
    data: {
      ...(data.discountType && { discountType: data.discountType }),
      ...(typeof data.discountValue === "number" && { discountValue: data.discountValue }),
      ...(typeof data.isActive === "boolean" && { isActive: data.isActive }),
    },
  });
}

export async function deleteDailyDeal(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.dailyDeal.delete({ where: { id } });
}

// ===================== FAQ / KNOWLEDGE BASE =====================

export async function listFAQs(category?: string) {
  return prisma.fAQ.findMany({
    where: { isActive: true, ...(category ? { category } : {}) },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createFAQ(data: { category: string; question: string; answer: string }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.fAQ.create({ data });
}

export async function updateFAQ(id: string, data: { category?: string; question?: string; answer?: string; isActive?: boolean }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.fAQ.update({ where: { id }, data });
}

export async function deleteFAQ(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.fAQ.delete({ where: { id } });
}

// ===================== BRAND STORIES =====================

export async function createBrandStory(data: {
  brandId: string; title: string; content: string; heroImage?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.brandStory.create({ data });
}

export async function getBrandStory(brandId: string) {
  return prisma.brandStory.findFirst({
    where: { brandId, isPublic: true },
  });
}

// ===================== SOCIAL SHARING =====================

export async function recordShare(productId: string, platform: string) {
  const session = await getSession();
  return prisma.socialShare.create({
    data: {
      productId,
      userId: session?.user.id,
      platform,
    },
  });
}

export async function getShareCount(productId: string) {
  return prisma.socialShare.count({ where: { productId } });
}

// ===================== DELIVERY SLOTS =====================

export async function listDeliverySlots(from?: string, to?: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic Prisma where filter
  const where: any = { isActive: true };
  if (from) {
    const start = new Date(from);
    start.setHours(0, 0, 0, 0);
    where.date = { gte: start };
  }
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    where.date = { ...where.date, lte: end };
  }
  return prisma.deliverySlot.findMany({
    where,
    orderBy: { date: "asc" },
  });
}

export async function createDeliverySlot(data: {
  date: string; timeFrom: string; timeTo: string; maxOrders?: number; fee?: number;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.deliverySlot.create({
    data: {
      date: new Date(data.date),
      timeFrom: new Date(data.timeFrom),
      timeTo: new Date(data.timeTo),
      maxOrders: data.maxOrders ?? 100,
      fee: data.fee ?? 0,
    },
  });
}

export async function updateDeliverySlot(id: string, data: { isActive?: boolean; maxOrders?: number; fee?: number }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.deliverySlot.update({ where: { id }, data });
}

// ===================== NOTIFICATIONS =====================

export async function listNotifications(limit?: number) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: limit || 50,
  });
}

export async function markNotificationRead(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.notification.updateMany({
    where: { id, userId: session.user.id },
    data: { isRead: true },
  });
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.notification.updateMany({
    where: { userId: session.user.id, isRead: false },
    data: { isRead: true },
  });
}

export async function getUnreadNotificationCount() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.notification.count({
    where: { userId: session.user.id, isRead: false },
  });
}

// ===================== NOTIFICATION PREFERENCES =====================

export async function getNotificationPreferences() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  let prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });
  if (!prefs) {
    prefs = await prisma.notificationPreference.create({
      data: { userId: session.user.id },
    });
  }
  return prefs;
}

export async function updateNotificationPreferences(data: {
  orderUpdates?: boolean; priceAlerts?: boolean; promotions?: boolean;
  newsletter?: boolean; smsEnabled?: boolean; emailEnabled?: boolean;
  whatsappEnabled?: boolean; pushEnabled?: boolean;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.notificationPreference.update({
    where: { userId: session.user.id },
    data,
  });
}

// ===================== CALLBACK REQUESTS =====================

export async function createCallbackRequest(data: {
  userPhone: string; preferredTime?: string; reason?: string; userName?: string;
}) {
  const session = await getSession();
  return prisma.callbackRequest.create({
    data: {
      userId: session?.user.id,
      userName: data.userName || session?.user?.name || "Anonymous",
      userPhone: data.userPhone,
      preferredTime: data.preferredTime ? new Date(data.preferredTime) : null,
      reason: data.reason,
    },
  });
}

export async function listCallbackRequests(status?: string) {
  return prisma.callbackRequest.findMany({
    where: { ...(status ? { status } : {}) },
    orderBy: { createdAt: "desc" },
  });
}

export async function updateCallbackRequest(id: string, data: { status?: string; agentId?: string; notes?: string }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.callbackRequest.update({
    where: { id },
    data: {
      ...(data.status && { status: data.status }),
      ...(data.agentId && { agentId: data.agentId }),
      ...(data.notes && { notes: data.notes }),
    },
  });
}

// ===================== WEBHOOKS =====================

export async function listWebhooks() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.webhook.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createWebhook(data: {
  url: string; events: string; secret: string; description?: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.webhook.create({ data });
}

export async function updateWebhook(id: string, data: { isActive?: boolean; events?: string; url?: string }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.webhook.update({
    where: { id },
    data: {
      ...(typeof data.isActive === "boolean" && { isActive: data.isActive }),
      ...(data.events && { events: data.events }),
      ...(data.url && { url: data.url }),
    },
  });
}

export async function deleteWebhook(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.webhook.delete({ where: { id } });
}

export async function listWebhookDeliveries(webhookId: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.webhookDelivery.findMany({
    where: { webhookId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

// ===================== INTERNATIONAL TAX =====================

export async function listTaxRates(country?: string) {
  return prisma.taxRate.findMany({
    where: { isActive: true, ...(country ? { country } : {}) },
    orderBy: { country: "asc" },
  });
}

export async function createTaxRate(data: {
  country: string; state?: string; taxType?: string; rate: number; name: string;
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.taxRate.create({ data });
}

export async function calculateTax(amount: number, country: string, state?: string) {
  const rate = await prisma.taxRate.findFirst({
    where: { country, state: state || null, isActive: true },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!rate) return { rate: 0, amount: 0, taxType: "NONE" };
  return {
    rate: Number(rate.rate),
    amount: amount * Number(rate.rate) / 100,
    taxType: rate.taxType,
  };
}

// ===================== CURRENCY / MULTI-CURRENCY =====================

export async function listCurrencies() {
  const currencies = await prisma.currency.findMany({ where: { isActive: true }, orderBy: { code: "asc" } });
  return currencies.map((c) => ({
    ...c,
    rateToINR: Number(c.rateToINR),
  }));
}

export async function convertCurrency(amount: number, fromCode: string, toCode: string) {
  const [fromCurrency, toCurrency] = await Promise.all([
    prisma.currency.findUnique({ where: { code: fromCode } }),
    prisma.currency.findUnique({ where: { code: toCode } }),
  ]);

  if (!fromCurrency || !toCurrency) throw new Error("Currency not found");

  const amountInINR = amount * Number(fromCurrency.rateToINR);
  const convertedAmount = amountInINR / Number(toCurrency.rateToINR);

  return {
    amount,
    fromCode,
    toCode,
    converted: Math.round(convertedAmount * 100) / 100,
    rate: Number(toCurrency.rateToINR) / Number(fromCurrency.rateToINR),
  };
}

// ===================== BUNDLE DEALS =====================

export async function listBundleDeals() {
  return prisma.bundleDeal.findMany({
    where: { isActive: true },
    include: { items: { include: { product: true } } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function createBundleDeal(data: {
  name: string; description?: string; discountType: string; discountValue: number;
  minItems?: number; itemIds: string[];
}) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return prisma.bundleDeal.create({
    data: {
      name: data.name,
      description: data.description,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minItems: data.minItems ?? 2,
      items: {
        create: data.itemIds.map((id, i) => ({
          productId: id,
          sortOrder: i,
          required: true,
        })),
      },
    },
  });
}

export async function updateBundleDeal(id: string, data: { isActive?: boolean; name?: string; discountValue?: number }) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.bundleDeal.update({ where: { id }, data });
}

export async function deleteBundleDeal(id: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  await prisma.bundleDeal.delete({ where: { id } });
}

// ===================== VIDEO REVIEWS =====================

export async function createVideoReview(reviewId: string, videoUrl: string) {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return prisma.videoReview.create({ data: { reviewId, videoUrl } });
}

export async function listVideoReviews(reviewId: string) {
  return prisma.videoReview.findMany({ where: { reviewId } });
}
