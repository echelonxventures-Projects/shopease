"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { updateProduct, getProduct, getCategories, getBrands } from "@/server/actions/product-actions";
import { getCategoryBrands } from "@/server/actions/brand-category-actions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [categories, setCategories] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [brands, setBrands] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [filteredBrands, setFilteredBrands] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [translations, setTranslations] = useState<any[]>([]);
  const [translationDialog, setTranslationDialog] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [_editingTranslation, _setEditingTranslation] = useState<any>(null);
  const [transMode, setTransMode] = useState<"select" | "form">("select");
  const [transForm, setTransForm] = useState({
    locale: "", name: "", slug: "", shortDesc: "", description: "", tags: "",
  });
  const [form, setForm] = useState({
    name: "", shortDesc: "", description: "", price: "", comparePrice: "",
    categoryId: "", brandId: "", stock: "", sku: "", tags: "",
    discountType: "NONE", discountValue: "", offerStartDate: "", offerEndDate: "",
    isActive: true, isFeatured: false,
    // Advanced
    gtin: "", mpn: "", manufacturer: "", countryOfOrigin: "", condition: "NEW",
    weightGrams: "", lengthMm: "", widthMm: "", heightMm: "",
    costPrice: "", wholesalePrice: "", msrp: "",
    warrantyType: "NONE", warrantyDurationMonths: "", returnPolicy: "DAYS_30",
    ingredients: "", material: "", gender: "", videoUrl: "", metaTitle: "", metaDescription: "",
  });

  useEffect(() => {
    if (!params?.id) return;
    Promise.all([getProduct(params.id as string), getCategories(), getBrands()])
      .then(([p, cats, brs]) => {
        if (!p) { router.push("/admin/products"); return; }
        setProduct(p);
        setImages(p.images || []);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
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
          // Advanced
          gtin: p.gtin || "", mpn: p.mpn || "", manufacturer: p.manufacturer || "",
          countryOfOrigin: p.countryOfOrigin || "", condition: p.condition || "NEW",
          weightGrams: p.weightGrams?.toString() ?? "", lengthMm: p.lengthMm?.toString() ?? "",
          widthMm: p.widthMm?.toString() ?? "", heightMm: p.heightMm?.toString() ?? "",
          costPrice: p.costPrice?.toString() ?? "", wholesalePrice: p.wholesalePrice?.toString() ?? "",
          msrp: p.msrp?.toString() ?? "",
          warrantyType: p.warrantyType || "NONE",
          warrantyDurationMonths: p.warrantyDurationMonths?.toString() ?? "",
          returnPolicy: p.returnPolicy || "DAYS_30",
          ingredients: p.ingredients || "", material: p.material || "", gender: p.gender || "",
          videoUrl: p.videoUrl || "", metaTitle: p.metaTitle || "", metaDescription: p.metaDescription || "",
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

  // Filter brands based on selected category
  useEffect(() => {
    if (!form.categoryId) { setFilteredBrands(brands); return; }
    getCategoryBrands(form.categoryId).then((mappings) => {
      if (mappings.length === 0) { setFilteredBrands(brands); return; }
      const allowedIds = new Set(mappings.map((m: { brand: { id: string } }) => m.brand.id));
      setFilteredBrands(brands.filter((b: { id: string }) => allowedIds.has(b.id)));
    }).catch(() => setFilteredBrands(brands));
  }, [form.categoryId, brands]);

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
        // Advanced fields
        gtin: form.gtin || undefined,
        mpn: form.mpn || undefined,
        manufacturer: form.manufacturer || undefined,
        countryOfOrigin: form.countryOfOrigin || undefined,
        condition: form.condition as "NEW" | undefined,
        weightGrams: form.weightGrams ? parseFloat(form.weightGrams) : undefined,
        lengthMm: form.lengthMm ? parseFloat(form.lengthMm) : undefined,
        widthMm: form.widthMm ? parseFloat(form.widthMm) : undefined,
        heightMm: form.heightMm ? parseFloat(form.heightMm) : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        wholesalePrice: form.wholesalePrice ? parseFloat(form.wholesalePrice) : undefined,
        msrp: form.msrp ? parseFloat(form.msrp) : undefined,
        warrantyType: form.warrantyType as "NONE" | undefined,
        warrantyDurationMonths: form.warrantyDurationMonths ? parseInt(form.warrantyDurationMonths) : undefined,
        returnPolicy: form.returnPolicy as "DAYS_30" | undefined,
        ingredients: form.ingredients || undefined,
        material: form.material || undefined,
        gender: form.gender || undefined,
        videoUrl: form.videoUrl || undefined,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
      });
      toast.success("Product updated");
      router.push("/admin/products");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
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
      const existing = translations.find((t) => t.locale === transForm.locale);
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
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleDeleteTranslation = async (locale: string) => {
    if (!confirm(`Delete ${getLocaleName(locale)} translation?`)) return;
    try {
      await deleteProductTranslation(params.id as string, locale);
      toast.success("Translation deleted");
      setTranslations((t) => t.filter((t) => t.locale !== locale));
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
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
              <Select value={form.discountType} onValueChange={(v) => { if (v) setForm({ ...form, discountType: v || "NONE" }); }}>
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
              Price: ₹{parseFloat(form.price).toLocaleString("en-IN")} → Tax incl. (est. 18%): ₹{(parseFloat(form.price) * 1.18).toFixed(2)}
            </p>
          </div>
        )}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Category *</Label>
            <Select value={form.categoryId} onValueChange={(v) => v && setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Brand</Label>
            <Select value={form.brandId} onValueChange={(v) => v && setForm({ ...form, brandId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No brand</SelectItem>
                {filteredBrands.map((b) => (<SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>))}
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

        {/* Advanced Fields */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Advanced Details</h3>
          <Tabs defaultValue="ids" className="w-full">
            <TabsList className="flex flex-wrap w-full">
              <TabsTrigger value="ids">IDs & Origin</TabsTrigger>
              <TabsTrigger value="physical">Physical</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="warranty">Warranty</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>
            <TabsContent value="ids" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>GTIN</Label><Input value={form.gtin} onChange={(e) => setForm({ ...form, gtin: e.target.value })} /></div>
                <div><Label>MPN</Label><Input value={form.mpn} onChange={(e) => setForm({ ...form, mpn: e.target.value })} /></div>
                <div><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
                <div><Label>Country of Origin</Label><Input value={form.countryOfOrigin} onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })} placeholder="IN, US, CN" /></div>
                <div>
                  <Label>Condition</Label>
                  <Select value={form.condition} onValueChange={(v) => v && setForm({ ...form, condition: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NEW">New</SelectItem>
                      <SelectItem value="LIKE_NEW">Like New</SelectItem>
                      <SelectItem value="REFURBISHED">Refurbished</SelectItem>
                      <SelectItem value="USED_GOOD">Used - Good</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="physical" className="space-y-3 pt-3">
              <div className="grid grid-cols-4 gap-3">
                <div><Label>Weight (g)</Label><Input type="number" value={form.weightGrams} onChange={(e) => setForm({ ...form, weightGrams: e.target.value })} /></div>
                <div><Label>Length (mm)</Label><Input type="number" value={form.lengthMm} onChange={(e) => setForm({ ...form, lengthMm: e.target.value })} /></div>
                <div><Label>Width (mm)</Label><Input type="number" value={form.widthMm} onChange={(e) => setForm({ ...form, widthMm: e.target.value })} /></div>
                <div><Label>Height (mm)</Label><Input type="number" value={form.heightMm} onChange={(e) => setForm({ ...form, heightMm: e.target.value })} /></div>
              </div>
            </TabsContent>
            <TabsContent value="pricing" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Cost Price</Label><Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
                <div><Label>Wholesale</Label><Input type="number" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} /></div>
                <div><Label>MSRP</Label><Input type="number" value={form.msrp} onChange={(e) => setForm({ ...form, msrp: e.target.value })} /></div>
              </div>
            </TabsContent>
            <TabsContent value="warranty" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Warranty</Label>
                  <Select value={form.warrantyType} onValueChange={(v) => v && setForm({ ...form, warrantyType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="MANUFACTURER">Manufacturer</SelectItem>
                      <SelectItem value="SELLER">Seller</SelectItem>
                      <SelectItem value="LIFETIME">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Duration (months)</Label><Input type="number" value={form.warrantyDurationMonths} onChange={(e) => setForm({ ...form, warrantyDurationMonths: e.target.value })} /></div>
                <div>
                  <Label>Return Policy</Label>
                  <Select value={form.returnPolicy} onValueChange={(v) => v && setForm({ ...form, returnPolicy: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_RETURN">No Return</SelectItem>
                      <SelectItem value="DAYS_7">7 Days</SelectItem>
                      <SelectItem value="DAYS_30">30 Days</SelectItem>
                      <SelectItem value="DAYS_90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>
            <TabsContent value="details" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Material</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} /></div>
                <div><Label>Gender</Label><Input value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} placeholder="men, women, unisex" /></div>
              </div>
              <div><Label>Ingredients</Label><Textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} rows={2} /></div>
            </TabsContent>
            <TabsContent value="seo" className="space-y-3 pt-3">
              <div><Label>Meta Title</Label><Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} /></div>
              <div><Label>Meta Description</Label><Textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} rows={2} /></div>
              <div><Label>Video URL</Label><Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} /></div>
            </TabsContent>
          </Tabs>
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
            {translations.map((t) => (
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
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl mt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold">Variants</h2>
            <p className="text-sm text-gray-500">Manage product options (size, color, etc.) and variant combinations</p>
          </div>
          <Button onClick={() => router.push(`/admin/products/${params.id}/variants`)}>
            Manage Variants →
          </Button>
        </div>
      </div>

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
                    const existing = translations.find((t) => t.locale === loc.code);
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
                  <DialogTitle>{translations.some((t) => t.locale === transForm.locale) ? "Edit Translation" : "Create Translation"}</DialogTitle>
                </div>
              </DialogHeader>
              <div className={`px-4 py-2 rounded-md text-sm font-medium mb-2 ${translations.some((t) => t.locale === transForm.locale) ? "bg-amber-50 text-amber-700 border border-amber-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                {translations.some((t) => t.locale === transForm.locale) ? "✏️ Editing existing translation" : "✨ Creating new translation"}
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
