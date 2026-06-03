"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { getOrder } from "@/server/actions/order-actions";
import { DynamicMap } from "@/components/map/MapProvider";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, CheckCircle, Truck, Clock, MapPin, Phone, Star, User } from "lucide-react";
import Link from "next/link";

const statusIcons: Record<string, any> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle,
  PROCESSING: Package,
  SHIPPED: Truck,
  OUT_FOR_DELIVERY: Truck,
  DELIVERED: CheckCircle,
  CANCELLED: Clock,
  RETURNED: Clock,
};

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800",
  SHIPPED: "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
  RETURNED: "bg-gray-100 text-gray-800",
};

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [delivery, setDelivery] = useState<any>(null);
  const [etaMinutes, _setEtaMinutes] = useState<number | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  // SSE: connect to delivery tracking stream
  useEffect(() => {
    const assignmentId = order?.deliveryAssignment?.id || order?.deliveryAssignmentId;
    if (!assignmentId) return;

    const es = new EventSource(`/api/delivery/track/${assignmentId}`);
    eventSourceRef.current = es;

    es.addEventListener("heartbeat", (_e: MessageEvent) => {
      // Could use this to check latest event timestamp
    });

    es.onmessage = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type) {
          // Update delivery state with new tracking event
          setDelivery((prev: any) => ({
            ...prev,
            status: data.type,
            lat: data.lat,
            lng: data.lng,
          }));
        }
      } catch {
        // Ignore parse errors
      }
    };

    return () => {
      es.close();
    };
  }, [order?.deliveryAssignment?.id || order?.deliveryAssignmentId]);

  useEffect(() => {
    if (!params?.id) return;
    getOrder(params.id as string)
      .then(setOrder)
      .catch(() => router.push("/account/orders"))
      .finally(() => setLoading(false));
  }, [params?.id]);

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading order...</p></div>;
  if (!order) return <div className="p-6"><p className="text-red-500">Order not found</p></div>;

  const currentStatusIndex = ["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED"].indexOf(order.status);
  const Icon = statusIcons[order.status] || Clock;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <Link href="/account/orders" className="hover:text-blue-600">My Orders</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">{order.orderNumber}</span>
      </div>
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/account/orders")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
                <p className="text-gray-500 text-sm">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <Badge className={`${statusColors[order.status]} text-sm px-3 py-1`}>
                <Icon className="w-4 h-4 mr-1" /> {order.status.replace(/_/g, " ")}
              </Badge>
            </div>

            {/* Order Timeline */}
            <div className="flex items-center gap-1 mt-6 overflow-x-auto pb-2">
              {["PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"].map((status, i) => {
                const isActive = i <= currentStatusIndex;
                const isCurrent = status === order.status;
                return (
                  <div key={status} className="flex items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                      isActive ? "bg-green-500 text-white" : "bg-gray-200 text-gray-500"
                    } ${isCurrent ? "ring-2 ring-green-500 ring-offset-2" : ""}`}>
                      {isActive ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs ml-1 hidden sm:block ${isCurrent ? "font-bold" : "text-gray-400"}`}>
                      {status.replace(/_/g, " ")}
                    </span>
                    {i < 4 && <div className={`w-8 sm:w-12 h-0.5 mx-1 ${isActive ? "bg-green-500" : "bg-gray-200"}`} />}
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Items */}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Order Items</h2>
            <div className="space-y-4">
              {(order.items as any[])?.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-4 border-b pb-4 last:border-0">
                  <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    {item.variantOptions && (
                      <p className="text-xs text-gray-400">{item.variantOptions}</p>
                    )}
                    {item.variantSku && (
                      <p className="text-xs text-gray-400">SKU: {item.variantSku}</p>
                    )}
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold">₹{(Number(item.price) * item.quantity).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Live Tracking Map */}
          {order?.deliveryAssignment && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" /> Live Tracking
              </h2>
              <div className="mb-3">
                <DynamicMap
                  center={[28.6139, 77.2090]}
                  zoom={13}
                  height="250px"
                  markers={[
                    ...(delivery?.lat ? [{ lat: delivery.lat, lng: delivery.lng, title: "Driver location" }] : []),
                    ...(order.shippingAddress ? [{
                      lat: order.shippingAddress.latitude ? Number(order.shippingAddress.latitude) : 28.6139,
                      lng: order.shippingAddress.longitude ? Number(order.shippingAddress.longitude) : 77.2090,
                      title: "Delivery destination",
                    }] : []),
                  ]}
                  polylines={order.shippingAddress && delivery?.lat ? [{
                    points: [
                      [delivery.lat, delivery.lng],
                      [
                        order.shippingAddress.latitude ? Number(order.shippingAddress.latitude) : 28.6139,
                        order.shippingAddress.longitude ? Number(order.shippingAddress.longitude) : 77.2090,
                      ],
                    ],
                    color: "#2563eb",
                  }] : []}
                />
              </div>

              {/* ETA */}
              {etaMinutes !== null && (
                <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-semibold text-blue-800">
                    Estimated arrival: {etaMinutes} min
                  </span>
                </div>
              )}

              {/* Agent card */}
              {delivery?.agent && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg mt-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{delivery.agent.name}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span>{delivery.agent.rating}</span>
                      <span>•</span>
                      <span>{delivery.agent.vehicleType}</span>
                    </div>
                  </div>
                  {delivery.agent.phone && (
                    <a href={`tel:${delivery.agent.phone}`} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700">
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              )}

              {/* Tracking timeline */}
              {delivery?.events && delivery.events.length > 0 && (
                <div className="mt-3 space-y-2 max-h-48 overflow-y-auto">
                  {delivery.events.reverse().slice(0, 10).map((event: any) => (
                    <div key={event.id} className="flex gap-2 text-xs">
                      <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                        event.type === "DELIVERED" ? "bg-green-500" :
                        event.type === "EXCEPTION" ? "bg-red-500" :
                        "bg-blue-500"
                      }`} />
                      <div>
                        <p className="font-medium text-gray-700">{event.message}</p>
                        <p className="text-gray-400">
                          {new Date(event.createdAt).toLocaleTimeString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Price Breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>₹{order.subtotal != null ? Number(order.subtotal).toLocaleString("en-IN") : '0'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Tax</span><span>₹{order.tax != null ? Number(order.tax).toLocaleString("en-IN") : '0'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span className="text-green-600">Free</span></div>
              {order.discount != null && Number(order.discount) > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{Number(order.discount).toLocaleString("en-IN")}</span></div>}
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>₹{order.total != null ? Number(order.total).toLocaleString("en-IN") : '0'}</span></div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> Shipping Address</h2>
            {(order.shippingAddress as any) ? (
              <div className="text-sm text-gray-600">
                <p className="font-medium text-gray-900">{(order.shippingAddress as any)?.fullName || 'N/A'}</p>
                <p>{(order.shippingAddress as any)?.street}</p>
                {!(order.shippingAddress as any)?.street && (
                  <p>{(order.shippingAddress as any)?.addressLabel || 'Delivery Location'}</p>
                )}
                <p>{(order.shippingAddress as any)?.city}{(order.shippingAddress as any)?.city && (order.shippingAddress as any)?.state ? ', ' : ''}{(order.shippingAddress as any)?.state}{(order.shippingAddress as any)?.zipCode ? ' - ' + (order.shippingAddress as any)?.zipCode : ''}</p>
                {(order.shippingAddress as any)?.country && <p>{(order.shippingAddress as any)?.country}</p>}
                {(order.shippingAddress as any)?.phone && <p className="mt-2">Phone: {(order.shippingAddress as any)?.phone}</p>}
                {(order.shippingAddress as any)?.landmark && <p className="text-xs text-gray-500">Landmark: {(order.shippingAddress as any)?.landmark}</p>}
                {(order.shippingAddress as any)?.deliveryNote && <p className="text-xs text-gray-500 mt-1">Note: {(order.shippingAddress as any)?.deliveryNote}</p>}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No shipping address saved</p>
            )}
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Payment</h2>
            <p className="text-sm">Method: <span className="font-medium uppercase">{order.paymentMethod || 'N/A'}</span></p>
            <p className="text-sm mt-2">Status: <Badge className={order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : order.paymentStatus === 'FAILED' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>{order.paymentStatus || 'PENDING'}</Badge></p>
          </Card>

          {/* Status History */}
          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4">Activity</h2>
              <div className="space-y-3">
                {(order.statusHistory as any[]).map((h: any) => (
                  <div key={h.id} className="flex gap-3">
                    <div className="w-2 h-2 mt-2 bg-blue-500 rounded-full shrink-0" />
                    <div>
                      <p className="text-sm font-medium">{h.message}</p>
                      <p className="text-xs text-gray-400">{new Date(h.createdAt).toLocaleString("en-IN")}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
