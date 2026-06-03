"use client";
import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  getSite, updateSite, addSiteDomain, removeSiteDomain,
  getAllProducts, getSiteProducts, addProductToSite, removeProductFromSite,
  getAllCategories, getSiteCategories, addCategoryToSite, removeCategoryFromSite,
  getAllBrands, getSiteBrands, addBrandToSite, removeBrandFromSite,
  updateSiteSettings, getSiteSettings, getSiteFormLookups,
  getSiteAdmins, updateSiteAdminPermissions,
} from "@/server/actions/site-actions";
import { ALL_PERMISSIONS, PERMISSION_GROUPS } from "@/lib/site-permissions";
import { COMMON_LOCALES } from "@/lib/sites/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type TabId = "general" | "region" | "branding" | "contact" | "products" | "payments" | "shipping" | "sellers" | "suppliers" | "offers" | "notifications" | "orders" | "inventory" | "compliance" | "permissions";

// Lookup payload returned by getSiteFormLookups; only the bits this page uses.
type FormLookups = {
  regions: Array<{
    id: string;
    code: string;
    name: string;
    currency: string;
    currencySymbol: string;
    defaultLocale: string;
    supportedLocales: string[];
    timezone: string;
  }>;
  currencies: Array<{ code: string; name: string; symbol: string }>;
};

export default function SiteDetailPage() {
  const router = useRouter();
  const params = useParams();
  const siteId = params?.id as string;

  interface SiteDomain { id: string; hostname: string; type: string }
  interface SiteData { id: string; name: string; slug: string; domain: string | null; subdomain: string | null; status: string; description: string | null; primaryColor: string | null; secondaryColor: string | null; fontFamily: string | null; logo: string | null; favicon: string | null; regionId: string | null; defaultCurrency: string | null; defaultLocale: string | null; supportedLocales: string[]; contactEmail: string | null; contactPhone: string | null; contactAddress: string | null; domains: SiteDomain[]; isDefault?: boolean }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- site products/categories/brands have complex Prisma relation shapes
  const [site, setSite] = useState<SiteData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex Prisma join types
  const [allProducts, setAllProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex Prisma join types
  const [siteProducts, setSiteProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex Prisma join types
  const [allCategories, setAllCategories] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex Prisma join types
  const [siteCategories, setSiteCategories] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex Prisma join types
  const [allBrands, setAllBrands] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex Prisma join types
  const [siteBrands, setSiteBrands] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, any>>({});
  const [lookups, setLookups] = useState<FormLookups | null>(null);
  const [form, setForm] = useState({
    // Identity
    name: "",
    slug: "",
    domain: "",
    subdomain: "",
    status: "PENDING",
    description: "",
    // Branding
    primaryColor: "#2563eb",
    secondaryColor: "#f59e0b",
    fontFamily: "sans",
    logo: "",
    favicon: "",
    // Region & locale (first-class columns)
    regionId: "",
    defaultCurrency: "",
    defaultLocale: "",
    supportedLocales: [] as string[],
    // Contact (first-class columns)
    contactEmail: "",
    contactPhone: "",
    contactAddress: "",
  });

  // Dialog states
  const [domainDlg, setDomainDlg] = useState(false);
  const [productDlg, setProductDlg] = useState(false);
  const [categoryDlg, setCategoryDlg] = useState(false);
  const [brandDlg, setBrandDlg] = useState(false);
  const [domainForm, setDomainForm] = useState({ hostname: "", type: "SUBDOMAIN" });
  const [productForm, setProductForm] = useState({ productId: "", customSlug: "" });
  const [categoryForm, setCategoryForm] = useState({ categoryId: "", customName: "", customSlug: "" });
  const [brandForm, setBrandForm] = useState({ brandId: "" });

  useEffect(() => { if (siteId) loadData(); }, [siteId]);

  async function loadData() {
    try {
      const [s, prods, sp, cats, sc, brands, sb, st, lk] = await Promise.all([
        getSite(siteId), getAllProducts(), getSiteProducts(siteId),
        getAllCategories(), getSiteCategories(siteId),
        getAllBrands(), getSiteBrands(siteId), getSiteSettings(siteId),
        getSiteFormLookups(),
      ]);
      setSite(s);
      setForm({
        name: s?.name || "",
        slug: s?.slug || "",
        domain: s?.domain || "",
        subdomain: s?.subdomain || "",
        status: s?.status || "PENDING",
        description: s?.description || "",
        primaryColor: s?.primaryColor || "#2563eb",
        secondaryColor: s?.secondaryColor || "#f59e0b",
        fontFamily: s?.fontFamily || "sans",
        logo: s?.logo || "",
        favicon: s?.favicon || "",
        regionId: s?.regionId || "",
        defaultCurrency: s?.defaultCurrency || "",
        defaultLocale: s?.defaultLocale || "",
        supportedLocales: Array.isArray(s?.supportedLocales) ? s.supportedLocales : [],
        contactEmail: s?.contactEmail || "",
        contactPhone: s?.contactPhone || "",
        contactAddress: s?.contactAddress || "",
      });
      setAllProducts(prods); setSiteProducts(sp);
      setAllCategories(cats); setSiteCategories(sc);
      setAllBrands(brands); setSiteBrands(sb);
      setSettings(st);
      setLookups(lk as FormLookups);
    } catch { router.push("/admin/sites"); }
    finally { setLoading(false); }
  }

  async function saveSite() {
    if (!site) return;
    if (!form.name) { toast.error("Name required"); return; }
    try {
      await updateSite(site.id, {
        name: form.name,
        slug: form.slug,
        domain: form.domain || undefined,
        subdomain: form.subdomain || undefined,
        status: form.status as "PENDING" | "ACTIVE" | "SUSPENDED",
        description: form.description || undefined,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        fontFamily: form.fontFamily,
        logo: form.logo || undefined,
        favicon: form.favicon || undefined,
        regionId: form.regionId || undefined,
        defaultCurrency: form.defaultCurrency || undefined,
        defaultLocale: form.defaultLocale || undefined,
        supportedLocales: form.supportedLocales,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        contactAddress: form.contactAddress || undefined,
      });
      toast.success("Saved");
      loadData();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    }
  }

  async function saveSettings(patch: Record<string, unknown>) {
    if (!site) return;
    try { await updateSiteSettings(site.id, patch); setSettings((p) => ({ ...p, ...patch })); toast.success("Settings saved"); } catch (e) { toast.error(e instanceof Error ? e.message : "Operation failed"); }
  }

  // Quick handlers
  async function addDomain() { if (!site || !domainForm.hostname) return; await addSiteDomain(site.id, domainForm.hostname, domainForm.type); setDomainDlg(false); setDomainForm({ hostname: "", type: "SUBDOMAIN" }); toast.success("Added"); loadData(); }
  async function rmDomain(id: string) { if (!confirm("Remove?")) return; await removeSiteDomain(id); toast.success("Removed"); loadData(); }
  async function addProd() { if (!site || !productForm.productId) return; await addProductToSite(site.id, productForm.productId, { customSlug: productForm.customSlug || undefined }); setProductDlg(false); setProductForm({ productId: "", customSlug: "" }); toast.success("Added"); loadData(); }
  async function rmProd(id: string) { if (!confirm("Remove?")) return; await removeProductFromSite(id); toast.success("Removed"); loadData(); }
  async function addCat() { if (!site || !categoryForm.categoryId) return; await addCategoryToSite(site.id, categoryForm.categoryId, categoryForm.customName || undefined, categoryForm.customSlug || undefined); setCategoryDlg(false); setCategoryForm({ categoryId: "", customName: "", customSlug: "" }); toast.success("Added"); loadData(); }
  async function rmCat(id: string) { if (!confirm("Remove?")) return; await removeCategoryFromSite(id); toast.success("Removed"); loadData(); }
  async function addBrand() { if (!site || !brandForm.brandId) return; await addBrandToSite(site.id, brandForm.brandId); setBrandDlg(false); setBrandForm({ brandId: "" }); toast.success("Added"); loadData(); }
  async function rmBrand(id: string) { if (!confirm("Remove?")) return; await removeBrandFromSite(id); toast.success("Removed"); loadData(); }

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;
  if (!site) return null;

  const tabs: { id: TabId; label: string }[] = [
    { id: "general", label: "General & Domains" },
    { id: "region", label: "Region / Taxes / Languages / Currency" },
    { id: "branding", label: "Brand / Logo / Themes" },
    { id: "contact", label: "Contact Details" },
    { id: "products", label: "Products / Categories / Brands" },
    { id: "payments", label: "Payment Gateways" },
    { id: "shipping", label: "Shipping & Delivery" },
    { id: "sellers", label: "Sellers / Marketplace" },
    { id: "suppliers", label: "Suppliers" },
    { id: "offers", label: "Offers & Promotions" },
    { id: "notifications", label: "Notifications" },
    { id: "orders", label: "Orders & Checkout" },
    { id: "inventory", label: "Inventory" },
    { id: "compliance", label: "Compliance" },
    { id: "permissions", label: "Admin Permissions" },
  ];

  return (
    <div className="p-6">
      <Link href="/admin/sites"><Button variant="ghost" className="mb-4"><ArrowLeft className="w-4 h-4 mr-2" /> Back</Button></Link>
      <h1 className="text-2xl font-bold mb-1">{site.name}</h1>
      <div className="flex items-center gap-2 mb-6">
        <Badge variant={site.status === "ACTIVE" ? "default" : "secondary"}>{site.status}</Badge>
        {site.isDefault && <Badge variant="outline">Default</Badge>}
      </div>

      <div className="flex gap-1 mb-6 border-b overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap ${activeTab === t.id ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>{t.label}</button>
        ))}
      </div>

      {/* TAB: General & Domains */}
      {activeTab === "general" && (
        <div className="space-y-6 max-w-3xl">
          <Section title="Site Settings">
            <Field label="Name"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
            <Field label="Slug"><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} /></Field>
            <Field label="Status">
              <Select value={form.status} onValueChange={(v) => v && setForm({ ...form, status: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="PENDING">Pending</SelectItem><SelectItem value="ACTIVE">Active</SelectItem><SelectItem value="SUSPENDED">Suspended</SelectItem></SelectContent></Select>
            </Field>
            <Field label="Domain"><Input value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} placeholder="shop.example.com" /></Field>
            <Field label="Subdomain"><Input value={form.subdomain} onChange={(e) => setForm({ ...form, subdomain: e.target.value })} placeholder="mystore" /></Field>
            <Field label="Description"><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></Field>
            <Button onClick={saveSite}>Save</Button>
          </Section>
          <Section title="Domains" action={<Button size="sm" onClick={() => setDomainDlg(true)}><Plus className="w-4 h-4 mr-1" />Add</Button>}>
            {site.domains?.length === 0 && <p className="text-sm text-gray-400">No domains.</p>}
            {site.domains?.map((d) => (
              <div key={d.id} className="flex items-center justify-between border rounded p-3 mb-2">
                <span className="text-sm"><Badge className="mr-2">{d.type}</Badge>{d.hostname}</span>
                <Button variant="ghost" size="sm" onClick={() => rmDomain(d.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            ))}
          </Section>
        </div>
      )}

      {/* TAB: Region / Taxes / Languages / Currency */}
      {activeTab === "region" && (
        <RegionTab
          form={form}
          setForm={setForm}
          settings={settings}
          lookups={lookups}
          onSaveSite={saveSite}
          onSaveSettings={saveSettings}
        />
      )}

      {/* TAB: Branding */}
      {activeTab === "branding" && <BrandingTab form={form} setForm={setForm} settings={settings} onSaveSite={saveSite} onSaveSettings={saveSettings} />}

      {/* TAB: Contact Details */}
      {activeTab === "contact" && (
        <ContactTab
          form={form}
          setForm={setForm}
          settings={settings}
          onSaveSite={saveSite}
          onSaveSettings={saveSettings}
        />
      )}

      {/* TAB: Products / Categories / Brands */}
      {activeTab === "products" && (
        <div className="space-y-6">
          <Section title="Product Types (Global Categories)" action={<Button size="sm" onClick={() => setCategoryDlg(true)}><Plus className="w-4 h-4 mr-1" />Add Category</Button>}>
            <p className="text-xs text-gray-500 mb-3">Configure which product types this site sells (e.g. Clothes, Shoes, Electronics).</p>
            {siteCategories.length === 0 ? <p className="text-sm text-gray-400">None added.</p> : siteCategories.map((sc) => (
              <div key={sc.id} className="flex items-center justify-between border rounded p-3 mb-2">
                <span className="text-sm font-medium">{sc.customName || sc.category?.name}</span>
                <Button variant="ghost" size="sm" onClick={() => rmCat(sc.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            ))}
          </Section>
          <Section title="Products" action={<Button size="sm" onClick={() => setProductDlg(true)}><Plus className="w-4 h-4 mr-1" />Add Product</Button>}>
            {siteProducts.length === 0 ? <p className="text-sm text-gray-400">None added.</p> : siteProducts.map((sp) => (
              <div key={sp.id} className="flex items-center justify-between border rounded p-3 mb-2">
                <span className="text-sm">{sp.product?.name}</span>
                <Button variant="ghost" size="sm" onClick={() => rmProd(sp.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            ))}
          </Section>
          <Section title="Brands" action={<Button size="sm" onClick={() => setBrandDlg(true)}><Plus className="w-4 h-4 mr-1" />Add Brand</Button>}>
            {siteBrands.length === 0 ? <p className="text-sm text-gray-400">None added.</p> : siteBrands.map((sb) => (
              <div key={sb.id} className="flex items-center justify-between border rounded p-3 mb-2">
                <span className="text-sm">{sb.brand?.name}</span>
                <Button variant="ghost" size="sm" onClick={() => rmBrand(sb.id)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
              </div>
            ))}
          </Section>
        </div>
      )}

      {/* TAB: Payment Gateways */}
      {activeTab === "payments" && <PaymentsTab settings={settings} onSave={saveSettings} />}

      {/* TAB: Shipping & Delivery */}
      {activeTab === "shipping" && <ShippingTab settings={settings} onSave={saveSettings} />}

      {/* TAB: Sellers / Marketplace */}
      {activeTab === "sellers" && <SellersTab settings={settings} onSave={saveSettings} />}

      {/* TAB: Suppliers */}
      {activeTab === "suppliers" && <SuppliersTab settings={settings} onSave={saveSettings} />}

      {/* TAB: Offers & Promotions */}
      {activeTab === "offers" && <OffersTab settings={settings} onSave={saveSettings} />}

      {/* TAB: Notifications */}
      {activeTab === "notifications" && <NotificationsTab settings={settings} onSave={saveSettings} />}

      {/* TAB: Orders & Checkout */}
      {activeTab === "orders" && <OrdersTab settings={settings} onSave={saveSettings} />}

      {/* TAB: Inventory */}
      {activeTab === "inventory" && <InventoryTab settings={settings} onSave={saveSettings} />}

      {/* TAB: Compliance */}
      {activeTab === "compliance" && <ComplianceTab settings={settings} onSave={saveSettings} />}

      {/* TAB: Permissions */}
      {activeTab === "permissions" && <PermissionsTab siteId={siteId} />}

      {/* Dialogs */}
      <Dialog open={domainDlg} onOpenChange={setDomainDlg}><DialogContent><DialogHeader><DialogTitle>Add Domain</DialogTitle></DialogHeader><div className="space-y-3"><Field label="Hostname"><Input value={domainForm.hostname} onChange={(e) => setDomainForm({ ...domainForm, hostname: e.target.value })} /></Field><Field label="Type"><Select value={domainForm.type} onValueChange={(v) => v && setDomainForm({ ...domainForm, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="SUBDOMAIN">Subdomain</SelectItem><SelectItem value="CUSTOM">Custom</SelectItem></SelectContent></Select></Field></div><DialogFooter><Button onClick={addDomain}>Add</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={productDlg} onOpenChange={setProductDlg}><DialogContent><DialogHeader><DialogTitle>Add Product</DialogTitle></DialogHeader><div className="space-y-3"><Field label="Product"><Select value={productForm.productId} onValueChange={(v) => v && setProductForm({ ...productForm, productId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{allProducts.filter((p) => !siteProducts.some((s) => s.productId === p.id)).map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent></Select></Field></div><DialogFooter><Button onClick={addProd}>Add</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={categoryDlg} onOpenChange={setCategoryDlg}><DialogContent><DialogHeader><DialogTitle>Add Category / Product Type</DialogTitle></DialogHeader><div className="space-y-3"><Field label="Category"><Select value={categoryForm.categoryId} onValueChange={(v) => v && setCategoryForm({ ...categoryForm, categoryId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{allCategories.filter((c) => !siteCategories.some((s) => s.categoryId === c.id)).map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></Field><Field label="Custom Name (optional)"><Input value={categoryForm.customName} onChange={(e) => setCategoryForm({ ...categoryForm, customName: e.target.value })} /></Field></div><DialogFooter><Button onClick={addCat}>Add</Button></DialogFooter></DialogContent></Dialog>
      <Dialog open={brandDlg} onOpenChange={setBrandDlg}><DialogContent><DialogHeader><DialogTitle>Add Brand</DialogTitle></DialogHeader><div className="space-y-3"><Field label="Brand"><Select value={brandForm.brandId} onValueChange={(v) => v && setBrandForm({ brandId: v })}><SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger><SelectContent>{allBrands.filter((b) => !siteBrands.some((s) => s.brandId === b.id)).map((b) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></Field></div><DialogFooter><Button onClick={addBrand}>Add</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

// ─── Helper Components ───

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><Label className="mb-1 block text-sm">{label}</Label>{children}</div>;
}

// ─── Region / Taxes / Languages / Currency Tab ───

function RegionTab({
  form,
  setForm,
  settings,
  lookups,
  onSaveSite,
  onSaveSettings,
}: {
  form: any;
  setForm: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
  settings: Record<string, any>;
  lookups: FormLookups | null;
  onSaveSite: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
  onSaveSettings: (p: Record<string, any>) => void;
}) {
  // Tax / timezone / language-as-string still live in the JSON `settings` blob
  // because they don't have first-class columns yet.
  const [timezone, setTimezone] = useState(settings.timezone || "");
  const [taxMode, setTaxMode] = useState(settings.taxMode || "auto");
  const [taxInclusive, setTaxInclusive] = useState(settings.taxInclusive ?? true);
  const [taxRate, setTaxRate] = useState(settings.defaultTaxRate ?? "");

  // Cascading: picking a region prefills currency/locale/supportedLocales.
  function onRegionChange(regionId: string) {
    const r = lookups?.regions.find((x) => x.id === regionId);
    setForm({
      ...form,
      regionId,
      defaultCurrency: r?.currency ?? form.defaultCurrency,
      defaultLocale: r?.defaultLocale ?? form.defaultLocale,
      supportedLocales:
        r && r.supportedLocales.length ? r.supportedLocales : form.supportedLocales,
    });
    if (r?.timezone) setTimezone(r.timezone);
  }

  function toggleLocale(locale: string) {
    const next = form.supportedLocales.includes(locale)
      ? form.supportedLocales.filter((l: string) => l !== locale)
      : [...form.supportedLocales, locale];
    setForm({ ...form, supportedLocales: next });
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Region / Country">
        <Field label="Region">
          <Select
            value={form.regionId || "none"}
            onValueChange={(v) => v && onRegionChange(v === "none" ? "" : v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— No region —</SelectItem>
              {lookups?.regions.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} ({r.code}) — {r.currencySymbol}
                  {r.currency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-gray-500 mt-1">
            Picking a region prefills currency, locale, and supported languages.
          </p>
        </Field>
        <Field label="Timezone">
          <Input
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            placeholder="Asia/Kolkata"
          />
        </Field>
        <div className="flex gap-2">
          <Button onClick={onSaveSite}>Save Region</Button>
          <Button variant="outline" onClick={() => onSaveSettings({ timezone })}>
            Save Timezone
          </Button>
        </div>
      </Section>

      <Section title="Currency">
        <Field label="Default Currency">
          <Select
            value={form.defaultCurrency || "none"}
            onValueChange={(v) =>
              v && setForm({ ...form, defaultCurrency: v === "none" ? "" : v })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select currency" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">— None —</SelectItem>
              {(lookups?.currencies ?? []).map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.symbol} {c.code} — {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Button onClick={onSaveSite}>Save Currency</Button>
      </Section>

      <Section title="Languages / Locales">
        <Field label="Default Locale (BCP 47)">
          <Input
            value={form.defaultLocale}
            onChange={(e) => setForm({ ...form, defaultLocale: e.target.value })}
            placeholder="en-IN"
          />
        </Field>
        <Field label="Supported Languages">
          <div className="flex flex-wrap gap-2">
            {COMMON_LOCALES.map((l) => {
              const active = form.supportedLocales.includes(l.value);
              return (
                <button
                  key={l.value}
                  type="button"
                  onClick={() => toggleLocale(l.value)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition ${
                    active
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Selected: {form.supportedLocales.length || "none"}
          </p>
        </Field>
        <Button onClick={onSaveSite}>Save Languages</Button>
      </Section>

      <Section title="Taxes">
        <Field label="Tax Mode">
          <Select value={taxMode} onValueChange={(v) => v && setTaxMode(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="auto">Auto (based on region)</SelectItem>
              <SelectItem value="manual">Manual</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <div className="flex items-center gap-3 mb-3">
          <Switch checked={taxInclusive} onCheckedChange={setTaxInclusive} />
          <Label>Prices include tax</Label>
        </div>
        {taxMode === "manual" && (
          <Field label="Default Tax Rate (%)">
            <Input
              type="number"
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="18"
            />
          </Field>
        )}
        <Button
          onClick={() =>
            onSaveSettings({
              taxMode,
              taxInclusive,
              defaultTaxRate: taxRate ? Number(taxRate) : undefined,
            })
          }
        >
          Save Tax Settings
        </Button>
      </Section>
    </div>
  );
}

// ─── Branding Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function BrandingTab({ form, setForm, settings, onSaveSite, onSaveSettings }: { form: any; setForm: any; settings: Record<string, any>; onSaveSite: () => void; onSaveSettings: (p: Record<string, any>) => void }) {
  const [theme, setTheme] = useState(settings.theme || "light");

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Logo & Favicon">
        <Field label="Logo URL"><Input value={form.logo} onChange={(e) => setForm({ ...form, logo: e.target.value })} placeholder="https://..." /></Field>
        {form.logo && <img src={form.logo} alt="Logo" className="h-12 mb-2 rounded" />}
        <Field label="Favicon URL"><Input value={form.favicon} onChange={(e) => setForm({ ...form, favicon: e.target.value })} placeholder="https://..." /></Field>
        <Button onClick={onSaveSite}>Save Logo & Favicon</Button>
      </Section>
      <Section title="Colors & Font">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Primary Color"><div className="flex gap-2"><Input type="color" value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} className="w-14 h-10" /><Input value={form.primaryColor} onChange={(e) => setForm({ ...form, primaryColor: e.target.value })} /></div></Field>
          <Field label="Secondary Color"><div className="flex gap-2"><Input type="color" value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} className="w-14 h-10" /><Input value={form.secondaryColor} onChange={(e) => setForm({ ...form, secondaryColor: e.target.value })} /></div></Field>
        </div>
        <Field label="Font Family">
          <Select value={form.fontFamily} onValueChange={(v) => v && setForm({ ...form, fontFamily: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sans">Sans-serif</SelectItem><SelectItem value="serif">Serif</SelectItem><SelectItem value="mono">Monospace</SelectItem><SelectItem value="inter">Inter</SelectItem><SelectItem value="poppins">Poppins</SelectItem></SelectContent></Select>
        </Field>
        <Button onClick={onSaveSite}>Save Colors & Font</Button>
      </Section>
      <Section title="Theme">
        <Field label="Theme Mode">
          <Select value={theme} onValueChange={(v) => v && setTheme(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="light">Light</SelectItem><SelectItem value="dark">Dark</SelectItem><SelectItem value="auto">Auto (system)</SelectItem></SelectContent></Select>
        </Field>
        <Button onClick={() => onSaveSettings({ theme })}>Save Theme</Button>
      </Section>
    </div>
  );
}

// ─── Contact Details Tab ───
// Admin/owner contact lives on first-class columns now (contactEmail/Phone/Address).
// Support email and WhatsApp stay in the JSON settings blob since they are
// secondary channels.

function ContactTab({
  form,
  setForm,
  settings,
  onSaveSite,
  onSaveSettings,
}: {
  form: any;
  setForm: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
  settings: Record<string, any>;
  onSaveSite: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
  onSaveSettings: (p: Record<string, any>) => void;
}) {
  const [supportEmail, setSupportEmail] = useState(settings.supportEmail || "");
  const [whatsapp, setWhatsapp] = useState(settings.whatsapp || "");

  return (
    <div className="max-w-3xl">
      <Section title="Primary Contact (stored on Site)">
        <Field label="Admin / Contact Email">
          <Input
            type="email"
            value={form.contactEmail}
            onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
            placeholder="admin@store.com"
          />
        </Field>
        <Field label="Phone">
          <Input
            value={form.contactPhone}
            onChange={(e) => setForm({ ...form, contactPhone: e.target.value })}
            placeholder="+91 9876543210"
          />
        </Field>
        <Field label="Business Address">
          <Textarea
            value={form.contactAddress}
            onChange={(e) => setForm({ ...form, contactAddress: e.target.value })}
            placeholder="Full address"
          />
        </Field>
        <Button onClick={onSaveSite}>Save Primary Contact</Button>
      </Section>

      <Section title="Secondary Channels (stored in settings)">
        <Field label="Support Email">
          <Input
            type="email"
            value={supportEmail}
            onChange={(e) => setSupportEmail(e.target.value)}
            placeholder="support@store.com"
          />
        </Field>
        <Field label="WhatsApp">
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+91 9876543210"
          />
        </Field>
        <Button onClick={() => onSaveSettings({ supportEmail, whatsapp })}>
          Save Secondary Channels
        </Button>
      </Section>
    </div>
  );
}

// ─── Payment Gateways Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function PaymentsTab({ settings, onSave }: { settings: Record<string, any>; onSave: (p: Record<string, any>) => void }) {
  const gateways = ["razorpay", "stripe", "paypal", "cod", "upi", "bank_transfer"];
  const [enabled, setEnabled] = useState<string[]>(settings.paymentGateways || []);
  const [codMinOrder, setCodMinOrder] = useState(settings.codMinOrder || "");
  const [codMaxOrder, setCodMaxOrder] = useState(settings.codMaxOrder || "");
  // Razorpay
  const [razorpayKeyId, setRazorpayKeyId] = useState(settings.razorpayKeyId || "");
  const [razorpayKeySecret, setRazorpayKeySecret] = useState(settings.razorpayKeySecret || "");
  const [razorpayWebhookSecret, setRazorpayWebhookSecret] = useState(settings.razorpayWebhookSecret || "");
  // Stripe
  const [stripePublishableKey, setStripePublishableKey] = useState(settings.stripePublishableKey || "");
  const [stripeSecretKey, setStripeSecretKey] = useState(settings.stripeSecretKey || "");
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState(settings.stripeWebhookSecret || "");
  // PayPal
  const [paypalClientId, setPaypalClientId] = useState(settings.paypalClientId || "");
  const [paypalClientSecret, setPaypalClientSecret] = useState(settings.paypalClientSecret || "");
  const [paypalMode, setPaypalMode] = useState(settings.paypalMode || "sandbox");
  // UPI
  const [upiVpa, setUpiVpa] = useState(settings.upiVpa || "");
  const [upiMerchantName, setUpiMerchantName] = useState(settings.upiMerchantName || "");
  // Bank Transfer
  const [bankName, setBankName] = useState(settings.bankName || "");
  const [bankAccountNumber, setBankAccountNumber] = useState(settings.bankAccountNumber || "");
  const [bankIfsc, setBankIfsc] = useState(settings.bankIfsc || "");
  const [bankAccountHolder, setBankAccountHolder] = useState(settings.bankAccountHolder || "");

  function toggle(gw: string) {
    setEnabled((prev) => prev.includes(gw) ? prev.filter((g) => g !== gw) : [...prev, gw]);
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Payment Gateways">
        <p className="text-xs text-gray-500 mb-4">Enable/disable payment methods and configure API keys.</p>
        <div className="space-y-3">
          {gateways.map((gw) => (
            <div key={gw} className="flex items-center justify-between border rounded p-3">
              <span className="text-sm font-medium capitalize">{gw.replace("_", " ")}</span>
              <Switch checked={enabled.includes(gw)} onCheckedChange={() => toggle(gw)} />
            </div>
          ))}
        </div>
      </Section>
      {enabled.includes("razorpay") && (
        <Section title="Razorpay Configuration">
          <Field label="Key ID"><Input value={razorpayKeyId} onChange={(e) => setRazorpayKeyId(e.target.value)} placeholder="rzp_live_..." /></Field>
          <Field label="Key Secret"><Input type="password" value={razorpayKeySecret} onChange={(e) => setRazorpayKeySecret(e.target.value)} placeholder="Secret key" /></Field>
          <Field label="Webhook Secret"><Input type="password" value={razorpayWebhookSecret} onChange={(e) => setRazorpayWebhookSecret(e.target.value)} placeholder="Webhook signing secret" /></Field>
        </Section>
      )}
      {enabled.includes("stripe") && (
        <Section title="Stripe Configuration">
          <Field label="Publishable Key"><Input value={stripePublishableKey} onChange={(e) => setStripePublishableKey(e.target.value)} placeholder="pk_live_..." /></Field>
          <Field label="Secret Key"><Input type="password" value={stripeSecretKey} onChange={(e) => setStripeSecretKey(e.target.value)} placeholder="sk_live_..." /></Field>
          <Field label="Webhook Secret"><Input type="password" value={stripeWebhookSecret} onChange={(e) => setStripeWebhookSecret(e.target.value)} placeholder="whsec_..." /></Field>
        </Section>
      )}
      {enabled.includes("paypal") && (
        <Section title="PayPal Configuration">
          <Field label="Client ID"><Input value={paypalClientId} onChange={(e) => setPaypalClientId(e.target.value)} /></Field>
          <Field label="Client Secret"><Input type="password" value={paypalClientSecret} onChange={(e) => setPaypalClientSecret(e.target.value)} /></Field>
          <Field label="Mode">
            <Select value={paypalMode} onValueChange={setPaypalMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="sandbox">Sandbox</SelectItem><SelectItem value="live">Live</SelectItem></SelectContent></Select>
          </Field>
        </Section>
      )}
      {enabled.includes("upi") && (
        <Section title="UPI Configuration">
          <Field label="UPI VPA (Virtual Payment Address)"><Input value={upiVpa} onChange={(e) => setUpiVpa(e.target.value)} placeholder="merchant@upi" /></Field>
          <Field label="Merchant Name"><Input value={upiMerchantName} onChange={(e) => setUpiMerchantName(e.target.value)} /></Field>
        </Section>
      )}
      {enabled.includes("bank_transfer") && (
        <Section title="Bank Transfer Details">
          <Field label="Bank Name"><Input value={bankName} onChange={(e) => setBankName(e.target.value)} /></Field>
          <Field label="Account Holder"><Input value={bankAccountHolder} onChange={(e) => setBankAccountHolder(e.target.value)} /></Field>
          <Field label="Account Number"><Input value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} /></Field>
          <Field label="IFSC Code"><Input value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} /></Field>
        </Section>
      )}
      {enabled.includes("cod") && (
        <Section title="COD Settings">
          <Field label="Min Order Amount"><Input type="number" value={codMinOrder} onChange={(e) => setCodMinOrder(e.target.value)} /></Field>
          <Field label="Max Order Amount"><Input type="number" value={codMaxOrder} onChange={(e) => setCodMaxOrder(e.target.value)} /></Field>
        </Section>
      )}
      <Button onClick={() => onSave({ paymentGateways: enabled, codMinOrder: codMinOrder ? Number(codMinOrder) : undefined, codMaxOrder: codMaxOrder ? Number(codMaxOrder) : undefined, razorpayKeyId, razorpayKeySecret, razorpayWebhookSecret, stripePublishableKey, stripeSecretKey, stripeWebhookSecret, paypalClientId, paypalClientSecret, paypalMode, upiVpa, upiMerchantName, bankName, bankAccountNumber, bankIfsc, bankAccountHolder })}>Save Payment Settings</Button>
    </div>
  );
}

// ─── Inventory Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function InventoryTab({ settings, onSave }: { settings: Record<string, any>; onSave: (p: Record<string, any>) => void }) {
  const [trackInventory, setTrackInventory] = useState(settings.trackInventory ?? true);
  const [lowStockThreshold, setLowStockThreshold] = useState(settings.lowStockThreshold || "5");
  const [outOfStockBehavior, setOutOfStockBehavior] = useState(settings.outOfStockBehavior || "hide");
  const [backorderEnabled, setBackorderEnabled] = useState(settings.backorderEnabled ?? false);
  const [reserveOnCart, setReserveOnCart] = useState(settings.reserveStockOnCart ?? false);
  const [reserveTimeoutMin, setReserveTimeoutMin] = useState(settings.reserveTimeoutMin || "15");
  const [multiWarehouse, setMultiWarehouse] = useState(settings.multiWarehouseEnabled ?? false);
  const [batchTracking, setBatchTracking] = useState(settings.batchTrackingEnabled ?? false);
  const [serialTracking, setSerialTracking] = useState(settings.serialTrackingEnabled ?? false);
  const [expiryTracking, setExpiryTracking] = useState(settings.expiryTrackingEnabled ?? false);
  const [autoReorder, setAutoReorder] = useState(settings.autoReorderEnabled ?? false);
  const [reorderQuantity, setReorderQuantity] = useState(settings.defaultReorderQuantity || "50");
  const [stockAuditEnabled, setStockAuditEnabled] = useState(settings.stockAuditEnabled ?? false);
  const [negativeStockAllowed, setNegativeStockAllowed] = useState(settings.negativeStockAllowed ?? false);

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Stock Management">
        <div className="flex items-center gap-3 mb-3"><Switch checked={trackInventory} onCheckedChange={setTrackInventory} /><Label>Track Inventory</Label></div>
        <Field label="Low Stock Threshold"><Input type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value)} /></Field>
        <Field label="Out of Stock Behavior">
          <Select value={outOfStockBehavior} onValueChange={setOutOfStockBehavior}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="hide">Hide Product</SelectItem><SelectItem value="show_disabled">Show (Disabled)</SelectItem><SelectItem value="show_notify">Show (Notify Me)</SelectItem></SelectContent></Select>
        </Field>
        <div className="flex items-center gap-3 mb-3"><Switch checked={backorderEnabled} onCheckedChange={setBackorderEnabled} /><Label>Allow Backorders</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={negativeStockAllowed} onCheckedChange={setNegativeStockAllowed} /><Label>Allow Negative Stock</Label></div>
      </Section>
      <Section title="Stock Reservation">
        <div className="flex items-center gap-3 mb-3"><Switch checked={reserveOnCart} onCheckedChange={setReserveOnCart} /><Label>Reserve Stock on Add to Cart</Label></div>
        {reserveOnCart && <Field label="Reservation Timeout (minutes)"><Input type="number" value={reserveTimeoutMin} onChange={(e) => setReserveTimeoutMin(e.target.value)} /></Field>}
      </Section>
      <Section title="Warehousing & Tracking">
        <div className="flex items-center gap-3 mb-3"><Switch checked={multiWarehouse} onCheckedChange={setMultiWarehouse} /><Label>Multi-Warehouse</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={batchTracking} onCheckedChange={setBatchTracking} /><Label>Batch/Lot Tracking</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={serialTracking} onCheckedChange={setSerialTracking} /><Label>Serial Number Tracking</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={expiryTracking} onCheckedChange={setExpiryTracking} /><Label>Expiry Date Tracking</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={stockAuditEnabled} onCheckedChange={setStockAuditEnabled} /><Label>Stock Audit Trail</Label></div>
      </Section>
      <Section title="Auto-Reorder">
        <div className="flex items-center gap-3 mb-3"><Switch checked={autoReorder} onCheckedChange={setAutoReorder} /><Label>Auto-Reorder at Low Stock</Label></div>
        {autoReorder && <Field label="Default Reorder Quantity"><Input type="number" value={reorderQuantity} onChange={(e) => setReorderQuantity(e.target.value)} /></Field>}
      </Section>
      <Button onClick={() => onSave({ trackInventory, lowStockThreshold: Number(lowStockThreshold), outOfStockBehavior, backorderEnabled, reserveStockOnCart: reserveOnCart, reserveTimeoutMin: Number(reserveTimeoutMin), multiWarehouseEnabled: multiWarehouse, batchTrackingEnabled: batchTracking, serialTrackingEnabled: serialTracking, expiryTrackingEnabled: expiryTracking, autoReorderEnabled: autoReorder, defaultReorderQuantity: Number(reorderQuantity), stockAuditEnabled, negativeStockAllowed })}>Save Inventory Settings</Button>
    </div>
  );
}

// ─── Orders & Checkout Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function OrdersTab({ settings, onSave }: { settings: Record<string, any>; onSave: (p: Record<string, any>) => void }) {
  const [guestCheckout, setGuestCheckout] = useState(settings.guestCheckoutEnabled ?? true);
  const [orderPrefix, setOrderPrefix] = useState(settings.orderPrefix || "ORD");
  const [autoConfirm, setAutoConfirm] = useState(settings.autoConfirmOrders ?? false);
  const [autoCancelHours, setAutoCancelHours] = useState(settings.autoCancelUnpaidHours || "24");
  const [minOrderAmount, setMinOrderAmount] = useState(settings.minOrderAmount || "");
  const [maxOrderAmount, setMaxOrderAmount] = useState(settings.maxOrderAmount || "");
  const [orderNotesEnabled, setOrderNotesEnabled] = useState(settings.orderNotesEnabled ?? true);
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(settings.giftWrapEnabled ?? false);
  const [giftWrapPrice, setGiftWrapPrice] = useState(settings.giftWrapPrice || "49");
  const [invoiceAutoGenerate, setInvoiceAutoGenerate] = useState(settings.invoiceAutoGenerate ?? true);
  const [invoicePrefix, setInvoicePrefix] = useState(settings.invoicePrefix || "INV");
  const [returnWindowDays, setReturnWindowDays] = useState(settings.returnWindowDays || "7");
  const [returnEnabled, setReturnEnabled] = useState(settings.returnsEnabled ?? true);
  const [exchangeEnabled, setExchangeEnabled] = useState(settings.exchangeEnabled ?? true);
  const [refundMode, setRefundMode] = useState(settings.refundMode || "original");
  const [splitShipmentEnabled, setSplitShipmentEnabled] = useState(settings.splitShipmentEnabled ?? false);
  const [orderRatingEnabled, setOrderRatingEnabled] = useState(settings.orderRatingEnabled ?? true);
  const [reorderEnabled, setReorderEnabled] = useState(settings.reorderEnabled ?? true);

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Checkout Settings">
        <div className="flex items-center gap-3 mb-3"><Switch checked={guestCheckout} onCheckedChange={setGuestCheckout} /><Label>Guest Checkout</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={orderNotesEnabled} onCheckedChange={setOrderNotesEnabled} /><Label>Allow Order Notes</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={giftWrapEnabled} onCheckedChange={setGiftWrapEnabled} /><Label>Gift Wrap Option</Label></div>
        {giftWrapEnabled && <Field label="Gift Wrap Price"><Input type="number" value={giftWrapPrice} onChange={(e) => setGiftWrapPrice(e.target.value)} /></Field>}
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min Order Amount"><Input type="number" value={minOrderAmount} onChange={(e) => setMinOrderAmount(e.target.value)} placeholder="No minimum" /></Field>
          <Field label="Max Order Amount"><Input type="number" value={maxOrderAmount} onChange={(e) => setMaxOrderAmount(e.target.value)} placeholder="No maximum" /></Field>
        </div>
      </Section>
      <Section title="Order Processing">
        <Field label="Order Number Prefix"><Input value={orderPrefix} onChange={(e) => setOrderPrefix(e.target.value)} /></Field>
        <div className="flex items-center gap-3 mb-3"><Switch checked={autoConfirm} onCheckedChange={setAutoConfirm} /><Label>Auto-Confirm Orders (skip manual review)</Label></div>
        <Field label="Auto-Cancel Unpaid Orders After (hours)"><Input type="number" value={autoCancelHours} onChange={(e) => setAutoCancelHours(e.target.value)} /></Field>
        <div className="flex items-center gap-3 mb-3"><Switch checked={splitShipmentEnabled} onCheckedChange={setSplitShipmentEnabled} /><Label>Split Shipments</Label></div>
      </Section>
      <Section title="Invoicing">
        <div className="flex items-center gap-3 mb-3"><Switch checked={invoiceAutoGenerate} onCheckedChange={setInvoiceAutoGenerate} /><Label>Auto-Generate Invoice</Label></div>
        <Field label="Invoice Prefix"><Input value={invoicePrefix} onChange={(e) => setInvoicePrefix(e.target.value)} /></Field>
      </Section>
      <Section title="Returns & Refunds">
        <div className="flex items-center gap-3 mb-3"><Switch checked={returnEnabled} onCheckedChange={setReturnEnabled} /><Label>Returns Enabled</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={exchangeEnabled} onCheckedChange={setExchangeEnabled} /><Label>Exchanges Enabled</Label></div>
        <Field label="Return Window (days)"><Input type="number" value={returnWindowDays} onChange={(e) => setReturnWindowDays(e.target.value)} /></Field>
        <Field label="Refund Mode">
          <Select value={refundMode} onValueChange={setRefundMode}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="original">Original Payment Method</SelectItem><SelectItem value="wallet">Store Wallet</SelectItem><SelectItem value="choice">Customer Choice</SelectItem></SelectContent></Select>
        </Field>
      </Section>
      <Section title="Post-Order">
        <div className="flex items-center gap-3 mb-3"><Switch checked={orderRatingEnabled} onCheckedChange={setOrderRatingEnabled} /><Label>Order Rating & Feedback</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={reorderEnabled} onCheckedChange={setReorderEnabled} /><Label>Quick Reorder</Label></div>
      </Section>
      <Button onClick={() => onSave({ guestCheckoutEnabled: guestCheckout, orderPrefix, autoConfirmOrders: autoConfirm, autoCancelUnpaidHours: Number(autoCancelHours), minOrderAmount: minOrderAmount ? Number(minOrderAmount) : undefined, maxOrderAmount: maxOrderAmount ? Number(maxOrderAmount) : undefined, orderNotesEnabled, giftWrapEnabled, giftWrapPrice: Number(giftWrapPrice), invoiceAutoGenerate, invoicePrefix, returnWindowDays: Number(returnWindowDays), returnsEnabled: returnEnabled, exchangeEnabled, refundMode, splitShipmentEnabled, orderRatingEnabled, reorderEnabled })}>Save Order Settings</Button>
    </div>
  );
}

// ─── Notifications Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function NotificationsTab({ settings, onSave }: { settings: Record<string, any>; onSave: (p: Record<string, any>) => void }) {
  const [emailEnabled, setEmailEnabled] = useState(settings.notifEmailEnabled ?? true);
  const [smsEnabled, setSmsEnabled] = useState(settings.notifSmsEnabled ?? false);
  const [pushEnabled, setPushEnabled] = useState(settings.notifPushEnabled ?? false);
  const [whatsappEnabled, setWhatsappEnabled] = useState(settings.notifWhatsappEnabled ?? false);
  const [emailProvider, setEmailProvider] = useState(settings.emailProvider || "resend");
  const [emailApiKey, setEmailApiKey] = useState(settings.emailApiKey || "");
  const [emailFromAddress, setEmailFromAddress] = useState(settings.emailFromAddress || "");
  const [emailFromName, setEmailFromName] = useState(settings.emailFromName || "");
  const [smsProvider, setSmsProvider] = useState(settings.smsProvider || "twilio");
  const [smsApiKey, setSmsApiKey] = useState(settings.smsApiKey || "");
  const [smsSenderId, setSmsSenderId] = useState(settings.smsSenderId || "");
  const [pushFcmKey, setPushFcmKey] = useState(settings.pushFcmServerKey || "");
  const [whatsappApiKey, setWhatsappApiKey] = useState(settings.whatsappApiKey || "");
  const [whatsappPhoneId, setWhatsappPhoneId] = useState(settings.whatsappPhoneId || "");
  const [orderConfirmation, setOrderConfirmation] = useState(settings.notifOrderConfirmation ?? true);
  const [orderShipped, setOrderShipped] = useState(settings.notifOrderShipped ?? true);
  const [orderDelivered, setOrderDelivered] = useState(settings.notifOrderDelivered ?? true);
  const [priceDropAlert, setPriceDropAlert] = useState(settings.notifPriceDrop ?? true);
  const [backInStock, setBackInStock] = useState(settings.notifBackInStock ?? true);
  const [promoNotif, setPromoNotif] = useState(settings.notifPromotional ?? false);

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Notification Channels">
        <div className="flex items-center gap-3 mb-3"><Switch checked={emailEnabled} onCheckedChange={setEmailEnabled} /><Label>Email Notifications</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={smsEnabled} onCheckedChange={setSmsEnabled} /><Label>SMS Notifications</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={pushEnabled} onCheckedChange={setPushEnabled} /><Label>Push Notifications</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={whatsappEnabled} onCheckedChange={setWhatsappEnabled} /><Label>WhatsApp Notifications</Label></div>
      </Section>
      {emailEnabled && (
        <Section title="Email Configuration">
          <Field label="Email Provider">
            <Select value={emailProvider} onValueChange={setEmailProvider}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="resend">Resend</SelectItem><SelectItem value="sendgrid">SendGrid</SelectItem><SelectItem value="ses">AWS SES</SelectItem><SelectItem value="smtp">Custom SMTP</SelectItem></SelectContent></Select>
          </Field>
          <Field label="API Key"><Input type="password" value={emailApiKey} onChange={(e) => setEmailApiKey(e.target.value)} placeholder="re_..." /></Field>
          <Field label="From Email"><Input value={emailFromAddress} onChange={(e) => setEmailFromAddress(e.target.value)} placeholder="noreply@store.com" /></Field>
          <Field label="From Name"><Input value={emailFromName} onChange={(e) => setEmailFromName(e.target.value)} placeholder="My Store" /></Field>
        </Section>
      )}
      {smsEnabled && (
        <Section title="SMS Configuration">
          <Field label="SMS Provider">
            <Select value={smsProvider} onValueChange={setSmsProvider}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="twilio">Twilio</SelectItem><SelectItem value="fast2sms">Fast2SMS</SelectItem><SelectItem value="msg91">MSG91</SelectItem><SelectItem value="textlocal">TextLocal</SelectItem></SelectContent></Select>
          </Field>
          <Field label="API Key"><Input type="password" value={smsApiKey} onChange={(e) => setSmsApiKey(e.target.value)} /></Field>
          <Field label="Sender ID"><Input value={smsSenderId} onChange={(e) => setSmsSenderId(e.target.value)} placeholder="MYSHOP" /></Field>
        </Section>
      )}
      {pushEnabled && (
        <Section title="Push Notification Configuration">
          <Field label="FCM Server Key"><Input type="password" value={pushFcmKey} onChange={(e) => setPushFcmKey(e.target.value)} /></Field>
        </Section>
      )}
      {whatsappEnabled && (
        <Section title="WhatsApp Configuration">
          <Field label="WhatsApp Business API Key"><Input type="password" value={whatsappApiKey} onChange={(e) => setWhatsappApiKey(e.target.value)} /></Field>
          <Field label="Phone Number ID"><Input value={whatsappPhoneId} onChange={(e) => setWhatsappPhoneId(e.target.value)} /></Field>
        </Section>
      )}
      <Section title="Notification Triggers">
        <div className="flex items-center gap-3 mb-3"><Switch checked={orderConfirmation} onCheckedChange={setOrderConfirmation} /><Label>Order Confirmation</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={orderShipped} onCheckedChange={setOrderShipped} /><Label>Order Shipped</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={orderDelivered} onCheckedChange={setOrderDelivered} /><Label>Order Delivered</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={priceDropAlert} onCheckedChange={setPriceDropAlert} /><Label>Price Drop Alerts</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={backInStock} onCheckedChange={setBackInStock} /><Label>Back in Stock Alerts</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={promoNotif} onCheckedChange={setPromoNotif} /><Label>Promotional Notifications</Label></div>
      </Section>
      <Button onClick={() => onSave({ notifEmailEnabled: emailEnabled, notifSmsEnabled: smsEnabled, notifPushEnabled: pushEnabled, notifWhatsappEnabled: whatsappEnabled, emailProvider, emailApiKey, emailFromAddress, emailFromName, smsProvider, smsApiKey, smsSenderId, pushFcmServerKey: pushFcmKey, whatsappApiKey, whatsappPhoneId, notifOrderConfirmation: orderConfirmation, notifOrderShipped: orderShipped, notifOrderDelivered: orderDelivered, notifPriceDrop: priceDropAlert, notifBackInStock: backInStock, notifPromotional: promoNotif })}>Save Notification Settings</Button>
    </div>
  );
}

// ─── Offers & Promotions Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function OffersTab({ settings, onSave }: { settings: Record<string, any>; onSave: (p: Record<string, any>) => void }) {
  const [couponsEnabled, setCouponsEnabled] = useState(settings.couponsEnabled ?? true);
  const [autoPromosEnabled, setAutoPromosEnabled] = useState(settings.autoPromosEnabled ?? false);
  const [stackingEnabled, setStackingEnabled] = useState(settings.promoStackingEnabled ?? false);
  const [maxStackCount, setMaxStackCount] = useState(settings.maxPromoStack || "2");
  const [flashSalesEnabled, setFlashSalesEnabled] = useState(settings.flashSalesEnabled ?? true);
  const [lightningDealsEnabled, setLightningDealsEnabled] = useState(settings.lightningDealsEnabled ?? true);
  const [bankOffersEnabled, setBankOffersEnabled] = useState(settings.bankOffersEnabled ?? true);
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(settings.loyaltyPointsEnabled ?? false);
  const [loyaltyPointsPerRupee, setLoyaltyPointsPerRupee] = useState(settings.loyaltyPointsPerRupee || "1");
  const [loyaltyRedemptionRate, setLoyaltyRedemptionRate] = useState(settings.loyaltyRedemptionRate || "100");
  const [referralEnabled, setReferralEnabled] = useState(settings.referralEnabled ?? false);
  const [referralReward, setReferralReward] = useState(settings.referralRewardAmount || "100");
  const [gamificationEnabled, setGamificationEnabled] = useState(settings.gamificationEnabled ?? false);
  const [bundleDealsEnabled, setBundleDealsEnabled] = useState(settings.bundleDealsEnabled ?? true);
  const [dynamicPricingEnabled, setDynamicPricingEnabled] = useState(settings.dynamicPricingEnabled ?? false);
  const [cartAbandonCoupon, setCartAbandonCoupon] = useState(settings.cartAbandonCouponEnabled ?? false);
  const [firstOrderDiscount, setFirstOrderDiscount] = useState(settings.firstOrderDiscount || "");
  const [minOrderForCoupon, setMinOrderForCoupon] = useState(settings.minOrderForCoupon || "");

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Coupons & Promotions">
        <div className="flex items-center gap-3 mb-3"><Switch checked={couponsEnabled} onCheckedChange={setCouponsEnabled} /><Label>Coupons Enabled</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={autoPromosEnabled} onCheckedChange={setAutoPromosEnabled} /><Label>Auto-Apply Promotions</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={stackingEnabled} onCheckedChange={setStackingEnabled} /><Label>Promo Stacking</Label></div>
        {stackingEnabled && <Field label="Max Stack Count"><Input type="number" value={maxStackCount} onChange={(e) => setMaxStackCount(e.target.value)} /></Field>}
        <Field label="First Order Discount (%)"><Input type="number" value={firstOrderDiscount} onChange={(e) => setFirstOrderDiscount(e.target.value)} placeholder="10" /></Field>
        <Field label="Min Order for Coupon"><Input type="number" value={minOrderForCoupon} onChange={(e) => setMinOrderForCoupon(e.target.value)} placeholder="299" /></Field>
      </Section>
      <Section title="Deal Types">
        <div className="flex items-center gap-3 mb-3"><Switch checked={flashSalesEnabled} onCheckedChange={setFlashSalesEnabled} /><Label>Flash Sales</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={lightningDealsEnabled} onCheckedChange={setLightningDealsEnabled} /><Label>Lightning Deals</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={bankOffersEnabled} onCheckedChange={setBankOffersEnabled} /><Label>Bank Offers</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={bundleDealsEnabled} onCheckedChange={setBundleDealsEnabled} /><Label>Bundle Deals</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={dynamicPricingEnabled} onCheckedChange={setDynamicPricingEnabled} /><Label>Dynamic Pricing</Label></div>
      </Section>
      <Section title="Loyalty & Referrals">
        <div className="flex items-center gap-3 mb-3"><Switch checked={loyaltyEnabled} onCheckedChange={setLoyaltyEnabled} /><Label>Loyalty Points Program</Label></div>
        {loyaltyEnabled && (<><Field label="Points Per ₹ Spent"><Input type="number" value={loyaltyPointsPerRupee} onChange={(e) => setLoyaltyPointsPerRupee(e.target.value)} /></Field><Field label="Points for ₹1 Redemption"><Input type="number" value={loyaltyRedemptionRate} onChange={(e) => setLoyaltyRedemptionRate(e.target.value)} /></Field></>)}
        <div className="flex items-center gap-3 mb-3"><Switch checked={referralEnabled} onCheckedChange={setReferralEnabled} /><Label>Referral Program</Label></div>
        {referralEnabled && <Field label="Referral Reward Amount"><Input type="number" value={referralReward} onChange={(e) => setReferralReward(e.target.value)} /></Field>}
      </Section>
      <Section title="Gamification & Recovery">
        <div className="flex items-center gap-3 mb-3"><Switch checked={gamificationEnabled} onCheckedChange={setGamificationEnabled} /><Label>Gamification (Spin Wheel, Scratch Cards)</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={cartAbandonCoupon} onCheckedChange={setCartAbandonCoupon} /><Label>Cart Abandonment Recovery Coupon</Label></div>
      </Section>
      <Button onClick={() => onSave({ couponsEnabled, autoPromosEnabled, promoStackingEnabled: stackingEnabled, maxPromoStack: Number(maxStackCount), flashSalesEnabled, lightningDealsEnabled, bankOffersEnabled, loyaltyPointsEnabled: loyaltyEnabled, loyaltyPointsPerRupee: Number(loyaltyPointsPerRupee), loyaltyRedemptionRate: Number(loyaltyRedemptionRate), referralEnabled, referralRewardAmount: Number(referralReward), gamificationEnabled, bundleDealsEnabled, dynamicPricingEnabled, cartAbandonCouponEnabled: cartAbandonCoupon, firstOrderDiscount: firstOrderDiscount ? Number(firstOrderDiscount) : undefined, minOrderForCoupon: minOrderForCoupon ? Number(minOrderForCoupon) : undefined })}>Save Offers Settings</Button>
    </div>
  );
}

// ─── Suppliers Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function SuppliersTab({ settings, onSave }: { settings: Record<string, any>; onSave: (p: Record<string, any>) => void }) {
  const [supplierEnabled, setSupplierEnabled] = useState(settings.supplierModuleEnabled ?? false);
  const [autoPoGeneration, setAutoPoGeneration] = useState(settings.autoPoGeneration ?? false);
  const [poApprovalRequired, setPoApprovalRequired] = useState(settings.poApprovalRequired ?? true);
  const [reorderPointEnabled, setReorderPointEnabled] = useState(settings.reorderPointEnabled ?? false);
  const [defaultLeadTimeDays, setDefaultLeadTimeDays] = useState(settings.defaultSupplierLeadTimeDays || "7");
  const [supplierRatingEnabled, setSupplierRatingEnabled] = useState(settings.supplierRatingEnabled ?? true);
  const [multiSupplierPerProduct, setMultiSupplierPerProduct] = useState(settings.multiSupplierPerProduct ?? true);
  const [supplierPortalEnabled, setSupplierPortalEnabled] = useState(settings.supplierPortalEnabled ?? false);
  const [supplierReturnEnabled, setSupplierReturnEnabled] = useState(settings.supplierReturnEnabled ?? true);
  const [qualityCheckRequired, setQualityCheckRequired] = useState(settings.qualityCheckRequired ?? false);
  const [paymentTermsDays, setPaymentTermsDays] = useState(settings.supplierPaymentTermsDays || "30");
  const [supplierCatalogSync, setSupplierCatalogSync] = useState(settings.supplierCatalogSync ?? false);

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Supplier Module">
        <div className="flex items-center gap-3 mb-3"><Switch checked={supplierEnabled} onCheckedChange={setSupplierEnabled} /><Label>Enable Supplier Management</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={supplierPortalEnabled} onCheckedChange={setSupplierPortalEnabled} /><Label>Supplier Self-Service Portal</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={multiSupplierPerProduct} onCheckedChange={setMultiSupplierPerProduct} /><Label>Multiple Suppliers Per Product</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={supplierCatalogSync} onCheckedChange={setSupplierCatalogSync} /><Label>Supplier Catalog Sync</Label></div>
      </Section>
      <Section title="Purchase Orders">
        <div className="flex items-center gap-3 mb-3"><Switch checked={autoPoGeneration} onCheckedChange={setAutoPoGeneration} /><Label>Auto-Generate POs at Reorder Point</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={poApprovalRequired} onCheckedChange={setPoApprovalRequired} /><Label>PO Approval Required</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={reorderPointEnabled} onCheckedChange={setReorderPointEnabled} /><Label>Reorder Point Alerts</Label></div>
        <Field label="Default Lead Time (days)"><Input type="number" value={defaultLeadTimeDays} onChange={(e) => setDefaultLeadTimeDays(e.target.value)} /></Field>
      </Section>
      <Section title="Quality & Returns">
        <div className="flex items-center gap-3 mb-3"><Switch checked={qualityCheckRequired} onCheckedChange={setQualityCheckRequired} /><Label>Quality Check on Receiving</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={supplierReturnEnabled} onCheckedChange={setSupplierReturnEnabled} /><Label>Supplier Returns Enabled</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={supplierRatingEnabled} onCheckedChange={setSupplierRatingEnabled} /><Label>Supplier Performance Rating</Label></div>
      </Section>
      <Section title="Payment Terms">
        <Field label="Default Payment Terms (days)"><Input type="number" value={paymentTermsDays} onChange={(e) => setPaymentTermsDays(e.target.value)} /></Field>
      </Section>
      <Button onClick={() => onSave({ supplierModuleEnabled: supplierEnabled, autoPoGeneration, poApprovalRequired, reorderPointEnabled, defaultSupplierLeadTimeDays: Number(defaultLeadTimeDays), supplierRatingEnabled, multiSupplierPerProduct, supplierPortalEnabled, supplierReturnEnabled, qualityCheckRequired, supplierPaymentTermsDays: Number(paymentTermsDays), supplierCatalogSync })}>Save Supplier Settings</Button>
    </div>
  );
}

// ─── Sellers / Marketplace Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function SellersTab({ settings, onSave }: { settings: Record<string, any>; onSave: (p: Record<string, any>) => void }) {
  const [marketplaceEnabled, setMarketplaceEnabled] = useState(settings.marketplaceEnabled ?? false);
  const [sellerRegistrationOpen, setSellerRegistrationOpen] = useState(settings.sellerRegistrationOpen ?? true);
  const [autoApprove, setAutoApprove] = useState(settings.sellerAutoApprove ?? false);
  const [commissionRate, setCommissionRate] = useState(settings.defaultCommissionRate || "10");
  const [commissionType, setCommissionType] = useState(settings.commissionType || "percentage");
  const [minPayoutAmount, setMinPayoutAmount] = useState(settings.sellerMinPayout || "500");
  const [payoutFrequency, setPayoutFrequency] = useState(settings.sellerPayoutFrequency || "weekly");
  const [sellerVerificationRequired, setSellerVerificationRequired] = useState(settings.sellerVerificationRequired ?? true);
  const [sellerProductApproval, setSellerProductApproval] = useState(settings.sellerProductApproval ?? true);
  const [maxProductsPerSeller, setMaxProductsPerSeller] = useState(settings.maxProductsPerSeller || "100");
  const [sellerRatingEnabled, setSellerRatingEnabled] = useState(settings.sellerRatingEnabled ?? true);
  const [sellerShippingEnabled, setSellerShippingEnabled] = useState(settings.sellerShippingEnabled ?? false);
  const [sellerReturnPolicy, setSellerReturnPolicy] = useState(settings.sellerReturnPolicy || "platform");
  const [disputeResolution, setDisputeResolution] = useState(settings.disputeResolution || "platform");

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Marketplace Settings">
        <div className="flex items-center gap-3 mb-3"><Switch checked={marketplaceEnabled} onCheckedChange={setMarketplaceEnabled} /><Label>Enable Marketplace / Multi-Seller</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={sellerRegistrationOpen} onCheckedChange={setSellerRegistrationOpen} /><Label>Open Seller Registration</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={autoApprove} onCheckedChange={setAutoApprove} /><Label>Auto-Approve New Sellers</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={sellerVerificationRequired} onCheckedChange={setSellerVerificationRequired} /><Label>Seller Verification Required (KYC)</Label></div>
      </Section>
      <Section title="Commission & Payouts">
        <Field label="Commission Type">
          <Select value={commissionType} onValueChange={setCommissionType}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="percentage">Percentage</SelectItem><SelectItem value="fixed">Fixed Amount</SelectItem><SelectItem value="tiered">Tiered</SelectItem></SelectContent></Select>
        </Field>
        <Field label="Default Commission Rate (%)"><Input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} /></Field>
        <Field label="Min Payout Amount"><Input type="number" value={minPayoutAmount} onChange={(e) => setMinPayoutAmount(e.target.value)} /></Field>
        <Field label="Payout Frequency">
          <Select value={payoutFrequency} onValueChange={setPayoutFrequency}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="daily">Daily</SelectItem><SelectItem value="weekly">Weekly</SelectItem><SelectItem value="biweekly">Bi-Weekly</SelectItem><SelectItem value="monthly">Monthly</SelectItem></SelectContent></Select>
        </Field>
      </Section>
      <Section title="Product & Catalog Control">
        <div className="flex items-center gap-3 mb-3"><Switch checked={sellerProductApproval} onCheckedChange={setSellerProductApproval} /><Label>Require Product Approval</Label></div>
        <Field label="Max Products Per Seller"><Input type="number" value={maxProductsPerSeller} onChange={(e) => setMaxProductsPerSeller(e.target.value)} /></Field>
        <div className="flex items-center gap-3 mb-3"><Switch checked={sellerShippingEnabled} onCheckedChange={setSellerShippingEnabled} /><Label>Sellers Handle Own Shipping</Label></div>
      </Section>
      <Section title="Reviews & Disputes">
        <div className="flex items-center gap-3 mb-3"><Switch checked={sellerRatingEnabled} onCheckedChange={setSellerRatingEnabled} /><Label>Seller Ratings & Reviews</Label></div>
        <Field label="Return Policy">
          <Select value={sellerReturnPolicy} onValueChange={setSellerReturnPolicy}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="platform">Platform Policy</SelectItem><SelectItem value="seller">Seller-Defined</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent></Select>
        </Field>
        <Field label="Dispute Resolution">
          <Select value={disputeResolution} onValueChange={setDisputeResolution}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="platform">Platform Mediated</SelectItem><SelectItem value="seller_first">Seller First</SelectItem><SelectItem value="auto">Auto-Resolve</SelectItem></SelectContent></Select>
        </Field>
      </Section>
      <Button onClick={() => onSave({ marketplaceEnabled, sellerRegistrationOpen, sellerAutoApprove: autoApprove, defaultCommissionRate: Number(commissionRate), commissionType, sellerMinPayout: Number(minPayoutAmount), sellerPayoutFrequency: payoutFrequency, sellerVerificationRequired, sellerProductApproval, maxProductsPerSeller: Number(maxProductsPerSeller), sellerRatingEnabled, sellerShippingEnabled, sellerReturnPolicy, disputeResolution })}>Save Marketplace Settings</Button>
    </div>
  );
}

// ─── Shipping & Delivery Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function ShippingTab({ settings, onSave }: { settings: Record<string, any>; onSave: (p: Record<string, any>) => void }) {
  const [freeShippingEnabled, setFreeShippingEnabled] = useState(settings.freeShippingEnabled ?? false);
  const [freeShippingMinOrder, setFreeShippingMinOrder] = useState(settings.freeShippingMinOrder || "");
  const [defaultShippingRate, setDefaultShippingRate] = useState(settings.defaultShippingRate || "");
  const [expressEnabled, setExpressEnabled] = useState(settings.expressDeliveryEnabled ?? false);
  const [expressSurcharge, setExpressSurcharge] = useState(settings.expressSurcharge || "");
  const [sameDayEnabled, setSameDayEnabled] = useState(settings.sameDayDeliveryEnabled ?? false);
  const [sameDayCutoff, setSameDayCutoff] = useState(settings.sameDayCutoffTime || "14:00");
  const [estimatedDaysMin, setEstimatedDaysMin] = useState(settings.estimatedDeliveryDaysMin || "2");
  const [estimatedDaysMax, setEstimatedDaysMax] = useState(settings.estimatedDeliveryDaysMax || "7");
  const [codEnabled, setCodEnabled] = useState(settings.shippingCodEnabled ?? true);
  const [trackingEnabled, setTrackingEnabled] = useState(settings.shipmentTrackingEnabled ?? true);
  const [providers, setProviders] = useState(settings.shippingProviders || "");
  const [returnShippingFree, setReturnShippingFree] = useState(settings.returnShippingFree ?? false);
  const [weightBasedEnabled, setWeightBasedEnabled] = useState(settings.weightBasedShipping ?? false);
  const [ratePerKg, setRatePerKg] = useState(settings.shippingRatePerKg || "");
  const [restrictedPincodes, setRestrictedPincodes] = useState(settings.restrictedPincodes || "");
  const [slotDeliveryEnabled, setSlotDeliveryEnabled] = useState(settings.slotDeliveryEnabled ?? false);
  const [slotDuration, setSlotDuration] = useState(settings.slotDurationMin || "60");
  const [maxOrdersPerSlot, setMaxOrdersPerSlot] = useState(settings.maxOrdersPerSlot || "10");

  return (
    <div className="space-y-6 max-w-3xl">
      <Section title="Shipping Methods">
        <div className="flex items-center gap-3 mb-3"><Switch checked={freeShippingEnabled} onCheckedChange={setFreeShippingEnabled} /><Label>Free Shipping</Label></div>
        {freeShippingEnabled && <Field label="Min Order for Free Shipping"><Input type="number" value={freeShippingMinOrder} onChange={(e) => setFreeShippingMinOrder(e.target.value)} placeholder="499" /></Field>}
        <Field label="Default Shipping Rate"><Input type="number" value={defaultShippingRate} onChange={(e) => setDefaultShippingRate(e.target.value)} placeholder="50" /></Field>
        <div className="flex items-center gap-3 mb-3"><Switch checked={weightBasedEnabled} onCheckedChange={setWeightBasedEnabled} /><Label>Weight-Based Shipping</Label></div>
        {weightBasedEnabled && <Field label="Rate per Kg"><Input type="number" value={ratePerKg} onChange={(e) => setRatePerKg(e.target.value)} placeholder="20" /></Field>}
      </Section>
      <Section title="Express & Same-Day Delivery">
        <div className="flex items-center gap-3 mb-3"><Switch checked={expressEnabled} onCheckedChange={setExpressEnabled} /><Label>Express Delivery</Label></div>
        {expressEnabled && <Field label="Express Surcharge"><Input type="number" value={expressSurcharge} onChange={(e) => setExpressSurcharge(e.target.value)} placeholder="99" /></Field>}
        <div className="flex items-center gap-3 mb-3"><Switch checked={sameDayEnabled} onCheckedChange={setSameDayEnabled} /><Label>Same-Day Delivery</Label></div>
        {sameDayEnabled && <Field label="Same-Day Cutoff Time"><Input type="time" value={sameDayCutoff} onChange={(e) => setSameDayCutoff(e.target.value)} /></Field>}
      </Section>
      <Section title="Delivery Slots">
        <div className="flex items-center gap-3 mb-3"><Switch checked={slotDeliveryEnabled} onCheckedChange={setSlotDeliveryEnabled} /><Label>Slot-Based Delivery</Label></div>
        {slotDeliveryEnabled && (<><Field label="Slot Duration (minutes)"><Input type="number" value={slotDuration} onChange={(e) => setSlotDuration(e.target.value)} /></Field><Field label="Max Orders Per Slot"><Input type="number" value={maxOrdersPerSlot} onChange={(e) => setMaxOrdersPerSlot(e.target.value)} /></Field></>)}
      </Section>
      <Section title="Delivery Estimates & Tracking">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Min Delivery Days"><Input type="number" value={estimatedDaysMin} onChange={(e) => setEstimatedDaysMin(e.target.value)} /></Field>
          <Field label="Max Delivery Days"><Input type="number" value={estimatedDaysMax} onChange={(e) => setEstimatedDaysMax(e.target.value)} /></Field>
        </div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={trackingEnabled} onCheckedChange={setTrackingEnabled} /><Label>Shipment Tracking</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={codEnabled} onCheckedChange={setCodEnabled} /><Label>Cash on Delivery</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={returnShippingFree} onCheckedChange={setReturnShippingFree} /><Label>Free Return Shipping</Label></div>
      </Section>
      <Section title="Shipping Providers & Restrictions">
        <Field label="Shipping Providers (comma-separated)"><Input value={providers} onChange={(e) => setProviders(e.target.value)} placeholder="Delhivery, BlueDart, DTDC, India Post" /></Field>
        <Field label="Restricted Pincodes (comma-separated)"><Input value={restrictedPincodes} onChange={(e) => setRestrictedPincodes(e.target.value)} placeholder="110001, 400001" /></Field>
      </Section>
      <Button onClick={() => onSave({ freeShippingEnabled, freeShippingMinOrder: freeShippingMinOrder ? Number(freeShippingMinOrder) : undefined, defaultShippingRate: defaultShippingRate ? Number(defaultShippingRate) : undefined, expressDeliveryEnabled: expressEnabled, expressSurcharge: expressSurcharge ? Number(expressSurcharge) : undefined, sameDayDeliveryEnabled: sameDayEnabled, sameDayCutoffTime: sameDayCutoff, estimatedDeliveryDaysMin: Number(estimatedDaysMin), estimatedDeliveryDaysMax: Number(estimatedDaysMax), shippingCodEnabled: codEnabled, shipmentTrackingEnabled: trackingEnabled, shippingProviders: providers, returnShippingFree, weightBasedShipping: weightBasedEnabled, shippingRatePerKg: ratePerKg ? Number(ratePerKg) : undefined, restrictedPincodes, slotDeliveryEnabled, slotDurationMin: Number(slotDuration), maxOrdersPerSlot: Number(maxOrdersPerSlot) })}>Save Shipping Settings</Button>
    </div>
  );
}

// ─── Compliance Tab ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- dynamic object shape
function ComplianceTab({ settings, onSave }: { settings: Record<string, any>; onSave: (p: Record<string, any>) => void }) {
  const [gdpr, setGdpr] = useState(settings.gdprEnabled ?? false);
  const [cookieConsent, setCookieConsent] = useState(settings.cookieConsentEnabled ?? true);
  const [termsUrl, setTermsUrl] = useState(settings.termsUrl || "");
  const [privacyUrl, setPrivacyUrl] = useState(settings.privacyUrl || "");
  const [returnPolicy, setReturnPolicy] = useState(settings.returnPolicyUrl || "");
  const [gstNumber, setGstNumber] = useState(settings.gstNumber || "");
  const [panNumber, setPanNumber] = useState(settings.panNumber || "");

  return (
    <div className="max-w-3xl">
      <Section title="Compliance & Legal">
        <div className="flex items-center gap-3 mb-3"><Switch checked={gdpr} onCheckedChange={setGdpr} /><Label>GDPR Enabled</Label></div>
        <div className="flex items-center gap-3 mb-3"><Switch checked={cookieConsent} onCheckedChange={setCookieConsent} /><Label>Cookie Consent Banner</Label></div>
        <Field label="Terms & Conditions URL"><Input value={termsUrl} onChange={(e) => setTermsUrl(e.target.value)} placeholder="/terms" /></Field>
        <Field label="Privacy Policy URL"><Input value={privacyUrl} onChange={(e) => setPrivacyUrl(e.target.value)} placeholder="/privacy" /></Field>
        <Field label="Return Policy URL"><Input value={returnPolicy} onChange={(e) => setReturnPolicy(e.target.value)} placeholder="/returns" /></Field>
        <Field label="GST Number"><Input value={gstNumber} onChange={(e) => setGstNumber(e.target.value)} placeholder="22AAAAA0000A1Z5" /></Field>
        <Field label="PAN Number"><Input value={panNumber} onChange={(e) => setPanNumber(e.target.value)} placeholder="AAAAA0000A" /></Field>
        <Button onClick={() => onSave({ gdprEnabled: gdpr, cookieConsentEnabled: cookieConsent, termsUrl, privacyUrl, returnPolicyUrl: returnPolicy, gstNumber, panNumber })}>Save Compliance</Button>
      </Section>
    </div>
  );
}

// ─── Permissions Tab ───
function PermissionsTab({ siteId }: { siteId: string }) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadAdmins(); }, [siteId]);

  async function loadAdmins() {
    try {
      const data = await getSiteAdmins(siteId);
      setAdmins(data);
    } catch { /* non-fatal */ }
    finally { setLoading(false); }
  }

  async function togglePermission(adminId: string, currentPerms: string[], perm: string) {
    const newPerms = currentPerms.includes(perm)
      ? currentPerms.filter(p => p !== perm)
      : [...currentPerms, perm];
    try {
      await updateSiteAdminPermissions(adminId, newPerms);
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, permissions: newPerms } : a));
      toast.success("Permission updated");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function grantAll(adminId: string) {
    try {
      await updateSiteAdminPermissions(adminId, [...ALL_PERMISSIONS]);
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, permissions: [...ALL_PERMISSIONS] } : a));
      toast.success("All permissions granted");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function revokeAll(adminId: string) {
    try {
      await updateSiteAdminPermissions(adminId, []);
      setAdmins(prev => prev.map(a => a.id === adminId ? { ...a, permissions: [] } : a));
      toast.success("All permissions revoked");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  if (loading) return <p className="text-gray-500">Loading admins...</p>;
  if (admins.length === 0) return <p className="text-gray-400">No site admins assigned to this site.</p>;

  return (
    <div className="max-w-4xl space-y-6">
      {admins.map((admin) => (
        <div key={admin.id} className="border rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="font-semibold">{admin.user.name || admin.user.email}</p>
              <p className="text-xs text-gray-500">{admin.user.email}</p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => grantAll(admin.id)}>Grant All</Button>
              <Button size="sm" variant="outline" onClick={() => revokeAll(admin.id)}>Revoke All</Button>
            </div>
          </div>
          <div className="space-y-4">
            {PERMISSION_GROUPS.map((group) => (
              <div key={group.label}>
                <p className="text-xs font-semibold text-gray-600 uppercase mb-2">{group.label}</p>
                <div className="flex flex-wrap gap-2">
                  {group.permissions.map((p) => {
                    const active = (admin.permissions || []).includes(p.key);
                    return (
                      <button
                        key={p.key}
                        onClick={() => togglePermission(admin.id, admin.permissions || [], p.key)}
                        className={`px-3 py-1.5 text-xs rounded-full border transition ${
                          active
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                        }`}
                      >
                        {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3">
            {(admin.permissions || []).length} / {ALL_PERMISSIONS.length} permissions enabled
          </p>
        </div>
      ))}
    </div>
  );
}
