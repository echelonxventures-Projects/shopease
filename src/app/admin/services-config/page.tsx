"use client";

import { useEffect, useState } from "react";
import { getServicesConfig, updateServiceConfig } from "@/server/actions/services-config-actions";

interface ServiceToggle {
  key: string;
  label: string;
  category: string;
  enabled: boolean;
  configKey: string;
}

export default function AdminServicesConfigPage() {
  const [services, setServices] = useState<ServiceToggle[]>([]);
  const [configs, setConfigs] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { getServicesConfig().then((d) => { setServices(d.toggles); setConfigs(d.configs); }); }, []);

  async function toggle(svc: ServiceToggle) {
    setSaving(svc.key);
    const newVal = !svc.enabled;
    await updateServiceConfig(svc.configKey, String(newVal));
    setServices((s) => s.map((x) => x.key === svc.key ? { ...x, enabled: newVal } : x));
    setSaving(null);
  }

  async function saveConfig(key: string, value: string) {
    await updateServiceConfig(key, value);
    setConfigs((c) => ({ ...c, [key]: value }));
  }

  const categories = [...new Set(services.map((s) => s.category))];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Services Configuration</h1>
      <p className="text-sm text-gray-500 mb-6">Enable/disable features and configure providers. Changes apply immediately.</p>

      {categories.map((cat) => (
        <div key={cat} className="mb-8">
          <h2 className="text-lg font-semibold capitalize mb-3 border-b pb-2">{cat.replace(/_/g, " ")}</h2>
          <div className="space-y-3">
            {services.filter((s) => s.category === cat).map((svc) => (
              <div key={svc.key} className="flex items-center justify-between border rounded-lg p-4">
                <div>
                  <p className="font-medium">{svc.label}</p>
                  <p className="text-xs text-gray-400">{svc.configKey}</p>
                </div>
                <button
                  onClick={() => toggle(svc)}
                  disabled={saving === svc.key}
                  className={`relative w-12 h-6 rounded-full transition ${svc.enabled ? "bg-green-500" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition ${svc.enabled ? "left-6" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      <h2 className="text-lg font-semibold mb-3 border-b pb-2 mt-10">Provider Settings</h2>
      <div className="space-y-3">
        {Object.entries(configs).map(([key, value]) => (
          <div key={key} className="flex items-center gap-3 border rounded-lg p-3">
            <label className="text-sm font-mono text-gray-600 w-64 truncate">{key}</label>
            <input
              defaultValue={value}
              onBlur={(e) => { if (e.target.value !== value) saveConfig(key, e.target.value); }}
              className="flex-1 border rounded px-3 py-1 text-sm"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
