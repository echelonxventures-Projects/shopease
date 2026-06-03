"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Loader2, Bell, Mail, Smartphone, MessageSquare, Monitor } from "lucide-react";
import { getNotificationPreferences, updatePreference } from "@/server/actions/notification-preference-actions";

const CATEGORIES = [
  { key: "orderUpdates", label: "Order Updates", description: "Status changes for your orders" },
  { key: "priceAlerts", label: "Price Alerts", description: "When watched items drop in price" },
  { key: "promotions", label: "Promotions", description: "Special offers and deals" },
  { key: "newsletter", label: "Newsletter", description: "Weekly digest and updates" },
] as const;

const CHANNELS = [
  { key: "email", label: "Email", icon: Mail },
  { key: "sms", label: "SMS", icon: Smartphone },
  { key: "push", label: "Push", icon: Monitor },
  { key: "whatsapp", label: "WhatsApp", icon: MessageSquare },
] as const;

type CategoryKey = (typeof CATEGORIES)[number]["key"];
type ChannelKey = (typeof CHANNELS)[number]["key"];

interface Preferences {
  orderUpdates: boolean;
  priceAlerts: boolean;
  promotions: boolean;
  newsletter: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  whatsappEnabled: boolean;
  pushEnabled: boolean;
}

export default function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<Record<string, boolean>>({});

  const fetchPrefs = useCallback(async () => {
    try {
      const data = await getNotificationPreferences();
      setPrefs(data as Preferences);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleToggle = async (channel: ChannelKey, category: CategoryKey) => {
    if (!prefs) return;
    const toggleKey = `${channel}-${category}`;
    setUpdating((prev) => ({ ...prev, [toggleKey]: true }));

    try {
      // The current model stores channel and category separately,
      // so we toggle both independently
      const channelField = `${channel}Enabled` as keyof Preferences;
      const currentValue = prefs[category] && prefs[channelField];
      const newValue = !currentValue;

      const updated = await updatePreference(channel, category, newValue);
      setPrefs(updated as Preferences);
    } catch {
      // Non-critical; the toggle will revert
    } finally {
      setUpdating((prev) => ({ ...prev, [toggleKey]: false }));
    }
  };

  const isCellEnabled = (channel: ChannelKey, category: CategoryKey): boolean => {
    if (!prefs) return false;
    const channelField = `${channel}Enabled` as keyof Preferences;
    return Boolean(prefs[category]) && Boolean(prefs[channelField]);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">
          Your Account
        </Link>
        <span className="mx-2">&rsaquo;</span>
        <Link href="/account/notifications" className="hover:text-blue-600">
          Notifications
        </Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-gray-900 font-medium">Preferences</span>
      </div>

      <div className="flex items-center gap-3">
        <Bell className="w-6 h-6 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Notification Preferences</h1>
          <p className="text-sm text-gray-500">
            Control what notifications you receive and how
          </p>
        </div>
      </div>

      {/* Toggle Matrix */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left p-4 font-medium text-gray-700 min-w-[200px]">
                  Category
                </th>
                {CHANNELS.map((channel) => {
                  const Icon = channel.icon;
                  return (
                    <th
                      key={channel.key}
                      className="text-center p-4 font-medium text-gray-700 min-w-[80px]"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="text-xs">{channel.label}</span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {CATEGORIES.map((category) => (
                <tr key={category.key} className="border-b last:border-0">
                  <td className="p-4">
                    <p className="font-medium">{category.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {category.description}
                    </p>
                  </td>
                  {CHANNELS.map((channel) => {
                    const toggleKey = `${channel.key}-${category.key}`;
                    const isLoading = updating[toggleKey];
                    const enabled = isCellEnabled(
                      channel.key as ChannelKey,
                      category.key as CategoryKey,
                    );

                    return (
                      <td key={channel.key} className="p-4 text-center">
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={enabled}
                            onChange={() =>
                              handleToggle(
                                channel.key as ChannelKey,
                                category.key as CategoryKey,
                              )
                            }
                            disabled={isLoading}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600 peer-disabled:opacity-50" />
                          {isLoading && (
                            <Loader2 className="absolute w-3 h-3 animate-spin text-blue-600" />
                          )}
                        </label>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-gray-400">
        Changes take effect immediately. You may still receive critical account
        notifications regardless of your preferences.
      </p>
    </div>
  );
}
