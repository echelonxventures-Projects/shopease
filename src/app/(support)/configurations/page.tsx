"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSystemConfigs, updateSystemConfig, deleteSystemConfig } from "@/server/actions/support-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Edit, Trash2 } from "lucide-react";

export default function ConfigurationsPage() {
  const router = useRouter();
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ key: "", value: "", description: "", category: "" });

  const fetch = () => {
    getSystemConfigs()
      .then(setConfigs)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => { setForm({ key: "", value: "", description: "", category: "" }); setEditMode(false); };

  const handleSubmit = async () => {
    if (!form.key.trim() || !form.value.trim()) { toast.error("Key and value required"); return; }
    try {
      await updateSystemConfig(form.key, form.value);
      toast.success(editMode ? "Config updated" : "Config created");
      setOpen(false); resetForm(); fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (key: string) => {
    if (!confirm(`Delete config "${key}"?`)) return;
    try {
      await deleteSystemConfig(key);
      toast.success("Config deleted");
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">System Configurations</h1>
        <Button onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Config
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Key</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Value</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Description</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {configs.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No configurations</td></tr>
            ) : (
              configs.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-mono text-sm font-medium">{c.key}</td>
                  <td className="px-4 py-3 text-sm max-w-xs truncate">{c.value}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.description || "-"}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{c.category || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => {
                        setForm({ key: c.key, value: c.value, description: c.description || "", category: c.category || "" });
                        setEditMode(true); setOpen(true);
                      }}>
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(c.key)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editMode ? "Edit Configuration" : "Add Configuration"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Key</Label><Input value={form.key} onChange={(e) => setForm({ ...form, key: e.target.value })} disabled={editMode} placeholder="setting_name" /></div>
            <div><Label>Value</Label><Input value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Category</Label><Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editMode ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-medium mb-1">{children}</label>;
}
