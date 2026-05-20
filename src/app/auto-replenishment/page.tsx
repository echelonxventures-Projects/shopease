"use client";

import { useState, useEffect } from "react";
import { getMySubscriptions, createSubscription, pauseSubscription, cancelSubscription } from "@/server/actions/replenishment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw, Pause, Play, X, Clock } from "lucide-react";
import { toast } from "sonner";

export default function AutoReplenishmentPage() {
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [interval, setInterval] = useState("30");
  const [loading, setLoading] = useState(false);

  const load = () => getMySubscriptions().then(setSubscriptions).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await createSubscription({
        productId: selectedProduct,
        intervalDays: parseInt(interval),
      });
      toast.success("Subscription created!");
      setShowForm(false);
      load();
    } catch {
      toast.error("Failed to create subscription");
    } finally {
      setLoading(false);
    }
  };

  const handlePause = async (id: string) => {
    try {
      await pauseSubscription({ subscriptionId: id });
      toast.success("Subscription paused");
      load();
    } catch {
      toast.error("Failed to pause");
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm("Cancel this subscription?")) return;
    try {
      await cancelSubscription({ subscriptionId: id });
      toast.success("Subscription cancelled");
      load();
    } catch {
      toast.error("Failed to cancel");
    }
  };

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    PAUSED: "bg-yellow-100 text-yellow-700",
    CANCELLED: "bg-red-100 text-red-700",
    EXPIRED: "bg-gray-100 text-gray-500",
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-3">
          <RefreshCw className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold">Auto-Replenishment</h1>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <RefreshCw className="w-4 h-4 mr-2" /> New Subscription
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-lg shadow p-6 mb-6 space-y-4">
          <h2 className="font-bold">Create Auto-Replenishment</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Product</label>
              <Input
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                placeholder="Product ID or search..."
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Delivery Frequency</label>
              <select
                value={interval}
                onChange={(e) => setInterval(e.target.value)}
                className="border rounded-md p-2 w-full"
              >
                <option value="7">Every week</option>
                <option value="14">Every 2 weeks</option>
                <option value="30">Every month</option>
                <option value="60">Every 2 months</option>
                <option value="90">Every quarter</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate} disabled={loading}>
              {loading ? "Creating..." : "Create Subscription"}
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
        </div>
      )}

      {/* Subscriptions List */}
      <div className="space-y-4">
        {subscriptions.map((sub) => (
          <div key={sub.id} className="bg-white rounded-xl shadow p-5 border">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg">{sub.productName || "Product"}</h3>
                <p className="text-sm text-gray-500">
                  Every {sub.intervalDays} days · Next order:{" "}
                  {sub.nextBillingDate ? new Date(sub.nextBillingDate).toLocaleDateString("en-IN") : "—"}
                </p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[sub.status] || "bg-gray-100"}`}>
                {sub.status}
              </span>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
              {sub.autoRenew && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> Auto-renew</span>}
              {sub.currentPeriodEnd && (
                <span>Period ends: {new Date(sub.currentPeriodEnd).toLocaleDateString("en-IN")}</span>
              )}
            </div>

            <div className="flex gap-2">
              {sub.status === "ACTIVE" && (
                <Button variant="outline" size="sm" onClick={() => handlePause(sub.id)}>
                  <Pause className="w-3 h-3 mr-1" /> Pause
                </Button>
              )}
              {sub.status === "PAUSED" && (
                <Button variant="outline" size="sm" onClick={() => handlePause(sub.id)}>
                  <Play className="w-3 h-3 mr-1" /> Resume
                </Button>
              )}
              {sub.status !== "CANCELLED" && sub.status !== "EXPIRED" && (
                <Button variant="outline" size="sm" onClick={() => handleCancel(sub.id)} className="text-red-600 border-red-200">
                  <X className="w-3 h-3 mr-1" /> Cancel
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {subscriptions.length === 0 && !showForm && (
        <div className="text-center py-16 text-gray-400">
          <RefreshCw className="w-16 h-16 mx-auto mb-4 opacity-20" />
          <p className="text-lg">No active subscriptions</p>
          <p className="text-sm">Set up auto-replenishment for your regular purchases</p>
        </div>
      )}
    </div>
  );
}
