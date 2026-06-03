"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  getAllConfigsAction,
  updateConfig,
  reloadConfigCache,
  getConfigCategories,
  resetConfigToDefault,
  seedDefaultConfigs,
} from "@/server/actions/config-actions";

interface ConfigEntry {
  key: string;
  value: string;
  description: string;
  category: string;
  type: string;
  isDefault: boolean;
  isSecret: boolean;
}

export default function ConfigPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [configs, setConfigs] = useState<ConfigEntry[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadConfigs = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getAllConfigsAction({
        query: searchQuery || undefined,
        category: selectedCategory || undefined,
      });
      if (result && "configs" in result) {
        setConfigs(result.configs as ConfigEntry[]);
      }
    } catch (_err) {
      setMessage({ type: "error", text: "Failed to load configurations" });
    }
    setLoading(false);
  }, [searchQuery, selectedCategory]);

  const loadCategories = useCallback(async () => {
    try {
      const result = await getConfigCategories();
      if (result && "categories" in result) {
        setCategories(result.categories as string[]);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") {
      loadConfigs();
      loadCategories();
    }
  }, [status, loadConfigs, loadCategories, router]);

  const handleSave = async (key: string) => {
    setSaving(true);
    try {
      const result = await updateConfig({ key, value: editValue });
      if (result && "error" in result) {
        setMessage({ type: "error", text: result.error as string });
      } else {
        setMessage({ type: "success", text: `Updated ${key}` });
        setEditingKey(null);
        await loadConfigs();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to save" });
    }
    setSaving(false);
  };

  const handleReset = async (key: string) => {
    if (!confirm("Reset to default value?")) return;
    try {
      const result = await resetConfigToDefault({ key });
      if (result && "value" in result) {
        setMessage({ type: "success", text: `Reset ${key} to default` });
        await loadConfigs();
      }
    } catch {
      setMessage({ type: "error", text: "Failed to reset" });
    }
  };

  const handleReloadCache = async () => {
    setSaving(true);
    try {
      await reloadConfigCache();
      setMessage({ type: "success", text: "Config cache reloaded" });
    } catch {
      setMessage({ type: "error", text: "Failed to reload cache" });
    }
    setSaving(false);
  };

  const handleSeedDefaults = async () => {
    if (!confirm("Seed all missing default configurations?")) return;
    try {
      await seedDefaultConfigs();
      setMessage({ type: "success", text: "Default configs seeded" });
      await loadConfigs();
    } catch {
      setMessage({ type: "error", text: "Failed to seed defaults" });
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  const groupedConfigs = configs.reduce(
    (acc, config) => {
      const cat = config.category || "general";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(config);
      return acc;
    },
    {} as Record<string, ConfigEntry[]>
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">System Configuration</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage all runtime configuration. Changes take effect after cache TTL (60s) or manual reload.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSeedDefaults}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm"
          >
            Seed Defaults
          </button>
          <button
            onClick={handleReloadCache}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50"
          >
            {saving ? "Reloading..." : "Reload Cache"}
          </button>
        </div>
      </div>

      {message && (
        <div
          className={`p-3 rounded-lg text-sm ${
            message.type === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : "bg-red-50 text-red-700 border border-red-200"
          }`}
        >
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-2 underline">
            dismiss
          </button>
        </div>
      )}

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Search configurations..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
            </option>
          ))}
        </select>
      </div>

      <div className="text-sm text-gray-500">
        Showing {configs.length} configuration{configs.length !== 1 ? "s" : ""}
      </div>

      {Object.entries(groupedConfigs)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([category, entries]) => (
          <div key={category} className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b">
              <h2 className="font-semibold text-sm uppercase tracking-wider text-gray-600">
                {category.replace(/_/g, " ")}
              </h2>
            </div>
            <div className="divide-y">
              {entries.map((config) => (
                <div key={config.key} className="px-4 py-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono text-gray-800 truncate">
                          {config.key}
                        </code>
                        <span className="px-1.5 py-0.5 text-xs bg-gray-100 text-gray-500 rounded">
                          {config.type}
                        </span>
                        {config.isSecret && (
                          <span className="px-1.5 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded">
                            secret
                          </span>
                        )}
                        {config.isDefault && (
                          <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            default
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{config.description}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {editingKey === config.key ? (
                        <>
                          <input
                            type={config.isSecret ? "password" : "text"}
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="w-64 px-2 py-1 text-sm border rounded focus:ring-1 focus:ring-blue-500"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSave(config.key);
                              if (e.key === "Escape") setEditingKey(null);
                            }}
                          />
                          <button
                            onClick={() => handleSave(config.key)}
                            disabled={saving}
                            className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingKey(null)}
                            className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded hover:bg-gray-300"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span
                            className={`text-sm font-mono max-w-xs truncate ${
                              config.isSecret ? "text-gray-400" : "text-gray-700"
                            }`}
                          >
                            {config.isSecret && config.value ? "••••••••" : config.value || "(empty)"}
                          </span>
                          <button
                            onClick={() => {
                              setEditingKey(config.key);
                              setEditValue(config.value);
                            }}
                            className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded hover:bg-blue-100"
                          >
                            Edit
                          </button>
                          {!config.isDefault && (
                            <button
                              onClick={() => handleReset(config.key)}
                              className="px-2 py-1 bg-gray-50 text-gray-600 text-xs rounded hover:bg-gray-100"
                            >
                              Reset
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      {configs.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          No configurations found. Click &quot;Seed Defaults&quot; to populate default values.
        </div>
      )}
    </div>
  );
}
