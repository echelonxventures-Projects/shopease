"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Package,
  Clock,
  MapPin,
  Loader2,
} from "lucide-react";
import { OrderTimeline } from "@/components/storefront/OrderTimeline";
import { DeliveryMap } from "@/components/storefront/DeliveryMap";

interface OrderTrackingData {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    total: number;
    items: Array<{ name: string; quantity: number; price: number; image?: string }>;
    shippingAddress: {
      line1?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
    createdAt: string;
    estimatedDelivery?: string;
  };
  statusHistory: Array<{
    status: string;
    message?: string;
    createdAt: string;
  }>;
  deliveryAssignment?: {
    id: string;
    status: string;
    estimatedEta?: string;
    agent: {
      name: string;
      phone?: string;
      avatar?: string;
    };
  };
}

export default function OrderTrackingPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [data, setData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTracking() {
      try {
        const res = await fetch(`/api/orders/${orderId}/tracking`);
        if (!res.ok) throw new Error("Failed to load tracking data");
        const json = await res.json();
        setData(json);
      } catch (err: any) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    if (orderId) fetchTracking();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">
            {error || "Order not found"}
          </h2>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" /> Back to orders
          </Link>
        </div>
      </div>
    );
  }

  const { order, statusHistory, deliveryAssignment } = data;

  const timelineSteps = statusHistory.map((h) => ({
    status: h.status,
    label: h.status.replace(/_/g, " "),
    description: h.message || undefined,
    timestamp: h.createdAt,
    completed: true,
    isCurrent: h.status === order.status,
  }));

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-6">
        <Link href="/account/orders" className="hover:text-blue-600">
          My Orders
        </Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-gray-900 font-medium">
          #{order.orderNumber}
        </span>
      </div>

      <div className="flex items-center gap-3 mb-8">
        <Link
          href="/account/orders"
          className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">
            Placed on{" "}
            {new Date(order.createdAt).toLocaleDateString("en-IN", {
              dateStyle: "long",
            })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Timeline & Map */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Timeline */}
          <div className="bg-white rounded-xl border p-6">
            <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-600" />
              Order Progress
            </h2>
            <OrderTimeline steps={timelineSteps} currentStatus={order.status} />
          </div>

          {/* Delivery Map */}
          {deliveryAssignment && (
            <div>
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                Live Delivery Tracking
              </h2>
              <DeliveryMap
                assignmentId={deliveryAssignment.id}
                agent={deliveryAssignment.agent}
                eta={
                  deliveryAssignment.estimatedEta
                    ? new Date(deliveryAssignment.estimatedEta).toLocaleTimeString(
                        "en-IN",
                        { hour: "2-digit", minute: "2-digit" }
                      )
                    : order.estimatedDelivery
                }
              />
            </div>
          )}
        </div>

        {/* Right Column - Order Summary */}
        <div className="space-y-6">
          {/* Estimated Delivery */}
          {order.estimatedDelivery && (
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100 p-5 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-blue-700 font-medium">
                Estimated Delivery
              </p>
              <p className="text-xl font-bold text-blue-900 mt-1">
                {new Date(order.estimatedDelivery).toLocaleDateString("en-IN", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                })}
              </p>
            </div>
          )}

          {/* Order Items */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-3">Order Items</h3>
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                      <Package className="w-5 h-5 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.name}</p>
                    <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="text-sm font-medium">
                    ₹{(item.price * item.quantity).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>
            <div className="border-t mt-4 pt-4 flex justify-between">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-lg">
                ₹{order.total.toLocaleString("en-IN")}
              </span>
            </div>
          </div>

          {/* Shipping Address */}
          <div className="bg-white rounded-xl border p-5">
            <h3 className="font-semibold mb-2">Delivery Address</h3>
            <p className="text-sm text-gray-600">
              {order.shippingAddress?.line1}
              {order.shippingAddress?.city && `, ${order.shippingAddress.city}`}
              {order.shippingAddress?.state && `, ${order.shippingAddress.state}`}
              {order.shippingAddress?.pincode && ` - ${order.shippingAddress.pincode}`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
