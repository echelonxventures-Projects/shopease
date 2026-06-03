"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getCountryTree,
  createLocation,
  updateLocation,
  deleteLocation,
  toggleLocationActive,
  createOrUpdateCountryProfile,
  getCountryProfile,
  getLocationChain,
} from "@/server/actions/location-actions";

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
import { MapPin, Settings, Globe, Map, Building2, Landmark, Home } from "lucide-react";
import { LocationTree } from "@/components/admin/LocationTree";

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

const LOCATION_TYPES = [
  { value: "PLANET", label: "Planet", icon: Globe },
  { value: "REGION", label: "Region", icon: Map },
  { value: "COUNTRY", label: "Country", icon: Globe },
  { value: "STATE", label: "State", icon: Building2 },
  { value: "DISTRICT", label: "District", icon: Landmark },
  { value: "VILLAGE", label: "Village", icon: Home },
];

type LocationNode = {
  id: string;
  name: string;
  code: string | null;
  type: string;
  parentId: string | null;
  isActive: boolean;
  children: LocationNode[];
};

export default function LocationsPage() {
  const router = useRouter();
  const [tree, setTree] = useState<LocationNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [selectedLocation, _setSelectedLocation] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [countryProfile, setCountryProfile] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [chain, setChain] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [countryDialogOpen, setCountryDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("");
  const [search, setSearch] = useState("");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [parentLocations, setParentLocations] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    code: "",
    type: "COUNTRY",
    parentId: "",
    isActive: true,
    isVerified: false,
    latitude: "",
    longitude: "",
  });

  const [countryForm, setCountryForm] = useState({
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
      const data = await getCountryTree();
      setTree(data);
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, []);

  const fetchParents = async () => {
    try {
      const all = await getCountryTree();
      const flatten = (nodes: LocationNode[]): any[] =>
        nodes.flatMap((n) => [{ id: n.id, name: n.name, type: n.type }, ...flatten(n.children)]);
      setParentLocations(flatten(all).filter((l) => l.type !== "VILLAGE"));
    } catch {}
  };

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    try {
      const locChain = await getLocationChain(id);
      setChain(locChain);
    } catch {}
  };

  const resetForm = () => {
    setForm({ name: "", code: "", type: "COUNTRY", parentId: "", isActive: true, isVerified: false, latitude: "", longitude: "" });
    setCountryForm({ isoCode: "", currency: "INR", currencySymbol: "₹", defaultLocale: "en", supportedLocales: ["en"], taxRate: "0.18", timezone: "Asia/Kolkata", dialCode: "", callingCode: "" });
  };

  const handleSubmitLocation = async () => {
    if (!form.name.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      await createLocation({
        name: form.name,
        code: form.code || null,
        type: form.type,
        parentId: form.parentId || null,
        isActive: form.isActive,
        isVerified: form.isVerified,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      toast.success("Location created");
      setDialogOpen(false);
      resetForm();
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      await toggleLocationActive(id, !isActive);
      toast.success(isActive ? "Location disabled" : "Location enabled");
      fetch();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Operation failed"); }
  };

  const handleSubmitCountryProfile = async () => {
    if (!countryForm.isoCode.trim()) {
      toast.error("ISO Code is required");
      return;
    }
    try {
      const profile = await createOrUpdateCountryProfile(selectedId!, {
        isoCode: countryForm.isoCode.toUpperCase(),
        currency: countryForm.currency,
        currencySymbol: countryForm.currencySymbol,
        defaultLocale: countryForm.defaultLocale,
        supportedLocales: countryForm.supportedLocales,
        taxRate: parseFloat(countryForm.taxRate),
        timezone: countryForm.timezone,
        dialCode: countryForm.dialCode || null,
        callingCode: countryForm.callingCode || null,
      });
      setCountryProfile(profile);
      toast.success("Country profile saved");
      setCountryDialogOpen(false);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const toggleLocale = (locale: string) => {
    setCountryForm({
      ...countryForm,
      supportedLocales: countryForm.supportedLocales.includes(locale)
        ? countryForm.supportedLocales.filter((l) => l !== locale)
        : [...countryForm.supportedLocales, locale],
    });
  };

  const updateCurrency = (currency: string | null) => {
    if (!currency) return;
    const c = CURRENCIES.find((c) => c.value === currency);
    setCountryForm({ ...countryForm, currency, currencySymbol: c?.symbol || "$" });
  };

  // Filter tree by type
  const filterTreeNodes = (nodes: LocationNode[]): LocationNode[] => {
    if (!filterType) return nodes;
    return nodes
      .map((node) => {
        const matchesType = node.type === filterType;
        const filteredChildren = filterTreeNodes(node.children);
        return matchesType || filteredChildren.length > 0
          ? { ...node, children: filteredChildren }
          : null;
      })
      .filter(Boolean) as LocationNode[];
  };

  const filteredTree = filterTreeNodes(tree);

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Location Hierarchy</h1>
          <p className="text-gray-500 text-sm mt-1">
            Planet → Region → Country → State → District → Village
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => router.push("/admin/locations/country-profiles")}>
            <Settings className="w-4 h-4 mr-1" /> Country Profiles
          </Button>
          <Button onClick={() => { resetForm(); fetchParents(); setDialogOpen(true); }}>
            <MapPin className="w-4 h-4 mr-1" /> Add Location
          </Button>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Left: Tree */}
        <div className="w-80 bg-white rounded-lg shadow p-4">
          <div className="mb-3 space-y-2">
            <Input
              placeholder="Search locations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="text-sm"
            />
            <Select value={filterType} onValueChange={(v) => setFilterType(v || "")}>
              <SelectTrigger className="text-sm"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                {LOCATION_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <LocationTree nodes={filteredTree} selectedId={selectedId} onSelect={handleSelect} />
        </div>

        {/* Right: Detail */}
        <div className="flex-1 bg-white rounded-lg shadow p-6">
          {selectedId ? (
            <div className="space-y-6">
              {/* Breadcrumb */}
              {chain.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-500 flex-wrap">
                  {chain.map((c, i) => (
                    <span key={c.id} className="flex items-center gap-2">
                      {i > 0 && <span className="text-gray-300">→</span>}
                      <Badge variant="outline">{c.name}</Badge>
                    </span>
                  ))}
                </div>
              )}

              {/* Location info */}
              <div>
                <h2 className="text-xl font-bold">{selectedLocation?.name || "Select a location"}</h2>
                <div className="flex gap-2 mt-2">
                  <Badge>{chain[chain.length - 1]?.type || selectedId}</Badge>
                  <Badge variant="outline">{chain[chain.length - 1]?.code || "No code"}</Badge>
                </div>
              </div>

              {/* Country profile card */}
              {chain.some((c) => c.type === "COUNTRY") && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Country Profile</h3>
                    <Button size="sm" variant="outline" onClick={async () => {
                      try {
                        await fetchParents();
                        const profile = await getCountryProfile(selectedId);
                        setCountryProfile(profile);
                        if (profile) {
                          setCountryForm({
                            isoCode: profile.isoCode,
                            currency: profile.currency,
                            currencySymbol: profile.currencySymbol,
                            defaultLocale: profile.defaultLocale,
                            supportedLocales: profile.supportedLocales,
                            taxRate: profile.taxRate?.toString() || "0.18",
                            timezone: profile.timezone,
                            dialCode: profile.dialCode || "",
                            callingCode: profile.callingCode || "",
                          });
                        }
                        setCountryDialogOpen(true);
                      } catch {}
                    }}>
                      {countryProfile ? "Edit" : "Create"}
                    </Button>
                  </div>
                  {countryProfile ? (
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">ISO Code</span>
                        <p className="font-medium">{countryProfile.isoCode}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Currency</span>
                        <p className="font-medium">{countryProfile.currencySymbol} {countryProfile.currency}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Tax Rate</span>
                        <p className="font-medium">{((countryProfile.taxRate || 0) * 100).toFixed(1)}%</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Timezone</span>
                        <p className="font-medium text-xs">{countryProfile.timezone}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Default Locale</span>
                        <p className="font-medium">{countryProfile.defaultLocale}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No country profile configured</p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => {
                  const last = chain[chain.length - 1];
                  if (last) handleToggleActive(last.id, last.isActive !== false);
                }}>
                  Toggle Active
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Select a location from the tree to view details</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Location Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(v) => { setDialogOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Location name" />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g., IN, MH, IN-MH-01" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(v) => { if (v) setForm({ ...form, type: v || "COUNTRY" }); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Parent (optional)</Label>
              <Select value={form.parentId} onValueChange={(v) => { if (v) setForm({ ...form, parentId: v || "" }); }}>
                <SelectTrigger><SelectValue placeholder="None (root level)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">None (root level)</SelectItem>
                  {parentLocations.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} placeholder="18.52" />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} placeholder="73.86" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitLocation}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Country Profile Dialog */}
      <Dialog open={countryDialogOpen} onOpenChange={setCountryDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Country Profile</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>ISO Code</Label>
              <Input value={countryForm.isoCode} onChange={(e) => setCountryForm({ ...countryForm, isoCode: e.target.value.toUpperCase() })} placeholder="IN" />
            </div>
            <div>
              <Label>Currency</Label>
              <Select value={countryForm.currency} onValueChange={updateCurrency}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.symbol} {c.label} ({c.value})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Currency Symbol</Label>
              <Input value={countryForm.currencySymbol} onChange={(e) => setCountryForm({ ...countryForm, currencySymbol: e.target.value })} placeholder="₹" />
            </div>
            <div>
              <Label>Default Locale</Label>
              <Select value={countryForm.defaultLocale} onValueChange={(v) => setCountryForm({ ...countryForm, defaultLocale: v || "en" })}>
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
                      countryForm.supportedLocales.includes(l.value)
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
                value={countryForm.taxRate}
                onChange={(e) => setCountryForm({ ...countryForm, taxRate: e.target.value })}
                placeholder="18"
              />
            </div>
            <div>
              <Label>Timezone</Label>
              <Select value={countryForm.timezone} onValueChange={(v) => setCountryForm({ ...countryForm, timezone: v || "Asia/Kolkata" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIMEZONES.map((tz) => (
                    <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Dial Code</Label>
                <Input value={countryForm.dialCode} onChange={(e) => setCountryForm({ ...countryForm, dialCode: e.target.value })} placeholder="+91" />
              </div>
              <div>
                <Label>Calling Code</Label>
                <Input value={countryForm.callingCode} onChange={(e) => setCountryForm({ ...countryForm, callingCode: e.target.value })} placeholder="91" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCountryDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmitCountryProfile}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
