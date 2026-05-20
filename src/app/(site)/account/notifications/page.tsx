"use client";

import { useState, useEffect } from "react";
import { listNotifications, markNotificationRead, markAllNotificationsRead, getNotificationPreferences, updateNotificationPreferences } from "@/server/actions/commerce-actions";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, CheckCircle, Settings, Package, Tag, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

type Tab = "notifications" | "preferences";

export default function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("notifications");
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<any>(null);

  const fetchNotifications = async () => {
    try {
      const data = await listNotifications();
      setNotifications(data);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  const fetchPrefs = async () => {
    try {
      const data = await getNotificationPreferences();
      setPrefs(data);
    } catch {
      // Non-critical
    }
  };

  useEffect(() => {
    fetchNotifications();
    fetchPrefs();
  }, []);

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    toast.success("All marked as read");
  };

  const handlePrefToggle = async (key: string, value: boolean) => {
    if (!prefs) return;
    const updated = { ...prefs, [key]: !value };
    try {
      await updateNotificationPreferences({ [key]: !value } as any);
      setPrefs(updated);
      toast.success("Preference updated");
    } catch {
      toast.error("Failed to update");
    }
  };

  const typeIcons: Record<string, any> = {
    ORDER: Package,
    PROMOTION: Tag,
    ALERT: AlertCircle,
    INFO: Bell,
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Notifications</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Notifications</h1>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab("notifications")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "notifications" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Bell className="w-4 h-4 inline mr-2" />
          Notifications
        </button>
        <button
          onClick={() => setTab("preferences")}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            tab === "preferences" ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Settings className="w-4 h-4 inline mr-2" />
          Preferences
        </button>
      </div>

      {tab === "notifications" && (
        <div>
          {notifications.some((n) => !n.isRead) && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="mb-4">
              <CheckCircle className="w-4 h-4 mr-2" />
              Mark all as read
            </Button>
          )}

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-xl">
              <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-500">No notifications</h3>
              <p className="text-sm text-gray-400 mt-2">You'll see notifications here when there are updates.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((n: any) => {
                const Icon = typeIcons[n.type] || Bell;
                return (
                  <div
                    key={n.id}
                    className={`border rounded-lg p-4 flex items-start gap-3 transition-colors ${
                      n.isRead ? "bg-white" : "bg-blue-50 border-blue-200"
                    }`}
                  >
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      n.isRead ? "bg-gray-100 text-gray-400" : "bg-blue-100 text-blue-600"
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium">{n.title}</p>
                      <p className="text-sm text-gray-600">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                    </div>
                    {!n.isRead && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkRead(n.id)}
                        className="shrink-0"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "preferences" && prefs && (
        <div className="bg-white rounded-lg shadow border divide-y max-w-xl">
          <div className="p-4">
            <h2 className="font-semibold mb-1">Notification Channels</h2>
            <p className="text-sm text-gray-500">Choose how you want to be notified</p>
          </div>
          {[
            { key: "emailEnabled", label: "Email Notifications", desc: "Receive updates via email" },
            { key: "smsEnabled", label: "SMS Notifications", desc: "Receive updates via text message" },
            { key: "whatsappEnabled", label: "WhatsApp Notifications", desc: "Receive updates via WhatsApp" },
            { key: "pushEnabled", label: "Push Notifications", desc: "Browser push notifications" },
          ].map((pref) => (
            <div key={pref.key} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{pref.label}</p>
                <p className="text-xs text-gray-500">{pref.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[pref.key] as boolean}
                  onChange={() => handlePrefToggle(pref.key, prefs[pref.key])}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
          <div className="p-4">
            <h2 className="font-semibold mb-1">Notification Types</h2>
            <p className="text-sm text-gray-500">Choose what types of notifications you want</p>
          </div>
          {[
            { key: "orderUpdates", label: "Order Updates", desc: "Status changes for your orders" },
            { key: "priceAlerts", label: "Price Alerts", desc: "When watched items drop in price" },
            { key: "promotions", label: "Promotions", desc: "Special offers and deals" },
            { key: "newsletter", label: "Newsletter", desc: "Weekly digest and updates" },
          ].map((pref) => (
            <div key={pref.key} className="p-4 flex items-center justify-between">
              <div>
                <p className="font-medium text-sm">{pref.label}</p>
                <p className="text-xs text-gray-500">{pref.desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs[pref.key] as boolean}
                  onChange={() => handlePrefToggle(pref.key, prefs[pref.key])}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
