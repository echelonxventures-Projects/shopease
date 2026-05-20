"use client";

import { useEffect, useState } from "react";
import { getMyBusiness } from "@/server/actions/business-actions";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Package, RefreshCw } from "lucide-react";
import Link from "next/link";

const ORDER_STATUS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  CONFIRMED: "bg-blue-100 text-blue-800",
  PROCESSING: "bg-purple-100 text-purple-800",
  SHIPPED: "bg-indigo-100 text-indigo-800",
  DELIVERED: "bg-green-100 text-green-800",
  CANCELLED: "bg-red-100 text-red-800",
};

export default function B2BOrdersPage() {
  const [business, setBusiness] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch B2B orders via getMyBusiness
  useEffect(() => {
    getMyBusiness()
      .then((b) => { setBusiness(b); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!business) return <div className="text-center py-20">No business profile found.</div>;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">B2B Orders</h1>
        <p className="text-gray-500 mt-1">View and manage your business purchases</p>
      </div>

      {orders.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No orders yet</p>
            <p className="text-sm mt-1">Start shopping on the B2B portal to place your first order.</p>
            <Link href="/b2b" className="inline-flex items-center mt-4 text-blue-600 hover:underline">
              <RefreshCw className="w-4 h-4 mr-2" /> Go to B2B Portal
            </Link>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Payment Terms</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm">{order.id.substring(0, 12)}</TableCell>
                  <TableCell>{order.businessPurchaseOrderNumber || "—"}</TableCell>
                  <TableCell>
                    <Badge className={ORDER_STATUS[order.status] || "bg-gray-100 text-gray-800"}>
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-bold">{order.currency || "INR"} {Number(order.totalAmount).toLocaleString()}</TableCell>
                  <TableCell>{order.paymentTerms?.replace("_", " ") || "—"}</TableCell>
                  <TableCell>{order.taxExempt ? "Exempt" : "Applied"}</TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
