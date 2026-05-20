"use client";

import { useEffect, useState } from "react";
import {
  getMicroFulfillmentCenters,
  createMicroFulfillmentCenter,
  updateMicroFulfillmentCenter,
  getDeliveryZones,
} from "@/server/actions/delivery-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Package, Edit, Save, X } from "lucide-react";
import { toast } from "sonner";

export default function DarkStoresPage() {
  const [centers, setCenters] = useState<any[]>([]);
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<any>({});

  const loadData = async () => {
    try {
      const [centersData, zonesData] = await Promise.all([
        getMicroFulfillmentCenters(),
        getDeliveryZones({ includeInactive: false }),
      ]);
      setCenters(centersData);
      setZones(zonesData);
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const startCreate = () => {
    setEditingId("new");
    setForm({ name: "", zoneId: "", addressLine: "", contactPhone: "", inventoryCapacity: 5000 });
  };

  const startEdit = (center: any) => {
    setEditingId(center.id);
    setForm({
      name: center.name,
      zoneId: center.zoneId,
      addressLine: center.addressLine || "",
      contactPhone: center.contactPhone || "",
      inventoryCapacity: center.inventoryCapacity,
    });
  };

  const handleSave = async () => {
    try {
      if (editingId === "new") {
        await createMicroFulfillmentCenter({
          name: form.name,
          zoneId: form.zoneId,
          addressLine: form.addressLine,
          lat: 0,
          lng: 0,
          contactPhone: form.contactPhone,
          inventoryCapacity: form.inventoryCapacity,
        });
      } else if (editingId) {
        await updateMicroFulfillmentCenter(editingId, {
          name: form.name,
          addressLine: form.addressLine,
          contactPhone: form.contactPhone,
          inventoryCapacity: form.inventoryCapacity,
        });
      }
      toast.success("Dark store saved");
      setEditingId(null);
      loadData();
    } catch {
      toast.error("Failed to save");
    }
  };

  if (loading) return <div className="p-6"><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Micro-Fulfillment Centers (Dark Stores)</h1>
        <Button onClick={startCreate}>
          <Plus /> Add Center
        </Button>
      </div>

      {/* Create/Edit form */}
      {editingId && (
        <div className="bg-white rounded-lg p-6 shadow mb-6 space-y-4">
          <h2 className="text-lg font-bold">
            {editingId === "new" ? "New Dark Store" : "Edit Dark Store"}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Center name"
            />
            <select
              value={form.zoneId || ""}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">Select zone</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
            <Input
              value={form.addressLine || ""}
              onChange={(e) => setForm({ ...form, addressLine: e.target.value })}
              placeholder="Address"
            />
            <Input
              value={form.contactPhone || ""}
              onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
              placeholder="Contact phone"
            />
            <Input
              type="number"
              value={form.inventoryCapacity || ""}
              onChange={(e) => setForm({ ...form, inventoryCapacity: Number(e.target.value) })}
              placeholder="Inventory capacity"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Save</Button>
            <Button variant="outline" onClick={() => setEditingId(null)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {/* Center list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold">Name</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Zone</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Contact</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Capacity</th>
              <th className="text-left px-4 py-3 text-sm font-semibold">Status</th>
              <th className="text-right px-4 py-3 text-sm font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {centers.map((c) => (
              <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-sm">{c.zone?.name || "-"}</td>
                <td className="px-4 py-3 text-sm">{c.contactPhone || "-"}</td>
                <td className="px-4 py-3 text-sm">{c.inventoryCapacity?.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    c.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-500"
                  }`}>
                    {c.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="sm" onClick={() => startEdit(c)}>
                    <Edit className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {centers.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No dark stores configured yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

import { Plus } from "lucide-react";
