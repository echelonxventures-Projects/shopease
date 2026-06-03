"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getAvailableOrders,
  updateDeliveryStatus,
  submitProofOfDelivery,
} from "@/server/actions/agent-actions";
import { NavigationPanel } from "@/components/agent/NavigationPanel";
import { PhotoProof } from "@/components/agent/PhotoProof";
import { OTPVerification } from "@/components/agent/OTPVerification";

interface OrderDetail {
  assignmentId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  address: string;
  landmark?: string;
  items: { name: string; quantity: number }[];
  status: string;
  pickupConfirmed: boolean;
  estimatedEta?: string;
  distanceKm?: number;
  deliveryLat?: number;
  deliveryLng?: number;
}

export default function AgentOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [, startTransition] = useTransition();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [otp, setOtp] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await getAvailableOrders();
      if ("error" in res && res.error) {
        setError(res.error);
        setLoading(false);
        return;
      }
      const list = res as unknown as OrderDetail[];
      const found = list.find((o) => o.assignmentId === params.id);
      if (!found) {
        setError("Order not found or no longer assigned to you.");
      } else {
        setOrder(found);
      }
      setLoading(false);
    }
    load();
  }, [params.id]);

  function handlePickupConfirm() {
    if (!order) return;
    startTransition(async () => {
      const res = await updateDeliveryStatus(order.assignmentId, "PICKED_UP");
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setOrder({ ...order, status: "PICKED_UP", pickupConfirmed: true });
    });
  }

  function handleStatusAdvance() {
    if (!order) return;
    startTransition(async () => {
      const nextStatus = order.status === "PICKED_UP" ? "IN_TRANSIT" : "NEARBY";
      const res = await updateDeliveryStatus(order.assignmentId, nextStatus);
      if ("error" in res && res.error) {
        setError(res.error);
        return;
      }
      setOrder({ ...order, status: nextStatus });
    });
  }

  async function handleComplete() {
    if (!order) return;
    if (!photoUrl) {
      setError("Please capture a proof-of-delivery photo.");
      return;
    }
    if (otp.length < 4) {
      setError("Please enter the customer's delivery OTP.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const res = await submitProofOfDelivery(order.assignmentId, photoUrl, otp);
    setSubmitting(false);
    if ("error" in res && res.error) {
      setError(res.error);
      return;
    }
    router.push("/agent/dashboard");
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-80 animate-pulse rounded-xl bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error || "Order not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
      <header>
        <div className="text-xs uppercase tracking-wider text-slate-500">
          Order #{order.orderNumber}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">{order.customerName}</h1>
        <div className="mt-1 text-sm text-slate-500">
          Status: <span className="font-semibold text-slate-700 dark:text-slate-200">{order.status}</span>
        </div>
      </header>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold">Delivery Address</h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{order.address}</p>
        {order.landmark && (
          <p className="mt-1 text-xs text-slate-500">Landmark: {order.landmark}</p>
        )}
        <p className="mt-2 text-sm">
          <a href={`tel:${order.customerPhone}`} className="text-blue-600 hover:underline dark:text-blue-400">
            Call: {order.customerPhone}
          </a>
        </p>
      </section>

      <NavigationPanel
        address={order.address}
        lat={order.deliveryLat}
        lng={order.deliveryLng}
        distanceKm={order.distanceKm}
        etaMinutes={order.estimatedEta ? Math.ceil((new Date(order.estimatedEta).getTime() - Date.now()) / 60000) : undefined}
      />

      <section className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <h2 className="font-semibold">Items ({order.items.length})</h2>
        <ul className="mt-3 divide-y divide-slate-100 text-sm dark:divide-slate-800">
          {order.items.map((item, i) => (
            <li key={i} className="flex justify-between py-2">
              <span>{item.name}</span>
              <span className="text-slate-500">× {item.quantity}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        {!order.pickupConfirmed && (
          <button
            onClick={handlePickupConfirm}
            className="w-full rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white hover:bg-amber-600"
          >
            Confirm Pickup
          </button>
        )}

        {order.pickupConfirmed && order.status !== "DELIVERED" && order.status !== "NEARBY" && (
          <button
            onClick={handleStatusAdvance}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-700"
          >
            {order.status === "PICKED_UP" ? "Start Delivery" : "Mark as Nearby"}
          </button>
        )}

        {order.status === "NEARBY" && (
          <>
            <PhotoProof onCapture={setPhotoUrl} />
            <OTPVerification value={otp} onChange={setOtp} length={4} />
            <button
              onClick={handleComplete}
              disabled={submitting}
              className="w-full rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {submitting ? "Submitting…" : "Complete Delivery"}
            </button>
          </>
        )}
      </section>
    </div>
  );
}
