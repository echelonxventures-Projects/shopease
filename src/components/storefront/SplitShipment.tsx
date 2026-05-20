"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Truck, MapPin, Plus, Trash2, Package, ChevronRight } from "lucide-react";

interface ShipmentItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

interface Shipment {
  id: string;
  label: string;
  items: ShipmentItem[];
  address: {
    name: string;
    phone: string;
    line1: string;
    line2: string;
    city: string;
    state: string;
    pincode: string;
  };
  shippingMethod: string;
  status: string;
}

interface SplitShipmentProps {
  cartItems: Array<{
    id: string;
    productName: string;
    quantity: number;
    price: number;
    sellerId?: string;
  }>;
}

export function SplitShipment({ cartItems }: SplitShipmentProps) {
  const [shipments, setShipments] = useState<Shipment[]>([
    {
      id: "1",
      label: "Shipment 1",
      items: cartItems.map((item) => ({
        productId: item.id,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
      })),
      address: { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" },
      shippingMethod: "STANDARD",
      status: "PENDING",
    },
  ]);

  const shippingMethods = [
    { id: "STANDARD", label: "Standard (5-7 days)", price: 40 },
    { id: "EXPRESS", label: "Express (2-3 days)", price: 99 },
    { id: "SAME_DAY", label: "Same Day", price: 199 },
  ];

  const addShipment = () => {
    setShipments([
      ...shipments,
      {
        id: String(Date.now()),
        label: `Shipment ${shipments.length + 1}`,
        items: [],
        address: { name: "", phone: "", line1: "", line2: "", city: "", state: "", pincode: "" },
        shippingMethod: "STANDARD",
        status: "PENDING",
      },
    ]);
  };

  const removeShipment = (id: string) => {
    if (shipments.length <= 1) return;
    setShipments(shipments.filter((s) => s.id !== id));
  };

  const updateAddress = (shipmentId: string, field: string, value: string) => {
    setShipments(shipments.map((s) =>
      s.id === shipmentId ? { ...s, address: { ...s.address, [field]: value } } : s
    ));
  };

  const moveItem = (shipmentId: string, productId: string, toShipmentId: string) => {
    const fromShipment = shipments.find((s) => s.id === shipmentId);
    const item = fromShipment?.items.find((i) => i.productId === productId);
    if (!item || !fromShipment) return;

    setShipments(shipments.map((s) => {
      if (s.id === shipmentId) {
        return { ...s, items: s.items.filter((i) => i.productId !== productId) };
      }
      if (s.id === toShipmentId) {
        return { ...s, items: [...s.items, item] };
      }
      return s;
    }));
  };

  const totalShipping = shipments.reduce((sum, s) => {
    const method = shippingMethods.find((m) => m.id === s.shippingMethod);
    return sum + (method?.price || 40);
  }, 0);

  const totalItems = shipments.reduce((sum, s) => sum + s.items.reduce((is, i) => is + i.quantity, 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5" />
          <h2 className="font-bold text-lg">Split Shipment</h2>
          <span className="text-sm text-gray-500">({shipments.length} shipments, {totalItems} items)</span>
        </div>
        <Button onClick={addShipment} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-1" /> Add Shipment
        </Button>
      </div>

      {shipments.map((shipment, idx) => (
        <div key={shipment.id} className="bg-white rounded-xl shadow border overflow-hidden">
          {/* Header */}
          <div className="bg-gray-50 px-5 py-3 flex justify-between items-center border-b">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="font-medium">{shipment.label}</span>
              <span className="text-xs text-gray-500">({shipment.items.length} items)</span>
            </div>
            {shipments.length > 1 && (
              <Button variant="ghost" size="sm" onClick={() => removeShipment(shipment.id)}>
                <Trash2 className="w-4 h-4 text-red-500" />
              </Button>
            )}
          </div>

          <div className="p-5">
            {/* Items */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Items in this shipment</label>
              {shipment.items.length === 0 ? (
                <p className="text-sm text-gray-400 py-3 text-center border border-dashed rounded-lg">
                  No items added. Move items from other shipments.
                </p>
              ) : (
                <div className="space-y-2">
                  {shipment.items.map((item) => (
                    <div key={item.productId} className="flex justify-between items-center bg-gray-50 px-3 py-2 rounded-lg">
                      <span className="text-sm font-medium">{item.productName}</span>
                      <span className="text-sm text-gray-500">
                        ×{item.quantity} · ₹{(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Shipping Method */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 block">Shipping Method</label>
              <select
                value={shipment.shippingMethod}
                onChange={(e) => setShipments(shipments.map((s) =>
                  s.id === shipment.id ? { ...s, shippingMethod: e.target.value } : s
                ))}
                className="border rounded-md p-2 w-full"
              >
                {shippingMethods.map((m) => (
                  <option key={m.id} value={m.id}>{m.label} — ₹{m.price}</option>
                ))}
              </select>
            </div>

            {/* Delivery Address */}
            <div className="mb-4">
              <label className="text-sm font-medium mb-2 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Delivery Address
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Full Name" value={shipment.address.name} onChange={(e: any) => updateAddress(shipment.id, "name", e.target.value)} />
                <Input placeholder="Phone" value={shipment.address.phone} onChange={(e: any) => updateAddress(shipment.id, "phone", e.target.value)} />
                <Input placeholder="Address Line 1" value={shipment.address.line1} onChange={(e: any) => updateAddress(shipment.id, "line1", e.target.value)} className="col-span-2" />
                <Input placeholder="Address Line 2" value={shipment.address.line2} onChange={(e: any) => updateAddress(shipment.id, "line2", e.target.value)} className="col-span-2" />
                <Input placeholder="City" value={shipment.address.city} onChange={(e: any) => updateAddress(shipment.id, "city", e.target.value)} />
                <Input placeholder="State" value={shipment.address.state} onChange={(e: any) => updateAddress(shipment.id, "state", e.target.value)} />
                <Input placeholder="Pincode" value={shipment.address.pincode} onChange={(e: any) => updateAddress(shipment.id, "pincode", e.target.value)} />
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Summary */}
      <div className="bg-gray-50 rounded-xl p-5">
        <div className="flex justify-between mb-2">
          <span>Subtotal</span>
          <span>₹{cartItems.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2)}</span>
        </div>
        <div className="flex justify-between mb-2">
          <span>Shipping ({shipments.length} shipments)</span>
          <span>₹{totalShipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg border-t pt-3 mt-3">
          <span>Total</span>
          <span>{(cartItems.reduce((s, i) => s + i.price * i.quantity, 0) + totalShipping).toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
