"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRefunds, processRefund } from "@/server/actions/ticket-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";

export default function RefundsPage() {
  const router = useRouter();
  const [refunds, setRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState<any>(null);
  const [approved, setApproved] = useState(true);
  const [adminNote, setAdminNote] = useState("");

  const fetch = () => {
    getRefunds()
      .then(setRefunds)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleProcess = async () => {
    if (!selectedRefund) return;
    try {
      await processRefund(selectedRefund.id, approved, adminNote);
      toast.success(approved ? "Refund approved" : "Refund rejected");
      setOpen(false); setSelectedRefund(null); setAdminNote("");
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Refund Requests</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Order</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Amount</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Reason</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Created</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {refunds.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No refund requests</td></tr>
            ) : (
              refunds.map((r: any) => (
                <tr key={r.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{r.order?.orderNumber}</td>
                  <td className="px-4 py-3 font-bold">₹{r.amount?.toLocaleString?.() ?? r.amount}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{r.reason}</td>
                  <td className="px-4 py-3">
                    <Badge className={
                      r.status === "APPROVED" ? "bg-green-100 text-green-800" :
                      r.status === "REJECTED" ? "bg-red-100 text-red-800" :
                      r.status === "PROCESSED" ? "bg-blue-100 text-blue-800" :
                      "bg-yellow-100 text-yellow-800"
                    }>{r.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    {r.status === "PENDING" && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => { setSelectedRefund(r); setApproved(true); setOpen(true); }}>
                          <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setSelectedRefund(r); setApproved(false); setOpen(true); }}>
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{approved ? "Approve Refund" : "Reject Refund"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedRefund && (
              <div>
                <p className="font-bold">{selectedRefund.order?.orderNumber}</p>
                <p className="text-sm text-gray-500">Amount: ₹{selectedRefund.amount?.toLocaleString?.() ?? selectedRefund.amount}</p>
                <p className="text-sm text-gray-500">Reason: {selectedRefund.reason}</p>
              </div>
            )}
            <div><Label>Admin Note</Label><Textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Optional note" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant={approved ? "default" : "destructive"} onClick={handleProcess}>
              {approved ? "Approve" : "Reject"} Refund
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium mb-1">{children}</label>;
}
