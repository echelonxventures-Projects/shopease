"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";

/**
 * Get notification preferences for the current user.
 */
export const getNotificationPreferences = withErrorHandling(async () => {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const prefs = await prisma.notificationPreference.findUnique({
    where: { userId: session.user.id },
  });

  if (!prefs) {
    // Create default preferences
    const created = await prisma.notificationPreference.create({
      data: { userId: session.user.id },
    });
    return {
      orderUpdates: created.orderUpdates,
      priceAlerts: created.priceAlerts,
      promotions: created.promotions,
      newsletter: created.newsletter,
      emailEnabled: created.emailEnabled,
      smsEnabled: created.smsEnabled,
      whatsappEnabled: created.whatsappEnabled,
      pushEnabled: created.pushEnabled,
    };
  }

  return {
    orderUpdates: prefs.orderUpdates,
    priceAlerts: prefs.priceAlerts,
    promotions: prefs.promotions,
    newsletter: prefs.newsletter,
    emailEnabled: prefs.emailEnabled,
    smsEnabled: prefs.smsEnabled,
    whatsappEnabled: prefs.whatsappEnabled,
    pushEnabled: prefs.pushEnabled,
  };
});

/**
 * Update a specific notification preference.
 * channel: "email" | "sms" | "push" | "whatsapp"
 * category: "orderUpdates" | "priceAlerts" | "promotions" | "newsletter"
 */
export const updatePreference = withErrorHandling(
  async (channel: string, category: string, enabled: boolean) => {
    const session = await getSession();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const validChannels = ["email", "sms", "push", "whatsapp"];
    const validCategories = [
      "orderUpdates",
      "priceAlerts",
      "promotions",
      "newsletter",
    ];

    if (!validChannels.includes(channel)) {
      throw new Error(`Invalid channel: ${channel}`);
    }
    if (!validCategories.includes(category)) {
      throw new Error(`Invalid category: ${category}`);
    }

    const channelField = `${channel}Enabled` as string;

    // Upsert: create if not exists, update if exists
    const prefs = await prisma.notificationPreference.upsert({
      where: { userId: session.user.id },
      create: {
        userId: session.user.id,
        [category]: category === "orderUpdates" || category === "priceAlerts" ? enabled : enabled,
        [channelField]: enabled,
      },
      update: {
        [category]: enabled,
        [channelField]: enabled,
      },
    });

    return {
      orderUpdates: prefs.orderUpdates,
      priceAlerts: prefs.priceAlerts,
      promotions: prefs.promotions,
      newsletter: prefs.newsletter,
      emailEnabled: prefs.emailEnabled,
      smsEnabled: prefs.smsEnabled,
      whatsappEnabled: prefs.whatsappEnabled,
      pushEnabled: prefs.pushEnabled,
    };
  },
);
