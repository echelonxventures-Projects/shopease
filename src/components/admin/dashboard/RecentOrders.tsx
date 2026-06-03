"use client";

import { Clock, ExternalLink } from "lucide-react";
import Link from "next/link";

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface RecentOrdersProps {
  orders: RecentOrder[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 border-yellow-200",
  CONFIRMED: "bg-blue-50 text-blue-700 border-blue-200",
  PROCESSING: "bg-indigo-50 text-indigo-700 border-indigo-200",
  SHIPPED: "bg-purple-50 text-purple-700 border-purple-200",
  OUT_FOR_DELIVERY: "bg-cyan-50 text-cyan-700 border-cyan-200",
  DELIVERED: "bg-green-50 text-green-700 border-green-200",
  CANCELLED: "bg-red-50 text-red-700 border-red-200",
  RETURNED: "bg-orange-50 text-orange-700 border-orange-200",
};

function StatusBadge({ status }: { status: string }) {
  const style =
    STATUS_STYLES[status] || "bg-gray-50 text-gray-700 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function RecentOrders({ orders }: RecentOrdersProps) {
  if (!orders.length) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Orders</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No recent orders
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Recent Orders</h3>
        </div>
        <Link
          href="/admin/orders"
          className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
        >
          View all <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 font-medium">Order</th>
              <th className="pb-3 font-medium">Customer</th>
              <th className="pb-3 font-medium text-right">Amount</th>
              <th className="pb-3 font-medium">Status</th>
              <th className="pb-3 font-medium text-right">Date</th>
              <th className="pb-3 font-medium text-right">Action</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="font-medium text-blue-600 hover:underline"
                  >
                    #{order.orderNumber}
                  </Link>
                </td>
                <td className="py-3 text-gray-700">{order.customerName}</td>
                <td className="py-3 text-right font-medium">
                  &#8377;{order.total.toLocaleString("en-IN")}
                </td>
                <td className="py-3">
                  <StatusBadge status={order.status} />
                </td>
                <td className="py-3 text-right text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("en-IN", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td className="py-3 text-right">
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-0.5"
                  >
                    View
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
