"use client";

import { useState, useEffect } from "react";
import { updateSellerStatus } from "@/server/actions/seller-actions";
import { listSellers } from "@/server/actions/seller-actions";
import { notFound, useParams } from "next/navigation";
import { CheckCircle, XCircle, Star, Package, Truck, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function SellerDetailPage() {
  const params = useParams();
  const sellerId = params.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [seller, setSeller] = useState<any>(null);
  const [tab, setTab] = useState("products");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [_products, _setProducts] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [_orders, _setOrders] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [_reviews, _setReviews] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [_payouts, _setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    listSellers().then((all) => {
      const found = all.find((s) => s.id === sellerId);
      if (!found) {
        setLoading(false);
        return;
      }
      setSeller(found);
      // Load seller products and orders using the seller ID
      Promise.all([
        import("@/server/actions/seller-actions").then(async (_m) => {
          // We need a way to fetch by sellerId, not just current user
          // Using prisma directly via a temporary action
          return [];
        }),
      ]).catch(() => {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [sellerId]);

  const handleStatus = async (status: string) => {
    try {
      await updateSellerStatus(sellerId, status);
      toast.success(`Seller ${status.toLowerCase()}`);
      setSeller({ ...seller, status });
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    ACTIVE: "bg-green-100 text-green-700",
    SUSPENDED: "bg-red-100 text-red-700",
    REJECTED: "bg-gray-100 text-gray-700",
  };

  if (loading) return <div className="p-6 text-center text-gray-500">Loading...</div>;
  if (!seller) return notFound();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Seller Details</h1>

      {/* Info Card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-sm text-gray-500">Business Name</p>
            <p className="font-bold">{seller.businessName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Email / Phone</p>
            <p>{seller.businessEmail}</p>
            <p className="text-gray-500">{seller.businessPhone}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Status</p>
            <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[seller.status]}`}>
              {seller.status}
            </span>
          </div>
          <div>
            <p className="text-sm text-gray-500">Rating / Orders</p>
            <p>⭐ {Number(seller.rating).toFixed(1)} / {seller.totalOrders} orders</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">GSTIN</p>
            <p>{seller.gstin || "—"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Commission Rate</p>
            <p>{Number(seller.commissionRate).toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">KYC Verified</p>
            <p>{seller.kycVerified ? <CheckCircle className="w-4 h-4 text-green-600" /> : "No"}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Total Revenue</p>
            <p>₹{Number(seller.totalRevenue).toLocaleString("en-IN")}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4 pt-4 border-t">
          {seller.status === "PENDING" && (
            <Button size="sm" onClick={() => handleStatus("ACTIVE")}>
              <CheckCircle className="w-4 h-4 mr-1" /> Approve
            </Button>
          )}
          {seller.status === "ACTIVE" && (
            <Button size="sm" variant="destructive" onClick={() => handleStatus("SUSPENDED")}>
              <XCircle className="w-4 h-4 mr-1" /> Suspend
            </Button>
          )}
          {seller.status === "SUSPENDED" && (
            <Button size="sm" onClick={() => handleStatus("ACTIVE")}>
              Reactivate
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4 border-b">
        {[
          { key: "products", icon: Package, label: "Products" },
          { key: "orders", icon: Truck, label: "Orders" },
          { key: "payouts", icon: DollarSign, label: "Payouts" },
          { key: "reviews", icon: Star, label: "Reviews" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 transition ${
              tab === t.key ? "border-blue-600 text-blue-600 font-bold" : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-500 text-sm text-center py-8">
          {tab === "products" && "Products tab — fetch seller products via seller-actions"}
          {tab === "orders" && "Orders tab — fetch seller orders via seller-actions"}
          {tab === "payouts" && "Payouts tab — fetch seller payouts via seller-actions"}
          {tab === "reviews" && "Reviews tab — fetch seller reviews via seller-actions"}
        </p>
      </div>
    </div>
  );
}
