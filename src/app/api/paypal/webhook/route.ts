import { NextRequest, NextResponse } from "next/server";
import { paypalProvider } from "@/lib/payments/providers/paypal";
import { updatePaymentTransaction } from "@/lib/payments/gateway-registry";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const body = await req.text();

  try {
    const event = await paypalProvider.handleWebhook(body);
    const paymentId = event.paymentId;

    if (event.type === "PAYMENT.CAPTURE.COMPLETED") {
      const txn = await prisma.paymentTransaction.findFirst({ where: { providerTxnId: paymentId } });
      if (txn) await updatePaymentTransaction(txn.id, { status: "COMPLETED", providerTxnId: paymentId });
    } else if (event.type === "PAYMENT.CAPTURE.DENIED") {
      const txn = await prisma.paymentTransaction.findFirst({ where: { providerTxnId: paymentId } });
      if (txn) await updatePaymentTransaction(txn.id, { status: "FAILED", failureReason: "Payment denied" });
    } else if (event.type === "PAYMENT.CAPTURE.REFUNDED") {
      const txn = await prisma.paymentTransaction.findFirst({ where: { providerTxnId: paymentId } });
      if (txn) await updatePaymentTransaction(txn.id, { status: "REFUNDED" });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}
