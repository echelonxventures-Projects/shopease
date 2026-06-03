"use client";

import { useEffect, useState } from "react";
import { getRoles, createRole, updateRole, deleteRole, seedDefaultRoles } from "@/server/actions/role-actions";
import { AVAILABLE_PERMISSIONS } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

const ROUTE_OPTIONS = ["/admin", "/support", "/customer-care", "/agent", "/business", "/seller", "/supplier", "/affiliate"];

const PERMISSION_GROUPS: Record<string, string[]> = {};
for (const p of AVAILABLE_PERMISSIONS) {
  const group = p.split(".")[0];
  if (!PERMISSION_GROUPS[group]) PERMISSION_GROUPS[group] = [];
  PERMISSION_GROUPS[group].push(p);
}

export default function RolesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [roles, setRoles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ displayName: "", name: "", description: "", permissions: [] as string[], routes: [] as string[] });

  const load = () => { getRoles().then(setRoles).catch(() => {}).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);

  const reset = () => { setForm({ displayName: "", name: "", description: "", permissions: [], routes: [] }); setEditId(null); };

  const handleSave = async () => {
    if (!form.displayName) { toast.error("Display name required"); return; }
    try {
      if (editId) {
        await updateRole(editId, { displayName: form.displayName, description: form.description, permissions: form.permissions, routes: form.routes });
        toast.success("Role updated");
      } else {
        await createRole({ name: form.name || form.displayName, displayName: form.displayName, description: form.description, permissions: form.permissions, routes: form.routes });
        toast.success("Role created");
      }
      setDialogOpen(false); reset(); load();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this role?")) return;
    try { await deleteRole(id); toast.success("Deleted"); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const handleSeed = async () => {
    try { await seedDefaultRoles(); toast.success("Default roles seeded"); load(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  };

  const togglePerm = (p: string) => setForm((f) => ({ ...f, permissions: f.permissions.includes(p) ? f.permissions.filter((x) => x !== p) : [...f.permissions, p] }));
  const toggleRoute = (r: string) => setForm((f) => ({ ...f, routes: f.routes.includes(r) ? f.routes.filter((x) => x !== r) : [...f.routes, r] }));
  const toggleGroup = (perms: string[]) => {
    const allSelected = perms.every((p) => form.permissions.includes(p));
    setForm((f) => ({ ...f, permissions: allSelected ? f.permissions.filter((p) => !perms.includes(p)) : [...new Set([...f.permissions, ...perms])] }));
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Roles Management</h1>
          <p className="text-sm text-gray-500">Create infinite custom roles with granular permissions</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleSeed}>Seed Defaults</Button>
          <Button onClick={() => { reset(); setDialogOpen(true); }}>Create Role</Button>
        </div>
      </div>

      <div className="grid gap-4">
        {roles.map((r) => (
          <div key={r.id} className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{r.displayName}</h3>
                <Badge variant="secondary">{r.name}</Badge>
                {r.isSystem && <Badge variant="outline">System</Badge>}
                <Badge>{r._count.users} users</Badge>
              </div>
              <p className="text-sm text-gray-500">{r.description || "No description"}</p>
              <div className="flex gap-1 mt-2 flex-wrap">
                {r.routes.map((route: string) => <Badge key={route} className="text-xs">{route}</Badge>)}
              </div>
              <p className="text-xs text-gray-400 mt-1">{r.permissions.length} permissions</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => {
                setEditId(r.id);
                setForm({ displayName: r.displayName, name: r.name, description: r.description || "", permissions: r.permissions, routes: r.routes });
                setDialogOpen(true);
              }}>Edit</Button>
              {!r.isSystem && <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>Delete</Button>}
            </div>
          </div>
        ))}
        {roles.length === 0 && <p className="text-center text-gray-400 py-8">No roles. Click &quot;Seed Defaults&quot; to create system roles.</p>}
      </div>

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) reset(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editId ? "Edit Role" : "Create Role"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Display Name *</Label><Input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder="Store Manager" /></div>
              {!editId && <div><Label>Slug (auto-generated)</Label><Input value={form.name || form.displayName.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>}
            </div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="What this role does" /></div>

            <div>
              <Label>Allowed Routes</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {ROUTE_OPTIONS.map((r) => (
                  <button key={r} type="button" onClick={() => toggleRoute(r)} className={`px-3 py-1.5 text-xs rounded-full border transition ${form.routes.includes(r) ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 border-gray-300"}`}>{r}</button>
                ))}
              </div>
            </div>

            <div>
              <Label>Permissions ({form.permissions.length} selected)</Label>
              <div className="mt-2 space-y-3 max-h-60 overflow-y-auto border rounded p-3">
                {Object.entries(PERMISSION_GROUPS).map(([group, perms]) => (
                  <div key={group}>
                    <button type="button" onClick={() => toggleGroup(perms)} className="text-xs font-bold uppercase text-gray-600 hover:text-blue-600 mb-1">{group} ({perms.filter((p) => form.permissions.includes(p)).length}/{perms.length})</button>
                    <div className="flex flex-wrap gap-1">
                      {perms.map((p) => (
                        <button key={p} type="button" onClick={() => togglePerm(p)} className={`px-2 py-1 text-xs rounded border transition ${form.permissions.includes(p) ? "bg-green-600 text-white border-green-600" : "bg-white text-gray-600 border-gray-300"}`}>{p.split(".")[1]}</button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDialogOpen(false); reset(); }}>Cancel</Button>
            <Button onClick={handleSave}>{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
