"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllRegions,
  createRegion,
  updateRegion,
  toggleRegionActive,
} from "@/server/actions/localization-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const LOCALES = [
  { value: "en", label: "English" },
  { value: "hi", label: "Hindi" },
  { value: "de", label: "German" },
  { value: "fr", label: "French" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
  { value: "es", label: "Spanish" },
];

const CURRENCIES = [
  { value: "INR", symbol: "₹", label: "Indian Rupee" },
  { value: "USD", symbol: "$", label: "US Dollar" },
  { value: "EUR", symbol: "€", label: "Euro" },
  { value: "GBP", symbol: "£", label: "British Pound" },
  { value: "JPY", symbol: "¥", label: "Japanese Yen" },
  { value: "AUD", symbol: "A$", label: "Australian Dollar" },
  { value: "AED", symbol: "د.إ", label: "UAE Dirham" },
  { value: "CAD", symbol: "C$", label: "Canadian Dollar" },
  { value: "CHF", symbol: "Fr", label: "Swiss Franc" },
  { value: "CNY", symbol: "¥", label: "Chinese Yuan" },
];

const TIMEZONES = [
  "Asia/Kolkata",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Berlin",
  "Europe/Paris",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "UTC",
];

export default function RegionsPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    name: "",
    currency: "INR",
    currencySymbol: "₹",
    defaultLocale: "en",
    supportedLocales: ["en"],
    taxRate: "0.18",
    timezone: "Asia/Kolkata",
    isActive: true,
  });

  const fetch = () => {
    getAllRegions()
      .then(setRegions)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => {
    setForm({
      code: "", name: "", currency: "INR", currencySymbol: "₹",
      defaultLocale: "en", supportedLocales: ["en"],
      taxRate: "0.18", timezone: "Asia/Kolkata", isActive: true,
    });
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.code.trim() || !form.name.trim()) {
      toast.error("Code and name are required");
      return;
    }

    try {
      if (editId) {
        await updateRegion(editId, {
          code: form.code.toUpperCase().trim(),
          name: form.name,
          currency: form.currency,
          currencySymbol: form.currencySymbol,
          defaultLocale: form.defaultLocale,
          supportedLocales: form.supportedLocales,
          taxRate: parseFloat(form.taxRate),
          timezone: form.timezone,
          isActive: form.isActive,
        });
        toast.success("Region updated");
      } else {
        await createRegion({
          code: form.code.toUpperCase().trim(),
          name: form.name,
          currency: form.currency,
          currencySymbol: form.currencySymbol,
          defaultLocale: form.defaultLocale,
          supportedLocales: form.supportedLocales,
          taxRate: parseFloat(form.taxRate),
          timezone: form.timezone,
          isActive: form.isActive,
        });
        toast.success("Region created");
      }
      setOpen(false);
      resetForm();
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const toggleLocale = (locale: string) => {
    setForm({
      ...form,
      supportedLocales: form.supportedLocales.includes(locale)
        ? form.supportedLocales.filter((l) => l !== locale)
        : [...form.supportedLocales, locale],
    });
  };

  const updateCurrency = (currency: string | null, _?: any) => {
    if (!currency) return;
    const c = CURRENCIES.find((c) => c.value === currency);
    setForm({ ...form, currency, currencySymbol: c?.symbol || "$" });
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Regions & Currency</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage geographic regions, currencies, locales, and timezone settings
          </p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }}>Create Region</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {regions.map((region) => (
          <div key={region.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{region.currencySymbol}</span>
                <div>
                  <h3 className="font-bold">{region.name}</h3>
                  <p className="text-xs text-gray-500">{region.code}</p>
                </div>
              </div>
              <Badge className={region.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                {region.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Currency</span>
                <span className="font-medium">{region.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Default Locale</span>
                <span className="font-medium">{region.defaultLocale}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Supported Locales</span>
                <span className="font-medium">{region.supportedLocales.join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax Rate</span>
                <span className="font-medium">{((region.taxRate || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timezone</span>
                <span className="font-medium text-xs">{region.timezone}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => { populateEditForm(region); setOpen(true); }}
              >
                Edit
              </Button>
              <Button
                size="sm"
                variant={region.isActive ? "outline" : "default"}
                onClick={async () => {
                  try {
                    await toggleRegionActive(region.id, !region.isActive);
                    toast.success(region.isActive ? "Region disabled" : "Region enabled");
                    fetch();
                  } catch (e) { toast.error(e instanceof Error ? e.message : "Operation failed"); }
                }}
              >
                {region.isActive ? "Disable" : "Enable"}
              </Button>
            </div>
          </div>
        ))}
      </div>

      {regions.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">No regions configured</div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Region" : "Create Region"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country Code</Label>
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="IN" />
              </div>
              <div>
                <Label>Region Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="India" />
              </div>
            </div>

            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={(v) => updateCurrency(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.symbol} {c.label} ({c.value})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Currency Symbol</Label>
              <Input value={form.currencySymbol} onChange={(e) => setForm({ ...form, currencySymbol: e.target.value })} placeholder="₹" />
            </div>

            <div>
              <Label>Default Locale</Label>
              <Select value={form.defaultLocale} onValueChange={(v) => v && setForm({ ...form, defaultLocale: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Supported Locales</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {LOCALES.map((l) => (
                  <button
                    key={l.value}
                    onClick={() => toggleLocale(l.value)}
                    className={`px-3 py-1 rounded-full text-sm border transition ${
                      form.supportedLocales.includes(l.value)
                        ? "bg-blue-500 text-white border-blue-500"
                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label>Tax Rate (%)</Label>
              <Input
                type="number"
                step="0.01"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                placeholder="18"
              />
              <p className="text-xs text-gray-400 mt-1">
                Enter as decimal (0.18 = 18%)
              </p>
            </div>

            <div>
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => v && setForm({ ...form, timezone: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  function populateEditForm(region: any) {
    setForm({
      code: region.code,
      name: region.name,
      currency: region.currency,
      currencySymbol: region.currencySymbol,
      defaultLocale: region.defaultLocale,
      supportedLocales: region.supportedLocales || ["en"],
      taxRate: region.taxRate ? Number(region.taxRate).toString() : "0.18",
      timezone: region.timezone || "Asia/Kolkata",
      isActive: region.isActive,
    });
    setEditId(region.id);
  }
}
