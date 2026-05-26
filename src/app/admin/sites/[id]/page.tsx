"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getSite, updateSite, addSiteDomain, removeSiteDomain, getAllProducts, getSiteProducts, addProductToSite, updateSiteProduct, removeProductFromSite, getAllCategories, getSiteCategories, addCategoryToSite, updateSiteCategory, removeCategoryFromSite } from "@/server/actions/site-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, ExternalLink, Package, FolderTree, Palette } from "lucide-react";

export default function SiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [site, setSite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"settings" | "domains" | "products" | "categories">("settings");
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [siteProducts, setSiteProducts] = useState<any[]>([]);
  const [allCategories, setAllCategories] = useState<any[]>([]);
  const [siteCategories, setSiteCategories] = useState<any[]>([]);
  const [domainDialog, setDomainDialog] = useState(false);
  const [productDialog, setProductDialog] = useState(false);
  const [categoryDialog, setCategoryDialog] = useState(false);
  const [form, setForm] = useState<{ name: string; slug: string; domain: string; subdomain: string; status: string; description: string; primaryColor: string; secondaryColor: string; fontFamily: string }>({ name: "", slug: "", domain: "", subdomain: "", status: "PENDING", description: "", primaryColor: "#2563eb", secondaryColor: "#f59e0b", fontFamily: "sans" });
  const [domainForm, setDomainForm] = useState<{ hostname: string; type: string }>({ hostname: "", type: "SUBDOMAIN" });
  const [productForm, setProductForm] = useState<{ productId: string; customSlug: string }>({ productId: "", customSlug: "" });
  const [categoryForm, setCategoryForm] = useState<{ categoryId: string; customName: string; customSlug: string }>({ categoryId: "", customName: "", customSlug: "" });

  useEffect(() => {
    if (!params?.id) return;
    loadData();
  }, [params?.id]);

  async function loadData() {
    try {
      const [s, products, sp, cats, sc] = await Promise.all([
        getSite(params.id as string),
        getAllProducts(),
        getSiteProducts(params.id as string),
        getAllCategories(),
        getSiteCategories(params.id as string),
      ]);
      setSite(s);
      setForm({ name: s?.name || "", slug: s?.slug || "", domain: s?.domain || "", subdomain: s?.subdomain || "", status: s?.status || "PENDING", description: s?.description || "", primaryColor: s?.primaryColor || "#2563eb", secondaryColor: s?.secondaryColor || "#f59e0b", fontFamily: s?.fontFamily || "sans" });
      setAllProducts(products); setSiteProducts(sp);
      setAllCategories(cats); setSiteCategories(sc);
    } catch { router.push("/admin/sites"); }
    finally { setLoading(false); }
  }

  async function handleSave() {
    if (!form.name) { toast.error("Name required"); return; }
    try {
      await updateSite(site.id, { name: form.name, slug: form.slug, domain: form.domain, subdomain: form.subdomain, status: form.status, description: form.description, primaryColor: form.primaryColor, secondaryColor: form.secondaryColor, fontFamily: form.fontFamily });
      toast.success("Site updated");
      loadData();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleAddDomain() {
    if (!domainForm.hostname) { toast.error("Hostname required"); return; }
    try {
      await addSiteDomain(site.id, domainForm.hostname, domainForm.type);
      toast.success("Domain added"); setDomainDialog(false); setDomainForm({ hostname: "", type: "SUBDOMAIN" });
      loadData();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleRemoveDomain(id: string) {
    if (!confirm("Remove this domain?")) return;
    try { await removeSiteDomain(id); toast.success("Domain removed"); loadData(); } catch (err: any) { toast.error(err.message); }
  }

  async function handleAddProduct() {
    if (!productForm.productId) { toast.error("Product required"); return; }
    try {
      await addProductToSite(site.id, productForm.productId, { customSlug: productForm.customSlug || undefined });
      toast.success("Product added to site"); setProductDialog(false); setProductForm({ productId: "", customSlug: "" });
      loadData();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleRemoveProduct(id: string) {
    if (!confirm("Remove this product from the site?")) return;
    try { await removeProductFromSite(id); toast.success("Product removed"); loadData(); } catch (err: any) { toast.error(err.message); }
  }

  async function handleAddCategory() {
    if (!categoryForm.categoryId) { toast.error("Category required"); return; }
    try {
      await addCategoryToSite(site.id, categoryForm.categoryId, categoryForm.customName || undefined, categoryForm.customSlug || undefined);
      toast.success("Category added"); setCategoryDialog(false); setCategoryForm({ categoryId: "", customName: "", customSlug: "" });
      loadData();
    } catch (err: any) { toast.error(err.message); }
  }

  async function handleRemoveCategory(id: string) {
    if (!confirm("Remove this category from the site?")) return;
    try { await removeCategoryFromSite(id); toast.success("Category removed"); loadData(); } catch (err: any) { toast.error(err.message); }
  }

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;
  if (!site) return null;

  const tabs = [
    { id: "settings" as const, label: "Settings" },
    { id: "domains" as const, label: "Domains" },
    { id: "products" as const, label: `Products (${siteProducts.length})` },
    { id: "categories" as const, label: `Categories (${siteCategories.length})` },
  ];

  return (
    <div className="p-6">
      <Link href="/admin/sites">
        <Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back to Sites</Button>
      </Link>
      <h1 className="text-2xl font-bold mb-2">{site.name}</h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant={site.status === "ACTIVE" ? "default" : "secondary"}>{site.status}</Badge>
        {site.isDefault && <Badge variant="outline">Default Site</Badge>}
        <span className="text-sm text-gray-400">/{site.slug}</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b">
        {tabs.map((tab) => (
          <button key={tab.id} className={`px-4 py-2 text-sm font-medium border-b-2 transition ${activeTab === tab.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`} onClick={() => setActiveTab(tab.id)}>{tab.label}</button>
        ))}
      </div>

      {activeTab === "settings" && (
        <div className="max-w-2xl space-y-4 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Site Settings</h2>
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></div>
          <div><Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="SUSPENDED">Suspended</SelectItem></SelectContent>
            </Select>
          </div>
          <div><Label>Custom Domain</Label><Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="shop.mystore.com" /></div>
          <div><Label>Subdomain</Label><Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="mystore" /></div>
          <div><Label>Description</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Primary Color</Label><div className="flex gap-2"><Input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-16 h-10" /><Input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div></div>
            <div><Label>Secondary Color</Label><div className="flex gap-2"><Input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="w-16 h-10" /><Input value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} /></div></div>
          </div>
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      )}

      {activeTab === "domains" && (
        <div className="max-w-2xl bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Domains</h2>
            <Button size="sm" onClick={() => setDomainDialog(true)}><Plus className="w-4 h-4 mr-2" /> Add Domain</Button>
          </div>
          {site.domains?.length === 0 && <p className="text-sm text-gray-400 py-4">No domains configured yet.</p>}
          <div className="space-y-2">
            {site.domains?.map((d: any) => (
              <div key={d.id} className="flex items-center justify-between border rounded-lg p-3">
                <div>
                  <Badge className="mr-2">{d.type}</Badge>
                  <span className="text-sm">{d.hostname}</span>
                  <Badge variant={d.sslStatus === "ACTIVE" ? "default" : "secondary"} className="ml-2 text-xs">{d.sslStatus}</Badge>
                </div>
                <Button variant="ghost" size="sm" onClick={() => handleRemoveDomain(d.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            ))}
          </div>
          {site.domain && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium mb-1">Primary Domain</p>
              <p className="text-sm">{site.domain}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "products" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><Package className="w-5 h-5" /> Products</h2>
            <Button size="sm" onClick={() => setProductDialog(true)}><Plus className="w-4 h-4 mr-2" /> Add Product</Button>
          </div>
          {siteProducts.length === 0 ? <p className="text-sm text-gray-400 py-4">No products added to this site yet.</p> : (
            <div className="space-y-2">
              {siteProducts.map((sp: any) => (
                <div key={sp.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    {sp.product.images?.[0] && <img src={sp.product.images[0]} alt="" className="w-10 h-10 rounded object-cover" />}
                    <div>
                      <p className="text-sm font-medium">{sp.product.name}</p>
                      <p className="text-xs text-gray-400">{sp.product.slug}</p>
                    </div>
                    <Badge variant={sp.isVisible ? "default" : "secondary"} className="ml-2">{sp.isVisible ? "Visible" : "Hidden"}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveProduct(sp.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === "categories" && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2"><FolderTree className="w-5 h-5" /> Categories</h2>
            <Button size="sm" onClick={() => setCategoryDialog(true)}><Plus className="w-4 h-4 mr-2" /> Add Category</Button>
          </div>
          {siteCategories.length === 0 ? <p className="text-sm text-gray-400 py-4">No categories added to this site yet.</p> : (
            <div className="space-y-2">
              {siteCategories.map((sc: any) => (
                <div key={sc.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div>
                    <p className="text-sm font-medium">{sc.category?.name}</p>
                    {(sc.customName || sc.customSlug) && <p className="text-xs text-gray-400">{sc.customName || sc.category?.name} — /{sc.customSlug || sc.category?.slug}</p>}
                    <Badge variant={sc.isVisible ? "default" : "secondary"} className="mt-1">{sc.isVisible ? "Visible" : "Hidden"}</Badge>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveCategory(sc.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Domain Dialog */}
      <Dialog open={domainDialog} onOpenChange={setDomainDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Domain</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Hostname</Label><Input value={domainForm.hostname} onChange={(e) => setDomainForm({ ...domainForm, hostname: e.target.value })} placeholder="shop.mystore.com" /></div>
            <div><Label>Type</Label>
              <Select value={domainForm.type} onValueChange={(v) => v && setDomainForm({ ...domainForm, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="SUBDOMAIN">Subdomain</SelectItem><SelectItem value="CUSTOM">Custom Domain</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setDomainDialog(false)}>Cancel</Button><Button onClick={handleAddDomain}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Dialog */}
      <Dialog open={productDialog} onOpenChange={setProductDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Product to Site</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Product</Label>
              <Select value={productForm.productId} onValueChange={(v) => v && setProductForm({ ...productForm, productId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a product" /></SelectTrigger>
                <SelectContent>{allProducts.filter((p) => !siteProducts.some((sp) => sp.productId === p.id)).map((p) => (<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>Custom Slug (optional)</Label><Input value={productForm.customSlug} onChange={(e) => setProductForm({ ...productForm, customSlug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="custom-product-url" /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setProductDialog(false)}>Cancel</Button><Button onClick={handleAddProduct}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Category to Site</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Category</Label>
              <Select value={categoryForm.categoryId} onValueChange={(v) => v && setCategoryForm({ ...categoryForm, categoryId: v })}>
                <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                <SelectContent>{allCategories.filter((c) => !siteCategories.some((sc) => sc.categoryId === c.id)).map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div><Label>Custom Name (optional)</Label><Input value={categoryForm.customName} onChange={(e) => setCategoryForm({ ...categoryForm, customName: e.target.value })} /></div>
            <div><Label>Custom Slug (optional)</Label><Input value={categoryForm.customSlug} onChange={(e) => setCategoryForm({ ...categoryForm, customSlug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCategoryDialog(false)}>Cancel</Button><Button onClick={handleAddCategory}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
