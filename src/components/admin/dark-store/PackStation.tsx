"use client";

import { useState } from "react";
import { Box, Printer, CheckCircle, Loader2, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PackOrder {
  id: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemCount: number;
  items: { name?: string; productName?: string; quantity?: number }[];
  agentName: string;
  pickedUpAt: string | null;
  estimatedEta: string | null;
  packed: boolean;
  labelGenerated: boolean;
}

interface PackStationProps {
  orders: PackOrder[];
  storeId: string;
  onRefresh: () => void;
}

export function PackStation({ orders, storeId, onRefresh }: PackStationProps) {
  const [packedOrders, setPackedOrders] = useState<Set<string>>(new Set());
  const [labeledOrders, setLabeledOrders] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<string | null>(null);

  const handlePack = async (order: PackOrder) => {
    setProcessing(order.id);

    // Simulate packing operation
    await new Promise((resolve) => setTimeout(resolve, 500));

    const next = new Set(packedOrders);
    next.add(order.id);
    setPackedOrders(next);
    setProcessing(null);
    toast.success(`Order ${order.orderNumber} packed`);
  };

  const handleGenerateLabel = async (order: PackOrder) => {
    setProcessing(`label-${order.id}`);

    // Simulate label generation
    await new Promise((resolve) => setTimeout(resolve, 300));

    const next = new Set(labeledOrders);
    next.add(order.id);
    setLabeledOrders(next);
    setProcessing(null);
    toast.success(`Label generated for ${order.orderNumber}`);
  };

  const unpackedOrders = orders.filter((o) => !packedOrders.has(o.id));
  const packedCount = packedOrders.size;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Pack Station</h2>
          <p className="text-sm text-gray-500">
            {packedCount} of {orders.length} orders packed
          </p>
        </div>
      </div>

      {/* Progress */}
      {orders.length > 0 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${orders.length > 0 ? (packedCount / orders.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Box className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No orders ready for packing.</p>
          <p className="text-sm">Orders will appear here after picking is complete.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unpackedOrders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600" />
                    <span className="font-bold">{order.orderNumber}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Customer: {order.customerName}
                    {order.customerPhone && ` (${order.customerPhone})`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Agent: {order.agentName}
                  </p>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</p>
                  {order.pickedUpAt && (
                    <p className="text-xs">Picked: {new Date(order.pickedUpAt).toLocaleTimeString("en-IN")}</p>
                  )}
                </div>
              </div>

              {/* Items list */}
              <div className="bg-gray-50 rounded p-2 mb-3">
                {order.items.slice(0, 3).map((item, idx: number) => (
                  <div key={idx} className="text-xs text-gray-600 py-0.5">
                    {item.quantity || 1}x {item.name || item.productName || "Item"}
                  </div>
                ))}
                {order.items.length > 3 && (
                  <div className="text-xs text-gray-400">+{order.items.length - 3} more</div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={() => handlePack(order)}
                  disabled={processing === order.id}
                >
                  {processing === order.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-1" />
                  )}
                  Pack Order
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleGenerateLabel(order)}
                  disabled={processing === `label-${order.id}`}
                >
                  {processing === `label-${order.id}` ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-1" />
                  ) : (
                    <Printer className="w-4 h-4 mr-1" />
                  )}
                  Generate Label
                </Button>
              </div>

              {/* Status indicators */}
              {(packedOrders.has(order.id) || labeledOrders.has(order.id)) && (
                <div className="flex gap-2 mt-2">
                  {packedOrders.has(order.id) && (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                      Packed
                    </span>
                  )}
                  {labeledOrders.has(order.id) && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                      Label Generated
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Packed summary */}
          {packedCount > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-green-600 font-medium">
                ✓ {packedCount} order{packedCount !== 1 ? "s" : ""} packed and ready for dispatch
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
