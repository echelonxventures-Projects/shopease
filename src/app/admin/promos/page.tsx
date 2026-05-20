"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getPromos, createPromo, updatePromo, deletePromo,
  publishPromo, pausePromo, togglePromoActive,
} from "@/server/actions/promo-actions";
import {
  getAllRegions,
  createPromoTranslation,
  getPromoTranslations,
  updatePromoTranslation,
  deletePromoTranslation,
} from "@/server/actions/localization-actions";
import { Badge } from "@/components/ui/badge";
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
import { toast } from "sonner";
import { Languages } from "lucide-react";
import { LOCALES, getLocaleName } from "@/lib/i18n";

const PROMO_TYPES = [
  { value: "COUPON", label: "Coupon Code" },
  { value: "BANK_OFFER", label: "Bank Offer" },
  { value: "BRAND_OFFER", label: "Brand Offer" },
  { value: "CATEGORY_OFFER", label: "Category Offer" },
  { value: "FLASH_SALE", label: "Flash Sale" },
  { value: "FESTIVE_OFFER", label: "Festive Offer" },
  { value: "BOGO", label: "Buy One Get One" },
  { value: "COMBO", label: "Combo / Bundle" },
  { value: "TIME_BASED", label: "Time-Based" },
  { value: "MINIMUM_SPEND", label: "Minimum Spend" },
  { value: "SEASONAL", label: "Seasonal" },
  { value: "NEW_USER", label: "New User Offer" },
];

const PROMO_STATUSES = [
  { value: "DRAFT", label: "Draft", color: "bg-gray-100 text-gray-700" },
  { value: "SCHEDULED", label: "Scheduled", color: "bg-blue-100 text-blue-700" },
  { value: "ACTIVE", label: "Active", color: "bg-green-100 text-green-700" },
  { value: "PAUSED", label: "Paused", color: "bg-yellow-100 text-yellow-700" },
  { value: "EXPIRED", label: "Expired", color: "bg-red-100 text-red-700" },
  { value: "COMPLETED", label: "Completed", color: "bg-purple-100 text-purple-700" },
];

export default function PromosPage() {
  const router = useRouter();
  const [promos, setPromos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [filter, setFilter] = useState("");

  const [form, setForm] = useState({
    code: "",
    type: "COUPON",
    title: "",
    description: "",
    status: "DRAFT",
    discountType: "PERCENTAGE",
    discountValue: "",
    maxDiscount: "",
    minOrderValue: "",
    minQuantity: "",
    maxUses: "",
    perUserLimit: "",
    validFrom: "",
    validUntil: "",
    stackingGroup: "",
    priority: "0",
    isActive: true,
    regionId: "",
    // Rules
    banks: "",
    bankDiscountType: "PERCENTAGE",
    bankDiscountValue: "",
    bankDiscountMax: "",
    bogoBuy: "1",
    bogoGet: "1",
    bogoMaxPrice: "",
    comboBundlePrice: "",
    timeWindows: "" as string,
  });

  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [filterRegion, setFilterRegion] = useState("");
  const [regions, setRegions] = useState<any[]>([]);

  // Translations
  const [translations, setTranslations] = useState<any[]>([]);
  const [transDialogOpen, setTransDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [editingTranslation, setEditingTranslation] = useState<any>(null);
  const [transForm, setTransForm] = useState({ locale: "", title: "", description: "" });

  const fetch = () => {
    const filters: any = {};
    if (filterType) filters.type = filterType;
    if (filterStatus) filters.status = filterStatus;
    if (filterRegion) filters.regionId = filterRegion;
    getPromos(filters)
      .then(setPromos)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    getAllRegions().then(setRegions).catch(() => {});
  }, []);

  useEffect(() => { fetch(); }, [filterType, filterStatus, filterRegion]);

  const resetForm = () => {
    setForm({
      code: "", type: "COUPON", title: "", description: "",
      status: "DRAFT", discountType: "PERCENTAGE", discountValue: "",
      maxDiscount: "", minOrderValue: "", minQuantity: "",
      maxUses: "", perUserLimit: "", validFrom: "", validUntil: "",
      stackingGroup: "", priority: "0", isActive: true, regionId: "",
      banks: "", bankDiscountType: "PERCENTAGE", bankDiscountValue: "",
      bankDiscountMax: "", bogoBuy: "1", bogoGet: "1", bogoMaxPrice: "",
      comboBundlePrice: "", timeWindows: "",
    });
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { toast.error("Title is required"); return; }
    if (form.type === "COUPON" && !form.code.trim()) { toast.error("Code is required for coupons"); return; }
    if (!form.discountValue) { toast.error("Discount value is required"); return; }

    try {
      const rules: any = {};

      // Build rules based on type
      if (form.type === "BANK_OFFER" && form.banks) {
        rules.banks = form.banks.split(",").map((b) => b.trim());
        rules.bankDiscount = {};
        if (form.bankDiscountValue) {
          const bankName = rules.banks[0];
          rules.bankDiscount[bankName] = {
            type: form.bankDiscountType,
            value: parseFloat(form.bankDiscountValue),
            max: form.bankDiscountMax ? parseFloat(form.bankDiscountMax) : undefined,
          };
        }
      }

      if (form.type === "BOGO") {
        rules.bogo = {
          buy: parseInt(form.bogoBuy) || 1,
          get: parseInt(form.bogoGet) || 1,
          freeItemMaxPrice: form.bogoMaxPrice ? parseFloat(form.bogoMaxPrice) : undefined,
        };
      }

      if (form.type === "COMBO") {
        const productIds = (form as any).comboProductIds || form.minQuantity;
        rules.combo = {
          bundlePrice: form.comboBundlePrice ? parseFloat(form.comboBundlePrice) : 0,
          items: productIds ? productIds.split(",").map((id: string) => ({ productId: id.trim(), requiredQty: 1 })) : [],
        };
      }

      if (form.type === "TIME_BASED" && form.timeWindows) {
        try {
          rules.timeWindows = JSON.parse(form.timeWindows);
        } catch {
          toast.error("Invalid time windows JSON");
          return;
        }
      }

      const data: any = {
        ...(form.type === "COUPON" ? { code: form.code.toUpperCase().trim() } : {}),
        type: form.type,
        title: form.title,
        description: form.description || undefined,
        status: form.status,
        discountType: form.discountType,
        discountValue: parseFloat(form.discountValue),
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : undefined,
        minOrderValue: form.minOrderValue ? parseFloat(form.minOrderValue) : undefined,
        minQuantity: form.minQuantity ? parseInt(form.minQuantity) : undefined,
        maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
        perUserLimit: form.perUserLimit ? parseInt(form.perUserLimit) : undefined,
        validFrom: form.validFrom ? new Date(form.validFrom) : new Date(),
        validUntil: form.validUntil ? new Date(form.validUntil) : undefined,
        stackingGroup: form.stackingGroup || undefined,
        priority: parseInt(form.priority) || 0,
        isActive: form.isActive,
        regionId: form.regionId || null,
        rules: Object.keys(rules).length > 0 ? rules : undefined,
      };

      if (editId) {
        await updatePromo(editId, data);
        toast.success("Promo updated");
      } else {
        await createPromo(data);
        toast.success("Promo created");
      }
      setOpen(false);
      resetForm();
      fetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getTypeLabel = (type: string) => PROMO_TYPES.find((t) => t.value === type)?.label || type;
  const getStatusBadge = (status: string) =>
    PROMO_STATUSES.find((s) => s.value === status) || { label: status, color: "bg-gray-100 text-gray-700" };

  const openTranslations = async (promo: any) => {
    setEditingPromo(promo);
    setEditingTranslation(null);
    try {
      const data = await getPromoTranslations(promo.id);
      setTranslations(data);
    } catch { setTranslations([]); }
    setTransDialogOpen(true);
  };

  const handleSaveTranslation = async () => {
    if (!transForm.title.trim()) { toast.error("Title is required"); return; }
    if (!transForm.locale) { toast.error("Select a locale"); return; }
    try {
      const payload: any = { title: transForm.title, description: transForm.description || undefined };
      if (editingTranslation) {
        await updatePromoTranslation(editingTranslation.id, payload);
        toast.success("Translation updated");
      } else {
        await createPromoTranslation(editingPromo.id, transForm.locale, payload);
        toast.success("Translation created");
      }
      const data = await getPromoTranslations(editingPromo.id);
      setTranslations(data);
      setTransForm({ locale: "", title: "", description: "" });
      setEditingTranslation(null);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDeleteTranslation = async (id: string) => {
    try {
      await deletePromoTranslation(id);
      toast.success("Translation deleted");
      const data = await getPromoTranslations(editingPromo.id);
      setTranslations(data);
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Promotions & Offers</h1>
        <Button onClick={() => { resetForm(); setOpen(true); }}>Create Promo</Button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <Select value={filterRegion} onValueChange={(v) => setFilterRegion(v || "")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Regions" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Regions</SelectItem>
            {regions.map((r) => (
              <SelectItem key={r.id} value={r.id}>{r.code} — {r.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterType} onValueChange={(v) => setFilterType(v || "")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Types" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Types</SelectItem>
            {PROMO_TYPES.map((t) => (
              <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v || "")}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            {PROMO_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Title</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Discount</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Code</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Region</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Usage</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Dates</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {promos.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No promos found</td></tr>
            ) : (
              promos.map((p: any) => (
                <tr key={p.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-sm">{getTypeLabel(p.type)}</td>
                  <td className="px-4 py-3 text-sm">
                    {p.discountType === "PERCENTAGE" ? `${Number(p.discountValue)}%` : `₹${Number(p.discountValue)}`}
                    {p.maxDiscount && <span className="text-xs text-gray-400 ml-1">(max ₹{p.maxDiscount})</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm">{p.code || "—"}</td>
                  <td className="px-4 py-3 text-sm">
                    {p.region ? <Badge variant="outline">{p.region.code}</Badge> : <span className="text-gray-400">Global</span>}
                  </td>
                  <td className="px-4 py-3 text-sm">{p.usedCount}{p.maxUses ? `/${p.maxUses}` : ""}</td>
                  <td className="px-4 py-3">
                    <Badge className={getStatusBadge(p.status).color}>{p.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {new Date(p.validFrom).toLocaleDateString()}
                    {p.validUntil && ` — ${new Date(p.validUntil).toLocaleDateString()}`}
                  </td>
                  <td className="px-4 py-3 flex gap-1 flex-wrap">
                    <Button size="sm" variant="outline" onClick={() => { populateEditForm(p); setOpen(true); }}>Edit</Button>
                    <Button size="sm" variant="outline" onClick={() => openTranslations(p)}>
                      <Languages className="w-3 h-3 mr-1" /> Lang
                    </Button>
                    {p.status === "DRAFT" && (
                      <Button size="sm" onClick={async () => { await publishPromo(p.id); toast.success("Published"); fetch(); }}>Publish</Button>
                    )}
                    {p.status === "ACTIVE" && (
                      <Button size="sm" variant="outline" onClick={async () => { await pausePromo(p.id); toast.success("Paused"); fetch(); }}>Pause</Button>
                    )}
                    <Button size="sm" variant="destructive" onClick={async () => {
                      if (confirm("Delete promo?")) { await deletePromo(p.id); toast.success("Deleted"); fetch(); }
                    }}>Del</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Promo" : "Create Promo"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PROMO_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {form.type === "COUPON" && (
              <div>
                <Label>Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="SAVE20" />
              </div>
            )}

            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Summer Sale 2026" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Discount Type</Label>
                <Select value={form.discountType} onValueChange={(v) => v && setForm({ ...form, discountType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                    <SelectItem value="FLAT">Flat (₹)</SelectItem>
                    <SelectItem value="FREE_ITEM">Free Item</SelectItem>
                    <SelectItem value="BUY_X_GET_Y">Buy X Get Y</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Discount Value</Label>
                <Input type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Max Discount (₹)</Label><Input value={form.maxDiscount} onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })} placeholder="Max cap" /></div>
              <div><Label>Min Order Value (₹)</Label><Input value={form.minOrderValue} onChange={(e) => setForm({ ...form, minOrderValue: e.target.value })} /></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div><Label>Min Quantity</Label><Input value={form.minQuantity} onChange={(e) => setForm({ ...form, minQuantity: e.target.value })} /></div>
              <div><Label>Max Uses</Label><Input value={form.maxUses} onChange={(e) => setForm({ ...form, maxUses: e.target.value })} /></div>
              <div><Label>Per User Limit</Label><Input value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} /></div>
            </div>

            {/* Type-specific fields */}
            {form.type === "BANK_OFFER" && (
              <div className="p-4 bg-blue-50 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Bank Offer Configuration</h4>
                <div><Label>Banks (comma-separated)</Label><Input value={form.banks} onChange={(e) => setForm({ ...form, banks: e.target.value })} placeholder="SBI, HDFC, ICICI" /></div>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label>Bank Discount Type</Label>
                    <Select value={form.bankDiscountType} onValueChange={(v) => v && setForm({ ...form, bankDiscountType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                        <SelectItem value="FLAT">Flat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div><Label>Value</Label><Input type="number" value={form.bankDiscountValue} onChange={(e) => setForm({ ...form, bankDiscountValue: e.target.value })} /></div>
                  <div><Label>Max Cap (₹)</Label><Input value={form.bankDiscountMax} onChange={(e) => setForm({ ...form, bankDiscountMax: e.target.value })} /></div>
                </div>
              </div>
            )}

            {form.type === "BOGO" && (
              <div className="p-4 bg-green-50 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">BOGO Configuration</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div><Label>Buy Qty</Label><Input type="number" value={form.bogoBuy} onChange={(e) => setForm({ ...form, bogoBuy: e.target.value })} /></div>
                  <div><Label>Get Qty</Label><Input type="number" value={form.bogoGet} onChange={(e) => setForm({ ...form, bogoGet: e.target.value })} /></div>
                  <div><Label>Max Free Price (₹)</Label><Input value={form.bogoMaxPrice} onChange={(e) => setForm({ ...form, bogoMaxPrice: e.target.value })} /></div>
                </div>
              </div>
            )}

            {form.type === "COMBO" && (
              <div className="p-4 bg-purple-50 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Combo Configuration</h4>
                <div><Label>Product IDs (comma-separated)</Label><Input onChange={(e) => (form as any).comboProductIds = e.target.value} placeholder="id1, id2, ..." /></div>
                <div><Label>Bundle Price (₹)</Label><Input type="number" value={form.comboBundlePrice} onChange={(e) => setForm({ ...form, comboBundlePrice: e.target.value })} /></div>
              </div>
            )}

            {form.type === "TIME_BASED" && (
              <div className="p-4 bg-orange-50 rounded-lg space-y-3">
                <h4 className="font-semibold text-sm">Time Windows</h4>
                <Label>JSON format</Label>
                <Textarea value={form.timeWindows} onChange={(e) => setForm({ ...form, timeWindows: e.target.value })} placeholder='[{"startHour":0,"endHour":6,"discountType":"PERCENTAGE","discountValue":20}]' />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Valid From</Label>
                <Input type="datetime-local" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div>
                <Label>Valid Until</Label>
                <Input type="datetime-local" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><Label>Stacking Group</Label><Input value={form.stackingGroup} onChange={(e) => setForm({ ...form, stackingGroup: e.target.value })} placeholder="Leave empty for standalone" /></div>
              <div><Label>Priority</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Translations Dialog */}
      <Dialog open={transDialogOpen} onOpenChange={(v) => { setTransDialogOpen(v); if (!v) { setEditingPromo(null); setEditingTranslation(null); } }}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Translations: {editingPromo?.title}</DialogTitle>
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
                    <span className="text-xs text-gray-400 ml-2">{t.title}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => { setEditingTranslation(t); setTransForm({ locale: t.locale, title: t.title, description: t.description || "" }); }}>
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
                        setTransForm({ locale: existing.locale, title: existing.title, description: existing.description || "" });
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
                <Label>Title</Label>
                <Input
                  value={editingTranslation ? editingTranslation.title : transForm.title}
                  onChange={(e) => {
                    if (editingTranslation) {
                      setEditingTranslation({ ...editingTranslation, title: e.target.value });
                    } else {
                      setTransForm({ ...transForm, title: e.target.value });
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
                  const payload: any = { title: editingTranslation.title, description: editingTranslation.description || undefined };
                  await updatePromoTranslation(editingTranslation.id, payload);
                  toast.success("Translation updated");
                  const data = await getPromoTranslations(editingPromo.id);
                  setTranslations(data);
                  setEditingTranslation(null);
                  setTransForm({ locale: "", title: "", description: "" });
                }}>
                  {editingTranslation ? "Update" : "Create"}
                </Button>
                {editingTranslation && (
                  <Button size="sm" variant="outline" onClick={() => { setEditingTranslation(null); setTransForm({ locale: "", title: "", description: "" }); }}>
                    Cancel Edit
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setTransDialogOpen(false); setEditingPromo(null); setEditingTranslation(null); }}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  function populateEditForm(p: any) {
    const rules = p.rules || {};
    setForm({
      code: p.code || "",
      type: p.type,
      title: p.title,
      description: p.description || "",
      status: p.status,
      discountType: p.discountType,
      discountValue: Number(p.discountValue).toString(),
      maxDiscount: p.maxDiscount ? Number(p.maxDiscount).toString() : "",
      minOrderValue: p.minOrderValue ? Number(p.minOrderValue).toString() : "",
      minQuantity: p.minQuantity?.toString() || "",
      maxUses: p.maxUses?.toString() || "",
      perUserLimit: p.perUserLimit?.toString() || "",
      validFrom: p.validFrom ? new Date(p.validFrom).toISOString().slice(0, 16) : "",
      validUntil: p.validUntil ? new Date(p.validUntil).toISOString().slice(0, 16) : "",
      stackingGroup: p.stackingGroup || "",
      priority: p.priority?.toString() || "0",
      isActive: p.isActive,
      regionId: p.regionId || "",
      banks: rules.banks?.join(", ") || "",
      bankDiscountType: rules.bankDiscount ? Object.values(rules.bankDiscount as any[])[0]?.type || "PERCENTAGE" : "PERCENTAGE",
      bankDiscountValue: rules.bankDiscount ? Object.values(rules.bankDiscount as any[])[0]?.value?.toString() || "" : "",
      bankDiscountMax: rules.bankDiscount ? Object.values(rules.bankDiscount as any[])[0]?.max?.toString() || "" : "",
      bogoBuy: rules.bogo?.buy?.toString() || "1",
      bogoGet: rules.bogo?.get?.toString() || "1",
      bogoMaxPrice: rules.bogo?.freeItemMaxPrice?.toString() || "",
      comboBundlePrice: rules.combo?.bundlePrice?.toString() || "",
      timeWindows: rules.timeWindows ? JSON.stringify(rules.timeWindows) : "",
    });
    setEditId(p.id);
  }
}
