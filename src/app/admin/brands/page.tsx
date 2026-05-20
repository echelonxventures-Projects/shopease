"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getBrands, createBrand, updateBrand, deleteBrand } from "@/server/actions/admin-actions";
import {
  createBrandTranslation,
  getBrandTranslations,
  updateBrandTranslation,
  deleteBrandTranslation,
} from "@/server/actions/localization-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { LOCALES, getLocaleName } from "@/lib/i18n";
import { Languages } from "lucide-react";

export default function BrandsPage() {
  const router = useRouter();
  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", slug: "", description: "", logo: "", isActive: true });

  // Translations
  const [translations, setTranslations] = useState<any[]>([]);
  const [transDialogOpen, setTransDialogOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<any>(null);
  const [editingTranslation, setEditingTranslation] = useState<any>(null);
  const [transForm, setTransForm] = useState({ locale: "", name: "", slug: "", description: "" });

  const fetch = () => {
    getBrands({ limit: 100 })
      .then((data: any) => setBrands(data.brands))
      .catch((e: any) => { if (e.message === "Unauthorized") router.push("/auth/login"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => { setForm({ name: "", slug: "", description: "", logo: "", isActive: true }); setEditId(null); };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }
    try {
      if (editId) {
        await updateBrand(editId, form);
        toast.success("Brand updated");
      } else {
        await createBrand(form);
        toast.success("Brand created");
      }
      setOpen(false); resetForm(); fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this brand? Products with this brand will be affected.")) return;
    try { await deleteBrand(id); toast.success("Brand deleted"); fetch(); }
    catch (err: any) { toast.error(err.message); }
  };

  const openTranslations = async (brand: any) => {
    setEditingBrand(brand);
    setEditingTranslation(null);
    try {
      const data = await getBrandTranslations(brand.id);
      setTranslations(data);
    } catch { setTranslations([]); }
    setTransDialogOpen(true);
  };

  const handleSaveTranslation = async () => {
    if (!transForm.locale || !transForm.name) { toast.error("Locale and name are required"); return; }
    try {
      const payload = {
        name: transForm.name,
        slug: transForm.slug || transForm.name.toLowerCase().replace(/\s+/g, "-"),
        description: transForm.description || undefined,
      };
      if (editingTranslation) {
        await updateBrandTranslation(editingTranslation.id, payload);
        toast.success("Translation updated");
      } else {
        await createBrandTranslation(editingBrand.id, transForm.locale, payload);
        toast.success("Translation created");
      }
      setTransDialogOpen(false);
      setTransForm({ locale: "", name: "", slug: "", description: "" });
      setEditingTranslation(null);
      const data = await getBrandTranslations(editingBrand.id);
      setTranslations(data);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteTranslation = async (id: string, locale: string) => {
    if (!confirm(`Delete ${getLocaleName(locale)} translation?`)) return;
    try {
      await deleteBrandTranslation(id);
      toast.success("Translation deleted");
      const data = await getBrandTranslations(editingBrand.id);
      setTranslations(data);
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Brands</h1>
        <Button onClick={() => { resetForm(); setOpen(true); }}>Add Brand</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Logo</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Slug</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Products</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {brands.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No brands</td></tr>
            ) : (
              brands.map((b: any) => (
                <tr key={b.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    {b.logo ? (
                      <img src={b.logo} alt={b.name} className="w-10 h-10 rounded object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded bg-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-lg">{b.name[0]}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">{b.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{b.slug}</td>
                  <td className="px-4 py-3 text-sm">{b._count?.products ?? 0}</td>
                  <td className="px-4 py-3">
                    <Badge className={b.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                      {b.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" className="mr-2" onClick={() => {
                      setForm({ name: b.name, slug: b.slug, description: b.description || "", logo: b.logo || "", isActive: b.isActive });
                      setEditId(b.id); setOpen(true);
                    }}>Edit</Button>
                    <Button size="sm" variant="outline" className="mr-2" onClick={() => openTranslations(b)}>
                      <Languages className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Brand Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editId ? "Edit Brand" : "Add Brand"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input id="slug" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="e.g. samsung" />
            </div>
            <div>
              <Label htmlFor="logo">Logo URL</Label>
              <Input id="logo" value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} />
            </div>
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Translations Dialog */}
      <Dialog open={transDialogOpen} onOpenChange={setTransDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Translations: {editingBrand?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {translations.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No translations yet</p>
            ) : (
              <div className="space-y-2 max-h-60 overflow-auto">
                {translations.map((t: any) => (
                  <div key={t.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <Badge className="mb-1">{getLocaleName(t.locale)}</Badge>
                      <p className="text-sm font-medium">{t.name}</p>
                      <p className="text-xs text-gray-400">{t.slug}</p>
                    </div>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingTranslation(t);
                        setTransForm({
                          locale: t.locale,
                          name: t.name,
                          slug: t.slug,
                          description: t.description || "",
                        });
                      }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDeleteTranslation(t.id, t.locale)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">
                {editingTranslation ? "Edit Translation" : "New Translation"}
              </h4>
              <div className="space-y-3">
                <div>
                  <Label>Locale</Label>
                  <select
                    value={transForm.locale}
                    onChange={(e) => {
                      const existing = translations.find((t: any) => t.locale === e.target.value);
                      if (existing && !editingTranslation) {
                        setEditingTranslation(existing);
                        setTransForm({
                          locale: existing.locale,
                          name: existing.name,
                          slug: existing.slug,
                          description: existing.description || "",
                        });
                      } else {
                        setTransForm((f) => ({ ...f, locale: e.target.value }));
                      }
                    }}
                    disabled={!!editingTranslation}
                    className="w-full border rounded-md px-3 py-2 text-sm mt-1"
                  >
                    <option value="">Select locale</option>
                    {LOCALES.filter((l) => l.code !== "en").map((loc) => (
                      <option key={loc.code} value={loc.code} disabled={!editingTranslation && translations.some((t: any) => t.locale === loc.code)}>
                        {loc.nativeName} {!editingTranslation && translations.some((t: any) => t.locale === loc.code) ? "(exists)" : ""}
                      </option>
                    ))}
                  </select>
                </div>
                <div><Label>Name *</Label><Input value={transForm.name} onChange={(e) => setTransForm({ ...transForm, name: e.target.value })} /></div>
                <div><Label>Slug</Label><Input value={transForm.slug} onChange={(e) => setTransForm({ ...transForm, slug: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={transForm.description} onChange={(e) => setTransForm({ ...transForm, description: e.target.value })} rows={2} /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" onClick={handleSaveTranslation}>
                  {editingTranslation ? "Update" : "Create"}
                </Button>
                {editingTranslation && (
                  <Button size="sm" variant="outline" onClick={() => {
                    setEditingTranslation(null);
                    setTransForm({ locale: "", name: "", slug: "", description: "" });
                  }}>Cancel</Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
