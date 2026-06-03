"use server";

import { prisma } from "@/lib/prisma";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { getSession } from "@/lib/auth";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-unused-vars -- used for type inference via z.infer
const feedbackSchema = z.object({
  orderId: z.string(),
  deliveryAgentId: z.string().optional(),
  rating: z.number().min(1).max(5),
  comment: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const submitDeliveryFeedback = withErrorHandling(async (data: z.infer<typeof feedbackSchema>) => {
  const session = await getSession();
  if (!session?.user?.id) {
    return { error: "Unauthorized", code: "UNAUTHORIZED" };
  }

  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: { deliveryAssignment: true },
  });

  if (!order) {
    return { error: "Order not found", code: "NOT_FOUND" };
  }

  if (order.userId !== session.user.id) {
    return { error: "Forbidden", code: "FORBIDDEN" };
  }

  if (order.status !== "DELIVERED") {
    return { error: "Can only submit feedback for delivered orders", code: "VALIDATION_ERROR" };
  }

  const existing = await prisma.deliveryFeedback.findUnique({
    where: { orderId: data.orderId },
  });

  if (existing) {
    return { error: "Feedback already submitted for this order", code: "DUPLICATE" };
  }

  const feedback = await prisma.deliveryFeedback.create({
    data: {
      orderId: data.orderId,
      deliveryAgentId: data.deliveryAgentId || order.deliveryAssignment?.deliveryAgentId,
      overallRating: data.rating,
      comment: data.comment,
      tags: data.tags || [],
    },
  });

  if (feedback.deliveryAgentId) {
    const agentFeedbacks = await prisma.deliveryFeedback.findMany({
      where: { deliveryAgentId: feedback.deliveryAgentId },
      select: { overallRating: true },
    });

    const avgRating = agentFeedbacks.reduce((sum, f) => sum + f.overallRating, 0) / agentFeedbacks.length;

    await prisma.deliveryAgent.update({
      where: { id: feedback.deliveryAgentId },
      data: { rating: avgRating },
    });
  }

  return { success: true, feedback };
});

export const getDeliveryFeedback = withErrorHandling(async (orderId: string) => {
  const feedback = await prisma.deliveryFeedback.findUnique({
    where: { orderId },
  });

  return { feedback };
});

export const getAgentFeedbackStats = withErrorHandling(async (agentId: string) => {
  const feedbacks = await prisma.deliveryFeedback.findMany({
    where: { deliveryAgentId: agentId },
    select: { overallRating: true, createdAt: true },
  });

  const total = feedbacks.length;
  const avgRating = total > 0 ? feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / total : 0;
  const distribution = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: feedbacks.filter(f => f.overallRating === rating).length,
  }));

  const last30Days = feedbacks.filter(f => {
    const daysDiff = (Date.now() - f.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    return daysDiff <= 30;
  }).length;

  return {
    total,
    avgRating: Math.round(avgRating * 10) / 10,
    distribution,
    last30Days,
  };
});
