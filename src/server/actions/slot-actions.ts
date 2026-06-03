"use server";

import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { withErrorHandling } from "@/lib/server-action-wrapper";
import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";
import {
  generateSlots,
  getAvailableSlots as getAvailableSlotsEngine,
  reserveSlot as reserveSlotEngine,
  type SlotConfig,
} from "@/lib/slot/slot-engine";

async function requireAdmin() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (session.user.role !== "ADMIN") throw new Error("Forbidden");
  return session;
}

// ── Public Actions ───────────────────────────────────────────────────────────────

/**
 * Get available delivery slots for a date range and zone.
 */
export const getAvailableSlots = withErrorHandling(
  async (input: { date: string; endDate?: string; zoneId: string }) => {
    const start = new Date(input.date);
    const end = input.endDate ? new Date(input.endDate) : new Date(start);
    end.setHours(23, 59, 59, 999);
    const slots = await getAvailableSlotsEngine(start, end, input.zoneId);
    return { slots };
  }
);

/**
 * Reserve a slot for an order.
 */
export const reserveSlot = withErrorHandling(
  async (input: { slotId: string; orderId: string }) => {
    const success = await reserveSlotEngine(input.slotId, input.orderId);
    if (!success) throw new Error("Slot unavailable");
    return { success: true };
  }
);

// ── Admin Actions ────────────────────────────────────────────────────────────────

/**
 * Get the current slot engine configuration from SystemConfig.
 */
export const getSlotConfig = withErrorHandling(async () => {
  await requireAdmin();

  const [
    durationMin,
    bufferMin,
    maxOrdersPerSlot,
    advanceBookingHours,
    cutoffMin,
    prepTimeMin,
  ] = await Promise.all([
    configService.getNumber(CONFIG_KEYS.SLOT_DURATION_MIN),
    configService.getNumber(CONFIG_KEYS.SLOT_BUFFER_MIN),
    configService.getNumber(CONFIG_KEYS.SLOT_MAX_ORDERS_PER_SLOT),
    configService.getNumber(CONFIG_KEYS.SLOT_ADVANCE_BOOKING_HOURS),
    configService.getNumber(CONFIG_KEYS.SLOT_CUTOFF_MIN),
    configService.getNumber(CONFIG_KEYS.SLOT_PREP_TIME_MIN),
  ]);

  const config: SlotConfig = {
    durationMin: durationMin || 30,
    bufferMin: bufferMin || 15,
    maxOrdersPerSlot: maxOrdersPerSlot || 10,
    advanceBookingHours: advanceBookingHours || 48,
    cutoffMin: cutoffMin || 30,
    prepTimeMin: prepTimeMin || 20,
    operatingHours: { start: "08:00", end: "22:00" },
  };

  return { config };
});

/**
 * Update slot engine configuration.
 */
export const updateSlotConfig = withErrorHandling(
  async (input: Partial<SlotConfig>) => {
    await requireAdmin();

    const updates: Array<[string, string]> = [];
    if (input.durationMin !== undefined)
      updates.push([CONFIG_KEYS.SLOT_DURATION_MIN, String(input.durationMin)]);
    if (input.bufferMin !== undefined)
      updates.push([CONFIG_KEYS.SLOT_BUFFER_MIN, String(input.bufferMin)]);
    if (input.maxOrdersPerSlot !== undefined)
      updates.push([CONFIG_KEYS.SLOT_MAX_ORDERS_PER_SLOT, String(input.maxOrdersPerSlot)]);
    if (input.advanceBookingHours !== undefined)
      updates.push([CONFIG_KEYS.SLOT_ADVANCE_BOOKING_HOURS, String(input.advanceBookingHours)]);
    if (input.cutoffMin !== undefined)
      updates.push([CONFIG_KEYS.SLOT_CUTOFF_MIN, String(input.cutoffMin)]);
    if (input.prepTimeMin !== undefined)
      updates.push([CONFIG_KEYS.SLOT_PREP_TIME_MIN, String(input.prepTimeMin)]);

    for (const [key, value] of updates) {
      await configService.set(key, value);
    }

    return { success: true, updated: updates.length };
  }
);

/**
 * Generate and preview slots for a given date (admin tool).
 */
export const previewSlots = withErrorHandling(
  async (input: { date: string; zoneId: string }) => {
    await requireAdmin();
    const date = new Date(input.date);
    const slots = await generateSlots(date, input.zoneId);
    return { slots };
  }
);

/**
 * Get today's slot utilization for a zone.
 */
export const getTodayUtilization = withErrorHandling(
  async (input?: { zoneId?: string }) => {
    await requireAdmin();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const slots = await prisma.deliverySlot.findMany({
      where: {
        date: { gte: today, lt: tomorrow },
      },
      orderBy: { timeFrom: "asc" },
    });

    const summary = slots.map((s) => ({
      id: s.id,
      timeFrom: s.timeFrom,
      timeTo: s.timeTo,
      maxOrders: s.maxOrders,
      bookedOrders: s.bookedOrders,
      utilization: s.maxOrders > 0 ? (s.bookedOrders / s.maxOrders) * 100 : 0,
      fee: Number(s.fee),
      isActive: s.isActive,
    }));

    return { slots: summary, zoneId: input?.zoneId };
  }
);
