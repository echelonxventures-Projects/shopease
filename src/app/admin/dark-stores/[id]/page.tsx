"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import {
  getDarkStoreDetail,
  getDarkStoreInventory,
  getPickLists,
  getPackStationStatus,
} from "@/server/actions/dark-store-actions";
import { PickList } from "@/components/admin/dark-store/PickList";
import { PackStation } from "@/components/admin/dark-store/PackStation";
import {
  Loader2,
  Package,
  ClipboardList,
  Box,
  BarChart3,
} from "lucide-react";

import { toast } from "sonner";

export default function DarkStoreDetailPage() {
  const params = useParams();
  const storeId = params.id as string;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [store, setStore] = useState<any>(null);
  const [tab, setTab] = useState<"inventory" | "picklists" | "packstations" | "performance">("inventory");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [inventory, setInventory] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [pickItems, setPickItems] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [packOrders, setPackOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    getDarkStoreDetail(storeId)
      .then(setStore)
      .catch(() => toast.error("Failed to load dark store"))
      .finally(() => setLoading(false));
  }, [storeId]);

  useEffect(() => {
    if (!store) return;
    setTabLoading(true);

    if (tab === "inventory") {
      getDarkStoreInventory(storeId)
        .then(setInventory)
        .catch(() => {})
        .finally(() => setTabLoading(false));
    } else if (tab === "picklists") {
      getPickLists(storeId)
        .then(setPickItems)
        .catch(() => {})
        .finally(() => setTabLoading(false));
    } else if (tab === "packstations") {
      getPackStationStatus(storeId)
        .then(setPackOrders)
        .catch(() => {})
        .finally(() => setTabLoading(false));
    } else {
      setTabLoading(false);
    }
  }, [tab, store, storeId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="p-6 text-center text-gray-500">Dark store not found</div>
    );
  }

  const tabs = [
    { key: "inventory" as const, icon: Package, label: "Inventory" },
    { key: "picklists" as const, icon: ClipboardList, label: "Pick Lists" },
    { key: "packstations" as const, icon: Box, label: "Pack Stations" },
    { key: "performance" as const, icon: BarChart3, label: "Performance" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{store.name}</h1>
      <p className="text-sm text-gray-500 mb-6">
        {store.code} &middot; {store.zone?.name} &middot; {store.addressLine || "No address"}
      </p>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Inventory Items</p>
          <p className="text-2xl font-bold">{store.stats?.inventoryCount || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Pending Orders</p>
          <p className="text-2xl font-bold text-orange-600">{store.stats?.pendingOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Active Pickers</p>
          <p className="text-2xl font-bold text-green-600">{store.stats?.activePickers || 0}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
              tab === t.key
                ? "border-blue-600 text-blue-600 font-bold"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {tabLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {tab === "inventory" && (
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Inventory ({inventory.length} items)</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="text-left p-3">Product</th>
                        <th className="text-left p-3">SKU</th>
                        <th className="text-left p-3">Quantity</th>
                        <th className="text-left p-3">Avg Cost</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map((item) => (
                        <tr key={item.id} className="border-b hover:bg-gray-50">
                          <td className="p-3 font-medium">{item.product?.name}</td>
                          <td className="p-3 text-gray-500">{item.product?.sku}</td>
                          <td className="p-3">{item.quantity}</td>
                          <td className="p-3">₹{item.avgCost?.toFixed(2)}</td>
                          <td className="p-3">
                            {item.lowStock ? (
                              <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-700">Low Stock</span>
                            ) : (
                              <span className="px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">In Stock</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {inventory.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-gray-500">
                            No inventory at this location.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {tab === "picklists" && (
              <PickList items={pickItems} storeId={storeId} onRefresh={() => {
                getPickLists(storeId).then(setPickItems);
              }} />
            )}

            {tab === "packstations" && (
              <PackStation orders={packOrders} storeId={storeId} onRefresh={() => {
                getPackStationStatus(storeId).then(setPackOrders);
              }} />
            )}

            {tab === "performance" && (
              <div className="p-6">
                <h2 className="text-lg font-bold mb-4">Performance Metrics</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-blue-600">{store.stats?.inventoryCount || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Total SKUs</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-green-600">{store.stats?.activePickers || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">Active Staff</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-orange-600">{store.stats?.pendingOrders || 0}</p>
                    <p className="text-sm text-gray-500 mt-1">In Queue</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold">
                      {store.inventoryCapacity?.toLocaleString("en-IN")}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">Max Capacity</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
