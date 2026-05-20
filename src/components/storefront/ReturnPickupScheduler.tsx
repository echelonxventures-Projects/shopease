"use client";

import React, { useState } from "react";
import { createReturnRequest } from "@/server/actions/return-actions";
import { Truck, Calendar, MapPin, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface ReturnPickupSchedulerProps {
  orderId: string;
  productId: string;
  productName: string;
}

const STATUS_STEPS = [
  { key: "REQUESTED", label: "Requested" },
  { key: "PICKED_UP", label: "Picked Up" },
  { key: "IN_TRANSIT", label: "In Transit" },
  { key: "QUALITY_CHECK", label: "Quality Check" },
  { key: "REFUNDED", label: "Refunded" },
];

const STEP_ICONS: Record<string, React.ReactElement> = {
  REQUESTED: <FileText className="w-4 h-4" />,
  PICKED_UP: <Truck className="w-4 h-4" />,
  IN_TRANSIT: <Truck className="w-4 h-4" />,
  QUALITY_CHECK: <FileText className="w-4 h-4" />,
  REFUNDED: <FileText className="w-4 h-4" />,
};

export function ReturnPickupScheduler({ orderId, productId, productName }: ReturnPickupSchedulerProps) {
  const [reason, setReason] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [step, setStep] = useState<"form" | "success">("form");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error("Please provide a reason for return");
      return;
    }
    setLoading(true);
    try {
      await createReturnRequest({ orderId, productId, reason, preferredDate, pickupAddress });
      setStep("success");
      toast.success("Return request submitted!");
    } catch (err: any) {
      toast.error(err.message || "Failed to create return request");
    } finally {
      setLoading(false);
    }
  };

  if (step === "success") {
    return (
      <div className="border rounded-lg p-6 bg-green-50 text-center space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <FileText className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="font-bold text-green-800">Return Request Submitted!</h3>
        <p className="text-sm text-gray-600">
          We&apos;ll send a pickup notification soon. You can track the status below.
        </p>
        <div className="flex items-center justify-center gap-1 text-sm text-gray-500 mt-4">
          {STATUS_STEPS.map((s, i) => (
            <div key={s.key} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                s.key === "REQUESTED" ? "bg-green-600 text-white" : "bg-gray-200"
              }`}>
                {STEP_ICONS[s.key] || <FileText className="w-4 h-4" />}
              </div>
              {i < STATUS_STEPS.length - 1 && <div className="w-6 h-0.5 bg-gray-200" />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          {STATUS_STEPS.map((s) => (
            <span key={s.key}>{s.label}</span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="border rounded-lg p-6 space-y-4">
      <h3 className="font-bold text-lg">Schedule Return Pickup</h3>
      <p className="text-sm text-gray-600">Product: <strong>{productName}</strong></p>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 block">Reason for Return *</label>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Defective, Wrong item, Not as described, etc."
          className="w-full border rounded-md p-2 text-sm min-h-[80px] resize-y"
          maxLength={500}
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4" /> Preferred Pickup Date
        </label>
        <Input
          type="date"
          value={preferredDate}
          onChange={(e) => setPreferredDate(e.target.value)}
          min={new Date().toISOString().split("T")[0]}
          className="max-w-xs"
        />
      </div>

      <div>
        <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Pickup Address
        </label>
        <Input
          value={pickupAddress}
          onChange={(e) => setPickupAddress(e.target.value)}
          placeholder="Delivery address for pickup (if different from default)"
        />
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
        <p className="font-medium">Return Policy</p>
        <p>Items must be in original condition with tags attached. Refund will be processed within 5-7 business days after pickup.</p>
      </div>

      <Button onClick={handleSubmit} disabled={loading || !reason.trim()} className="w-full">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
        Schedule Pickup
      </Button>
    </div>
  );
}
