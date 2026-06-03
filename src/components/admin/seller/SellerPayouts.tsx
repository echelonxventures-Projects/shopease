"use client";

import { useState, useEffect } from "react";
import { getSellerPayouts, processSellerPayout } from "@/server/actions/seller-portal-actions";
import { DollarSign, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SellerPayoutsProps {
  sellerId: string;
}

interface PayoutRecord {
  id: string;
  status: string;
  amount: number | string;
  commission: number | string;
  netAmount: number | string;
  periodStart: string | Date;
  periodEnd: string | Date;
  transferId?: string | null;
  transferredAt?: string | Date | null;
  createdAt: string | Date;
}

export function SellerPayouts({ sellerId }: SellerPayoutsProps) {
  const [payouts, setPayouts] = useState<PayoutRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  const loadPayouts = async () => {
    try {
      const data = await getSellerPayouts(sellerId);
      if (Array.isArray(data)) setPayouts(data);
    } catch {
      toast.error("Failed to load payouts");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadPayouts();
  }, [sellerId]);

  const handleProcessPayout = async (payoutId: string) => {
    setProcessing(payoutId);
    try {
      const result = await processSellerPayout(sellerId);
      if (result && "error" in result && result.error) {
        toast.error(result.error as string);
      } else {
        toast.success("Payout processed");
        loadPayouts();
      }
    } catch {
      toast.error("Failed to process payout");
    }
    setProcessing(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const pendingPayouts = payouts.filter((p) => p.status === "PENDING");
  const pendingAmount = pendingPayouts.reduce((sum, p) => sum + Number(p.netAmount), 0);

  const statusIcons: Record<string, React.ReactNode> = {
    PENDING: <Clock className="w-4 h-4 text-yellow-600" />,
    PROCESSED: <Loader2 className="w-4 h-4 text-blue-600" />,
    PAID: <CheckCircle className="w-4 h-4 text-green-600" />,
    FAILED: <AlertCircle className="w-4 h-4 text-red-600" />,
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSED: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    FAILED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold flex items-center gap-2">
          <DollarSign className="w-5 h-5" /> Payout History
        </h3>
        {pendingPayouts.length > 0 && (
          <Button
            size="sm"
            onClick={() => handleProcessPayout(pendingPayouts[0].id)}
            disabled={processing !== null}
          >
            {processing ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <DollarSign className="w-4 h-4 mr-2" />
            )}
            Process Pending (₹{pendingAmount.toFixed(0)})
          </Button>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="border rounded-lg p-3 text-center bg-yellow-50">
          <p className="text-xl font-bold text-yellow-700">₹{pendingAmount.toFixed(0)}</p>
          <p className="text-xs text-yellow-600">Pending</p>
        </div>
        <div className="border rounded-lg p-3 text-center bg-green-50">
          <p className="text-xl font-bold text-green-700">
            ₹{payouts.filter((p) => p.status === "PAID").reduce((s, p) => s + Number(p.netAmount), 0).toFixed(0)}
          </p>
          <p className="text-xs text-green-600">Paid</p>
        </div>
        <div className="border rounded-lg p-3 text-center">
          <p className="text-xl font-bold">{payouts.length}</p>
          <p className="text-xs text-gray-500">Total Payouts</p>
        </div>
      </div>

      {payouts.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No payouts recorded.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Period</th>
              <th className="text-left p-3">Gross</th>
              <th className="text-left p-3">Commission</th>
              <th className="text-left p-3">Net</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Transfer ID</th>
              <th className="text-left p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 text-xs">
                  {new Date(p.periodStart).toLocaleDateString("en-IN")} — {new Date(p.periodEnd).toLocaleDateString("en-IN")}
                </td>
                <td className="p-3">₹{Number(p.amount).toFixed(0)}</td>
                <td className="p-3 text-red-600">-₹{Number(p.commission).toFixed(0)}</td>
                <td className="p-3 font-medium">₹{Number(p.netAmount).toFixed(0)}</td>
                <td className="p-3">
                  <div className="flex items-center gap-1">
                    {statusIcons[p.status]}
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                </td>
                <td className="p-3 text-xs text-gray-500">{p.transferId || "—"}</td>
                <td className="p-3 text-xs text-gray-500">
                  {p.transferredAt ? new Date(p.transferredAt).toLocaleDateString("en-IN") : new Date(p.createdAt).toLocaleDateString("en-IN")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
