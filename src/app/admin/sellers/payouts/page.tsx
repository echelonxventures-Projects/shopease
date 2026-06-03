"use client";

import { useState, useEffect } from "react";
import { listSellerPayouts, processPayout } from "@/server/actions/seller-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

export default function AdminPayoutsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [payouts, setPayouts] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [transferIds, setTransferIds] = useState<Record<string, string>>({});

  const load = () => listSellerPayouts(filter || undefined).then(setPayouts).catch(() => {});
  useEffect(() => { load(); }, [filter]);

  const handleProcess = async (id: string) => {
    const transferId = transferIds[id]?.trim();
    if (!transferId) {
      toast.error("Enter a transfer ID");
      return;
    }
    setProcessingId(id);
    try {
      await processPayout(id, transferId);
      toast.success("Payout processed");
      load();
    } catch {
      toast.error("Failed to process");
    } finally {
      setProcessingId(null);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    PROCESSING: "bg-blue-100 text-blue-700",
    PAID: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Payout Processing</h1>

      <div className="flex gap-2 mb-4">
        {[
          { key: "", label: "All" },
          { key: "PENDING", label: "Pending" },
          { key: "PROCESSING", label: "Processing" },
          { key: "PAID", label: "Paid" },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Seller</th>
              <th className="text-left p-3">Amount</th>
              <th className="text-left p-3">Period</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Transfer ID</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {payouts.map((p) => (
              <tr key={p.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">
                  {p.seller?.businessName || "—"}
                  <div className="text-xs text-gray-400">{p.seller?.user?.name}</div>
                </td>
                <td className="p-3 font-semibold">₹{Number(p.amount).toLocaleString("en-IN")}</td>
                <td className="p-3 text-gray-500">
                  {p.periodStart ? new Date(p.periodStart).toLocaleDateString("en-IN") : "—"}
                  {" → "}
                  {p.periodEnd ? new Date(p.periodEnd).toLocaleDateString("en-IN") : "—"}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[p.status]}`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3">
                  {p.status === "PAID" ? (
                    <span className="text-gray-500">{p.transferId}</span>
                  ) : (
                    <Input
                      value={transferIds[p.id] || ""}
                      onChange={(e) => setTransferIds({ ...transferIds, [p.id]: e.target.value })}
                      placeholder="TXN-..."
                      className="w-32 h-8 text-sm"
                    />
                  )}
                </td>
                <td className="p-3">
                  {p.status === "PENDING" && (
                    <Button
                      size="sm"
                      onClick={() => handleProcess(p.id)}
                      disabled={processingId === p.id}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {processingId === p.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <>
                          <CreditCard className="w-3 h-3 mr-1" />
                          Pay
                        </>
                      )}
                    </Button>
                  )}
                  {p.status === "PAID" && (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {payouts.length === 0 && (
        <div className="text-center py-12 text-gray-500">No payouts found</div>
      )}
    </div>
  );
}
