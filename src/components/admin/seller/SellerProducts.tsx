"use client";

import { useState, useEffect } from "react";
import { getSellerProducts } from "@/server/actions/seller-portal-actions";
import { CheckCircle, XCircle, Package, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface SellerProductsProps {
  sellerId: string;
}

interface SellerProduct {
  id: string;
  sku?: string | null;
  costPrice?: number | string | null;
  status: string;
  product?: { name: string; sku?: string | null; price?: number | string; stock?: number } | null;
}

export function SellerProducts({ sellerId }: SellerProductsProps) {
  const [products, setProducts] = useState<SellerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    getSellerProducts(sellerId)
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, [sellerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    ACTIVE: "bg-green-100 text-green-700",
    INACTIVE: "bg-gray-100 text-gray-600",
    REJECTED: "bg-red-100 text-red-700",
    PENDING: "bg-yellow-100 text-yellow-700",
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
        <Package className="w-5 h-5" /> Seller Products ({products.length})
      </h3>

      {products.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-8">No products listed by this seller.</p>
      ) : (
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">Product</th>
              <th className="text-left p-3">SKU</th>
              <th className="text-left p-3">Price</th>
              <th className="text-left p-3">Stock</th>
              <th className="text-left p-3">Cost Price</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((sp) => (
              <tr key={sp.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{sp.product?.name || "Unknown"}</td>
                <td className="p-3 text-gray-500">{sp.sku || sp.product?.sku || "—"}</td>
                <td className="p-3">₹{sp.product?.price ? Number(sp.product.price).toFixed(0) : "—"}</td>
                <td className="p-3">{sp.product?.stock ?? "—"}</td>
                <td className="p-3">{sp.costPrice ? `₹${Number(sp.costPrice).toFixed(0)}` : "—"}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[sp.status] || "bg-gray-100"}`}>
                    {sp.status}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    {sp.status === "PENDING" && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActionLoading(sp.id);
                            toast.success("Product approved");
                            setProducts(products.map((p) => p.id === sp.id ? { ...p, status: "ACTIVE" } : p));
                            setActionLoading(null);
                          }}
                          disabled={actionLoading === sp.id}
                        >
                          <CheckCircle className="w-3 h-3 text-green-600" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setActionLoading(sp.id);
                            toast.success("Product rejected");
                            setProducts(products.map((p) => p.id === sp.id ? { ...p, status: "REJECTED" } : p));
                            setActionLoading(null);
                          }}
                          disabled={actionLoading === sp.id}
                        >
                          <XCircle className="w-3 h-3 text-red-600" />
                        </Button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
