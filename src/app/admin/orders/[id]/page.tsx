"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAllOrders, updateOrderStatus } from "@/server/actions/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Package, MapPin, Clock } from "lucide-react";


const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800", CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800", SHIPPED: "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800", DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800", RETURNED: "bg-gray-100 text-gray-800",
};

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [order, setOrder] = useState<any>(null);

  useEffect(() => {
    if (!params?.id) return;
    getAllOrders({ page: 1, limit: 100 }).then((data) => {
      const found = data.orders.find((o) => o.id === params.id);
      if (!found) { router.push("/admin/orders"); return; }
      setOrder(found);
    }).catch(() => router.push("/auth/login"));
  }, [params?.id]);

  if (!order) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <Button variant="ghost" className="mb-4" onClick={() => window.location.href = "/admin/orders"}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Orders
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-2xl font-bold">{order.orderNumber}</h1>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleString("en-IN")}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                  {order.status.replace(/_/g, " ")}
                </Badge>
                <Select onValueChange={(v) => {
                  const status = v as string;
                  updateOrderStatus(order.id, status).then(() => {
                    setOrder({ ...order, status });
                    toast.success("Status updated");
                  }).catch((e) => toast.error(e.message));
                }}>
                  <SelectTrigger className="w-40">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(statusColors).map((s) => (
                      <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Items</h2>
            <div className="space-y-4">
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
              {(order.items as any[])?.map((item, i) => (
                <div key={i} className="flex items-center gap-4 border-b pb-4 last:border-0">
                  <Package className="w-8 h-8 text-gray-400" />
                  <div className="flex-1">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold">₹{(item.price * item.quantity).toLocaleString("en-IN")}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Customer</h2>
            <p className="font-medium">{order.user?.name}</p>
            <p className="text-sm text-gray-500">{order.user?.email}</p>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MapPin className="w-5 h-5" /> Address</h2>
            <div className="text-sm text-gray-600">
              <p className="font-medium text-gray-900">{(order.shippingAddress as Record<string, string>)?.fullName}</p>
              <p>{(order.shippingAddress as Record<string, string>)?.street}</p>
              <p>
                {[
                  (order.shippingAddress as Record<string, string>)?.city,
                  (order.shippingAddress as Record<string, string>)?.districtName,
                  (order.shippingAddress as Record<string, string>)?.stateName,
                  (order.shippingAddress as Record<string, string>)?.villageName,
                ].filter(Boolean).join(", ")}
                {(order.shippingAddress as Record<string, string>)?.zipCode && ` - ${(order.shippingAddress as Record<string, string>)?.zipCode}`}
              </p>
              <p>{(order.shippingAddress as Record<string, string>)?.countryName || "India"}</p>
              <p>Phone: {(order.shippingAddress as Record<string, string>)?.phone}</p>
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4">Price & Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Subtotal</span><span>₹{order.subtotal?.toLocaleString?.() ?? order.subtotal}</span></div>
              <div className="flex justify-between"><span>Tax</span><span>₹{order.tax?.toLocaleString?.() ?? order.tax}</span></div>
              {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.discount?.toLocaleString?.() ?? order.discount}</span></div>}
              <div className="flex justify-between font-bold text-lg border-t pt-2"><span>Total</span><span>₹{order.total?.toLocaleString?.() ?? order.total}</span></div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm">Payment:</span>
              <Badge className={order.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {order.paymentStatus}
              </Badge>
            </div>
          </Card>

          {order.statusHistory && order.statusHistory.length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> History</h2>
              <div className="space-y-3">
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                {(order.statusHistory as any[]).map((h) => (
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
