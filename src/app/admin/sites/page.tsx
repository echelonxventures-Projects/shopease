"use client";
import { useEffect, useMemo, useState } from "react";
import {
  getSites,
  createSite,
  deleteSite,
  updateSite,
  getSiteFormLookups,
  resolvePresetCategoryIds,
  getBrandsByCategories,
} from "@/server/actions/site-actions";
import type { CategoryPreset } from "@/lib/sites/category-presets";
import { COMMON_LOCALES } from "@/lib/sites/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Globe, Edit, Trash2, ExternalLink } from "lucide-react";

// ── Types mirroring server-action lookup payload ────────────────────────────
type Region = {
  id: string;
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  defaultLocale: string;
  supportedLocales: string[];
  timezone: string;
};
type Currency = { code: string; name: string; symbol: string };
type Category = { id: string; name: string; slug: string; parentId: string | null };
type Brand = { id: string; name: string; slug: string; logo: string | null };
type Lookups = {
  regions: Region[];
  currencies: Currency[];
  categories: Category[];
  brands: Brand[];
  presets: CategoryPreset[];
};

// ── Form state ──────────────────────────────────────────────────────────────
const EMPTY_FORM = {
  // Basic
  name: "",
  slug: "",
  subdomain: "",
  domain: "",
  description: "",

  // Region & locale
  regionId: "",
  defaultCurrency: "",
  defaultLocale: "",
  supportedLocales: [] as string[],

  // Branding
  logo: "",
  favicon: "",
  primaryColor: "#2563eb",
  secondaryColor: "#f59e0b",
  fontFamily: "sans",

  // Contact
  contactEmail: "",
  contactPhone: "",
  contactAddress: "",

  // Catalog
  catalogPreset: "GLOBAL",
  brandIds: [] as string[],
  manualCategoryIds: [] as string[], // only used when preset === "MIX"

  // Meta
  metaTitle: "",
  metaDescription: "",
};
type SiteForm = typeof EMPTY_FORM;

export default function SitesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [sites, setSites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lookups, setLookups] = useState<Lookups | null>(null);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [activeTab, setActiveTab] = useState("basic");
  const [form, setForm] = useState<SiteForm>(EMPTY_FORM);

  useEffect(() => {
    loadSites();
  }, []);

  async function loadSites() {
    try {
      const data = await getSites();
      setSites(data);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }

  async function openCreateDialog() {
    setForm(EMPTY_FORM);
    setActiveTab("basic");
    setDialogOpen(true);
    if (!lookups) {
      try {
        const data = (await getSiteFormLookups()) as Lookups;
        setLookups(data);
        setFilteredBrands(data.brands);
      } catch {
        toast.error("Failed to load form options");
      }
    }
  }

  // When a region is picked, prefill currency / default locale / supported
  // locales from the region's defaults — the admin can still override.
  function onRegionChange(regionId: string) {
    const r = lookups?.regions.find((x) => x.id === regionId);
    setForm((prev) => ({
      ...prev,
      regionId,
      defaultCurrency: r?.currency ?? prev.defaultCurrency,
      defaultLocale: r?.defaultLocale ?? prev.defaultLocale,
      supportedLocales:
        r && r.supportedLocales.length ? r.supportedLocales : prev.supportedLocales,
    }));
  }

  async function refreshBrandsForCategories(presetId: string, manualCategoryIds: string[]) {
    try {
      let categoryIds: string[];
      if (presetId === "MIX") {
        categoryIds = manualCategoryIds;
      } else if (presetId === "GLOBAL") {
        categoryIds = []; // all brands
      } else {
        categoryIds = await resolvePresetCategoryIds(presetId);
      }
      const brands = await getBrandsByCategories(categoryIds);
      setFilteredBrands(brands);
      // Remove any selected brandIds that are no longer in the filtered list
      const validIds = new Set(brands.map((b) => b.id));
      setForm((prev) => ({
        ...prev,
        brandIds: prev.brandIds.filter((id) => validIds.has(id)),
      }));
    } catch {
      // fallback to all brands
      if (lookups) setFilteredBrands(lookups.brands);
    }
  }

  function onPresetChange(presetId: string) {
    setForm((prev) => ({ ...prev, catalogPreset: presetId }));
    refreshBrandsForCategories(presetId, form.manualCategoryIds);
  }

  function toggleLocale(locale: string) {
    setForm((prev) => ({
      ...prev,
      supportedLocales: prev.supportedLocales.includes(locale)
        ? prev.supportedLocales.filter((l) => l !== locale)
        : [...prev.supportedLocales, locale],
    }));
  }

  function toggleBrand(id: string) {
    setForm((prev) => ({
      ...prev,
      brandIds: prev.brandIds.includes(id)
        ? prev.brandIds.filter((b) => b !== id)
        : [...prev.brandIds, id],
    }));
  }

  function toggleCategory(id: string) {
    setForm((prev) => {
      const newIds = prev.manualCategoryIds.includes(id)
        ? prev.manualCategoryIds.filter((c) => c !== id)
        : [...prev.manualCategoryIds, id];
      refreshBrandsForCategories("MIX", newIds);
      return { ...prev, manualCategoryIds: newIds };
    });
  }

  // Validation summary keyed by tab so the user knows where the error is.
  const validationByTab = useMemo(() => {
    const errors: Record<string, string[]> = {
      basic: [],
      locale: [],
      branding: [],
      contact: [],
      catalog: [],
    };
    if (!form.name.trim()) errors.basic.push("Name is required");
    if (!form.slug.trim()) errors.basic.push("Slug is required");
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) {
      errors.contact.push("Invalid email");
    }
    return errors;
  }, [form]);

  const hasErrors = Object.values(validationByTab).some((e) => e.length > 0);

  async function handleCreate() {
    if (hasErrors) {
      const firstErrTab = Object.keys(validationByTab).find(
        (k) => validationByTab[k].length > 0,
      );
      if (firstErrTab) setActiveTab(firstErrTab);
      toast.error("Please fix the highlighted fields");
      return;
    }
    setSubmitting(true);
    try {
      // Resolve categoryIds based on the chosen preset (or manual selection).
      let categoryIds: string[];
      if (form.catalogPreset === "MIX") {
        categoryIds = form.manualCategoryIds;
      } else {
        categoryIds = await resolvePresetCategoryIds(form.catalogPreset);
      }

      await createSite({
        name: form.name,
        slug: form.slug,
        domain: form.domain || undefined,
        subdomain: form.subdomain || undefined,
        description: form.description || undefined,
        logo: form.logo || undefined,
        favicon: form.favicon || undefined,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        fontFamily: form.fontFamily,
        regionId: form.regionId || undefined,
        defaultCurrency: form.defaultCurrency || undefined,
        defaultLocale: form.defaultLocale || undefined,
        supportedLocales: form.supportedLocales.length
          ? form.supportedLocales
          : undefined,
        contactEmail: form.contactEmail || undefined,
        contactPhone: form.contactPhone || undefined,
        contactAddress: form.contactAddress || undefined,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        categoryIds: categoryIds.length ? categoryIds : undefined,
        brandIds: form.brandIds.length ? form.brandIds : undefined,
      });
      toast.success("Site created");
      setDialogOpen(false);
      setForm(EMPTY_FORM);
      loadSites();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create site";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this site? This cannot be undone.")) return;
    try {
      await deleteSite(id);
      toast.success("Site deleted");
      loadSites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete site");
    }
  }

  async function handleToggleDefault(id: string, isDefault: boolean) {
    try {
      await updateSite(id, { isDefault: !isDefault });
      toast.success(isDefault ? "Default site removed" : "Default site set");
      loadSites();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update site");
    }
  }

  if (loading)
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading...</p>
      </div>
    );

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sites Management</h1>
          <p className="text-sm text-gray-500">
            Manage multi-tenant storefronts with custom domains
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="w-4 h-4 mr-2" /> New Site
        </Button>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-lg">
          <Globe className="w-12 h-12 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">
            No sites yet. Create your first site to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sites.map((site) => (
            <div
              key={site.id}
              className="bg-white rounded-lg shadow p-5 flex items-center justify-between"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-semibold text-lg">{site.name}</h3>
                  <Badge
                    variant={
                      site.status === "ACTIVE"
                        ? "default"
                        : site.status === "SUSPENDED"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {site.status}
                  </Badge>
                  {site.isDefault && <Badge variant="outline">Default</Badge>}
                </div>
                <p className="text-sm text-gray-500 mb-2">
                  {site.description || "No description"}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-400 flex-wrap">
                  <span>
                    Slug:{" "}
                    <code className="bg-gray-100 px-1 rounded">{site.slug}</code>
                  </span>
                  {site.domain && (
                    <span>
                      Domain:{" "}
                      <code className="bg-gray-100 px-1 rounded">{site.domain}</code>
                    </span>
                  )}
                  {site.subdomain && (
                    <span>
                      Subdomain:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        {site.subdomain}
                      </code>
                    </span>
                  )}
                  {site.defaultCurrency && (
                    <span>
                      Currency:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        {site.defaultCurrency}
                      </code>
                    </span>
                  )}
                  {site.defaultLocale && (
                    <span>
                      Locale:{" "}
                      <code className="bg-gray-100 px-1 rounded">
                        {site.defaultLocale}
                      </code>
                    </span>
                  )}
                  <span>{site.domains?.length || 0} domain(s)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleToggleDefault(site.id, site.isDefault)}
                >
                  {site.isDefault ? "Unset Default" : "Set Default"}
                </Button>
                <Link href={`/admin/sites/${site.id}`}>
                  <Button variant="outline" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </Link>
                <Link
                  href={`http://${site.subdomain || site.domain || "localhost"}:3000`}
                  target="_blank"
                >
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </Link>
                {!site.isDefault && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(site.id)}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Site Dialog ───────────────────────────────────────── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Site</DialogTitle>
            <DialogDescription>
              Configure your storefront end-to-end. Required: name, slug.
              Everything else can be edited later from the site detail page.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
            <TabsList className="flex w-full">
              <TabsTrigger value="basic" className="relative">
                Basic
                {validationByTab.basic.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </TabsTrigger>
              <TabsTrigger value="locale">Region</TabsTrigger>
              <TabsTrigger value="branding">Branding</TabsTrigger>
              <TabsTrigger value="contact" className="relative">
                Contact
                {validationByTab.contact.length > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                )}
              </TabsTrigger>
              <TabsTrigger value="catalog">Catalog</TabsTrigger>
            </TabsList>

            {/* ── BASIC ──────────────────────────────────────────────── */}
            <TabsContent value="basic" className="space-y-4 pt-4">
              <div>
                <Label>
                  Site Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="My Store"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>
                    Slug <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        slug: e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-")
                          .replace(/[^a-z0-9-]/g, ""),
                      })
                    }
                    placeholder="my-store"
                  />
                </div>
                <div>
                  <Label>Subdomain</Label>
                  <Input
                    value={form.subdomain}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        subdomain: e.target.value
                          .toLowerCase()
                          .replace(/\s+/g, "-"),
                      })
                    }
                    placeholder="mystore"
                  />
                </div>
              </div>
              <div>
                <Label>Custom Domain</Label>
                <Input
                  value={form.domain}
                  onChange={(e) => setForm({ ...form, domain: e.target.value })}
                  placeholder="shop.mystore.com"
                />
              </div>
              <div>
                <Label>Short Description</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  placeholder="Tagline visible in admin lists & SEO previews"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Meta Title (SEO)</Label>
                  <Input
                    value={form.metaTitle}
                    onChange={(e) =>
                      setForm({ ...form, metaTitle: e.target.value })
                    }
                    placeholder="Defaults to site name"
                  />
                </div>
                <div>
                  <Label>Meta Description (SEO)</Label>
                  <Input
                    value={form.metaDescription}
                    onChange={(e) =>
                      setForm({ ...form, metaDescription: e.target.value })
                    }
                    placeholder="Up to 160 characters"
                  />
                </div>
              </div>
            </TabsContent>

            {/* ── REGION & LOCALE ────────────────────────────────────── */}
            <TabsContent value="locale" className="space-y-4 pt-4">
              <div>
                <Label>Region / Country</Label>
                <Select
                  value={form.regionId || "none"}
                  onValueChange={(v) => onRegionChange(v ? (v === "none" ? "" : v) : "")}
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
                  Picking a region prefills the currency, locale, and supported
                  languages. You can override below.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Default Currency</Label>
                  <Select
                    value={form.defaultCurrency || "none"}
                    onValueChange={(v) =>
                      setForm({ ...form, defaultCurrency: v ? (v === "none" ? "" : v) : "" })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— None —</SelectItem>
                      {lookups?.currencies.map((c) => (
                        <SelectItem key={c.code} value={c.code}>
                          {c.symbol} {c.code} — {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Default Locale (BCP 47)</Label>
                  <Input
                    value={form.defaultLocale}
                    onChange={(e) =>
                      setForm({ ...form, defaultLocale: e.target.value })
                    }
                    placeholder="en-IN"
                  />
                </div>
              </div>

              <div>
                <Label>Supported Languages</Label>
                <div className="flex flex-wrap gap-2 mt-2">
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
              </div>
            </TabsContent>

            {/* ── BRANDING ───────────────────────────────────────────── */}
            <TabsContent value="branding" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Logo URL</Label>
                  <Input
                    value={form.logo}
                    onChange={(e) => setForm({ ...form, logo: e.target.value })}
                    placeholder="https://cdn.example.com/logo.png"
                  />
                </div>
                <div>
                  <Label>Favicon URL</Label>
                  <Input
                    value={form.favicon}
                    onChange={(e) =>
                      setForm({ ...form, favicon: e.target.value })
                    }
                    placeholder="https://cdn.example.com/favicon.ico"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) =>
                        setForm({ ...form, primaryColor: e.target.value })
                      }
                      className="w-12 h-9 rounded border cursor-pointer"
                      aria-label="Primary color picker"
                    />
                    <Input
                      value={form.primaryColor}
                      onChange={(e) =>
                        setForm({ ...form, primaryColor: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Secondary Color</Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={form.secondaryColor}
                      onChange={(e) =>
                        setForm({ ...form, secondaryColor: e.target.value })
                      }
                      className="w-12 h-9 rounded border cursor-pointer"
                      aria-label="Secondary color picker"
                    />
                    <Input
                      value={form.secondaryColor}
                      onChange={(e) =>
                        setForm({ ...form, secondaryColor: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div>
                  <Label>Font Family</Label>
                  <Select
                    value={form.fontFamily}
                    onValueChange={(v) => { if (v) setForm({ ...form, fontFamily: v ?? "sans" }); }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sans">Sans-serif</SelectItem>
                      <SelectItem value="serif">Serif</SelectItem>
                      <SelectItem value="mono">Monospace</SelectItem>
                      <SelectItem value="inter">Inter</SelectItem>
                      <SelectItem value="poppins">Poppins</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-gray-50 border rounded-lg p-4">
                <p className="text-xs font-semibold text-gray-600 mb-2">
                  Live preview
                </p>
                <div
                  className="rounded p-4 flex items-center gap-3"
                  style={{
                    backgroundColor: form.primaryColor,
                    color: "white",
                  }}
                >
                  {form.logo ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={form.logo}
                      alt="Logo preview"
                      className="w-10 h-10 rounded bg-white/20 object-contain"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded bg-white/20 flex items-center justify-center">
                      <Globe className="w-5 h-5" />
                    </div>
                  )}
                  <div>
                    <div className="font-semibold">{form.name || "My Store"}</div>
                    <div
                      className="text-xs opacity-80"
                      style={{ color: form.secondaryColor }}
                    >
                      {form.description || "Your tagline here"}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* ── CONTACT ────────────────────────────────────────────── */}
            <TabsContent value="contact" className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Admin / Contact Email</Label>
                  <Input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) =>
                      setForm({ ...form, contactEmail: e.target.value })
                    }
                    placeholder="admin@mystore.com"
                  />
                  {validationByTab.contact.includes("Invalid email") && (
                    <p className="text-xs text-red-500 mt-1">Invalid email</p>
                  )}
                </div>
                <div>
                  <Label>Contact Phone</Label>
                  <Input
                    value={form.contactPhone}
                    onChange={(e) =>
                      setForm({ ...form, contactPhone: e.target.value })
                    }
                    placeholder="+91 90000 00000"
                  />
                </div>
              </div>
              <div>
                <Label>Business Address</Label>
                <Textarea
                  value={form.contactAddress}
                  onChange={(e) =>
                    setForm({ ...form, contactAddress: e.target.value })
                  }
                  placeholder="Street, City, State, ZIP, Country"
                  rows={3}
                />
              </div>
            </TabsContent>

            {/* ── CATALOG ────────────────────────────────────────────── */}
            <TabsContent value="catalog" className="space-y-4 pt-4">
              <div>
                <Label>Catalog Preset</Label>
                <Select
                  value={form.catalogPreset}
                  onValueChange={(v) => onPresetChange(v ?? "GLOBAL")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {lookups?.presets.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-500 mt-1">
                  {lookups?.presets.find((p) => p.id === form.catalogPreset)
                    ?.description}
                </p>
              </div>

              {form.catalogPreset === "MIX" && (
                <div>
                  <Label>Pick Categories</Label>
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1 mt-1">
                    {(lookups?.categories ?? []).map((c) => {
                      const active = form.manualCategoryIds.includes(c.id);
                      return (
                        <label
                          key={c.id}
                          className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                        >
                          <input
                            type="checkbox"
                            checked={active}
                            onChange={() => toggleCategory(c.id)}
                          />
                          <span>{c.name}</span>
                          <span className="text-xs text-gray-400 ml-auto">
                            {c.slug}
                          </span>
                        </label>
                      );
                    })}
                    {(lookups?.categories ?? []).length === 0 && (
                      <p className="text-xs text-gray-400">
                        No categories in catalog yet.
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {form.manualCategoryIds.length}
                  </p>
                </div>
              )}

              <div>
                <Label>Brands to feature</Label>
                <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-1 mt-1">
                  {(filteredBrands.length ? filteredBrands : lookups?.brands ?? []).map((b) => {
                    const active = form.brandIds.includes(b.id);
                    return (
                      <label
                        key={b.id}
                        className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleBrand(b.id)}
                        />
                        <span>{b.name}</span>
                        <span className="text-xs text-gray-400 ml-auto">
                          {b.slug}
                        </span>
                      </label>
                    );
                  })}
                  {(filteredBrands.length ? filteredBrands : lookups?.brands ?? []).length === 0 && (
                    <p className="text-xs text-gray-400">
                      No brands in catalog yet.
                    </p>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Selected: {form.brandIds.length}
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="mt-6">
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={submitting || hasErrors}>
              {submitting ? "Creating..." : "Create Site"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
