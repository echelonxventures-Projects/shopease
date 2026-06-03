import { NextResponse } from "next/server";
import { headers } from "next/headers";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.text();
  const sig = (await headers()).get("x-razorpay-signature")!;

  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
    }

    const expectedSig = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");

    if (expectedSig !== sig) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    const event = JSON.parse(body);

    if (event.event === "payment.captured") {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes?.orderId;

      if (!orderId) {
        // Not a product-order payment (e.g. wallet top-up, confirmed client-side
        // with signature verification). Acknowledge so Razorpay doesn't retry.
        return NextResponse.json({ received: true });
      }

      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order) {
        return NextResponse.json({ error: "Order not found" }, { status: 400 });
      }

      const expectedAmount = Math.round(order.total.toNumber() * 100);
      if (payment.amount !== expectedAmount) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED" },
        });
        return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
      }

      if (order.paymentStatus === "PAID") {
        return NextResponse.json({ received: true });
      }

      await prisma.order.update({
        where: { id: orderId },
        data: { paymentStatus: "PAID", status: "CONFIRMED", paymentIntent: payment.id },
      });

      await prisma.payment.updateMany({
        where: { orderId },
        data: { status: "PAID", transactionId: payment.id },
      });

      await prisma.orderStatusHistory.create({
        data: { orderId, status: "CONFIRMED", message: `Payment captured via Razorpay (${payment.method})` },
      });

      const items = order.items as any[];
      for (const item of items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }
    }

    if (event.event === "payment.failed") {
      const payment = event.payload.payment.entity;
      const orderId = payment.notes?.orderId;

      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "FAILED" },
        });

        await prisma.payment.updateMany({
          where: { orderId },
          data: { status: "FAILED" },
        });

        await prisma.orderStatusHistory.create({
          data: { orderId, status: "PENDING", message: `Payment failed: ${payment.error_description || "Unknown error"}` },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch {
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
