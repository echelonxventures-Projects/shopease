"use client";

import { useState, useEffect } from "react";
import { listSellers, updateSellerStatus } from "@/server/actions/seller-actions";
import Link from "next/link";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SellersPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [sellers, setSellers] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = () => listSellers(filter || undefined).then(setSellers).catch(() => {});
  useEffect(() => { load(); }, [filter]);

  const handleStatus = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await updateSellerStatus(id, status);
      toast.success(`Seller ${status.toLowerCase()}`);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    ACTIVE: "bg-green-100 text-green-700",
    SUSPENDED: "bg-red-100 text-red-700",
    REJECTED: "bg-gray-100 text-gray-700",
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Seller Marketplace</h1>

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {[
          { key: "", label: "All" },
          { key: "PENDING", label: "Pending" },
          { key: "ACTIVE", label: "Active" },
          { key: "SUSPENDED", label: "Suspended" },
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Business</th>
              <th className="text-left p-3">Contact</th>
              <th className="text-left p-3">GSTIN</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Rating</th>
              <th className="text-left p-3">Commission</th>
              <th className="text-left p-3">Orders</th>
              <th className="text-left p-3">KYC</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-3">
                  <Link href={`/admin/sellers/${s.id}`} className="font-semibold text-blue-600 hover:underline">
                    {s.businessName}
                  </Link>
                </td>
                <td className="p-3">
                  <div>{s.businessEmail}</div>
                  <div className="text-gray-500">{s.businessPhone}</div>
                </td>
                <td className="p-3">{s.gstin || "—"}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-3">⭐ {Number(s.rating).toFixed(1)}</td>
                <td className="p-3">{Number(s.commissionRate).toFixed(1)}%</td>
                <td className="p-3">{s.totalOrders}</td>
                <td className="p-3">
                  {s.kycVerified ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-400" />
                  )}
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {s.status === "PENDING" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatus(s.id, "ACTIVE")}
                        disabled={actionLoading === s.id}
                      >
                        {actionLoading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 text-green-600" />}
                      </Button>
                    )}
                    {s.status === "ACTIVE" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatus(s.id, "SUSPENDED")}
                        disabled={actionLoading === s.id}
                      >
                        {actionLoading === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3 text-red-600" />}
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sellers.length === 0 && (
        <div className="text-center py-12 text-gray-500">No sellers found</div>
      )}
    </div>
  );
}
