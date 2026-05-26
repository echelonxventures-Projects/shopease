"use client";
import { useEffect, useState } from "react";
import { getSites, createSite, deleteSite, updateSite } from "@/server/actions/site-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Globe, Edit, Trash2, ExternalLink } from "lucide-react";

export default function SitesPage() {
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", slug: "", domain: "", subdomain: "", description: "" });

  useEffect(() => { loadSites(); }, []);

  async function loadSites() {
    try { const data = await getSites(); setSites(data); } catch { }
    finally { setLoading(false); }
  }

  async function handleCreate() {
    if (!form.name || !form.slug) { toast.error("Name and slug required"); return; }
    try {
      await createSite(form);
      toast.success("Site created");
      setDialogOpen(false);
      setForm({ name: "", slug: "", domain: "", subdomain: "", description: "" });
      loadSites();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this site? This cannot be undone.")) return;
    try {
      await deleteSite(id);
      toast.success("Site deleted");
      loadSites();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleToggleDefault(id: string, isDefault: boolean) {
    try {
      await updateSite(id, { isDefault: !isDefault });
      toast.success(isDefault ? "Default site removed" : "Default site set");
      loadSites();
    } catch (err: any) { toast.error(err.message); }
  }

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sites Management</h1>
          <p className="text-sm text-gray-500">Manage multi-tenant storefronts with custom domains</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" /> New Site
        </Button>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Globe className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No sites yet. Create your first site to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sites.map((site) => (
            <div key={site.id} className="bg-white rounded-lg shadow p-5 flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{site.name}</h3>
                  <Badge variant={site.status === "ACTIVE" ? "default" : site.status === "SUSPENDED" ? "destructive" : "secondary"}>
                    {site.status}
                  </Badge>
                  {site.isDefault && <Badge variant="outline">Default</Badge>}
                </div>
                <p className="text-sm text-gray-500 mb-2">{site.description || "No description"}</p>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Slug: <code className="bg-gray-100 px-1 rounded">{site.slug}</code></span>
                  {site.domain && <span>Domain: <code className="bg-gray-100 px-1 rounded">{site.domain}</code></span>}
                  {site.subdomain && <span>Subdomain: <code className="bg-gray-100 px-1 rounded">{site.subdomain}</code></span>}
                  <span>{site.domains?.length || 0} domain(s)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => handleToggleDefault(site.id, site.isDefault)}>
                  {site.isDefault ? "Unset Default" : "Set Default"}
                </Button>
                <Link href={`/admin/sites/${site.id}`}>
                  <Button variant="outline" size="sm"><Edit className="w-4 h-4" /></Button>
                </Link>
                <Link href={`http://${site.subdomain || site.domain || "localhost"}:3000`} target="_blank">
                  <Button variant="ghost" size="sm"><ExternalLink className="w-4 h-4" /></Button>
                </Link>
                {!site.isDefault && (
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(site.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Site</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Site Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My Store" /></div>
            <div><Label>Slug *</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="my-store" /></div>
            <div><Label>Subdomain</Label><Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="mystore" /></div>
            <div><Label>Custom Domain</Label><Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="shop.mystore.com" /></div>
            <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Store description" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate}>Create Site</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
