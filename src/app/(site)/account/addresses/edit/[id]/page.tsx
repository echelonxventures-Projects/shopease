"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getAddresses, updateAddress } from "@/server/actions/address-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const INDIAN_STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat",
  "Haryana","Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh",
  "Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Punjab",
  "Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh",
  "Uttarakhand","West Bengal",
  "Delhi","Puducherry","Chandigarh","Jammu and Kashmir","Ladakh","Lakshadweep",
  "Dadra and Nagar Haveli and Daman and Diu","Andaman and Nicobar Islands",
];

export default function EditAddressPage() {
  const router = useRouter();
  const params = useParams();
  const addressId = params.id as string;
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    street: "",
    street2: "",
    landmark: "",
    city: "",
    state: "",
    zipCode: "",
    isDefault: false,
    deliveryNote: "",
  });

  useEffect(() => {
    getAddresses()
      .then((addresses: any[]) => {
        const addr = addresses.find((a: any) => a.id === addressId);
        if (!addr) {
          toast.error("Address not found");
          router.push("/account/addresses");
          return;
        }
        const streetParts = addr.street.split(",").map((s: string) => s.trim());
        setForm({
          fullName: addr.fullName,
          phone: addr.phone,
          street: streetParts[0] || "",
          street2: streetParts.slice(1).join(", ") || "",
          landmark: addr.landmark || "",
          city: addr.city,
          state: addr.stateLoc?.name || addr.state || "",
          zipCode: addr.zipCode,
          isDefault: addr.isDefault,
          deliveryNote: addr.deliveryNote || "",
        });
      })
      .catch(() => {
        toast.error("Failed to load address");
        router.push("/account/addresses");
      })
      .finally(() => setLoading(false));
  }, [addressId, router]);

  const handleSubmit = async () => {
    if (!form.fullName.trim()) { toast.error("Please enter your full name"); return; }
    if (!form.phone.trim()) { toast.error("Please enter your mobile number"); return; }
    if (!form.street.trim()) { toast.error("Please enter Flat/House no. details"); return; }
    if (!form.city.trim()) { toast.error("Please enter your town/city"); return; }
    if (!form.state) { toast.error("Please select your state"); return; }
    if (!/^\d{6}$/.test(form.zipCode)) { toast.error("Enter a valid 6-digit PIN code"); return; }

    try {
      setSaving(true);
      await updateAddress(addressId, {
        fullName: form.fullName,
        phone: form.phone,
        street: [form.street, form.street2].filter(Boolean).join(", "),
        city: form.city,
        state: form.state,
        zipCode: form.zipCode,
        country: "India",
        isDefault: form.isDefault,
        landmark: form.landmark || undefined,
        deliveryNote: form.deliveryNote || undefined,
      });
      toast.success("Address updated");
      router.push("/account/addresses");
    } catch (err: any) {
      toast.error(err.message || "Failed to update address");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <Link href="/account/addresses" className="hover:text-blue-600">Your Addresses</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Edit address</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Edit address</h1>
      <p className="text-gray-500 mb-6">Update your delivery address</p>

      <div className="bg-white rounded-lg border p-6 max-w-2xl">
        {/* Country/Region */}
        <div className="mb-5">
          <Label htmlFor="country">Country/Region</Label>
          <Select value="IN" disabled>
            <SelectTrigger id="country" className="mt-1">
              <SelectValue placeholder="Select country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IN">India</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Full Name */}
        <div className="mb-5">
          <Label htmlFor="fullName">Full name (First and Last name) *</Label>
          <Input
            id="fullName"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            placeholder="First and Last name"
            className="mt-1"
            required
          />
        </div>

        {/* Mobile Number */}
        <div className="mb-5">
          <Label htmlFor="phone">Mobile number *</Label>
          <div className="flex gap-2 mt-1">
            <span className="inline-flex items-center px-3 bg-gray-100 border border-r-0 rounded-l-md text-sm text-gray-600">
              +91
            </span>
            <Input
              id="phone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })}
              placeholder="9876543210"
              className="flex-1 rounded-l-none"
              type="tel"
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">May be used to assist delivery</p>
        </div>

        {/* Pincode */}
        <div className="mb-5">
          <Label htmlFor="zipCode">Pincode *</Label>
          <Input
            id="zipCode"
            value={form.zipCode}
            onChange={(e) => setForm({ ...form, zipCode: e.target.value.replace(/\D/g, "").slice(0, 6) })}
            placeholder="6 digits [0-9] PIN code"
            className="mt-1"
            maxLength={6}
            required
          />
        </div>

        {/* Flat, House no., Building, Company, Apartment */}
        <div className="mb-5">
          <Label htmlFor="street">Flat, House no., Building, Company, Apartment *</Label>
          <Input
            id="street"
            value={form.street}
            onChange={(e) => setForm({ ...form, street: e.target.value })}
            placeholder="e.g. Flat No. 401, Shree Heights"
            className="mt-1"
            required
          />
        </div>

        {/* Area, Street, Sector, Village */}
        <div className="mb-5">
          <Label htmlFor="street2">Area, Street, Sector, Village</Label>
          <Input
            id="street2"
            value={form.street2}
            onChange={(e) => setForm({ ...form, street2: e.target.value })}
            placeholder="e.g. Sector 24, Near City Mall"
            className="mt-1"
          />
        </div>

        {/* Landmark */}
        <div className="mb-5">
          <Label htmlFor="landmark">Landmark</Label>
          <Input
            id="landmark"
            value={form.landmark}
            onChange={(e) => setForm({ ...form, landmark: e.target.value })}
            placeholder="E.g. near apollo hospital"
            className="mt-1"
          />
        </div>

        {/* Town/City */}
        <div className="mb-5">
          <Label htmlFor="city">Town/City *</Label>
          <Input
            id="city"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Bengaluru"
            className="mt-1"
            required
          />
        </div>

        {/* State */}
        <div className="mb-5">
          <Label htmlFor="state">State *</Label>
          <Select value={form.state} onValueChange={(v) => { if (v) setForm({ ...form, state: v }); }}>
            <SelectTrigger id="state" className="mt-1">
              <SelectValue placeholder="Choose a state" />
            </SelectTrigger>
            <SelectContent>
              {INDIAN_STATES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Make this my default address */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <Checkbox
              id="isDefault"
              checked={form.isDefault}
              onCheckedChange={(checked) => setForm({ ...form, isDefault: checked as boolean })}
            />
            <Label htmlFor="isDefault" className="text-sm font-medium cursor-pointer">
              Make this my default address
            </Label>
          </div>
        </div>

        {/* Delivery instructions */}
        <div className="mb-6">
          <Label htmlFor="deliveryNote">Delivery instructions (optional)</Label>
          <p className="text-xs text-gray-500 mb-2">Add preferences, notes, access codes and more</p>
          <Textarea
            id="deliveryNote"
            value={form.deliveryNote}
            onChange={(e) => setForm({ ...form, deliveryNote: e.target.value })}
            placeholder="e.g. Ring bell 2, 3rd floor, Call before delivery, Leave at door"
            className="mt-1 resize-none"
            rows={3}
          />
        </div>

        {/* Save / Cancel */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push("/account/addresses")}
            disabled={saving}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
          >
            {saving ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
