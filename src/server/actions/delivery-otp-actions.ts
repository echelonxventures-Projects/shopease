"use server";

import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { ServicesConfig } from "@/lib/config/services-config";

export async function generateDeliveryOTP(orderId: string) {
  const cfg = ServicesConfig.deliveryOtp();
  if (!cfg.enabled) throw new Error("Delivery OTP is disabled");

  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, orderNumber: true, notes: true } });
  if (!order) throw new Error("Order not found");

  const otp = crypto.randomInt(10 ** (cfg.length - 1), 10 ** cfg.length).toString();
  const expiresAt = new Date(Date.now() + cfg.expiryMin * 60 * 1000);

  await prisma.order.update({
    where: { id: orderId },
    data: { notes: JSON.stringify({ deliveryOtp: otp, otpExpiresAt: expiresAt.toISOString() }) },
  });

  await prisma.notification.create({
    data: { userId: order.userId, type: "INFO", title: "Delivery OTP", message: `Your delivery OTP is ${otp}. Share with delivery agent.` },
  });

  return { sent: true, expiresAt };
}

export async function verifyDeliveryOTP(orderId: string, inputOtp: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, select: { notes: true } });
  if (!order?.notes) throw new Error("No OTP generated");

  let meta: { deliveryOtp?: string; otpExpiresAt?: string };
  try { meta = JSON.parse(order.notes); } catch { throw new Error("Invalid OTP data"); }

  if (!meta.deliveryOtp) throw new Error("No OTP generated");
  if (new Date(meta.otpExpiresAt!) < new Date()) return { verified: false, reason: "expired" };
  if (meta.deliveryOtp !== inputOtp) return { verified: false, reason: "invalid" };

  await prisma.order.update({ where: { id: orderId }, data: { status: "DELIVERED", notes: null } });
  return { verified: true };
}
