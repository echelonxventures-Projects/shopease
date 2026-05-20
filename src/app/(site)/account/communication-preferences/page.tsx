"use client";

import { useState, useEffect } from "react";
import { getNotificationPreferences, updateNotificationPreferences } from "@/server/actions/commerce-actions";
import { Button } from "@/components/ui/button";
import { Settings, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function CommunicationPreferencesPage() {
  const [prefs, setPrefs] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const fetchPrefs = async () => {
    try {
      const data = await getNotificationPreferences();
      setPrefs(data);
    } catch {
      toast.error("Failed to load preferences");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPrefs(); }, []);

  const handleToggle = async (key: string) => {
    if (!prefs) return;
    const newValue = !prefs[key];
    setSaving(key);
    try {
      await updateNotificationPreferences({ [key]: newValue } as any);
      setPrefs({ ...prefs, [key]: newValue });
      toast.success("Preference updated");
    } catch {
      toast.error("Failed to update");
    } finally {
      setSaving(null);
    }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  if (!prefs) return <p className="text-gray-500">Could not load preferences.</p>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Communication Preferences</span>
      </div>
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Communication Preferences</h1>
      </div>

      <p className="text-gray-500">Choose how and what ShopEase communicates with you.</p>

      {/* Channels */}
      <div className="bg-white rounded-lg shadow border divide-y max-w-xl">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Notification Channels</h2>
          <p className="text-sm text-gray-500">Choose how you want to be contacted</p>
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
            <button
              onClick={() => handleToggle(pref.key)}
              disabled={saving === pref.key}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                prefs[pref.key] ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                prefs[pref.key] ? "translate-x-5" : ""
              }`} />
            </button>
          </div>
        ))}
      </div>

      {/* Types */}
      <div className="bg-white rounded-lg shadow border divide-y max-w-xl">
        <div className="p-4 border-b">
          <h2 className="font-semibold">Notification Types</h2>
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
            <button
              onClick={() => handleToggle(pref.key)}
              disabled={saving === pref.key}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                prefs[pref.key] ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                prefs[pref.key] ? "translate-x-5" : ""
              }`} />
            </button>
          </div>
        ))}
      </div>

      <div className="max-w-xl bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-2">
        <Check className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
        <p className="text-sm text-green-800">Your preferences are saved automatically when you toggle any setting. No need to click a save button.</p>
      </div>
    </div>
  );
}
