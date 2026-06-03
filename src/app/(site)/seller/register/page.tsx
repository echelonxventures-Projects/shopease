"use client";

import { useState } from "react";
import { registerSeller } from "@/server/actions/seller-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Store, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function SellerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    businessName: "", businessEmail: "", businessPhone: "",
    gstin: "", address: "", city: "", state: "", pincode: "",
  });

  const handleSubmit = async () => {
    if (!form.businessName || !form.businessEmail || !form.businessPhone) {
      toast.error("Fill all required fields");
      return;
    }
    setLoading(true);
    try {
      await registerSeller(form);
      toast.success("Seller registration submitted!");
      router.push("/seller/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <Store className="w-8 h-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Register as Seller</h1>
            <p className="text-sm text-gray-500">Start selling on ShopEase</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Business Name *</label>
            <Input value={form.businessName} onChange={(e) => setForm({ ...form, businessName: e.target.value })} placeholder="Your business name" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Business Email *</label>
              <Input type="email" value={form.businessEmail} onChange={(e) => setForm({ ...form, businessEmail: e.target.value })} placeholder="email@business.com" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Business Phone *</label>
              <Input value={form.businessPhone} onChange={(e) => setForm({ ...form, businessPhone: e.target.value })} placeholder="+91 9876543210" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">GSTIN (optional)</label>
            <Input value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value.toUpperCase() })} placeholder="e.g., 29ABCDE1234F1Z5" maxLength={15} />
          </div>

          <div className="flex items-center gap-2 mt-6 mb-2">
            <MapPin className="w-5 h-5 text-gray-400" />
            <h3 className="text-lg font-semibold">Business Address</h3>
          </div>
          <div>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Street address" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} placeholder="City" />
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} placeholder="State" />
            <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} placeholder="PIN code" maxLength={6} />
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full h-12 text-lg bg-blue-600 hover:bg-blue-700">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Submit Registration"}
          </Button>
        </div>
      </div>
    </div>
  );
}
