"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  toggleSupplierActive,
  verifySupplier,
  validateSupplierId,
} from "@/server/actions/inventory-actions";
import {
  resolvePinCode,
  getCountries,
  getStatesForCountry,
  getIdTypesForCountry,
} from "@/server/actions/location-lookup-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Search, Shield, ShieldCheck, ShieldX, Copy } from "lucide-react";

const VERIFICATION_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
};

interface IdTypeOption {
  value: string;
  label: string;
  formatHint: string;
}

export default function SuppliersPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Location dropdown data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [countries, setCountries] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [states, setStates] = useState<any[]>([]);
  const [idTypeOptions, setIdTypeOptions] = useState<IdTypeOption[]>([]);

  // Verification dialog
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyStatus, setVerifyStatus] = useState<"VERIFIED" | "REJECTED">("VERIFIED");
  const [verifyNotes, setVerifyNotes] = useState("");

  const [form, setForm] = useState({
    name: "", code: "", contactPerson: "", email: "", phone: "",
    address: "", city: "", state: "", country: "", zipCode: "",
    gstin: "", taxId: "", paymentTerms: "", notes: "",
    countryId: "", stateId: "",
    idType: "TAX_ID",
    uniqueId: "",
  });

  useEffect(() => {
    getCountries().then(setCountries).catch(() => {});
  }, []);

  const fetch = async () => {
    try {
      const data = await getSuppliers({ search: search || undefined });
      setSuppliers(data.suppliers);
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [search]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "", code: "", contactPerson: "", email: "", phone: "",
      address: "", city: "", state: "", country: "", zipCode: "",
      gstin: "", taxId: "", paymentTerms: "", notes: "",
      countryId: "", stateId: "",
      idType: "TAX_ID",
      uniqueId: "",
    });
    setStates([]);
    setIdTypeOptions([]);
    setDialogOpen(true);
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  const openEdit = (s: any) => {
    setEditingId(s.id);
    setForm({
      name: s.name || "", code: s.code || "", contactPerson: s.contactPerson || "",
      email: s.email || "", phone: s.phone || "", address: s.address || "",
      city: s.city || "", state: s.state || "", country: s.country || "",
      zipCode: s.zipCode || "", gstin: s.gstin || "", taxId: s.taxId || "",
      paymentTerms: s.paymentTerms || "", notes: s.notes || "",
      countryId: s.countryId || "",
      stateId: s.stateId || "",
      idType: s.idType || "TAX_ID",
      uniqueId: s.uniqueId || "",
    });
    setStates([]);
    // Load ID types for current country
    if (s.countryId) {
      fetchIdTypes(s.countryId);
    }
    setDialogOpen(true);
  };

  const fetchIdTypes = async (countryId: string) => {
    try {
      const country = countries.find((c) => c.id === countryId);
      if (country?.code) {
        const types = await getIdTypesForCountry(country.code);
        setIdTypeOptions(types);
        setForm((f) => ({ ...f, idType: types[0]?.value || "TAX_ID" }));
      }
    } catch {
      setIdTypeOptions([]);
    }
  };

  const handleCountryChange = async (countryId: string | null) => {
    setForm({ ...form, countryId: countryId || "", stateId: "", state: "" });
    if (countryId) {
      try {
        const s = await getStatesForCountry(countryId);
        setStates(s);
        // Load ID types for selected country
        const country = countries.find((c) => c.id === countryId);
        if (country?.code) {
          const types = await getIdTypesForCountry(country.code);
          setIdTypeOptions(types);
          setForm((f) => ({ ...f, idType: types[0]?.value || "TAX_ID" }));
        }
      } catch {
        setStates([]);
      }
    } else {
      setStates([]);
      setIdTypeOptions([]);
    }
  };

  const handleStateChange = (stateId: string) => {
    const selected = states.find((s) => s.id === stateId);
    setForm({ ...form, stateId, state: selected?.name || "" });
  };

  const handlePinCodeLookup = async () => {
    const pin = form.zipCode.trim();
    if (pin.length < 3) {
      toast.error("Enter at least 3 characters");
      return;
    }

    setPinLoading(true);
    try {
      const selectedCountry = countries.find((c) => c.id === form.countryId);
      const result = await resolvePinCode(pin, selectedCountry?.code);
      if (!result.valid) {
        toast.error(result.message || "Pin code not found");
        return;
      }

      if (!form.countryId && result.country) {
        const matchedCountry = countries.find(
          (c) => c.name.toLowerCase() === result.country!.toLowerCase()
        );
        if (matchedCountry) {
          await handleCountryChange(matchedCountry.id);
          setTimeout(() => {
            const matchedState = states.find(
              (s) => result.state && s.name.toLowerCase() === result.state!.toLowerCase()
            );
            if (matchedState) {
              handleStateChange(matchedState.id);
            }
          }, 500);
        }
      } else if (form.stateId === "" && result.state) {
        const matchedState = states.find(
          (s) => s.name.toLowerCase() === result.state!.toLowerCase()
        );
        if (matchedState) {
          handleStateChange(matchedState.id);
        }
      }

      setForm((prev) => ({
        ...prev,
        country: result.country || prev.country,
        state: result.state || prev.state,
        city: result.city || prev.city,
        zipCode: result.pincode || pin,
      }));

      toast.success(
        `Found: ${[result.city, result.state, result.country].filter(Boolean).join(", ")}`
      );
    } catch {
      toast.error("Pin code lookup failed. Please fill manually.");
    } finally {
      setPinLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error("Supplier name is required"); return; }

    const selectedCountry = countries.find((c) => c.id === form.countryId);
    const selectedState = states.find((s) => s.id === form.stateId);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
    const submitData: any = {
      ...form,
      country: selectedCountry?.name || form.country,
      state: selectedState?.name || form.state,
    };

    try {
      if (editingId) {
        await updateSupplier(editingId, submitData);
        toast.success("Supplier updated");
      } else {
        await createSupplier(submitData);
        toast.success("Supplier created");
      }
      setDialogOpen(false);
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleToggle = async (id: string, isActive: boolean) => {
    try {
      await toggleSupplierActive(id, !isActive);
      toast.success(isActive ? "Supplier deactivated" : "Supplier activated");
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleVerify = async () => {
    if (!verifyingId) return;
    try {
      await verifySupplier(verifyingId, verifyStatus, verifyNotes || undefined);
      toast.success(verifyStatus === "VERIFIED" ? "Supplier verified" : "Supplier rejected");
      setVerifyOpen(false);
      setVerifyNotes("");
      setVerifyingId(null);
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const copyUniqueId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("Unique ID copied");
  };

  const currentIdTypeLabel = idTypeOptions.find((t) => t.value === form.idType)?.label || form.idType;
  const currentIdTypeHint = idTypeOptions.find((t) => t.value === form.idType)?.formatHint || "";

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <Button onClick={openCreate}>+ Add Supplier</Button>
      </div>

      <div className="mb-4 flex gap-4">
        <Input
          placeholder="Search suppliers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="grid gap-4">
        {suppliers.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No suppliers found</div>
        )}
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white rounded-lg shadow p-5">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <h3 className="font-bold text-lg">{s.name}</h3>
                  <Badge className={s.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                    {s.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge className={VERIFICATION_COLORS[s.verificationStatus || "PENDING"]}>
                    {s.verificationStatus === "VERIFIED" && <ShieldCheck className="w-3 h-3 mr-1" />}
                    {s.verificationStatus === "REJECTED" && <ShieldX className="w-3 h-3 mr-1" />}
                    {s.verificationStatus === "PENDING" && <Shield className="w-3 h-3 mr-1" />}
                    {s.verificationStatus || "PENDING"}
                  </Badge>
                  {s.idType && (
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono">{s.idType}</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-gray-400 font-mono">{s.code}</span>
                  {s.uniqueId && (
                    <span className="text-xs text-gray-400 font-mono flex items-center gap-1">
                      ID: {s.uniqueId}
                      <Copy className="w-3 h-3 cursor-pointer hover:text-gray-600" onClick={() => copyUniqueId(s.uniqueId)} />
                    </span>
                  )}
                </div>
                {s.contactPerson && <p className="text-sm text-gray-600 mt-1">Contact: {s.contactPerson}</p>}
                {s.gstin && <p className="text-sm text-gray-500 mt-1">{currentIdTypeLabel}: {s.gstin}</p>}
                <div className="grid grid-cols-2 gap-x-8 gap-y-1 mt-3 text-sm text-gray-500">
                  {s.email && <p>Email: {s.email}</p>}
                  {s.phone && <p>Phone: {s.phone}</p>}
                  {s.city && <p>City: {s.city}{s.state ? `, ${s.state}` : ""}</p>}
                  {s.paymentTerms && <p>Terms: {s.paymentTerms}</p>}
                </div>
                {s.notes && <p className="text-sm text-gray-400 mt-2 italic">{s.notes}</p>}
                {s.verificationNotes && s.verificationStatus === "REJECTED" && (
                  <p className="text-sm text-red-500 mt-2 italic">Rejection: {s.verificationNotes}</p>
                )}
                <div className="flex gap-4 mt-3 text-xs text-gray-400">
                  <span>{s._count?.productSuppliers || 0} products</span>
                  <span>{s._count?.inventoryItems || 0} inventory records</span>
                </div>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button size="sm" variant="outline" onClick={() => openEdit(s)}>Edit</Button>
                {s.verificationStatus !== "VERIFIED" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setVerifyingId(s.id); setVerifyStatus("VERIFIED"); setVerifyNotes(""); setVerifyOpen(true); }}
                  >
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verify
                  </Button>
                )}
                <Button size="sm" variant={s.isActive ? "outline" : "default"} onClick={() => handleToggle(s.id, s.isActive)}>
                  {s.isActive ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Supplier" : "Add Supplier"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Tech Distributors" />
            </div>
            <div>
              <Label>Code</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="SUP-001" />
            </div>
            {editingId && form.uniqueId && (
              <div>
                <Label>Unique ID</Label>
                <div className="flex items-center gap-2">
                  <Input value={form.uniqueId} readOnly className="bg-gray-50 font-mono" />
                  <Button size="sm" variant="outline" onClick={() => copyUniqueId(form.uniqueId)}>
                    <Copy className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            )}

            {/* ID Type + GSTIN/ID Number */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>ID Type</Label>
                <Select value={form.idType} onValueChange={(v: string | null) => setForm({ ...form, idType: v || "TAX_ID" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select ID type" />
                  </SelectTrigger>
                  <SelectContent>
                    {idTypeOptions.length > 0 ? (
                      idTypeOptions.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="TAX_ID">Tax ID</SelectItem>
                        <SelectItem value="BUSINESS_REG">Business Registration</SelectItem>
                        <SelectItem value="OTHER">Other</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {currentIdTypeHint && (
                  <p className="text-xs text-gray-400 mt-1">{currentIdTypeHint}</p>
                )}
              </div>
              <div>
                <Label>{currentIdTypeLabel} / ID Number</Label>
                <Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} placeholder={currentIdTypeHint || "Enter ID number"} />
              </div>
            </div>

            <div>
              <Label>Contact Person</Label>
              <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>

            {/* ===== ADDRESS SECTION ===== */}
            <div>
              <Label>Address</Label>
              <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address, building..." />
            </div>

            <div className="flex gap-2">
              <div className="flex-1">
                <Label>Pin / Zip / Postal Code</Label>
                <Input
                  value={form.zipCode}
                  onChange={(e) => setForm({ ...form, zipCode: e.target.value.slice(0, 15) })}
                  placeholder="400001 (India), 10001 (US), SW1A 1AA (UK), etc."
                />
              </div>
              <div className="flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePinCodeLookup}
                  disabled={pinLoading}
                  className="h-10"
                >
                  {pinLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  <span className="ml-1">Auto</span>
                </Button>
              </div>
            </div>

            <div>
              <Label>Country</Label>
              <Select value={form.countryId} onValueChange={(v: string | null) => handleCountryChange(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name} ({c.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>State / Province</Label>
              <Select value={form.stateId} onValueChange={(v) => { if (v) handleStateChange(v); }} disabled={countries.length === 0 || !form.countryId}>
                <SelectTrigger>
                  <SelectValue placeholder={form.countryId ? "Select state" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {states.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>City</Label>
              <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="Mumbai" />
            </div>

            <div>
              <Label>Payment Terms</Label>
              <Input value={form.paymentTerms} onChange={(e) => setForm({ ...form, paymentTerms: e.target.value })} placeholder="Net 30" />
            </div>

            <div>
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>{editingId ? "Update" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verification Dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {verifyStatus === "VERIFIED" ? "Verify Supplier" : "Reject Supplier"}
            </DialogTitle>
            <DialogDescription>
              Confirm this supplier&apos;s verification status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Status</Label>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
              <Select value={verifyStatus} onValueChange={(v: string | null) => setVerifyStatus(v as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VERIFIED">Verified</SelectItem>
                  <SelectItem value="REJECTED">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={verifyNotes}
                onChange={(e) => setVerifyNotes(e.target.value)}
                placeholder={verifyStatus === "REJECTED" ? "Reason for rejection..." : "Verification notes..."}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyOpen(false)}>Cancel</Button>
            <Button
              onClick={handleVerify}
              variant={verifyStatus === "VERIFIED" ? "default" : "destructive"}
            >
              {verifyStatus === "VERIFIED" ? <ShieldCheck className="w-4 h-4 mr-1" /> : <ShieldX className="w-4 h-4 mr-1" />}
              {verifyStatus === "VERIFIED" ? "Verify" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
