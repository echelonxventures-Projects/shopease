"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getVouchers,
  createVoucher,
  updateVoucher,
  toggleVoucherActive,
  deleteVoucher,
  getVoucherTiers,
} from "@/server/actions/wallet-actions";
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
import Link from "next/link";

const VOUCHER_TYPES = [
  { value: "AMOUNT", label: "Fixed Amount", desc: "Adds fixed wallet amount" },
  { value: "PERCENTAGE", label: "Percentage", desc: "Adds % of face value" },
  { value: "CASHBACK", label: "Cashback", desc: "Cashback voucher" },
  { value: "BONUS", label: "Bonus", desc: "Bonus multiplier voucher" },
];

async function fetchSecureCode(): Promise<string> {
  try {
    const res = await fetch("/api/admin/voucher-code");
    if (res.ok) {
      const data = await res.json();
      return data.code;
    }
  } catch {
    // fall through to client-side fallback
  }
  // Fallback — should not happen in normal operation
  return "VOU-XXXX-XXXX-XXXX";
}

export default function VouchersPage() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [vouchers, setVouchers] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [form, setForm] = useState({
    code: "",
    type: "AMOUNT",
    faceValue: "",
    purchasePrice: "",
    redeemRate: "1",
    currency: "INR",
    expiryDays: "365",
    maxRedemptions: "",
    perUserLimit: "1",
    voucherTierId: "none",
    isActive: true,
  });

  const fetch = () => {
    Promise.all([getVouchers(), getVoucherTiers()]).then(([v, t]) => {
      setVouchers(v);
      setTiers(t);
    }).catch(() => router.push("/auth/login")).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetch();
    fetchSecureCode().then((code) => setForm((f) => ({ ...f, code })));
  }, []);

  const resetForm = () => {
    fetchSecureCode().then((code) => {
      setForm({
        code,
        type: "AMOUNT",
        faceValue: "",
        purchasePrice: "",
        redeemRate: "1",
        currency: "INR",
        expiryDays: "365",
        maxRedemptions: "",
        perUserLimit: "1",
        voucherTierId: "none",
        isActive: true,
      });
    });
    setEditId(null);
  };

  const handleSubmit = async () => {
    if (!form.code.trim()) { toast.error("Voucher code is required"); return; }
    if (!form.faceValue) { toast.error("Face value is required"); return; }

    try {
      if (editId) {
        await updateVoucher(editId, {
          type: form.type,
          faceValue: parseFloat(form.faceValue),
          purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
          redeemRate: parseFloat(form.redeemRate),
          expiryDays: parseInt(form.expiryDays),
          maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : undefined,
          perUserLimit: form.perUserLimit ? parseInt(form.perUserLimit) : undefined,
          isActive: form.isActive,
        });
        toast.success("Voucher updated");
      } else {
        await createVoucher({
          code: form.code,
          type: form.type,
          faceValue: parseFloat(form.faceValue),
          purchasePrice: form.purchasePrice ? parseFloat(form.purchasePrice) : undefined,
          redeemRate: parseFloat(form.redeemRate),
          currency: form.currency,
          expiryDays: parseInt(form.expiryDays),
          maxRedemptions: form.maxRedemptions ? parseInt(form.maxRedemptions) : undefined,
          perUserLimit: form.perUserLimit ? parseInt(form.perUserLimit) : undefined,
          voucherTierId: form.voucherTierId !== "none" ? form.voucherTierId : undefined,
          isActive: form.isActive,
        });
        toast.success("Voucher created");
      }
      setOpen(false);
      resetForm();
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const getTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      AMOUNT: "bg-blue-100 text-blue-700",
      PERCENTAGE: "bg-purple-100 text-purple-700",
      CASHBACK: "bg-green-100 text-green-700",
      BONUS: "bg-orange-100 text-orange-700",
    };
    return colors[type] || "bg-gray-100 text-gray-700";
  };

  const calculateCredit = (faceValue: number, rate: number, type: string) => {
    switch (type) {
      case "AMOUNT":
        return faceValue * rate;
      case "PERCENTAGE":
        return (faceValue * rate) / 100;
      case "CASHBACK":
        return faceValue * rate;
      case "BONUS":
        return faceValue * rate;
      default:
        return faceValue;
    }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Vouchers</h1>
          <p className="text-gray-500 text-sm mt-1">
            Create and manage vouchers — users redeem them to credit their wallet
          </p>
        </div>
        <Button onClick={() => { resetForm(); setOpen(true); }}>Create Voucher</Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Vouchers</p>
          <p className="text-2xl font-bold">{vouchers.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{vouchers.filter((v) => v.isActive).length}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Redeemed</p>
          <p className="text-2xl font-bold">{vouchers.reduce((sum, v) => sum + v.redeemedCount, 0)}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Credit Given</p>
          <p className="text-2xl font-bold">
            ₹{vouchers.reduce((sum, v) => {
              const per = calculateCredit(Number(v.faceValue), Number(v.redeemRate), v.type);
              return sum + per * v.redeemedCount;
            }, 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Code</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Type</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Face Value</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Rate</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Wallet Credit</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Redeemed</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {vouchers.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No vouchers</td></tr>
            ) : (
              vouchers.map((v) => {
                const credit = calculateCredit(Number(v.faceValue), Number(v.redeemRate), v.type);
                return (
                  <tr key={v.id} className="border-t">
                    <td className="px-4 py-3 font-mono font-bold text-sm">{v.code}</td>
                    <td className="px-4 py-3">
                      <Badge className={getTypeBadge(v.type)}>{v.type}</Badge>
                    </td>
                    <td className="px-4 py-3">₹{Number(v.faceValue).toFixed(2)}</td>
                    <td className="px-4 py-3">
                      <span className="font-mono">{Number(v.redeemRate).toFixed(2)}x</span>
                    </td>
                    <td className="px-4 py-3 font-bold text-green-600">₹{credit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm">
                      {v.redeemedCount}{v.maxRedemptions ? `/${v.maxRedemptions}` : ""}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={v.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}>
                        {v.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => { populateEditForm(v); setOpen(true); }}>Edit</Button>
                      <Button size="sm" variant="destructive" onClick={async () => {
                        if (confirm("Delete voucher?")) {
                          await deleteVoucher(v.id);
                          toast.success("Deleted");
                          fetch();
                        }
                      }}>Del</Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Voucher" : "Create Voucher"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Voucher Code</Label>
              <div className="flex gap-2">
                <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="VOU2026" />
                {!editId && (
                  <Button variant="outline" onClick={() => fetchSecureCode().then((code) => setForm({ ...form, code }))}>
                    Random
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label>Voucher Type</Label>
              <Select value={form.type} onValueChange={(v) => v && setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {VOUCHER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label} — {t.desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Voucher Tier
                <Link href="/admin/vouchers/tiers" className="text-xs text-blue-600 ml-2 hover:underline">Manage Tiers</Link>
              </Label>
              <Select value={form.voucherTierId || "none"} onValueChange={(v) => { if (v) setForm({ ...form, voucherTierId: v || "none" }); }}>
                <SelectTrigger><SelectValue placeholder="No tier" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No tier</SelectItem>
                  {tiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      <span className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />
                        {tier.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Face Value (₹)</Label>
                <Input type="number" value={form.faceValue} onChange={(e) => setForm({ ...form, faceValue: e.target.value })} placeholder="100" />
              </div>
              <div>
                <Label>Purchase Price (₹)</Label>
                <Input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })} placeholder="Same as face value" />
                <p className="text-xs text-gray-400">Leave empty to match face value</p>
              </div>
            </div>

            <div>
              <Label>Redeem Rate (multiplier)</Label>
              <div className="flex items-center gap-2">
                <Input type="number" step="0.01" value={form.redeemRate} onChange={(e) => setForm({ ...form, redeemRate: e.target.value })} />
                <span className="text-sm text-gray-500">x</span>
              </div>
              {form.faceValue && (
                <p className="text-xs text-green-600 mt-1">
                  → Wallet credit: ₹{(parseFloat(form.faceValue) * parseFloat(form.redeemRate)).toFixed(2)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Expiry (days)</Label>
                <Input type="number" value={form.expiryDays} onChange={(e) => setForm({ ...form, expiryDays: e.target.value })} />
              </div>
              <div>
                <Label>Currency</Label>
                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Max Redemptions</Label>
                <Input type="number" value={form.maxRedemptions} onChange={(e) => setForm({ ...form, maxRedemptions: e.target.value })} placeholder="Unlimited" />
              </div>
              <div>
                <Label>Per User Limit</Label>
                <Input type="number" value={form.perUserLimit} onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })} />
              </div>
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
  function populateEditForm(v: any) {
    setForm({
      code: v.code,
      type: v.type,
      faceValue: Number(v.faceValue).toString(),
      purchasePrice: v.purchasePrice ? Number(v.purchasePrice).toString() : "",
      redeemRate: Number(v.redeemRate).toString(),
      currency: v.currency,
      expiryDays: v.expiryDays.toString(),
      maxRedemptions: v.maxRedemptions?.toString() || "",
      perUserLimit: v.perUserLimit?.toString() || "1",
      voucherTierId: v.voucherTierId || "none",
      isActive: v.isActive,
    });
    setEditId(v.id);
  }
}
