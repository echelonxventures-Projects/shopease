"use client";

import { useState, useEffect } from "react";
import { getSellerOrders } from "@/server/actions/seller-portal-actions";
import { Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface SellerOrdersProps {
  sellerId: string;
}

interface SellerOrder {
  id: string;
  orderId: string;
  status: string;
  quantity: number;
  unitPrice: number | string;
  commissionAmount: number | string;
  shippedAt?: string | Date | null;
  deliveredAt?: string | Date | null;
  createdAt: string | Date;
  order?: { orderNumber?: string } | null;
  product?: { name: string } | null;
}

export function SellerOrders({ sellerId }: SellerOrdersProps) {
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");

  useEffect(() => {
    getSellerOrders(sellerId)
      .then((data) => {
        if (Array.isArray(data)) setOrders(data);
      })
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const filteredOrders = filter
    ? orders.filter((o) => o.status === filter)
    : orders;

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    SHIPPED: "bg-blue-100 text-blue-700",
    DELIVERED: "bg-green-100 text-green-700",
    RETURNED: "bg-red-100 text-red-700",
  };

  const shippingStatusColors: Record<string, string> = {
    PENDING: "text-yellow-600",
    SHIPPED: "text-blue-600",
    DELIVERED: "text-green-600",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <Truck className="w-5 h-5" /> Seller Orders ({orders.length})
        </h3>
        <div className="flex gap-2">
          {["", "PENDING", "SHIPPED", "DELIVERED", "RETURNED"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1 rounded-full transition ${
                filter === s ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No orders found.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Order</th>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">Qty</th>
              <th className="text-left p-3">Unit Price</th>
              <th className="text-left p-3">Commission</th>
              <th className="text-left p-3">Net</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Shipping</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((order) => {
              const unitPrice = Number(order.unitPrice);
              const commission = Number(order.commissionAmount);
              const net = unitPrice * order.quantity - commission;

              return (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium">{order.order?.orderNumber || order.orderId?.slice(0, 8)}</td>
                  <td className="p-3">{order.product?.name || "—"}</td>
                  <td className="p-3">{order.quantity}</td>
                  <td className="p-3">₹{unitPrice.toFixed(0)}</td>
                  <td className="p-3 text-red-600">₹{commission.toFixed(0)}</td>
                  <td className="p-3 font-medium">₹{net.toFixed(0)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[order.status] || ""}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`text-xs font-medium ${shippingStatusColors[order.status] || "text-gray-500"}`}>
                      {order.status === "SHIPPED" && order.shippedAt
                        ? `Shipped ${new Date(order.shippedAt).toLocaleDateString("en-IN")}`
                        : order.status === "DELIVERED" && order.deliveredAt
                        ? `Delivered ${new Date(order.deliveredAt).toLocaleDateString("en-IN")}`
                        : order.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500 text-xs">
                    {new Date(order.createdAt).toLocaleDateString("en-IN")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
