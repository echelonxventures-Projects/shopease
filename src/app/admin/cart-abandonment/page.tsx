"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getAbandonedCartStats,
  getAbandonedCarts,
  updateRecoveryConfig,
  sendManualRecovery,
  triggerCartAbandonmentProcessing,
} from "@/server/actions/cart-abandonment-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  TrendingUp,
  Mail,
  Bell,
  MessageSquare,
  Loader2,
  RefreshCw,
  Settings,
  Send,
  Users,
} from "lucide-react";
import { toast } from "sonner";

export default function CartAbandonmentPage() {
  const [tab, setTab] = useState<"overview" | "config">("overview");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [stats, setStats] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [carts, setCarts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [_pagination, setPagination] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [config, setConfig] = useState({
    enabled: true,
    pushDelayMinutes: 30,
    emailDelayMinutes: 120,
    smsDelayMinutes: 360,
    maxNotificationsPerCart: 3,
    minCartValue: 100,
    emailSubject: "You left something in your cart!",
    emailTemplate: "We noticed you didn't complete your purchase. Your items are still waiting for you!",
    smsTemplate: "Hi! You have items in your cart at ShopEase. Complete your order now: {url}",
    pushTitle: "Don't forget your cart!",
    pushMessage: "Your items are waiting. Complete your purchase now.",
    discountCode: "",
    discountPercentage: 0,
  });
  const [savingConfig, setSavingConfig] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      const data = await getAbandonedCartStats() as any;
      setStats(data);
    } catch {
      // Stats load failed
    }
  }, []);

  const loadCarts = useCallback(async () => {
    setLoading(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      const data = await getAbandonedCarts({ status: "ALL", page: 1, pageSize: 20 }) as any;
      setCarts(data.carts || []);
      setPagination(data.pagination);
    } catch {
      toast.error("Failed to load abandoned carts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
    loadCarts();
  }, [loadStats, loadCarts]);

  const handleManualRecovery = async (cartId: string, channel: "EMAIL" | "SMS" | "PUSH") => {
    setSending(cartId);
    try {
      await sendManualRecovery({ cartId, channel });
      toast.success(`Recovery ${channel.toLowerCase()} sent`);
      loadCarts();
      loadStats();
    } catch {
      toast.error("Failed to send recovery notification");
    } finally {
      setSending(null);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
      const result = await triggerCartAbandonmentProcessing() as any;
      toast.success(`Processed: ${result.processed}, Notified: ${result.notified}`);
      loadStats();
      loadCarts();
    } catch {
      toast.error("Processing failed");
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      await updateRecoveryConfig(config);
      toast.success("Recovery config saved");
    } catch {
      toast.error("Failed to save config");
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingCart className="w-7 h-7" />
          Cart Abandonment Recovery
        </h1>
        <div className="flex gap-2">
          <Button variant={tab === "overview" ? "default" : "outline"} onClick={() => setTab("overview")}>
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </Button>
          <Button variant={tab === "config" ? "default" : "outline"} onClick={() => setTab("config")}>
            <Settings className="w-4 h-4 mr-2" />
            Config
          </Button>
        </div>
      </div>

      {tab === "overview" && (
        <>
          {/* Stats */}
          {stats && (
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow border p-4">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3" /> Abandoned (7d)
                </p>
                <p className="text-2xl font-bold">{stats.totalAbandoned}</p>
              </div>
              <div className="bg-white rounded-lg shadow border p-4">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Recovered
                </p>
                <p className="text-2xl font-bold text-green-600">{stats.recovered}</p>
              </div>
              <div className="bg-white rounded-lg shadow border p-4">
                <p className="text-sm text-gray-500 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Active Carts
                </p>
                <p className="text-2xl font-bold text-blue-600">{stats.active}</p>
              </div>
              <div className="bg-white rounded-lg shadow border p-4">
                <p className="text-sm text-gray-500">Recovery Rate</p>
                <p className="text-2xl font-bold text-purple-600">{stats.recoveryRate}%</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 mb-4">
            <Button onClick={handleProcess} disabled={processing}>
              {processing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Process Now
            </Button>
            <Button variant="outline" onClick={() => { loadStats(); loadCarts(); }}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          {/* Cart List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="space-y-3">
              {carts.map((cart) => (
                <div key={cart.id} className="bg-white rounded-lg shadow border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{cart.user?.name || cart.user?.email}</p>
                      <p className="text-sm text-gray-500">
                        {cart.user?.email} &bull; Last active: {new Date(cart.lastActivity).toLocaleString("en-IN")}
                      </p>
                      <div className="flex gap-2 mt-1">
                        {cart.abandonedAt && (
                          <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded">Abandoned</span>
                        )}
                        {cart.promoTriggered && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded">Notified</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualRecovery(cart.id, "PUSH")}
                        disabled={sending === cart.id}
                      >
                        {sending === cart.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Bell className="w-3 h-3 mr-1" />}
                        Push
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualRecovery(cart.id, "EMAIL")}
                        disabled={sending === cart.id}
                      >
                        {sending === cart.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3 mr-1" />}
                        Email
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleManualRecovery(cart.id, "SMS")}
                        disabled={sending === cart.id}
                      >
                        {sending === cart.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquare className="w-3 h-3 mr-1" />}
                        SMS
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              {carts.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No abandoned carts found</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {tab === "config" && (
        <div className="bg-white rounded-lg shadow border p-6 space-y-4 max-w-2xl">
          <h2 className="font-semibold text-lg">Recovery Configuration</h2>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="h-4 w-4"
            />
            <label className="text-sm font-medium">Enable cart abandonment recovery</label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Push delay (minutes)</label>
              <Input
                type="number"
                value={config.pushDelayMinutes}
                onChange={(e) => setConfig({ ...config, pushDelayMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Email delay (minutes)</label>
              <Input
                type="number"
                value={config.emailDelayMinutes}
                onChange={(e) => setConfig({ ...config, emailDelayMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">SMS delay (minutes)</label>
              <Input
                type="number"
                value={config.smsDelayMinutes}
                onChange={(e) => setConfig({ ...config, smsDelayMinutes: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Min cart value</label>
              <Input
                type="number"
                value={config.minCartValue}
                onChange={(e) => setConfig({ ...config, minCartValue: Number(e.target.value) })}
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Email subject</label>
            <Input
              value={config.emailSubject}
              onChange={(e) => setConfig({ ...config, emailSubject: e.target.value })}
            />
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">Email template</label>
            <textarea
              className="w-full border rounded-md p-2 text-sm h-20"
              value={config.emailTemplate}
              onChange={(e) => setConfig({ ...config, emailTemplate: e.target.value })}
            />
            <p className="text-xs text-gray-400 mt-1">Variables: {"{url}"}, {"{name}"}, {"{items}"}, {"{total}"}</p>
          </div>

          <div>
            <label className="text-sm text-gray-600 block mb-1">SMS template</label>
            <textarea
              className="w-full border rounded-md p-2 text-sm h-20"
              value={config.smsTemplate}
              onChange={(e) => setConfig({ ...config, smsTemplate: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-600 block mb-1">Discount code (optional)</label>
              <Input
                value={config.discountCode}
                onChange={(e) => setConfig({ ...config, discountCode: e.target.value })}
                placeholder="COMEBACK10"
              />
            </div>
            <div>
              <label className="text-sm text-gray-600 block mb-1">Discount %</label>
              <Input
                type="number"
                value={config.discountPercentage}
                onChange={(e) => setConfig({ ...config, discountPercentage: Number(e.target.value) })}
              />
            </div>
          </div>

          <Button onClick={handleSaveConfig} disabled={savingConfig}>
            {savingConfig ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Save Configuration
          </Button>
        </div>
      )}
    </div>
  );
}
