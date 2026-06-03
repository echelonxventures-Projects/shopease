"use client";

import { useState, useEffect } from "react";
import {
  getAllSupplierListings,
  approveSupplierListing,
  rejectSupplierListing,
} from "@/server/actions/product-master-actions";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { CheckCircle, XCircle, Users, AlertTriangle } from "lucide-react";

interface Listing {
  id: string;
  productId: string;
  listingPrice: number;
  comparePrice?: number;
  quantity: number;
  status: string;
  listingSku?: string;
  description?: string;
  enabledAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  supplier: { id: string; name: string; code: string };
  product: {
    id: string;
    name: string;
    slug: string;
    price: number;
    masterStatus: string;
    category?: { name: string };
  };
}

export default function AdminSupplierListingsPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await getAllSupplierListings({ status, limit: 100 });
      setListings(res.listings as Listing[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  const statusColor = (s: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      DRAFT: "bg-yellow-100 text-yellow-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      OUT_OF_STOCK: "bg-red-100 text-red-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return colors[s] || "bg-gray-100 text-gray-800";
  };

  const stats = {
    total: listings.length,
    active: listings.filter((l) => l.status === "ACTIVE").length,
    draft: listings.filter((l) => l.status === "DRAFT").length,
    rejected: listings.filter((l) => l.status === "REJECTED").length,
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="w-6 h-6" />
          Supplier Product Listings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage all supplier-enabled product listings for the marketplace
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-gray-500">Total Listings</div>
        </div>
        <div className="bg-green-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-green-700">{stats.active}</div>
          <div className="text-sm text-green-600">Active</div>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-yellow-700">{stats.draft}</div>
          <div className="text-sm text-yellow-600">Draft</div>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <div className="text-2xl font-bold text-red-700">{stats.rejected}</div>
          <div className="text-sm text-red-600">Rejected</div>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-4">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="INACTIVE">Inactive</option>
          <option value="OUT_OF_STOCK">Out of Stock</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Listings Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Product</th>
              <th className="text-left p-3 text-sm font-medium">Supplier</th>
              <th className="text-right p-3 text-sm font-medium">List Price</th>
              <th className="text-right p-3 text-sm font-medium">Master Price</th>
              <th className="text-center p-3 text-sm font-medium">Qty</th>
              <th className="text-center p-3 text-sm font-medium">Status</th>
              <th className="text-center p-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : listings.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No listings found</td></tr>
            ) : (
              listings.map((l) => (
                <tr key={l.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{l.product?.name}</div>
                    <div className="text-xs text-gray-500">{l.product?.category?.name || "-"}</div>
                    {l.rejectionReason && (
                      <div className="flex items-center gap-1 text-xs text-red-500 mt-1">
                        <AlertTriangle className="w-3 h-3" />
                        {l.rejectionReason}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-sm">
                    <div>{l.supplier?.name}</div>
                    <div className="text-xs text-gray-500">{l.supplier?.code}</div>
                  </td>
                  <td className="p-3 text-right font-medium">
                    ₹{Number(l.listingPrice).toLocaleString("en-IN")}
                    {l.comparePrice && (
                      <div className="text-xs text-gray-400 line-through">
                        ₹{Number(l.comparePrice).toLocaleString("en-IN")}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right text-sm">
                    ₹{l.product?.price?.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3 text-center">{l.quantity.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(l.status)}`}>
                      {l.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {l.status === "DRAFT" && (
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            await approveSupplierListing(l.id);
                            toast.success("Listing approved");
                            load();
                          }}
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </Button>
                        <RejectButton listingId={l.id} onSuccess={load} />
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function RejectButton({ listingId, onSuccess }: { listingId: string; onSuccess: () => void }) {
  const [show, setShow] = useState(false);
  const [reason, setReason] = useState("");

  if (!show) {
    return (
      <Button variant="ghost" size="sm" onClick={() => setShow(true)}>
        <XCircle className="w-4 h-4 text-red-500" />
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Reason..."
        className="border rounded px-2 py-1 text-xs w-32"
      />
      <Button
        variant="ghost"
        size="sm"
        disabled={!reason.trim()}
        onClick={async () => {
          await rejectSupplierListing(listingId, reason.trim());
          toast.success("Listing rejected");
          onSuccess();
          setShow(false);
        }}
      >
        <XCircle className="w-4 h-4 text-red-500" />
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setShow(false)}>
        ✕
      </Button>
    </div>
  );
}
