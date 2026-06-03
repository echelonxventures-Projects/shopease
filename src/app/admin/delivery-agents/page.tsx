"use client";

import { useEffect, useState } from "react";
import {
  getDeliveryAgents,
  getDeliveryZones,
  createDeliveryAgent,
  updateAgentStatus,
} from "@/server/actions/delivery-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, UserPlus, Save, X, Navigation } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  ONLINE: "bg-green-100 text-green-800",
  OFFLINE: "bg-gray-100 text-gray-500",
  AVAILABLE: "bg-blue-100 text-blue-800",
  ON_DELIVERY: "bg-orange-100 text-orange-800",
  UNAVAILABLE: "bg-red-100 text-red-800",
};

const vehicleLabels: Record<string, string> = {
  BIKE: "🏍️ Bike",
  CAR: "🚗 Car",
  VAN: "🚐 Van",
  BIKE_ELECTRIC: "⚡ E-Bike",
};

export default function DeliveryAgentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [agents, setAgents] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    userId: "",
    phone: "",
    vehicleType: "BIKE",
    vehicleNumber: "",
    licenseNo: "",
    zoneId: "",
  });

  const loadData = async () => {
    try {
      const [agentsData, zonesData] = await Promise.all([
        getDeliveryAgents(),
        getDeliveryZones({ includeInactive: false }),
      ]);
      setAgents(agentsData);
      setZones(zonesData);
    } catch {
      toast.error("Failed to load data");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async () => {
    if (!form.userId || !form.phone) {
      toast.error("User ID and phone are required");
      return;
    }
    try {
      await createDeliveryAgent(form);
      toast.success("Agent created");
      setShowForm(false);
      setForm({ userId: "", phone: "", vehicleType: "BIKE", vehicleNumber: "", licenseNo: "", zoneId: "" });
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create agent");
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  const _handleStatusToggle = async (_agent: any, _newStatus: string) => {
    try {
      // This would need to be done by the agent themselves, or admin override action
      // For now, just show a message
      toast.info("Status update requires agent-side action");
    } catch {
      toast.error("Failed to update status");
    }
  };

  if (loading) return <div className="p-6"><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Delivery Agents</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <UserPlus className="w-4 h-4 mr-1" /> Add Agent
        </Button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-lg p-6 shadow mb-6 space-y-4">
          <h2 className="text-lg font-bold">New Delivery Agent</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              placeholder="User ID"
            />
            <Input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="Phone"
            />
            <select
              value={form.vehicleType}
              onChange={(e) => setForm({ ...form, vehicleType: e.target.value })}
              className="border rounded-lg px-3 py-2"
            >
              {Object.entries(vehicleLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
            <Input
              value={form.vehicleNumber}
              onChange={(e) => setForm({ ...form, vehicleNumber: e.target.value })}
              placeholder="Vehicle number"
            />
            <Input
              value={form.licenseNo}
              onChange={(e) => setForm({ ...form, licenseNo: e.target.value })}
              placeholder="License number"
            />
            <select
              value={form.zoneId}
              onChange={(e) => setForm({ ...form, zoneId: e.target.value })}
              className="border rounded-lg px-3 py-2"
            >
              <option value="">No zone assigned</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>{z.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate}><Save className="w-4 h-4 mr-1" /> Create</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}><X className="w-4 h-4 mr-1" /> Cancel</Button>
          </div>
        </div>
      )}

      {/* Agent cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {agents.map((a) => (
          <div key={a.id} className="bg-white rounded-lg shadow p-5 border">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-bold">{a.user?.name || a.phone}</h3>
                <p className="text-sm text-gray-500">{a.user?.email}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[a.status]}`}>
                {a.status.replace(/_/g, " ")}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Vehicle</span>
                <span>{vehicleLabels[a.vehicleType] || a.vehicleType}</span>
              </div>
              {a.vehicleNumber && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Plate</span>
                  <span>{a.vehicleNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Rating</span>
                <span>⭐ {Number(a.rating).toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Deliveries</span>
                <span>{a.totalDeliveries}</span>
              </div>
              {a.zone && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Zone</span>
                  <span className="text-blue-600">{a.zone.name}</span>
                </div>
              )}
            </div>

            {/* Live location */}
            {a.currentLat && a.currentLng && (
              <div className="mt-3 flex items-center gap-1 text-xs text-gray-500">
                <Navigation className="w-3 h-3" />
                {Number(a.currentLat).toFixed(4)}, {Number(a.currentLng).toFixed(4)}
              </div>
            )}
          </div>
        ))}
      </div>

      {agents.length === 0 && !showForm && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 mb-4">No delivery agents registered yet.</p>
          <Button onClick={() => setShowForm(true)}>
            <UserPlus className="w-4 h-4 mr-1" /> Add First Agent
          </Button>
        </div>
      )}
    </div>
  );
}
