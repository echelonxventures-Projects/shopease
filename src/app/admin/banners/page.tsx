"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  createBanner, getBanners, updateBanner, deleteBanner,
} from "@/server/actions/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export default function BannersPage() {
  const router = useRouter();
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", imageUrl: "", link: "" });

  const fetch = () => {
    getBanners().then(setBanners).catch(() => router.push("/auth/login")).finally(() => setLoading(false));
  };
  useEffect(() => { fetch(); }, []);

  const resetForm = () => { setForm({ title: "", description: "", imageUrl: "", link: "" }); setEditId(null); };

  const handleSubmit = async () => {
    if (!form.title.trim() || !form.imageUrl.trim()) { toast.error("Title and image URL required"); return; }
    try {
      if (editId) {
        await updateBanner(editId, form);
        toast.success("Banner updated");
      } else {
        await createBanner(form);
        toast.success("Banner created");
      }
      setOpen(false); resetForm(); fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Banners</h1>
        <Button onClick={() => { resetForm(); setOpen(true); }}>Add Banner</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {banners.length === 0 ? (
          <p className="text-gray-500 col-span-full text-center py-8">No banners</p>
        ) : (
          banners.map((b: any) => (
            <div key={b.id} className="border rounded-lg overflow-hidden">
              <div className="aspect-video bg-gray-100 flex items-center justify-center">
                {b.imageUrl ? <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" /> : <span className="text-4xl">🖼️</span>}
              </div>
              <div className="p-3">
                <p className="font-bold">{b.title}</p>
                {b.description && <p className="text-sm text-gray-500 line-clamp-2">{b.description}</p>}
                <div className="flex items-center gap-2 mt-2">
                  <Badge className={b.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {b.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <span className="text-xs text-gray-400">Pos: {b.position}</span>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => {
                    setForm({ title: b.title, description: b.description || "", imageUrl: b.imageUrl, link: b.link || "" });
                    setEditId(b.id); setOpen(true);
                  }}>Edit</Button>
                  <Button size="sm" variant="destructive" onClick={() => {
                    if (confirm("Delete banner?")) { deleteBanner(b.id).then(() => { toast.success("Deleted"); fetch(); }).catch((e: any) => toast.error(e.message)); }
                  }}>Delete</Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Banner" : "Add Banner"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>Image URL</Label><Input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="/uploads/banner.jpg" /></div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Link (optional)</Label><Input value={form.link} onChange={(e) => setForm({ ...form, link: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
