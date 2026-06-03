"use client";

import { useState, useEffect } from "react";
import { getSellerAnalytics, getSellerOrders, getSellerReviews } from "@/server/actions/seller-actions";
import { BarChart, Users, DollarSign, Star, Truck, TrendingUp, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SellerDashboardPage() {
  const [analytics, setAnalytics] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getSellerAnalytics().catch(() => null),
      getSellerOrders().catch(() => []),
      getSellerReviews("").catch(() => []),
    ])
      .then(([a, o, r]) => {
        setAnalytics(a);
        setOrders(o.slice(0, 10));
        setReviews(r.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const fulfillmentRate = analytics?.totalOrders
    ? Math.round(((analytics.deliveredOrders || 0) / analytics.totalOrders) * 100)
    : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-6">Seller Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg p-5 shadow border">
          <div className="flex items-center gap-3 mb-2">
            <BarChart className="w-5 h-5 text-blue-600" />
            <span className="text-sm text-gray-500">Total Orders</span>
          </div>
          <p className="text-3xl font-bold">{analytics?.totalOrders || 0}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow border">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-green-600" />
            <span className="text-sm text-gray-500">Revenue</span>
          </div>
          <p className="text-3xl font-bold">₹{Number(analytics?.totalRevenue || 0).toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-white rounded-lg p-5 shadow border">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-5 h-5 text-purple-600" />
            <span className="text-sm text-gray-500">Fulfillment Rate</span>
          </div>
          <p className="text-3xl font-bold">{fulfillmentRate}%</p>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full transition-all" style={{ width: `${fulfillmentRate}%` }} />
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 shadow border">
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-5 h-5 text-yellow-500" />
            <span className="text-sm text-gray-500">Seller Rating</span>
          </div>
          <p className="text-3xl font-bold">⭐ {analytics?.rating?.toFixed(1) || "0.0"}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Orders
            </h2>
            <Link href="/seller/payouts" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          <div className="divide-y">
            {orders.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No orders yet</p>
            ) : (
              orders.map((o: any) => (
                <div key={o.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{o.order?.orderNumber || "—"}</p>
                    <p className="text-xs text-gray-500">{new Date(o.createdAt).toLocaleDateString("en-IN")}</p>
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded ${
                    o.status === "DELIVERED" ? "bg-green-100 text-green-700"
                    : o.status === "SHIPPED" ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {o.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white rounded-lg shadow border">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-2">
              <Users className="w-5 h-5" />
              Customer Reviews
            </h2>
          </div>
          <div className="divide-y">
            {reviews.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No reviews yet</p>
            ) : (
              reviews.map((r: any) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{r.user?.name || "Anonymous"}</span>
                    <span className="text-yellow-400">{"★".repeat(r.rating)}</span>
                  </div>
                  {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
