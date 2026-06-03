"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getTranslationOverview,
  getTranslationStats,
  getProductsMissingTranslation,
  createBulkTranslations,
  createProductTranslation,
  updateProductTranslation,
  deleteProductTranslationById,
  getProductRegionOverview,
  getRegions,
} from "@/server/actions/localization-actions";
import { LOCALES, getLocaleName } from "@/lib/i18n";
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
import { BarChart3, Languages, Edit2, Trash2, Plus, Copy, Globe } from "lucide-react";

type Translation = {
  id: string;
  locale: string;
  name: string;
  slug: string;
  shortDesc: string | null;
  description: string | null;
  tags: string[];
};

type ProductOverview = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  categoryName: string;
  translations: Translation[];
  translatedLocales: string[];
  coverage: number;
};

type Stats = {
  totalProducts: number;
  productsWithTranslations: number;
  totalTranslations: number;
  translationsByLocale: { locale: string; count: number }[];
};

export default function AdminTranslationsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOverview[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [coverageFilter, setCoverageFilter] = useState<"all" | "complete" | "partial" | "none">("all");
  const [localeFilter, setLocaleFilter] = useState<string>("");
  const [page, setPage] = useState(1);
  const limit = 20;
  const [total, setTotal] = useState(0);

  // Editor dialog
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductOverview | null>(null);
  const [editorLocale, setEditorLocale] = useState("");
  const [editingTranslation, setEditingTranslation] = useState<Translation | null>(null);
  const [form, setForm] = useState({
    name: "", slug: "", shortDesc: "", description: "", tags: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Bulk operations
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkLocale, setBulkLocale] = useState("");
  const [bulkSourceLocale, setBulkSourceLocale] = useState("");
  const [missingProducts, setMissingProducts] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkTab, setBulkTab] = useState<"create" | "copy">("create");

  // Region pricing
  const [regionDialogOpen, setRegionDialogOpen] = useState(false);
  const [regionProduct, setRegionProduct] = useState<ProductOverview | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [regionData, setRegionData] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [regions, setRegions] = useState<any[]>([]);
  const [regionPriceForm, setRegionPriceForm] = useState({ regionId: "", price: "", comparePrice: "", discountType: "NONE", discountValue: "" });

  const fetchOverview = useCallback(() => {
    setLoading(true);
    getTranslationOverview({
      page, limit, search: searchTerm, coverageFilter, localeFilter,
    })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch((e) => {
        if (e.message === "Unauthorized") router.push("/auth/login");
      })
      .finally(() => setLoading(false));
  }, [page, searchTerm, coverageFilter, localeFilter, router]);

  useEffect(() => { fetchOverview(); }, [fetchOverview]);

  useEffect(() => {
    getTranslationStats().then(setStats).catch(() => {});
    getRegions().then(setRegions).catch(() => {});
  }, []);

  const totalPages = Math.ceil(total / limit);

  const handleDelete = async (translation: Translation) => {
    if (!confirm(`Delete ${getLocaleName(translation.locale)} translation for "${translation.name}"?`)) return;
    try {
      await deleteProductTranslationById(translation.id);
      toast.success("Translation deleted");
      fetchOverview();
      getTranslationStats().then(setStats).catch(() => {});
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const openEditor = (product: ProductOverview, translation?: Translation) => {
    setEditingProduct(product);
    if (translation) {
      setEditorLocale(translation.locale);
      setEditingTranslation(translation);
      setForm({
        name: translation.name,
        slug: translation.slug,
        shortDesc: translation.shortDesc || "",
        description: translation.description || "",
        tags: translation.tags?.join(", ") || "",
      });
    } else {
      setEditorLocale("");
      setEditingTranslation(null);
      setForm({ name: "", slug: "", shortDesc: "", description: "", tags: "" });
    }
    setEditorOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !editorLocale) {
      toast.error("Locale and name are required");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name,
        slug: form.slug || form.name.toLowerCase().replace(/\s+/g, "-"),
        shortDesc: form.shortDesc || undefined,
        description: form.description || undefined,
        tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      };

      if (editingTranslation) {
        await updateProductTranslation(editingTranslation.id, payload);
        toast.success("Translation updated");
      } else {
        await createProductTranslation(editingProduct!.id, editorLocale, payload);
        toast.success("Translation created");
      }

      setEditorOpen(false);
      fetchOverview();
      getTranslationStats().then(setStats).catch(() => {});
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
    finally { setSubmitting(false); }
  };

  // Bulk operations
  const openBulkDialog = async () => {
    setBulkDialogOpen(true);
    setBulkLocale("");
    setBulkSourceLocale("");
    setMissingProducts([]);
    setBulkSelected(new Set());
    setBulkTab("create");
  };

  const loadMissingProducts = async (locale: string) => {
    setBulkLoading(true);
    try {
      const data = await getProductsMissingTranslation(locale);
      setMissingProducts(data);
      setBulkSelected(new Set(data.map((p) => p.id)));
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
    finally { setBulkLoading(false); }
  };

  const handleBulkCreate = async () => {
    if (!bulkLocale) { toast.error("Select a target locale"); return; }
    if (bulkSelected.size === 0) { toast.error("Select at least one product"); return; }

    setBulkLoading(true);
    try {
      const ids = Array.from(bulkSelected);
      const source = bulkTab === "copy" && bulkSourceLocale ? bulkSourceLocale : undefined;
      const results = await createBulkTranslations(bulkLocale, ids, source);
      const success = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success);
      toast.success(`${success} translations created`);
      if (failed.length > 0) {
        toast.error(`${failed.length} failed: ${failed.map((f) => f.error).join(", ")}`);
      }
      setBulkDialogOpen(false);
      fetchOverview();
      getTranslationStats().then(setStats).catch(() => {});
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
    finally { setBulkLoading(false); }
  };

  // Region pricing
  const openRegionDialog = async (product: ProductOverview) => {
    setRegionProduct(product);
    setRegionDialogOpen(true);
    setRegionPriceForm({ regionId: "", price: "", comparePrice: "", discountType: "NONE", discountValue: "" });
    try {
      const data = await getProductRegionOverview(product.id);
      setRegionData(data);
    } catch { setRegionData(null); }
  };

  const handleSaveRegionPrice = async () => {
    if (!regionPriceForm.regionId || !regionPriceForm.price) {
      toast.error("Region and price are required");
      return;
    }
    try {
      const { setProductRegionPrice } = await import("@/server/actions/localization-actions");
      await setProductRegionPrice(regionProduct!.id, regionPriceForm.regionId, {
        currency: regions.find((r) => r.id === regionPriceForm.regionId)?.currency || "INR",
        price: parseFloat(regionPriceForm.price),
        comparePrice: regionPriceForm.comparePrice ? parseFloat(regionPriceForm.comparePrice) : undefined,
        discountType: regionPriceForm.discountType === "NONE" ? "NONE" : regionPriceForm.discountType,
        discountValue: regionPriceForm.discountValue ? parseFloat(regionPriceForm.discountValue) : undefined,
      });
      toast.success("Region price saved");
      setRegionPriceForm({ regionId: "", price: "", comparePrice: "", discountType: "NONE", discountValue: "" });
      const data = await getProductRegionOverview(regionProduct!.id);
      setRegionData(data);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const getCoverageBadge = (coverage: number) => {
    const allLocales = LOCALES.filter((l) => l.code !== "en");
    if (coverage === 0) return <Badge className="bg-gray-100 text-gray-500">0%</Badge>;
    if (coverage >= allLocales.length) return <Badge className="bg-green-100 text-green-700">100%</Badge>;
    const pct = Math.round((coverage / allLocales.length) * 100);
    return <Badge className="bg-amber-100 text-amber-700">{pct}%</Badge>;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Languages className="w-6 h-6" />
            Product Translations
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage localized content for products across {LOCALES.length - 1} supported languages
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={openBulkDialog}>
            <Copy className="w-4 h-4 mr-1" /> Bulk Create
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold">{stats?.totalProducts ?? "-"}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">With Translations</p>
          <p className="text-2xl font-bold text-green-600">{stats?.productsWithTranslations ?? "-"}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Translations</p>
          <p className="text-2xl font-bold text-blue-600">{stats?.totalTranslations ?? "-"}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Coverage</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats && stats.totalProducts > 0
              ? `${Math.round((stats.productsWithTranslations / stats.totalProducts) * 100)}%`
              : "-"}
          </p>
        </div>
      </div>

      {/* Locale breakdown */}
      {stats && stats.translationsByLocale.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Translations by Locale
          </h3>
          <div className="flex flex-wrap gap-4">
            {stats.translationsByLocale.map((l) => {
              const locale = LOCALES.find((lc) => lc.code === l.locale);
              return (
                <div key={l.locale} className="flex items-center gap-2">
                  <span className="text-sm">{locale?.nativeName ?? l.locale}</span>
                  <Badge variant="outline">{l.count}</Badge>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label>Search</Label>
          <div className="flex gap-2 mt-1">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Product name" />
            <Button onClick={() => { setPage(1); setSearchTerm(search); }}>Go</Button>
          </div>
        </div>
        <div>
          <Label>Locale Filter</Label>
          <Select value={localeFilter} onValueChange={(v) => { setLocaleFilter(v || ""); setPage(1); }}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="All Locales" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Locales</SelectItem>
              {LOCALES.filter((l) => l.code !== "en").map((loc) => (
                <SelectItem key={loc.code} value={loc.code}>{loc.nativeName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Coverage</Label>
          <Select value={coverageFilter} onValueChange={(v) => { setCoverageFilter(v || "all"); setPage(1); }}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="All Products" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="complete">100% Translated</SelectItem>
              <SelectItem value="partial">Partially Translated</SelectItem>
              <SelectItem value="none">No Translations</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Translations Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Product</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Translations</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Coverage</th>
              <th className="text-left px-4 py-3 text-sm font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">No products found</td></tr>
            ) : (
              products.map((product) => (
                <tr key={product.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-sm">{product.name}</p>
                    <p className="text-xs text-gray-400">{product.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-sm">{product.categoryName}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {product.translations.length === 0 ? (
                        <span className="text-xs text-gray-400">None</span>
                      ) : (
                        product.translations.map((t: Translation) => (
                          <Badge key={t.id} variant="outline" className="text-xs cursor-pointer hover:bg-blue-50"
                            onClick={() => openEditor(product, t)}
                          >
                            {getLocaleName(t.locale)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">{getCoverageBadge(product.coverage)}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => openRegionDialog(product)} title="Region pricing">
                        <Globe className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => openEditor(product)} title="Add translation">
                        <Plus className="w-3.5 h-3.5" />
                      </Button>
                      <Link href={`/admin/products/${product.id}`} className="text-blue-600 hover:underline text-sm" title="Edit product">
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} products)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Translation Editor Dialog */}
      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingTranslation ? "Edit Translation" : "Add Translation"}
              {editingProduct && (
                <span className="text-sm font-normal text-gray-500 block mt-1">
                  for &quot;{editingProduct.name}&quot;
                </span>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Locale *</Label>
              <Select
                value={editorLocale}
                onValueChange={(v) => {
                  if (!editingTranslation && v) {
                    setEditorLocale(v);
                  }
                }}
                disabled={!!editingTranslation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select locale" />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.filter((l) => {
                    if (l.code === "en") return false;
                    if (editingTranslation) return l.code === editingTranslation.locale;
                    const existingLocales = editingProduct?.translations.map((t) => t.locale) ?? [];
                    return !existingLocales.includes(l.code);
                  }).map((loc) => (
                    <SelectItem key={loc.code} value={loc.code}>
                      {loc.nativeName}
                    </SelectItem>
                  ))}
                  {editingTranslation && (
                    <SelectItem key={editingTranslation.locale} value={editingTranslation.locale}>
                      {getLocaleName(editingTranslation.locale)}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })}
                placeholder="auto-generated if empty" />
            </div>
            <div>
              <Label>Short Description</Label>
              <Input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={4} />
            </div>
            <div>
              <Label>Tags</Label>
              <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                placeholder="comma separated" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)}>Cancel</Button>
            {editingTranslation && (
              <Button variant="destructive" onClick={async () => {
                await handleDelete(editingTranslation);
                setEditorOpen(false);
              }}>
                <Trash2 className="w-4 h-4 mr-1" /> Delete
              </Button>
            )}
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? "Saving..." : editingTranslation ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Operations Dialog */}
      <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bulk Create Translations</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Tab toggle */}
            <div className="flex gap-2">
              <Button
                variant={bulkTab === "create" ? "default" : "outline"}
                size="sm"
                onClick={() => setBulkTab("create")}
              >
                Create Empty
              </Button>
              <Button
                variant={bulkTab === "copy" ? "default" : "outline"}
                size="sm"
                onClick={() => setBulkTab("copy")}
              >
                Copy from Locale
              </Button>
            </div>

            <div>
              <Label>Target Locale</Label>
              <Select value={bulkLocale} onValueChange={(v) => { if (v) { setBulkLocale(v); loadMissingProducts(v); } }}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select target locale" />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.filter((l) => l.code !== "en").map((loc) => (
                    <SelectItem key={loc.code} value={loc.code}>{loc.nativeName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {bulkTab === "copy" && (
              <div>
                <Label>Source Locale</Label>
                <Select value={bulkSourceLocale} onValueChange={(v) => v && setBulkSourceLocale(v)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Copy from (optional - uses English if none)" />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCALES.filter((l) => l.code !== "en").map((loc) => (
                      <SelectItem key={loc.code} value={loc.code}>{loc.nativeName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {bulkLoading ? (
              <p className="text-sm text-gray-500">Loading products...</p>
            ) : (
              <>
                {missingProducts.length === 0 && bulkLocale ? (
                  <p className="text-sm text-gray-500">All products already have translations for this locale.</p>
                ) : (
                  <div className="max-h-60 overflow-auto border rounded">
                    {missingProducts.map((p) => (
                      <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer border-b last:border-0">
                        <input
                          type="checkbox"
                          checked={bulkSelected.has(p.id)}
                          onChange={(e) => {
                            const next = new Set(bulkSelected);
                            if (e.target.checked) next.add(p.id);
                            else next.delete(p.id);
                            setBulkSelected(next);
                          }}
                        />
                        <div>
                          <p className="text-sm font-medium">{p.name}</p>
                          <p className="text-xs text-gray-400">{p.slug}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </>
            )}

            <p className="text-sm text-gray-500">
              {bulkSelected.size} of {missingProducts.length} products selected
            </p>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkCreate} disabled={bulkLoading || bulkSelected.size === 0}>
              {bulkLoading ? "Creating..." : `Create ${bulkSelected.size} Translation${bulkSelected.size !== 1 ? "s" : ""}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Region Pricing Dialog */}
      <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Region Pricing: {regionProduct?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Existing region prices */}
            {regionData?.prices && regionData.prices.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-auto">
                {regionData.prices.map((p: { regionId: string; regionName: string; currencySymbol: string; price: number; comparePrice?: number }) => (
                  <div key={p.regionId} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <Badge className="mb-1">{p.regionName}</Badge>
                      <p className="text-sm font-medium">
                        {p.currencySymbol}{p.price}
                      </p>
                      {p.comparePrice && (
                        <p className="text-xs text-gray-400 line-through">{p.currencySymbol}{p.comparePrice}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">
                        {regionData.availabilities?.find((a: { regionId: string; isAvailable: boolean }) => a.regionId === p.regionId)?.isAvailable ? "In stock" : "Unavailable"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400">No region-specific prices set.</p>
            )}

            {/* Add region price form */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-semibold mb-3">Add Region Price</h4>
              <div className="space-y-3">
                <div>
                  <Label>Region</Label>
                  <Select value={regionPriceForm.regionId} onValueChange={(v) => v && setRegionPriceForm({ ...regionPriceForm, regionId: v })}>
                    <SelectTrigger className="mt-1"><SelectValue placeholder="Select region" /></SelectTrigger>
                    <SelectContent>
                      {regions.map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name} ({r.currency})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Price</Label><Input type="number" value={regionPriceForm.price} onChange={(e) => setRegionPriceForm({ ...regionPriceForm, price: e.target.value })} /></div>
                  <div><Label>Compare Price</Label><Input type="number" value={regionPriceForm.comparePrice} onChange={(e) => setRegionPriceForm({ ...regionPriceForm, comparePrice: e.target.value })} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Discount Type</Label>
                    <Select value={regionPriceForm.discountType} onValueChange={(v) => setRegionPriceForm({ ...regionPriceForm, discountType: v || "NONE" })}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FLAT">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Discount Value</Label><Input type="number" value={regionPriceForm.discountValue} onChange={(e) => setRegionPriceForm({ ...regionPriceForm, discountValue: e.target.value })} /></div>
                </div>
              </div>
              <Button className="mt-3" size="sm" onClick={handleSaveRegionPrice}>Add Price</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
