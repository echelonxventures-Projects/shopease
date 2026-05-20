"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { getDashboardStats, getSalesData } from "@/server/actions/admin-actions";
import { getProducts } from "@/server/actions/product-actions";
import { StatCard } from "@/components/admin/StatCard";
import Link from "next/link";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [salesData, setSalesData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || !session) {
      window.location.href = "/auth/login?callbackUrl=/admin/dashboard";
      return;
    }

    getDashboardStats()
      .then((s) => {
        setStats(s);
        return getSalesData().catch(() => []);
      })
      .then((sd) => {
        setSalesData(sd);
        return getProducts({ sort: "popular", limit: 5 });
      })
      .then((r) => setTopProducts(r.products))
      .catch((err) => {
        if (err.message === "Unauthorized") {
          window.location.href = "/auth/login?callbackUrl=/admin/dashboard";
          return;
        }
        setError(err.message || "Failed to load dashboard");
      });
  }, [session, status]);

  if (status === "loading" || !stats) return <div className="p-6 text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} icon="💰" color="bg-green-100" />
        <StatCard title="Total Orders" value={stats.totalOrders} icon="🛒" color="bg-blue-100" />
        <StatCard title="Customers" value={stats.totalCustomers} icon="👥" color="bg-purple-100" />
        <StatCard title="Pending Orders" value={stats.pendingOrders} icon="⏳" color="bg-yellow-100" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">Top Products</h2>
            <Link href="/admin/products" className="text-sm text-blue-600 hover:underline">View All</Link>
          </div>
          {topProducts.length > 0 ? (
            <div className="space-y-3">
              {topProducts.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <span className="text-sm">{p.name}</span>
                  <span className="text-sm font-medium">₹{Number(p.price).toLocaleString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No products yet</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Low Stock Alert</h2>
          {stats.lowStockProducts > 0 ? (
            <p className="text-orange-600">{stats.lowStockProducts} products are running low on stock</p>
          ) : (
            <p className="text-green-600">All products are well stocked</p>
          )}
        </div>
      </div>
    </div>
  );
}
