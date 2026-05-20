"use client";

import { useEffect, useState } from "react";
import { createApiKey, listApiKeys, revokeApiKey } from "@/server/actions/api-key-actions";
import { Key, Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const PERMISSION_OPTIONS = [
  "products:read",
  "products:write",
  "orders:read",
  "orders:write",
  "categories:read",
  "categories:write",
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<any[]>([]);
  const [name, setName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["products:read"]);
  const [showForm, setShowForm] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);

  const fetch = () => {
    listApiKeys().then(setKeys).catch(() => {});
  };

  useEffect(() => { fetch(); }, []);

  const handleCreate = async () => {
    if (!name.trim()) { toast.error("Enter a name"); return; }
    try {
      const data = await createApiKey(name.trim(), selectedPermissions);
      setNewKey(data.key);
      toast.success("API key created — copy it now, it won't be shown again!");
      fetch();
    } catch {
      toast.error("Failed to create API key");
    }
  };

  const handleRevoke = async (id: string) => {
    await revokeApiKey(id);
    toast.success("API key revoked");
    fetch();
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Key className="w-7 h-7 text-violet-600" /> API Keys
        </h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4 mr-1" /> New Key
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border p-6 mb-6 space-y-4">
          <h2 className="font-bold">Create API Key</h2>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Key name" />
          <div>
            <p className="text-sm font-medium mb-2">Permissions</p>
            <div className="grid grid-cols-2 gap-2">
              {PERMISSION_OPTIONS.map((perm) => (
                <label key={perm} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(perm)}
                    onChange={(e) => {
                      setSelectedPermissions(e.target.checked ? [...selectedPermissions, perm] : selectedPermissions.filter((p) => p !== perm));
                    }}
                  />
                  {perm}
                </label>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleCreate}>Create Key</Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
          </div>
          {newKey && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm text-amber-800 mb-1 font-bold">Copy your key now — it won't be shown again!</p>
              <div className="flex items-center gap-2">
                <code className="text-xs bg-white border rounded px-2 py-1 flex-1 truncate">{newKey}</code>
                <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(newKey); toast.success("Copied!"); }}>
                  <Copy className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left py-3 px-4 font-medium">Name</th>
              <th className="text-left py-3 px-4 font-medium">Permissions</th>
              <th className="text-left py-3 px-4 font-medium">Last Used</th>
              <th className="text-left py-3 px-4 font-medium">Expires</th>
              <th className="text-right py-3 px-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key.id} className="border-b">
                <td className="py-3 px-4 font-medium">{key.name}</td>
                <td className="py-3 px-4">
                  {(key.permissions || []).map((p: string) => (
                    <span key={p} className="inline-block bg-violet-100 text-violet-700 text-xs px-2 py-0.5 rounded mr-1">{p}</span>
                  ))}
                </td>
                <td className="py-3 px-4 text-gray-500">{key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : "Never"}</td>
                <td className="py-3 px-4 text-gray-500">{key.expiresAt ? new Date(key.expiresAt).toLocaleDateString() : "Never"}</td>
                <td className="py-3 px-4 text-right">
                  <Button size="sm" variant="ghost" onClick={() => handleRevoke(key.id)} className="text-red-500 hover:text-red-700">
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-400">No API keys yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
