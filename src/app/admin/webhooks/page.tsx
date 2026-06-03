"use client";

import { useState, useEffect } from "react";
import { listWebhooks, createWebhook } from "@/server/actions/commerce-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Webhook, Plus, Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function WebhooksPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ url: "", events: "", secret: "", description: "" });

  const load = () => listWebhooks().then(setWebhooks).catch(() => {});
  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.url || !form.events) {
      toast.error("URL and events are required");
      return;
    }
    setSaving(true);
    try {
      await createWebhook(form);
      toast.success("Webhook created");
      setShowForm(false);
      setForm({ url: "", events: "", secret: "", description: "" });
      load();
    } catch {
      toast.error("Failed to create webhook");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Webhook className="w-7 h-7" />
          Webhooks
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancel" : <><Plus className="w-4 h-4 mr-2" /> New Webhook</>}
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow border p-6 mb-6 space-y-4">
          <h2 className="font-semibold">Create Webhook</h2>
          <Input
            value={form.url}
            onChange={(e) => setForm({ ...form, url: e.target.value })}
            placeholder="Endpoint URL (https://...)"
          />
          <Input
            value={form.events}
            onChange={(e) => setForm({ ...form, events: e.target.value })}
            placeholder="Events: order.created, product.updated, *"
          />
          <Input
            value={form.secret}
            onChange={(e) => setForm({ ...form, secret: e.target.value })}
            placeholder="Signing Secret"
          />
          <Input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Description (optional)"
          />
          <Button onClick={handleCreate} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Webhook"}
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {webhooks.map((w) => (
          <div key={w.id} className="bg-white rounded-lg shadow border p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{w.description || "Webhook"}</span>
                  {w.isActive ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600" />
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-1 font-mono">{w.url}</p>
                <p className="text-xs text-gray-400 mt-1">Events: {w.events}</p>
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">
              Created {new Date(w.createdAt).toLocaleDateString("en-IN")}
            </div>
          </div>
        ))}
      </div>

      {webhooks.length === 0 && !showForm && (
        <div className="text-center py-12 text-gray-500">
          <Webhook className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No webhooks configured</p>
        </div>
      )}
    </div>
  );
}
