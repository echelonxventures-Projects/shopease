"use client";

import { useState, useEffect } from "react";
import { listSellers, updateCommissionRate } from "@/server/actions/seller-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CommissionManagementPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [sellers, setSellers] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRate, setNewRate] = useState("");
  const [saving, setSaving] = useState<string | null>(null);

  const load = () => listSellers().then(setSellers).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleSave = async (id: string) => {
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate < 0 || rate > 100) {
      toast.error("Enter a valid rate (0-100)");
      return;
    }
    setSaving(id);
    try {
      await updateCommissionRate(id, rate);
      toast.success("Commission rate updated");
      setEditingId(null);
      load();
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Commission Management</h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Seller</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Current Rate</th>
              <th className="text-left p-3">New Rate (%)</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sellers.map((s) => (
              <tr key={s.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{s.businessName}</td>
                <td className="p-3 text-gray-500">{s.businessEmail}</td>
                <td className="p-3 font-semibold">{Number(s.commissionRate).toFixed(1)}%</td>
                <td className="p-3">
                  {editingId === s.id ? (
                    <Input
                      type="number"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      placeholder="e.g., 15"
                      className="w-24 h-8 text-sm"
                      min={0}
                      max={100}
                    />
                  ) : (
                    "—"
                  )}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    s.status === "ACTIVE" ? "bg-green-100 text-green-700"
                    : s.status === "PENDING" ? "bg-yellow-100 text-yellow-700"
                    : "bg-red-100 text-red-700"
                  }`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-3">
                  {editingId === s.id ? (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => handleSave(s.id)} disabled={saving === s.id}>
                        {saving === s.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3 text-green-600" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                    </div>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => { setEditingId(s.id); setNewRate(String(s.commissionRate)); }}>
                      Edit
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
