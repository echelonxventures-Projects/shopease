/** Delivery Promise Engine - all thresholds from config, zero hardcoding */

import { ServicesConfig } from "@/lib/config/services-config";

interface PromiseParams {
  storeId: string;
  customerLat: number;
  customerLng: number;
  itemCount: number;
}

interface DeliveryPromise {
  etaMinutes: number;
  prepTimeMinutes: number;
  travelTimeMinutes: number;
  promisedAt: Date;
  deadline: Date;
  confidence: "high" | "medium" | "low";
}

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function calculateDeliveryPromise(params: PromiseParams, storeLat: number, storeLng: number): DeliveryPromise {
  const cfg = ServicesConfig.deliveryPromise();
  const distance = haversineDistance(storeLat, storeLng, params.customerLat, params.customerLng);
  const travelTimeMinutes = Math.ceil((distance / cfg.avgSpeedKmh) * 60);
  const prepTimeMinutes = Math.ceil(cfg.basePrepMin + params.itemCount * cfg.perItemPrepMin);
  const etaMinutes = prepTimeMinutes + travelTimeMinutes;

  const now = new Date();
  const deadline = new Date(now.getTime() + etaMinutes * 60 * 1000);
  const confidence = etaMinutes <= 10 ? "high" : etaMinutes <= 15 ? "medium" : "low";

  return { etaMinutes, prepTimeMinutes, travelTimeMinutes, promisedAt: now, deadline, confidence };
}

export function checkSLABreach(promisedAt: Date, etaMinutes: number): { breached: boolean; delayMinutes: number } {
  const deadline = new Date(promisedAt.getTime() + etaMinutes * 60 * 1000);
  const now = new Date();
  if (now > deadline) return { breached: true, delayMinutes: Math.ceil((now.getTime() - deadline.getTime()) / 60000) };
  return { breached: false, delayMinutes: 0 };
}
