"use client";

import { useState, useEffect } from "react";
import { listPriceAlerts, cancelPriceAlert } from "@/server/actions/commerce-actions";
import { Button } from "@/components/ui/button";
import { BellOff, Package, Loader2, Tag } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface PriceAlert {
  id: string;
  productId: string;
  targetPrice: number | string;
  isActive: boolean;
  createdAt: string;
  product: {
    name: string;
    price: number | string;
  };
}

export default function PriceAlertsPage() {
  const [alerts, setAlerts] = useState<PriceAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAlerts = async () => {
    try {
      const data: any = await listPriceAlerts();
      setAlerts(data.map((a: any) => ({
        ...a,
        targetPrice: Number(a.targetPrice),
        product: { ...a.product, price: Number(a.product.price) },
      })));
    } catch {
      toast.error("Failed to load alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAlerts(); }, []);

  const handleCancel = async (id: string) => {
    try {
      await cancelPriceAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      toast.success("Alert cancelled");
    } catch {
      toast.error("Failed to cancel alert");
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Price Alerts</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Price Alerts</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      ) : alerts.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">No active price alerts</h3>
          <p className="text-sm text-gray-400 mt-2">Set price alerts on any product page to get notified when prices drop.</p>
          <Link href="/products" className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 mt-4">
            Browse Products
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => {
            const currentPrice = Number(alert.product.price);
            const targetPrice = Number(alert.targetPrice);
            const isBelow = currentPrice <= targetPrice;
            const dropPercent = Math.round(((targetPrice - currentPrice) / targetPrice) * 100);

            return (
              <div key={alert.id} className={`border rounded-lg p-4 flex items-center gap-4 ${isBelow ? "bg-green-50 border-green-200" : "bg-white"}`}>
                <Package className="w-8 h-8 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${alert.productId}`} className="font-semibold text-blue-600 hover:underline truncate block">
                    {alert.product.name}
                  </Link>
                  <div className="flex items-center gap-3 mt-1 text-sm">
                    <span className="text-gray-500">Current: ₹{currentPrice.toLocaleString()}</span>
                    <Tag className="w-3.5 h-3.5 text-gray-400" />
                    <span className="text-green-600 font-medium">Target: ₹{targetPrice.toLocaleString()}</span>
                  </div>
                  {isBelow && (
                    <span className="inline-block mt-1 text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded font-semibold">
                      Price dropped {dropPercent}%!
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancel(alert.id)}
                  className="shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <BellOff className="w-4 h-4" />
                  <span className="ml-1 hidden sm:inline">Cancel</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
