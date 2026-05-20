"use client";

import { useEffect, useState } from "react";
import {
  getVoucherTiersAdmin,
  createVoucherTier,
  updateVoucherTier,
  deleteVoucherTier,
  getTierStats,
} from "@/server/actions/voucher-tier-actions";
import {
  getAllRegions,
  createVoucherTierTranslation,
  getVoucherTierTranslations,
  updateVoucherTierTranslation,
  deleteVoucherTierTranslation,
} from "@/server/actions/localization-actions";
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
import { Plus, Pencil, Trash2, BarChart3, Languages } from "lucide-react";
import { LOCALES, getLocaleName } from "@/lib/i18n";

export default function VoucherTiersPage() {
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [statsTierId, setStatsTierId] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [filterRegion, setFilterRegion] = useState("");
  const [regions, setRegions] = useState<any[]>([]);

  // Translations
  const [translations, setTranslations] = useState<any[]>([]);
  const [transDialogOpen, setTransDialogOpen] = useState(false);
  const [editingTier, setEditingTier] = useState<any>(null);
  const [editingTranslation, setEditingTranslation] = useState<any>(null);
  const [transForm, setTransForm] = useState({ locale: "", name: "", description: "" });

  const [form, setForm] = useState({
    slug: "",
    name: "",
    icon: "shopping-voucher",
    description: "",
    color: "#2563eb",
    balanceMode: "SHARED",
    minPurchasePrice: "",
    maxRedemptionPerOrder: "100",
    sortOrder: "0",
    isActive: true,
    regionId: "",
  });

  const ICONS = [
    "shopping-voucher", "fresh-voucher", "gold-voucher",
    "prime-voucher", "gift-voucher", "food-voucher",
  ];

  const fetch = () => {
    const region = filterRegion || undefined;
    getVoucherTiersAdmin(region)
      .then(setTiers)
      .catch(() => toast.error("Failed to load tiers"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getAllRegions().then(setRegions).catch(() => {});
  }, []);

  useEffect(() => { fetch(); }, [filterRegion]);

  const resetForm = () => {
    setForm({
      slug: "", name: "", icon: "shopping-voucher", description: "",
      color: "#2563eb", balanceMode: "SHARED",
      minPurchasePrice: "", maxRedemptionPerOrder: "100",
      sortOrder: "0", isActive: true, regionId: "",
    });
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error("Name is required"); return; }
    if (!form.slug.trim()) { toast.error("Slug is required"); return; }

    try {
      if (editId) {
        await updateVoucherTier(editId, {
          name: form.name,
          icon: form.icon,
          description: form.description,
          color: form.color,
          balanceMode: form.balanceMode,
          minPurchasePrice: form.minPurchasePrice ? parseFloat(form.minPurchasePrice) : undefined,
          maxRedemptionPerOrder: form.maxRedemptionPerOrder ? parseFloat(form.maxRedemptionPerOrder) : undefined,
          sortOrder: parseInt(form.sortOrder),
          isActive: form.isActive,
          regionId: form.regionId || null,
        });
        toast.success("Tier updated");
      } else {
        await createVoucherTier({
          slug: form.slug,
          name: form.name,
          icon: form.icon,
          description: form.description,
          color: form.color,
          balanceMode: form.balanceMode,
          minPurchasePrice: form.minPurchasePrice ? parseFloat(form.minPurchasePrice) : undefined,
          maxRedemptionPerOrder: form.maxRedemptionPerOrder ? parseFloat(form.maxRedemptionPerOrder) : undefined,
          sortOrder: parseInt(form.sortOrder),
          isActive: form.isActive,
          regionId: form.regionId || null,
        });
        toast.success("Tier created");
      }
      setOpen(false);
      resetForm();
      fetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tier? Vouchers using this tier must be reassigned first.")) return;
    try {
      await deleteVoucherTier(id);
      toast.success("Tier deleted");
      fetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const loadStats = async (id: string) => {
    setStatsTierId(id);
    try {
      setStats(await getTierStats(id));
    } catch {
      toast.error("Failed to load stats");
    }
  };

  const openTranslations = async (tier: any) => {
    setEditingTier(tier);
    setEditingTranslation(null);
    try {
      const data = await getVoucherTierTranslations(tier.id);
      setTranslations(data);
    } catch { setTranslations([]); }
    setTransDialogOpen(true);
  };

  const handleSaveTranslation = async () => {
    if (!transForm.name.trim()) { toast.error("Name is required"); return; }
    if (!transForm.locale) { toast.error("Select a locale"); return; }
    try {
      const payload: any = { name: transForm.name, description: transForm.description || undefined };
      if (editingTranslation) {
        await updateVoucherTierTranslation(editingTranslation.id, payload);
        toast.success("Translation updated");
      } else {
        await createVoucherTierTranslation(editingTier.id, transForm.locale, payload);
        toast.success("Translation created");
      }
      const data = await getVoucherTierTranslations(editingTier.id);
      setTranslations(data);
      setTransForm({ locale: "", name: "", description: "" });
      setEditingTranslation(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteTranslation = async (id: string) => {
    try {
      await deleteVoucherTierTranslation(id);
      toast.success("Translation deleted");
      const data = await getVoucherTierTranslations(editingTier.id);
      setTranslations(data);
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Voucher Tiers</h1>
          <p className="text-gray-500 text-sm mt-1">Configure voucher categories — Shopping, Fresh, Gold, Prime</p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" /> Add Tier
        </Button>
      </div>

      {/* Region Filter */}
      <div className="mb-4">
        <Select value={filterRegion} onValueChange={(v) => setFilterRegion(v || "")}>
          <SelectTrigger className="w-64"><SelectValue placeholder="All Regions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tiers.length === 0 ? (
          <div className="col-span-2 text-center py-12 text-gray-400">No tiers configured yet</div>
        ) : (
          tiers.map((tier: any) => (
            <div
              key={tier.id}
              className="bg-white rounded-lg shadow p-6 border-l-4 hover:shadow-md transition"
              style={{ borderLeftColor: tier.color }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: tier.color }}>
                    {tier.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{tier.name}</h3>
                    <p className="text-xs text-gray-400 font-mono">{tier.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {tier.region ? <Badge className="bg-blue-100 text-blue-700">{tier.region.code}</Badge> : <Badge className="bg-gray-100 text-gray-500">Global</Badge>}
                  <Badge className={tier.balanceMode === "SHARED" ? "bg-blue-100 text-blue-700" : "bg-purple-100 text-purple-700"}>
                    {tier.balanceMode}
                  </Badge>
                </div>
              </div>

              <p className="text-sm text-gray-500 mb-4">{tier.description || "No description"}</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 rounded p-2 text-center">
                  <p className="text-xs text-gray-400">Vouchers</p>
                  <p className="text-xl font-bold">{tier._count?.vouchers || 0}</p>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <p className="text-xs text-gray-400">Users</p>
                  <p className="text-xl font-bold">{tier._count?.userBalances || 0}</p>
                </div>
                <div className="bg-gray-50 rounded p-2 text-center">
                  <p className="text-xs text-gray-400">Gift Cards</p>
                  <p className="text-xl font-bold">{tier._count?.giftCards || 0}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => { populateEditForm(tier); setOpen(true); }}>
                  <Pencil className="w-3 h-3 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="outline" onClick={() => openTranslations(tier)}>
                  <Languages className="w-3 h-3 mr-1" /> Lang
                </Button>
                <Button size="sm" variant="outline" onClick={() => loadStats(tier.id)}>
                  <BarChart3 className="w-3 h-3 mr-1" /> Stats
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(tier.id)}>
                  <Trash2 className="w-3 h-3 mr-1" /> Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Voucher Tier" : "Create Voucher Tier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Name *</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Shopping Voucher" />
              </div>
              <div>
                <Label>Slug *</Label>
                <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })} placeholder="shopping-voucher" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Apply to all shopping orders" rows={2} />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Color</Label>
                <div className="flex gap-2">
                  <Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-16 h-10 p-1" />
                  <Input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="flex-1" />
                </div>
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
              </div>
              <div>
                <Label>Max Redeem %</Label>
                <Input type="number" value={form.maxRedemptionPerOrder} onChange={(e) => setForm({ ...form, maxRedemptionPerOrder: e.target.value })} placeholder="100" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Balance Mode</Label>
                <Select value={form.balanceMode} onValueChange={(v) => v && setForm({ ...form, balanceMode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHARED">Shared Balance</SelectItem>
                    <SelectItem value="SEPARATE">Separate Balance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Icon</Label>
                <Select value={form.icon} onValueChange={(v) => v && setForm({ ...form, icon: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ICONS.map((icon) => (
                      <SelectItem key={icon} value={icon}>{icon}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Min Purchase Price (optional)</Label>
              <Input type="number" value={form.minPurchasePrice} onChange={(e) => setForm({ ...form, minPurchasePrice: e.target.value })} placeholder="No minimum" />
            </div>

            <div>
              <Label>Region</Label>
              <Select value={form.regionId} onValueChange={(v) => setForm({ ...form, regionId: v || "" })}>
                <SelectTrigger><SelectValue placeholder="Global (all regions)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Global</SelectItem>
                  {regions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2">
              <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
              Active
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={!!statsTierId} onOpenChange={(v) => { if (!v) setStatsTierId(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tier Statistics</DialogTitle>
          </DialogHeader>
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Total Balance</p>
                <p className="text-2xl font-bold">₹{stats.totalBalance.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Total Redemptions</p>
                <p className="text-2xl font-bold">{stats.totalRedemptions}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Active Vouchers</p>
                <p className="text-2xl font-bold">{stats.activeVouchers}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <p className="text-sm text-gray-500">Users with Balance</p>
                <p className="text-2xl font-bold">{stats.uniqueUsers}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Translations Dialog */}
      <Dialog open={transDialogOpen} onOpenChange={(v) => { setTransDialogOpen(v); if (!v) { setEditingTier(null); setEditingTranslation(null); } }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Translations: {editingTier?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="border rounded-lg divide-y">
              {translations.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">No translations yet</p>
              )}
              {translations.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <span className="text-sm font-medium">{getLocaleName(t.locale)}</span>
                    <span className="text-xs text-gray-400 ml-2">{t.name}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setEditingTranslation(t); setTransForm({ locale: t.locale, name: t.name, description: t.description || "" }); }}>
                      <Languages className="w-3 h-3 mr-1" /> Edit
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteTranslation(t.id)}>Del</Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <Label>Locale</Label>
                  <Select
                    value={editingTranslation ? editingTranslation.locale : transForm.locale}
                    onValueChange={(v) => {
                      if (editingTranslation) return;
                      const existing = translations.find((t: any) => t.locale === v);
                      if (existing) {
                        setEditingTranslation(existing);
                        setTransForm({ locale: existing.locale, name: existing.name, description: existing.description || "" });
                      } else {
                        setTransForm({ ...transForm, locale: v });
                      }
                    }}
                  >
                    <SelectTrigger><SelectValue placeholder="Select locale" /></SelectTrigger>
                    <SelectContent>
                      {LOCALES.map((loc) => (
                        <option key={loc.code} value={loc.code} disabled={!editingTranslation && translations.some((t: any) => t.locale === loc.code)}>
                          {loc.nativeName} {!editingTranslation && translations.some((t: any) => t.locale === loc.code) ? "(exists)" : ""}
                        </option>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="mb-3">
                <Label>Name</Label>
                <Input
                  value={editingTranslation ? editingTranslation.name : transForm.name}
                  onChange={(e) => {
                    if (editingTranslation) {
                      setEditingTranslation({ ...editingTranslation, name: e.target.value });
                    } else {
                      setTransForm({ ...transForm, name: e.target.value });
                    }
                  }}
                />
              </div>
              <div className="mb-3">
                <Label>Description</Label>
                <Input
                  value={editingTranslation ? (editingTranslation.description || "") : transForm.description}
                  onChange={(e) => {
                    if (editingTranslation) {
                      setEditingTranslation({ ...editingTranslation, description: e.target.value });
                    } else {
                      setTransForm({ ...transForm, description: e.target.value });
                    }
                  }}
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={async () => {
                  if (!editingTranslation) { toast.error("Select a translation to edit"); return; }
                  const payload: any = { name: editingTranslation.name, description: editingTranslation.description || undefined };
                  await updateVoucherTierTranslation(editingTranslation.id, payload);
                  toast.success("Translation updated");
                  const data = await getVoucherTierTranslations(editingTier.id);
                  setTranslations(data);
                  setEditingTranslation(null);
                  setTransForm({ locale: "", name: "", description: "" });
                }}>
                  {editingTranslation ? "Update" : "Create"}
                </Button>
                {editingTranslation && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingTranslation(null); setTransForm({ locale: "", name: "", description: "" }); }}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransDialogOpen(false); setEditingTier(null); setEditingTranslation(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function populateEditForm(tier: any) {
    setForm({
      slug: tier.slug,
      name: tier.name,
      icon: tier.icon,
      description: tier.description || "",
      color: tier.color,
      balanceMode: tier.balanceMode,
      minPurchasePrice: tier.minPurchasePrice?.toString() || "",
      maxRedemptionPerOrder: tier.maxRedemptionPerOrder?.toString() || "100",
      sortOrder: tier.sortOrder.toString(),
      isActive: tier.isActive,
      regionId: tier.regionId || "",
    });
    setEditId(tier.id);
  }
}
