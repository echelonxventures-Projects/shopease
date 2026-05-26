"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateProduct, getProduct, getCategories, getBrands } from "@/server/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, ChevronLeft } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";
import { VariantBuilder } from "@/components/variants/VariantBuilder";
import { LOCALES, getLocaleName } from "@/lib/i18n";
import {
  getProductTranslations,
  createProductTranslation,
  updateProductTranslation,
  deleteProductTranslation,
} from "@/server/actions/localization-actions";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [translations, setTranslations] = useState<any[]>([]);
  const [translationDialog, setTranslationDialog] = useState(false);
  const [editingTranslation, setEditingTranslation] = useState<any>(null);
  const [transMode, setTransMode] = useState<"select" | "form">("select");
  const [transForm, setTransForm] = useState({
    locale: "", name: "", slug: "", shortDesc: "", description: "", tags: "",
  });
  const [form, setForm] = useState({
    name: "", shortDesc: "", description: "", price: "", comparePrice: "",
    categoryId: "", brandId: "", stock: "", sku: "", tags: "",
    discountType: "NONE", discountValue: "", offerStartDate: "", offerEndDate: "",
    isActive: true, isFeatured: false,
  });

  useEffect(() => {
    if (!params?.id) return;
    Promise.all([getProduct(params.id as string), getCategories(), getBrands()])
      .then(([p, cats, brs]) => {
        if (!p) { router.push("/admin/products"); return; }
        setProduct(p);
        setImages(p.images || []);
        const toLocalISO = (d: any) => d ? new Date(d).toISOString().slice(0, 16) : "";
        setForm({
          name: p.name, shortDesc: p.shortDesc || "", description: p.description || "",
          price: p.price?.toString?.() ?? p.price, comparePrice: p.comparePrice?.toString?.() ?? "",
          categoryId: p.categoryId, brandId: p.brandId || "", stock: p.stock.toString(),
          sku: p.sku || "", tags: (p.tags || []).join(", "),
          discountType: p.discountType || "NONE",
          discountValue: p.discountValue?.toString?.() ?? "",
          offerStartDate: toLocalISO(p.offerStartDate),
          offerEndDate: toLocalISO(p.offerEndDate),
          isActive: p.isActive, isFeatured: p.isFeatured,
        });
        setCategories(cats); setBrands(brs);
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
    // Load translations
    if (params?.id) {
      getProductTranslations(params.id as string)
        .then(setTranslations)
        .catch(() => {});
    }
  }, [params?.id]);

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.categoryId) { toast.error("Name, price, and category required"); return; }
    setSubmitting(true);
    try {
      const discountType = form.discountType;
      let comparePriceVal = form.comparePrice ? parseFloat(form.comparePrice) : undefined;

      if (discountType === "PERCENTAGE" && form.discountValue && !comparePriceVal) {
        const disc = parseFloat(form.discountValue);
        comparePriceVal = parseFloat(form.price) / (1 - disc / 100);
      } else if (discountType === "FLAT" && form.discountValue && !comparePriceVal) {
        comparePriceVal = parseFloat(form.price) + parseFloat(form.discountValue);
      }

      await updateProduct(params.id as string, {
        name: form.name, shortDesc: form.shortDesc || undefined, description: form.description || undefined,
        price: parseFloat(form.price), comparePrice: comparePriceVal,
        discountType: discountType === "NONE" ? undefined : discountType,
        discountValue: discountType === "NONE" ? undefined : (form.discountValue ? parseFloat(form.discountValue) : undefined),
        offerStartDate: form.offerStartDate ? new Date(form.offerStartDate) : undefined,
        offerEndDate: form.offerEndDate ? new Date(form.offerEndDate) : undefined,
        categoryId: form.categoryId, brandId: form.brandId || undefined,
        stock: parseInt(form.stock) || 0, sku: form.sku || undefined,
        tags: form.tags,
        isActive: form.isActive, isFeatured: form.isFeatured,
        images: images,
        barcodes: [],
        isSnappable: false,
        productType: "PHYSICAL",
        taxCategory: "STANDARD",
        trackingType: "NONE",
      });
      toast.success("Product updated");
      router.push("/admin/products");
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const handleSaveTranslation = async () => {
    if (!transForm.locale || !transForm.name) {
      toast.error("Locale and name are required");
      return;
    }
    const payload = {
      name: transForm.name,
      slug: transForm.slug || transForm.name.toLowerCase().replace(/\s+/g, "-"),
      shortDesc: transForm.shortDesc || undefined,
      description: transForm.description || undefined,
      tags: transForm.tags ? transForm.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
    };
    try {
      const existing = translations.find((t: any) => t.locale === transForm.locale);
      if (existing) {
        await updateProductTranslation(existing.id, payload);
      } else {
        await createProductTranslation(params.id as string, transForm.locale, payload);
      }
      toast.success("Translation saved");
      setTranslationDialog(false);
      setTransMode("select");
      setTransForm({ locale: "", name: "", slug: "", shortDesc: "", description: "", tags: "" });
      getProductTranslations(params.id as string).then(setTranslations).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteTranslation = async (locale: string) => {
    if (!confirm(`Delete ${getLocaleName(locale)} translation?`)) return;
    try {
      await deleteProductTranslation(params.id as string, locale);
      toast.success("Translation deleted");
      setTranslations((t) => t.filter((t) => t.locale !== locale));
    } catch (err: any) { toast.error(err.message); }
  };

  const openTranslationDialog = (translation?: any) => {
    setTransMode("select");
    if (translation) {
      setTransForm({
        locale: translation.locale,
        name: translation.name,
        slug: translation.slug,
        shortDesc: translation.shortDesc || "",
        description: translation.description || "",
        tags: (translation.tags || []).join(", "),
      });
    } else {
      setTransForm({ locale: "", name: "", slug: "", shortDesc: "", description: "", tags: "" });
    }
    setTranslationDialog(true);
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;
  if (!product) return null;

  return (
    <div className="p-6">
      <Button variant="ghost" className="mb-4" onClick={() => window.location.href = "/admin/products"}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
      </Button>
      <h1 className="text-2xl font-bold mb-6">Edit Product</h1>

      <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4">
        <div><Label>Product Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Short Description</Label><Input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
        <div>
          <Label>Product Images</Label>
          <ImageUploader images={images} onChange={setImages} />
        </div>
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Discount & Offers</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Discount Type</Label>
              <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v || "NONE" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FLAT">Flat (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Discount Value</Label>
              <Input type="number" value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === "PERCENTAGE" ? "e.g. 20" : form.discountType === "FLAT" ? "e.g. 500" : ""} />
            </div>
            <div>
              <Label>Offer Start Date</Label>
              <Input type="datetime-local" value={form.offerStartDate}
                onChange={(e) => setForm({ ...form, offerStartDate: e.target.value })} />
            </div>
            <div>
              <Label>Offer End Date</Label>
              <Input type="datetime-local" value={form.offerEndDate}
                onChange={(e) => setForm({ ...form, offerEndDate: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Leave all empty for no discount. When dates are set, discount only shows during the active window.</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><Label>Price *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div><Label>Compare Price</Label><Input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} /></div>
          <div><Label>Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
        </div>

        {/* Tax Estimate Preview */}
        {form.price && parseFloat(form.price) > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-1">💰 Tax Estimate (Standard rate)</p>
            <p className="text-sm text-blue-900">
              Price: ₹{parseFloat(form.price).toLocaleString()} → Tax incl. (est. 18%): ₹{(parseFloat(form.price) * 1.18).toFixed(2)}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Category *</Label>
            <Select value={form.categoryId} onValueChange={(v) => v && setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Brand</Label>
            <Select value={form.brandId} onValueChange={(v) => v && setForm({ ...form, brandId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No brand</SelectItem>
                {brands.map((b: any) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
        <div><Label>Tags</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} /></div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured</label>
        </div>
        <Button onClick={handleSubmit} disabled={submitting}>{submitting ? "Saving..." : "Save Changes"}</Button>
      </div>

      {/* Translations Section */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Translations</h2>
            <p className="text-sm text-gray-500">Add localized versions for different regions</p>
          </div>
          <Button size="sm" onClick={() => openTranslationDialog()}>
            Add Translation
          </Button>
        </div>

        {translations.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No translations yet. Add one to localize this product.</p>
        ) : (
          <div className="space-y-2">
            {translations.map((t: any) => (
              <div key={t.locale} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <Badge className="mb-1">{getLocaleName(t.locale)}</Badge>
                  <p className="text-sm font-medium">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.slug}</p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => openTranslationDialog(t)}>Edit</Button>
                  <Button size="sm" variant="outline" onClick={() => handleDeleteTranslation(t.locale)}>Delete</Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Variant Builder */}
      <VariantBuilder productId={product.id} />

      {/* Translation Dialog */}
      <Dialog open={translationDialog} onOpenChange={(open) => {
        setTranslationDialog(open);
        if (open) setTransMode("select");
      }}>
        <DialogContent>
          {transMode === "select" ? (
            <>
              <DialogHeader>
                <DialogTitle>Manage Translations</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Select an existing translation to edit, or choose a new locale to create one.</p>
                <div className="grid grid-cols-2 gap-2">
                  {LOCALES.filter((l) => l.code !== "en").map((loc) => {
                    const existing = translations.find((t: any) => t.locale === loc.code);
                    return (
                      <Button
                        key={loc.code}
                        variant={existing ? "outline" : "secondary"}
                        className="justify-start h-auto py-3 px-4"
                        onClick={() => {
                          if (existing) {
                            setTransForm({
                              locale: existing.locale,
                              name: existing.name,
                              slug: existing.slug,
                              shortDesc: existing.shortDesc || "",
                              description: existing.description || "",
                              tags: (existing.tags || []).join(", "),
                            });
                          } else {
                            setTransForm((f) => ({ ...f, locale: loc.code }));
                          }
                          setTransMode("form");
                        }}
                      >
                        <div className="text-left">
                          <div className="font-medium">{loc.nativeName}</div>
                          <div className="text-xs text-gray-400">{existing ? "Edit existing" : "Create new"}</div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setTransMode("select")}>
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <DialogTitle>{translations.some((t: any) => t.locale === transForm.locale) ? "Edit Translation" : "Create Translation"}</DialogTitle>
                </div>
              </DialogHeader>
              <div className={`px-4 py-2 rounded-md text-sm font-medium mb-2 ${translations.some((t: any) => t.locale === transForm.locale) ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                {translations.some((t: any) => t.locale === transForm.locale) ? "✏️ Editing existing translation" : "✨ Creating new translation"}
                {` — ${getLocaleName(transForm.locale)}`}
              </div>
              <div className="space-y-4">
                <div><Label>Name *</Label><Input value={transForm.name} onChange={(e) => setTransForm({ ...transForm, name: e.target.value })} /></div>
                <div><Label>Slug</Label><Input value={transForm.slug} onChange={(e) => setTransForm({ ...transForm, slug: e.target.value })} placeholder="auto-generated if empty" /></div>
                <div><Label>Short Description</Label><Input value={transForm.shortDesc} onChange={(e) => setTransForm({ ...transForm, shortDesc: e.target.value })} /></div>
                <div><Label>Description</Label><Textarea value={transForm.description} onChange={(e) => setTransForm({ ...transForm, description: e.target.value })} rows={3} /></div>
                <div><Label>Tags</Label><Input value={transForm.tags} onChange={(e) => setTransForm({ ...transForm, tags: e.target.value })} placeholder="comma separated" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setTranslationDialog(false)}>Cancel</Button>
                <Button onClick={handleSaveTranslation}>Save</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
