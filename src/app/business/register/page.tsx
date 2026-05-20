"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { registerBusiness } from "@/server/actions/business-actions";
import { getAllCountryProfiles } from "@/server/actions/location-actions";
import { getSubLocations } from "@/server/actions/location-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, MapPin, User, FileText, CheckCircle } from "lucide-react";
import Link from "next/link";

const STEPS = [
  { icon: Building2, label: "Business Details" },
  { icon: MapPin, label: "Address" },
  { icon: User, label: "Contact" },
  { icon: FileText, label: "Review" },
];

const BUSINESS_TYPES = [
  { value: "LLC", label: "LLC" },
  { value: "CORPORATION", label: "Corporation" },
  { value: "SOLE_PROPRIETOR", label: "Sole Proprietorship" },
  { value: "PARTNERSHIP", label: "Partnership" },
  { value: "NONPROFIT", label: "Nonprofit" },
  { value: "GOVERNMENT", label: "Government" },
  { value: "EDUCATIONAL", label: "Educational" },
  { value: "OTHER", label: "Other" },
];

const INDUSTRIES = [
  "Technology", "Healthcare", "Manufacturing", "Retail", "Education",
  "Finance", "Construction", "Agriculture", "Transportation", "Other",
];

const COMPANY_SIZES = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

export default function BusinessRegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<any[]>([]);

  const [form, setForm] = useState({
    name: "",
    businessType: "",
    industry: "",
    companySize: "",
    website: "",
    gstNumber: "",
    taxId: "",
    panNumber: "",
    registrationNumber: "",
    registeredCountry: "",
    businessAddress: "",
    city: "",
    state: "",
    zipCode: "",
    contactEmail: "",
    contactPhone: "",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Fetch countries on mount
  useEffect(() => {
    getAllCountryProfiles().then(setCountries).catch(() => {});
  }, []);

  const states = form.registeredCountry
    ? countries.find((c: any) => c.locationCode === form.registeredCountry)?.subLocations || []
    : [];

  async function handleSubmit() {
    setError("");
    setLoading(true);
    try {
      const result = await registerBusiness(form);
      if ((result as any)?.error) {
        setError((result as any).error);
      } else {
        router.push("/business/dashboard");
      }
    } catch (e: any) {
      setError(e.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  const canProceed = () => {
    switch (step) {
      case 0: return form.name && form.businessType;
      case 1: return form.registeredCountry && form.city && form.zipCode && form.businessAddress;
      case 2: return form.contactEmail;
      default: return true;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Register Your Business</h1>
        <p className="text-gray-500 mt-1">Set up your Amazon Business account in a few steps</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
              i <= step ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"
            }`}>
              {i < step ? <CheckCircle className="w-5 h-5" /> : <s.icon className="w-5 h-5" />}
            </div>
            <span className={`ml-2 text-xs font-medium ${i <= step ? "text-blue-600" : "text-gray-400"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <div className="w-16 h-0.5 bg-gray-200 mx-3" />}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-50 text-red-600 p-3 rounded mb-4">{error}</div>}

      <div className="bg-white rounded-lg shadow p-6">
        {/* Step 0: Business Details */}
        {step === 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Business Details</h2>
            <div>
              <Label>Business Name *</Label>
              <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Acme Corp" />
            </div>
            <div>
              <Label>Business Type *</Label>
              <Select value={form.businessType} onValueChange={(v) => v && update("businessType", v)}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Industry</Label>
              <Select value={form.industry} onValueChange={(v) => v && update("industry", v)}>
                <SelectTrigger><SelectValue placeholder="Select industry" /></SelectTrigger>
                <SelectContent>
                  {INDUSTRIES.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Company Size</Label>
              <Select value={form.companySize} onValueChange={(v) => v && update("companySize", v)}>
                <SelectTrigger><SelectValue placeholder="Select size" /></SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZES.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Website</Label>
              <Input value={form.website} onChange={(e) => update("website", e.target.value)} placeholder="https://example.com" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>GST Number</Label>
                <Input value={form.gstNumber} onChange={(e) => update("gstNumber", e.target.value)} placeholder="29ABCDE1234F1Z5" />
              </div>
              <div>
                <Label>Tax ID</Label>
                <Input value={form.taxId} onChange={(e) => update("taxId", e.target.value)} placeholder="Tax ID" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>PAN Number</Label>
                <Input value={form.panNumber} onChange={(e) => update("panNumber", e.target.value)} placeholder="ABCDE1234F" />
              </div>
              <div>
                <Label>Registration Number</Label>
                <Input value={form.registrationNumber} onChange={(e) => update("registrationNumber", e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* Step 1: Address */}
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Business Address</h2>
            <div>
              <Label>Country *</Label>
              <Select value={form.registeredCountry} onValueChange={(v) => v && update("registeredCountry", v)}>
                <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                <SelectContent>
                  {countries.map((c: any) => <SelectItem key={c.locationCode} value={c.locationCode}>{c.displayName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.registeredCountry && states.length > 0 && (
              <div>
                <Label>State / Province *</Label>
                <Select value={form.state} onValueChange={(v) => v && update("state", v)}>
                  <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
                  <SelectContent>
                    {states.filter((s: any) => s.type === "STATE").map((s: any) => (
                      <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div>
              <Label>Business Address *</Label>
              <Textarea value={form.businessAddress} onChange={(e) => update("businessAddress", e.target.value)} placeholder="Street address, suite, etc." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>City *</Label>
                <Input value={form.city} onChange={(e) => update("city", e.target.value)} placeholder="City" />
              </div>
              <div>
                <Label>Zip / Postal Code *</Label>
                <Input value={form.zipCode} onChange={(e) => update("zipCode", e.target.value)} placeholder="12345" />
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Contact */}
        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Contact Information</h2>
            <div>
              <Label>Contact Email *</Label>
              <Input type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} placeholder="you@company.com" />
            </div>
            <div>
              <Label>Contact Phone</Label>
              <Input type="tel" value={form.contactPhone} onChange={(e) => update("contactPhone", e.target.value)} placeholder="+1 (555) 123-4567" />
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold">Review & Submit</h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-2">
                <div><span className="text-gray-500">Business Name:</span> <strong>{form.name}</strong></div>
                <div><span className="text-gray-500">Type:</span> <strong>{form.businessType}</strong></div>
                <div><span className="text-gray-500">Industry:</span> <strong>{form.industry || "—"}</strong></div>
                <div><span className="text-gray-500">Size:</span> <strong>{form.companySize || "—"}</strong></div>
                <div><span className="text-gray-500">Country:</span> <strong>{form.registeredCountry}</strong></div>
                <div><span className="text-gray-500">City:</span> <strong>{form.city}</strong></div>
                <div><span className="text-gray-500">Email:</span> <strong>{form.contactEmail}</strong></div>
                <div><span className="text-gray-500">Phone:</span> <strong>{form.contactPhone || "—"}</strong></div>
              </div>
              {form.gstNumber && <div><span className="text-gray-500">GST:</span> <strong>{form.gstNumber}</strong></div>}
              {form.website && <div><span className="text-gray-500">Website:</span> <strong>{form.website}</strong></div>}
            </div>
            <p className="text-sm text-gray-500">
              By registering, you agree to the ShopEase Business Terms of Service. Your business will be pending verification.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-4 border-t">
          <Button variant="outline" onClick={() => setStep(step - 1)} disabled={step === 0}>
            Back
          </Button>
          {step < 3 ? (
            <Button onClick={() => canProceed() && setStep(step + 1)} disabled={!canProceed()}>
              Next
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={!loading}>
              {loading ? "Registering..." : "Register Business"}
            </Button>
          )}
        </div>
      </div>

      <p className="text-center text-sm text-gray-500 mt-4">
        Already have a business account? <Link href="/business/dashboard" className="text-blue-600">Go to Dashboard</Link>
      </p>
    </div>
  );
}
