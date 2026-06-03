"use client";

import { useState, useEffect } from "react";
import { getDarkStores } from "@/server/actions/dark-store-actions";
import {
  getMicroFulfillmentCenters,
  createMicroFulfillmentCenter,
  updateMicroFulfillmentCenter,
  getDeliveryZones,
} from "@/server/actions/delivery-actions";


import {
  Loader2,
  Package,
  Edit,
  Save,
  X,
  Plus,
  ShoppingBag,
  Users,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function DarkStoresPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [stores, setStores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const data = await getDarkStores();
      setStores(data);
    } catch {
      toast.error("Failed to load dark stores");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Dark Stores (Micro-Fulfillment Centers)</h1>
      </div>

      {/* Store Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stores.map((store) => (
          <Link
            key={store.id}
            href={`/admin/dark-stores/${store.id}`}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-bold text-lg">{store.name}</h3>
                <p className="text-sm text-gray-500">{store.code || store.zone?.name}</p>
              </div>
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
                  store.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {store.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            {store.addressLine && (
              <div className="flex items-start gap-1 text-sm text-gray-600 mb-3">
                <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{store.addressLine}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                  <Package className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold">{store.stats?.inventoryCount || 0}</p>
                <p className="text-xs text-gray-500">Items</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-orange-600 mb-1">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold">{store.stats?.pendingOrders || 0}</p>
                <p className="text-xs text-gray-500">Pending</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center gap-1 text-green-600 mb-1">
                  <Users className="w-4 h-4" />
                </div>
                <p className="text-xl font-bold">{store.stats?.activePickers || 0}</p>
                <p className="text-xs text-gray-500">Pickers</p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t text-xs text-gray-500 flex justify-between">
              <span>Capacity: {store.inventoryCapacity?.toLocaleString("en-IN")}</span>
              <span>{store.contactPhone || "No phone"}</span>
            </div>
          </Link>
        ))}
      </div>

      {stores.length === 0 && (
        <div className="text-center py-16 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-lg">No dark stores configured yet.</p>
          <p className="text-sm">Create one from the delivery zones page.</p>
        </div>
      )}
    </div>
  );
}
