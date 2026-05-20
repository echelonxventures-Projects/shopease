"use client";

import React, { useState, useEffect } from "react";
import { getAIConfig, updateAIConfig, toggleAIFeature, testAIProvider, syncAIConfigs } from "@/server/actions/ai-config-actions";
import { AI_FEATURES_LIST } from "@/lib/ai/features";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { RefreshCw, Zap, Save, Settings, ChevronDown, ChevronUp, Key, Box } from "lucide-react";

const PROVIDERS = ["pattern", "groq", "huggingface", "openai", "replicate", "local"];

const PROVIDER_INFO: Record<string, { label: string; needsKey: boolean; defaultModel: string; keyLabel: string }> = {
  pattern: { label: "Pattern Match", needsKey: false, defaultModel: "", keyLabel: "" },
  groq: { label: "Groq (Llama/Mistral)", needsKey: true, defaultModel: "llama-3.1-8b-instant", keyLabel: "GROQ_API_KEY" },
  huggingface: { label: "Hugging Face (Inference API)", needsKey: true, defaultModel: "mistralai/Mistral-7B-Instruct-v0.2", keyLabel: "HF_API_KEY" },
  openai: { label: "OpenAI (GPT-4o-mini)", needsKey: true, defaultModel: "gpt-4o-mini", keyLabel: "OPENAI_API_KEY" },
  replicate: { label: "Replicate", needsKey: true, defaultModel: "", keyLabel: "REPLICATE_API_KEY" },
  local: { label: "Local/On-Device", needsKey: false, defaultModel: "", keyLabel: "" },
};

export default function AIConfigPage() {
  const [configs, setConfigs] = useState<Record<string, any>>({});
  const [testing, setTesting] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [synced, setSynced] = useState(false);

  // Form state for each feature's provider config
  const [formState, setFormState] = useState<Record<string, { apiKey: string; model: string }>>({});

  useEffect(() => { loadConfigs(); }, []);

  async function loadConfigs() {
    const data = await getAIConfig();
    const map: Record<string, any> = {};
    const forms: Record<string, { apiKey: string; model: string }> = {};
    if (Array.isArray(data)) {
      for (const c of data) {
        map[c.feature] = c;
        const cfg = (c.config as any) || {};
        forms[c.feature] = { apiKey: cfg.apiKey || "", model: cfg.model || "" };
      }
    }
    setConfigs(map);
    setFormState(forms);
    setSynced(true);
  }

  async function handleToggle(feature: string, enabled: boolean) {
    await toggleAIFeature(feature, enabled);
    setConfigs((prev) => ({ ...prev, [feature]: { ...prev[feature], feature, enabled } }));
    toast.success(`${feature} ${enabled ? "enabled" : "disabled"}`);
  }

  async function handleProviderChange(feature: string, provider: string) {
    const current = configs[feature] || {};
    await updateAIConfig(feature, { provider });
    setConfigs((prev) => ({ ...prev, [feature]: { ...prev[feature], provider } }));
    toast.success(`Provider changed to ${provider}`);
  }

  async function handleSaveConfig(feature: string) {
    setSaving(feature);
    try {
      const form = formState[feature] || { apiKey: "", model: "" };
      const config: any = {};
      if (form.apiKey) config.apiKey = form.apiKey;
      if (form.model) config.model = form.model;
      await updateAIConfig(feature, { config });
      toast.success("Provider config saved to database");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(null);
    }
  }

  async function handleTest(feature: string) {
    setTesting(feature);
    try {
      const result = await testAIProvider(feature);
      if (result.success) {
        toast.success(`Test passed (${result.latency}ms)`);
      } else {
        toast.error(`Test failed: ${result.error}`);
      }
    } catch {
      toast.error("Test failed");
    } finally {
      setTesting(null);
    }
  }

  async function handleSync() {
    await syncAIConfigs();
    await loadConfigs();
    toast.success("AI configs synced");
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">AI Feature Configuration</h1>
        <div className="flex gap-2">
          <Button onClick={handleSync} disabled={!synced}>
            <RefreshCw className={`w-4 h-4 mr-2 ${!synced ? "animate-spin" : ""}`} />
            Sync Features
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-gray-50">
              <th className="text-left p-4 font-medium">Feature</th>
              <th className="text-center p-4 font-medium">Enabled</th>
              <th className="text-left p-4 font-medium">Provider</th>
              <th className="text-right p-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {AI_FEATURES_LIST.map(({ key, label, description, defaultProvider }) => {
              const config = configs[key] || { enabled: false, provider: defaultProvider };
              const form = formState[key] || { apiKey: "", model: "" };
              const providerInfo = PROVIDER_INFO[config.provider || defaultProvider];
              const isExpanded = expanded[key];

              return (
                <React.Fragment key={key}>
                  <tr className="border-b last:border-0 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-gray-500">{description}</div>
                    </td>
                    <td className="p-4 text-center">
                      <Switch
                        checked={!!config.enabled}
                        onCheckedChange={(checked: boolean) => handleToggle(key, checked)}
                      />
                    </td>
                    <td className="p-4">
                      <select
                        value={config.provider || defaultProvider}
                        onChange={(e) => handleProviderChange(key, e.target.value)}
                        className="border rounded px-2 py-1 text-sm"
                      >
                        {PROVIDERS.map((p) => (
                          <option key={p} value={p}>{PROVIDER_INFO[p]?.label || p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-4 text-right flex gap-1 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }))}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <Settings className="w-4 h-4" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleTest(key)} disabled={testing === key}>
                        <Zap className="w-3 h-3 mr-1" />
                        {testing === key ? "…" : "Test"}
                      </Button>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr key={`${key}-expand`}>
                      <td colSpan={4} className="p-0">
                        <div className="bg-blue-50 p-4 border-t border-blue-100">
                          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <Box className="w-4 h-4" /> Provider Configuration — stored in AIConfig DB
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                            {providerInfo?.needsKey && (
                              <div>
                                <Label className="text-xs flex items-center gap-1">
                                  <Key className="w-3 h-3" /> API Key
                                </Label>
                                <Input
                                  type="password"
                                  value={form.apiKey}
                                  onChange={(e) => setFormState((prev) => ({
                                    ...prev,
                                    [key]: { ...prev[key], apiKey: e.target.value }
                                  }))}
                                  placeholder={providerInfo?.keyLabel || "API Key"}
                                  className="mt-1"
                                />
                              </div>
                            )}
                            {providerInfo?.defaultModel && (
                              <div>
                                <Label className="text-xs">Model</Label>
                                <Input
                                  value={form.model}
                                  onChange={(e) => setFormState((prev) => ({
                                    ...prev,
                                    [key]: { ...prev[key], model: e.target.value }
                                  }))}
                                  placeholder={providerInfo?.defaultModel}
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                          <Button
                            className="mt-3"
                            size="sm"
                            onClick={() => handleSaveConfig(key)}
                            disabled={saving === key}
                          >
                            <Save className="w-3 h-3 mr-1" />
                            {saving === key ? "Saving…" : "Save to Database"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
