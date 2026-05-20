"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllCountryProfiles } from "@/server/actions/location-actions";
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
import { MapPin } from "lucide-react";

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

export default function CountryProfilesPage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    isoCode: "",
    currency: "INR",
    currencySymbol: "₹",
    defaultLocale: "en",
    supportedLocales: ["en"] as string[],
    taxRate: "0.18",
    timezone: "Asia/Kolkata",
    dialCode: "",
    callingCode: "",
  });

  const fetch = async () => {
    try {
      const data = await getAllCountryProfiles();
      setProfiles(data);
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const resetForm = () => {
    setForm({ isoCode: "", currency: "INR", currencySymbol: "₹", defaultLocale: "en", supportedLocales: ["en"], taxRate: "0.18", timezone: "Asia/Kolkata", dialCode: "", callingCode: "" });
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.isoCode.trim()) {
      toast.error("ISO Code is required");
      return;
    }
    try {
      const { createOrUpdateCountryProfile } = await import("@/server/actions/location-actions");
      if (editId) {
        await createOrUpdateCountryProfile(editId, {
          isoCode: form.isoCode.toUpperCase(),
          currency: form.currency,
          currencySymbol: form.currencySymbol,
          defaultLocale: form.defaultLocale,
          supportedLocales: form.supportedLocales,
          taxRate: parseFloat(form.taxRate),
          timezone: form.timezone,
          dialCode: form.dialCode || null,
          callingCode: form.callingCode || null,
        });
        toast.success("Country profile updated");
      }
      setDialogOpen(false);
      resetForm();
      fetch();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const toggleLocale = (locale: string) => {
    setForm({
      ...form,
      supportedLocales: form.supportedLocales.includes(locale)
        ? form.supportedLocales.filter((l) => l !== locale)
        : [...form.supportedLocales, locale],
    });
  };

  const updateCurrency = (currency: string | null) => {
    if (!currency) return;
    const c = CURRENCIES.find((c) => c.value === currency);
    setForm({ ...form, currency, currencySymbol: c?.symbol || "$" });
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Country Profiles</h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage currency, tax, locale, and timezone settings per country
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/locations")}>
          <MapPin className="w-4 h-4 mr-1" /> Location Hierarchy
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {profiles.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{p.currencySymbol}</span>
                <div>
                  <h3 className="font-bold">{p.name}</h3>
                  <p className="text-xs text-gray-500">{p.isoCode}</p>
                </div>
              </div>
              <Badge className={p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                {p.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Currency</span>
                <span className="font-medium">{p.currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Default Locale</span>
                <span className="font-medium">{p.defaultLocale}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Supported Locales</span>
                <span className="font-medium">{(p.supportedLocales as string[]).join(", ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Tax Rate</span>
                <span className="font-medium">{((p.taxRate as number || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Timezone</span>
                <span className="font-medium text-xs">{p.timezone}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-3 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditId(p.id);
                  setForm({
                    isoCode: p.isoCode,
                    currency: p.currency,
                    currencySymbol: p.currencySymbol,
                    defaultLocale: p.defaultLocale,
                    supportedLocales: p.supportedLocales,
                    taxRate: p.taxRate?.toString() || "0.18",
                    timezone: p.timezone,
                    dialCode: p.dialCode || "",
                    callingCode: p.callingCode || "",
                  });
                  setDialogOpen(true);
                }}
              >
                Edit
              </Button>
            </div>
          </div>
        ))}
      </div>

      {profiles.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          <p>No country profiles configured. Run the seed data or create profiles manually.</p>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Country Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ISO Code</Label>
              <Input value={form.isoCode} onChange={(e) => setForm({ ...form, isoCode: e.target.value.toUpperCase() })} placeholder="IN" />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={form.currency} onValueChange={updateCurrency}>
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
              <Select value={form.defaultLocale} onValueChange={(v) => setForm({ ...form, defaultLocale: v || "en" })}>
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
              <Input type="number" step="0.01" value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} placeholder="18" />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select value={form.timezone} onValueChange={(v) => setForm({ ...form, timezone: v || "Asia/Kolkata" })}>
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
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
