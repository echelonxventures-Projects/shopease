"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllOrders, updateOrderStatus } from "@/server/actions/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink,
  PaginationNext, PaginationPrevious,
} from "@/components/ui/pagination";
import { toast } from "sonner";
import Link from "next/link";

const statuses = ["ALL", "PENDING", "CONFIRMED", "PROCESSING", "SHIPPED", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "RETURNED"];
const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800", CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-indigo-100 text-indigo-800", SHIPPED: "bg-purple-100 text-purple-800",
  OUT_FOR_DELIVERY: "bg-orange-100 text-orange-800", DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800", RETURNED: "bg-gray-100 text-gray-800",
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const [data, setData] = useState<{ orders: any[]; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("ALL");

  const fetch = () => {
    getAllOrders({ page, limit: 20, status: status === "ALL" ? undefined : status })
      .then(setData)
      .catch((e) => { if (e.message === "Unauthorized") router.push("/auth/login"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, status]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus(orderId, newStatus);
      toast.success("Order status updated");
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Orders</h1>

      <div className="flex gap-4 mb-4">
        <Select value={status} onValueChange={(v) => { setStatus(v || ""); setPage(1); }}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>{s === "ALL" ? "All Statuses" : s.replace(/_/g, " ")}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Order #</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Customer</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Total</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Payment</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No orders found</td></tr>
            ) : (
              data?.orders.map((order: any) => (
                <tr key={order.id} className="border-t">
                  <td className="px-4 py-3">
                    <Link href={`/admin/orders/${order.id}`} className="font-medium hover:underline text-blue-600">
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{order.user?.name || order.user?.email}</td>
                  <td className="px-4 py-3 font-medium">₹{order.total?.toLocaleString?.() ?? order.total}</td>
                  <td className="px-4 py-3">
                    <Badge className={order.paymentStatus === "PAID" ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statusColors[order.status] || "bg-gray-100 text-gray-800"}>
                      {order.status.replace(/_/g, " ")}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <Select onValueChange={(v) => handleStatusChange(order.id, v as string)}>
                      <SelectTrigger className="w-40 text-xs">
                        <SelectValue placeholder="Update status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.filter(s => s !== "ALL").map((s) => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <Pagination className="mt-4">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious onClick={() => setPage(Math.max(1, page - 1))} className={page === 1 ? "pointer-events-none opacity-50" : ""} />
            </PaginationItem>
            {Array.from({ length: Math.min(data.totalPages, 5) }, (_, i) => {
              const p = i + 1;
              return (
                <PaginationItem key={p}>
                  <PaginationLink onClick={() => setPage(p)} isActive={p === page}>{p}</PaginationLink>
                </PaginationItem>
              );
            })}
            <PaginationItem>
              <PaginationNext onClick={() => setPage(Math.min(data.totalPages, page + 1))} className={page === data.totalPages ? "pointer-events-none opacity-50" : ""} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
