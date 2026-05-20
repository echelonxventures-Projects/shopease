"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getMyReturns, createReturn } from "@/server/actions/return-actions";
import { getOrders } from "@/server/actions/order-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Package, ArrowLeftRight } from "lucide-react";

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [reason, setReason] = useState("");

  const fetchData = async () => {
    try {
      const [returnsData, ordersData] = await Promise.all([getMyReturns(), getOrders()]);
      setReturns(returnsData);
      setOrders(ordersData.filter((o: any) => o.status === "DELIVERED"));
    } catch { router.push("/auth/login"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async () => {
    if (!selectedOrderId || !reason.trim()) { toast.error("Please select order and provide reason"); return; }
    try {
      await createReturn(selectedOrderId, reason, []);
      toast.success("Return request submitted");
      setOpen(false);
      setSelectedOrderId("");
      setReason("");
      fetchData();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Returns & Refunds</span>
      </div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Returns & Refunds</h1>
        {orders.length > 0 && (
          <Button onClick={() => setOpen(true)}>
            <ArrowLeftRight className="w-4 h-4 mr-2" /> Request Return
          </Button>
        )}
      </div>

      {returns.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No return requests yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((r: any) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-bold">{r.order?.orderNumber || "N/A"}</p>
                  <p className="text-sm text-gray-500 mt-1">{r.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">₹{r.amount?.toLocaleString?.() ?? r.amount}</span>
                  <Badge className={
                    r.status === "APPROVED" ? "bg-green-100 text-green-800" :
                    r.status === "REJECTED" ? "bg-red-100 text-red-800" :
                    r.status === "PROCESSED" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }>{r.status}</Badge>
                </div>
              </div>
              {r.adminNote && (
                <p className="text-sm text-gray-500 mt-2 border-t pt-2">Note: {r.adminNote}</p>
              )}
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Request Return</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Select Order</label>
              <select
                value={selectedOrderId}
                onChange={(e) => setSelectedOrderId(e.target.value)}
                className="w-full border rounded-lg px-4 py-2"
              >
                <option value="">Choose an order</option>
                {orders.map((o: any) => (
                  <option key={o.id} value={o.id}>{o.orderNumber} - ₹{o.total?.toLocaleString?.() ?? o.total}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Reason</label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why do you want to return this?" rows={4} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit Request</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
