"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getGiftCardById,
  purchaseGiftCard,
} from "@/server/actions/gift-card-store-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Gift, ArrowLeft, Mail, Truck, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PurchaseGiftCardPage() {
  const params = useParams();
  const router = useRouter();
  const [card, setCard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [purchaseLoading, setPurchaseLoading] = useState(false);
  const [step, setStep] = useState<"detail" | "form" | "success">("detail");
  const [form, setForm] = useState({
    amount: 500,
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    message: "",
    deliveryType: "E_GIFT",
    scheduledDate: "",
  });

  useEffect(() => {
    if (params.id) {
      getGiftCardById(params.id as string)
        .then(setCard)
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [params.id]);

  const minAmount = card ? Number(card.minAmount) : 25;
  const maxAmount = card ? Number(card.maxAmount) : 50000;
  const fixedAmounts = card?.fixedAmounts ? (card.fixedAmounts as number[]) : [];

  const handleSubmit = async () => {
    if (!form.recipientName.trim()) {
      toast.error("Recipient name is required");
      return;
    }
    if (form.deliveryType === "E_GIFT" && !form.recipientEmail.trim()) {
      toast.error("Recipient email is required for eGift delivery");
      return;
    }
    if (form.amount < minAmount || form.amount > maxAmount) {
      toast.error(`Amount must be between ₹${minAmount} and ₹${maxAmount}`);
      return;
    }

    setPurchaseLoading(true);
    try {
      const result = await purchaseGiftCard({
        storeCardId: card.id,
        amount: form.amount,
        recipientName: form.recipientName,
        recipientEmail: form.recipientEmail,
        recipientPhone: form.recipientPhone,
        message: form.message,
        deliveryType: form.deliveryType,
        scheduledDate: form.scheduledDate || undefined,
      });

      toast.success("Gift card order placed successfully!");
      setStep("success");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    } finally {
      setPurchaseLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-32 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <Gift className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h1 className="text-xl font-bold mb-2">Gift Card Not Found</h1>
        <Link href="/gift-cards" className="text-orange-600 hover:text-orange-700">
          Back to Gift Cards
        </Link>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="bg-white rounded-xl border p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Check className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Gift Card Sent!</h1>
          <p className="text-gray-500 mb-6">
            Your gift card has been sent to{" "}
            <span className="font-medium text-gray-900">{form.recipientName}</span>
          </p>
          {form.deliveryType === "E_GIFT" && (
            <p className="text-sm text-gray-500 mb-6">
              Delivered to {form.recipientEmail}
            </p>
          )}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">
              Amount: <span className="font-bold text-gray-900">₹{form.amount.toLocaleString()}</span>
            </p>
            {form.message && (
              <p className="text-sm text-gray-600 mt-2">
                Message: <span className="italic">&ldquo;{form.message}&rdquo;</span>
              </p>
            )}
          </div>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => router.push("/gift-cards")} variant="outline">
              Browse More
            </Button>
            <Button onClick={() => router.push("/gift-cards/redeem")}>
              Redeem Gift Card
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6">
        <Link href="/gift-cards" className="text-sm text-gray-500 hover:text-orange-600">
          Gift Cards
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm font-medium text-gray-900">{card.name}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Preview */}
        <div className="bg-white rounded-xl border overflow-hidden">
          <div className="aspect-[4/3] bg-gray-50 overflow-hidden">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"><rect fill="%23f3f4f6" width="400" height="300"/><text x="50%" y="50%" text-anchor="middle" fill="%23d1d5db" font-size="80">🎁</text></svg>`;
              }}
            />
          </div>
          <div className="p-4">
            <h1 className="text-xl font-bold mb-2">{card.name}</h1>
            {card.description && (
              <p className="text-sm text-gray-600 mb-3">{card.description}</p>
            )}

            {/* Occasions */}
            {card.occasions && card.occasions.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {card.occasions.map((o: any) => (
                  <span
                    key={o.slug}
                    className="text-xs px-2 py-1 bg-orange-50 text-orange-700 rounded-full"
                  >
                    {o.icon} {o.name}
                  </span>
                ))}
              </div>
            )}

            {/* Recipients */}
            {card.recipients && card.recipients.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {card.recipients.slice(0, 6).map((r: any) => (
                  <span
                    key={r.slug}
                    className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                  >
                    {r.name}
                  </span>
                ))}
              </div>
            )}

            {/* Design */}
            {card.design && (
              <p className="text-xs text-gray-500">
                Design: {card.design.name}
                {card.design.themeColor && ` (${card.design.themeColor})`}
              </p>
            )}
          </div>
        </div>

        {/* Purchase Form */}
        <div className="bg-white rounded-xl border p-6">
          <h2 className="text-lg font-bold mb-4">Send this gift card</h2>

          {/* Amount Selection */}
          <div className="mb-4">
            <Label>Amount</Label>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-gray-500 text-sm">₹</span>
              <input
                type="number"
                min={minAmount}
                max={maxAmount}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: parseInt(e.target.value) || 0 })}
                className="flex-1 border rounded-lg px-3 py-2 text-lg font-bold"
              />
            </div>
            {fixedAmounts.length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {fixedAmounts.map((amt: number) => (
                  <button
                    key={amt}
                    onClick={() => setForm({ ...form, amount: amt })}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      form.amount === amt
                        ? "bg-orange-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    ₹{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-gray-400 mt-1">
              Range: ₹{minAmount.toLocaleString()} — ₹{maxAmount.toLocaleString()}
              {card.customAmount && " · Custom amounts allowed"}
            </p>
          </div>

          {/* Delivery Type */}
          <div className="mb-4">
            <Label>Delivery Type</Label>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {card.deliveryTypes?.includes("E_GIFT") && (
                <button
                  onClick={() => setForm({ ...form, deliveryType: "E_GIFT" })}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    form.deliveryType === "E_GIFT"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Mail className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-medium">eGift Card</p>
                    <p className="text-xs text-gray-500">Instant delivery</p>
                  </div>
                </button>
              )}
              {card.deliveryTypes?.includes("PHYSICAL") && (
                <button
                  onClick={() => setForm({ ...form, deliveryType: "PHYSICAL" })}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    form.deliveryType === "PHYSICAL"
                      ? "border-orange-500 bg-orange-50 text-orange-700"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <Truck className="w-5 h-5" />
                  <div className="text-left">
                    <p className="text-sm font-medium">Physical Card</p>
                    <p className="text-xs text-gray-500">Shipped in 3-5 days</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Recipient Info */}
          <div className="mb-4">
            <Label>Recipient Name</Label>
            <Input
              value={form.recipientName}
              onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
              placeholder="Enter recipient's name"
              className="mt-1"
            />
          </div>

          {form.deliveryType === "E_GIFT" && (
            <div className="mb-4">
              <Label>Recipient Email</Label>
              <Input
                type="email"
                value={form.recipientEmail}
                onChange={(e) => setForm({ ...form, recipientEmail: e.target.value })}
                placeholder="recipient@email.com"
                className="mt-1"
              />
            </div>
          )}

          <div className="mb-4">
            <Label>Recipient Phone (optional)</Label>
            <Input
              value={form.recipientPhone}
              onChange={(e) => setForm({ ...form, recipientPhone: e.target.value })}
              placeholder="+91 98765 43210"
              className="mt-1"
            />
          </div>

          <div className="mb-4">
            <Label>Personal Message (optional)</Label>
            <Textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              placeholder="Add a personal message..."
              className="mt-1 resize-none"
              rows={3}
            />
          </div>

          {/* Schedule Delivery */}
          <div className="mb-6">
            <Label>Schedule Delivery (optional)</Label>
            <Input
              type="date"
              value={form.scheduledDate}
              onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
              min={new Date().toISOString().split("T")[0]}
              className="mt-1"
            />
          </div>

          {/* Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Total Amount</span>
              <span className="text-xl font-bold text-gray-900">₹{form.amount.toLocaleString()}</span>
            </div>
            {form.deliveryType === "E_GIFT" && (
              <p className="text-xs text-green-600 mt-1">Free delivery via email</p>
            )}
          </div>

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={purchaseLoading || !form.recipientName.trim()}
            className="w-full bg-orange-600 hover:bg-orange-700 text-white"
          >
            {purchaseLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              `Send Gift Card — ₹${form.amount.toLocaleString()}`
            )}
          </Button>

          <p className="text-xs text-gray-400 text-center mt-3">
            Gift card will be valid for 1 year from delivery
          </p>
        </div>
      </div>
    </div>
  );
}
