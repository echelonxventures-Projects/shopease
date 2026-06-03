import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import { configService } from "@/lib/config/config-service";
import { CONFIG_KEYS } from "@/lib/config/config-keys";

// ── Types ────────────────────────────────────────────────────────────────────────

export interface SlotConfig {
  durationMin: number;         // default 30
  bufferMin: number;           // default 15
  maxOrdersPerSlot: number;    // default 10
  advanceBookingHours: number; // default 48
  cutoffMin: number;           // default 30
  prepTimeMin: number;         // default 20
  operatingHours: { start: string; end: string }; // "08:00", "22:00"
}

export interface TimeSlot {
  id: string;
  startTime: Date;
  endTime: Date;
  available: boolean;
  bookedCount: number;
  remainingCapacity: number;
  price: number; // delivery fee for this slot
}

// ── Defaults ─────────────────────────────────────────────────────────────────────

const DEFAULT_CONFIG: SlotConfig = {
  durationMin: 30,
  bufferMin: 15,
  maxOrdersPerSlot: 10,
  advanceBookingHours: 48,
  cutoffMin: 30,
  prepTimeMin: 20,
  operatingHours: { start: "08:00", end: "22:00" },
};

async function loadSlotConfig(): Promise<SlotConfig> {
  try {
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

    return {
      durationMin: durationMin || DEFAULT_CONFIG.durationMin,
      bufferMin: bufferMin || DEFAULT_CONFIG.bufferMin,
      maxOrdersPerSlot: maxOrdersPerSlot || DEFAULT_CONFIG.maxOrdersPerSlot,
      advanceBookingHours: advanceBookingHours || DEFAULT_CONFIG.advanceBookingHours,
      cutoffMin: cutoffMin || DEFAULT_CONFIG.cutoffMin,
      prepTimeMin: prepTimeMin || DEFAULT_CONFIG.prepTimeMin,
      operatingHours: DEFAULT_CONFIG.operatingHours,
    };
  } catch (error) {
    logger.warn({ module: "slot-engine", error }, "Failed to load slot config, using defaults");
    return DEFAULT_CONFIG;
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────────

function parseTime(time: string): { hour: number; minute: number } {
  const [h, m] = time.split(":").map(Number);
  return { hour: h ?? 8, minute: m ?? 0 };
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ── Slot Generation ──────────────────────────────────────────────────────────────

export async function generateSlots(
  date: Date,
  zoneId: string,
  config?: Partial<SlotConfig>
): Promise<TimeSlot[]> {
  const cfg: SlotConfig = {
    ...(await loadSlotConfig()),
    ...(config || {}),
    operatingHours: config?.operatingHours ?? (await loadSlotConfig()).operatingHours,
  };

  const dayStart = startOfDay(date);
  const start = parseTime(cfg.operatingHours.start);
  const end = parseTime(cfg.operatingHours.end);

  const firstSlot = new Date(dayStart);
  firstSlot.setHours(start.hour, start.minute, 0, 0);

  const lastSlot = new Date(dayStart);
  lastSlot.setHours(end.hour, end.minute, 0, 0);

  // Fetch existing slots for the day
  const existingSlots = await prisma.deliverySlot.findMany({
    where: {
      date: dayStart,
      isActive: true,
    },
  });

  const existingMap = new Map(
    existingSlots.map((s) => [`${s.timeFrom.getTime()}`, s])
  );

  const slots: TimeSlot[] = [];
  const cursor = new Date(firstSlot);

  while (cursor.getTime() + cfg.durationMin * 60_000 <= lastSlot.getTime()) {
    const slotStart = new Date(cursor);
    const slotEnd = new Date(cursor.getTime() + cfg.durationMin * 60_000);

    const existing = existingMap.get(String(slotStart.getTime()));
    const bookedCount = existing?.bookedOrders ?? 0;
    const maxOrders = existing?.maxOrders ?? cfg.maxOrdersPerSlot;
    const fee = existing ? Number(existing.fee) : 0;

    slots.push({
      id: existing?.id ?? `slot-${zoneId}-${slotStart.getTime()}`,
      startTime: slotStart,
      endTime: slotEnd,
      available: bookedCount < maxOrders,
      bookedCount,
      remainingCapacity: Math.max(0, maxOrders - bookedCount),
      price: fee,
    });

    cursor.setTime(cursor.getTime() + (cfg.durationMin + cfg.bufferMin) * 60_000);
  }

  logger.debug(
    { module: "slot-engine", zoneId, date: dayStart.toISOString(), count: slots.length },
    "Generated time slots"
  );

  return slots;
}

// ── Available Slots ──────────────────────────────────────────────────────────────

export async function getAvailableSlots(
  startDate: Date,
  endDate: Date,
  zoneId: string
): Promise<TimeSlot[]> {
  const cfg = await loadSlotConfig();
  const now = new Date();
  const cutoffMs = cfg.cutoffMin * 60_000;
  const prepMs = cfg.prepTimeMin * 60_000;
  const advanceMs = cfg.advanceBookingHours * 60 * 60_000;

  // Clamp range to advance booking window
  const maxEnd = new Date(now.getTime() + advanceMs);
  const effectiveEnd = endDate > maxEnd ? maxEnd : endDate;

  const allSlots: TimeSlot[] = [];
  const cursor = new Date(startDate);
  cursor.setHours(0, 0, 0, 0);

  while (cursor <= effectiveEnd) {
    const daySlots = await generateSlots(new Date(cursor), zoneId);
    for (const slot of daySlots) {
      // Filter past slots & cutoff
      if (slot.startTime.getTime() - cutoffMs - prepMs <= now.getTime()) {
        slot.available = false;
      }
      allSlots.push(slot);
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return allSlots.filter((s) => s.available);
}

// ── Reservation ──────────────────────────────────────────────────────────────────

export async function reserveSlot(slotId: string, orderId: string): Promise<boolean> {
  try {
    const slot = await prisma.deliverySlot.findUnique({ where: { id: slotId } });
    if (!slot) {
      logger.warn({ module: "slot-engine", slotId }, "Slot not found for reservation");
      return false;
    }

    if (!slot.isActive || slot.bookedOrders >= slot.maxOrders) {
      logger.info(
        { module: "slot-engine", slotId, orderId },
        "Slot unavailable for reservation"
      );
      return false;
    }

    await prisma.deliverySlot.update({
      where: { id: slotId },
      data: { bookedOrders: { increment: 1 } },
    });

    // Attach slot to order if order exists
    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { deliverySlotId: slotId },
      });
    } catch {
      // Order might not exist yet or schema might not have relation — non-fatal
    }

    logger.info({ module: "slot-engine", slotId, orderId }, "Slot reserved");
    return true;
  } catch (error) {
    logger.error({ module: "slot-engine", slotId, orderId, error }, "Failed to reserve slot");
    return false;
  }
}

export async function releaseSlot(slotId: string, orderId: string): Promise<boolean> {
  try {
    const slot = await prisma.deliverySlot.findUnique({ where: { id: slotId } });
    if (!slot || slot.bookedOrders <= 0) {
      return false;
    }

    await prisma.deliverySlot.update({
      where: { id: slotId },
      data: { bookedOrders: { decrement: 1 } },
    });

    try {
      await prisma.order.update({
        where: { id: orderId },
        data: { deliverySlotId: null },
      });
    } catch {
      // non-fatal
    }

    logger.info({ module: "slot-engine", slotId, orderId }, "Slot released");
    return true;
  } catch (error) {
    logger.error({ module: "slot-engine", slotId, orderId, error }, "Failed to release slot");
    return false;
  }
}
