import { NextRequest, NextResponse } from "next/server";
import { stripeProvider } from "@/lib/payments/providers/stripe";
import { updatePaymentTransaction } from "@/lib/payments/gateway-registry";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature") || "";

  try {
    const event = await stripeProvider.handleWebhook(body, signature);
    const paymentId = event.paymentId;

    if (event.type === "payment_intent.succeeded") {
      const txn = await prisma.paymentTransaction.findFirst({ where: { providerTxnId: paymentId } });
      if (txn) await updatePaymentTransaction(txn.id, { status: "COMPLETED", providerTxnId: paymentId });
    } else if (event.type === "payment_intent.payment_failed") {
      const txn = await prisma.paymentTransaction.findFirst({ where: { providerTxnId: paymentId } });
      if (txn) await updatePaymentTransaction(txn.id, { status: "FAILED", failureReason: "Payment failed" });
    } else if (event.type === "charge.refunded") {
      const txn = await prisma.paymentTransaction.findFirst({ where: { providerTxnId: paymentId } });
      if (txn) await updatePaymentTransaction(txn.id, { status: "REFUNDED" });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
