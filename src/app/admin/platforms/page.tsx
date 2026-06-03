"use client";

import { useEffect, useState } from "react";
import {
  getPlatformModules, createPlatformModule, activateModule,
  deactivateModule, deleteModule, seedBuiltInModules,
} from "@/server/actions/platform-module-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function PlatformModulesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [modules, setModules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => getPlatformModules().then(setModules).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const seed = async () => {
    try { await seedBuiltInModules(); await load(); toast.success("Built-in modules seeded"); }
    catch (e) { toast.error((e as Error).message); }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Platform Modules</h1>
          <p className="text-muted-foreground">Manage standalone products/platforms integrated into the master platform</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seed}>Seed Built-in</Button>
          <Button onClick={() => setShowCreate(true)}>+ New Platform</Button>
        </div>
      </div>

      {showCreate && <CreateForm onCreated={() => { setShowCreate(false); load(); }} onCancel={() => setShowCreate(false)} />}

      <div className="grid gap-4">
        {modules.map((mod) => (
          <ModuleCard key={mod.id} mod={mod} onUpdate={load} />
        ))}
        {modules.length === 0 && (
          <div className="text-center py-12 border rounded-xl">
            <p className="text-lg text-muted-foreground">No platform modules yet.</p>
            <p className="text-sm text-muted-foreground mt-1">Click &quot;Seed Built-in&quot; to add Streaming & Trading, or create a new one.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function CreateForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    slug: "", name: "", description: "", icon: "🧩",
    adminRoute: "/admin/", userRoute: "/", category: "PLATFORM",
    isPublic: false, tags: "",
  });

  const submit = async () => {
    try {
      await createPlatformModule({
        ...form,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Platform module created");
      onCreated();
    } catch (e) { toast.error((e as Error).message); }
  };

  return (
    <div className="border rounded-xl p-6 space-y-4 bg-muted/30">
      <h3 className="font-semibold text-lg">Create New Platform Module</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="food-delivery" /></div>
        <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Food Delivery Platform" /></div>
        <div><Label>Icon (emoji)</Label><Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} /></div>
        <div><Label>Admin Route</Label><Input value={form.adminRoute} onChange={(e) => setForm({ ...form, adminRoute: e.target.value })} placeholder="/admin/food-delivery" /></div>
        <div><Label>User Route</Label><Input value={form.userRoute} onChange={(e) => setForm({ ...form, userRoute: e.target.value })} placeholder="/food-delivery" /></div>
        <div><Label>Category</Label>
          <select className="w-full border rounded p-2" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="PLATFORM">Platform</option>
            <option value="SERVICE">Service</option>
            <option value="INTEGRATION">Integration</option>
            <option value="ADDON">Add-on</option>
          </select>
        </div>
        <div><Label>Tags (comma-sep)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="food, delivery, restaurant" /></div>
        <div className="flex items-end"><label className="flex items-center gap-2"><input type="checkbox" checked={form.isPublic} onChange={(e) => setForm({ ...form, isPublic: e.target.checked })} />Public (no login)</label></div>
      </div>
      <div><Label>Description</Label><textarea className="w-full border rounded p-2 h-16" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
      <div className="flex gap-2">
        <Button onClick={submit}>Create Module</Button>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ModuleCard({ mod, onUpdate }: { mod: any; onUpdate: () => void }) {
  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-800",
    DRAFT: "bg-yellow-100 text-yellow-800",
    MAINTENANCE: "bg-orange-100 text-orange-800",
    DEPRECATED: "bg-red-100 text-red-800",
  };

  const handleActivate = async () => { await activateModule(mod.id); onUpdate(); toast.success("Activated"); };
  const handleDeactivate = async () => { await deactivateModule(mod.id); onUpdate(); toast.success("Deactivated"); };
  const handleDelete = async () => {
    if (!confirm(`Delete "${mod.name}"? This cannot be undone.`)) return;
    await deleteModule(mod.id); onUpdate(); toast.success("Deleted");
  };

  return (
    <div className="border rounded-xl p-5 flex items-start justify-between gap-4">
      <div className="flex gap-4 items-start">
        <span className="text-3xl">{mod.icon}</span>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-lg">{mod.name}</h3>
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${statusColors[mod.status] || "bg-gray-100"}`}>{mod.status}</span>
            <Badge variant="outline">{mod.category}</Badge>
            <span className="text-xs text-muted-foreground">v{mod.version}</span>
          </div>
          {mod.description && <p className="text-sm text-muted-foreground mt-1">{mod.description}</p>}
          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
            <span>Admin: <code className="bg-muted px-1 rounded">{mod.adminRoute}</code></span>
            <span>User: <code className="bg-muted px-1 rounded">{mod.userRoute}</code></span>
            {mod.tags?.length > 0 && <span>Tags: {mod.tags.join(", ")}</span>}
          </div>
        </div>
      </div>
      <div className="flex gap-2 shrink-0">
        {mod.status !== "ACTIVE" && <Button size="sm" onClick={handleActivate}>Activate</Button>}
        {mod.status === "ACTIVE" && <Button size="sm" variant="outline" onClick={handleDeactivate}>Deactivate</Button>}
        <Button size="sm" variant="destructive" onClick={handleDelete}>Delete</Button>
      </div>
    </div>
  );
}
