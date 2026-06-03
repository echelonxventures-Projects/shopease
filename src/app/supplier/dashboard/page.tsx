"use client";

export default function SupplierDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Supplier Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5"><p className="text-sm text-gray-500">Active Listings</p><p className="text-2xl font-bold">—</p></div>
        <div className="bg-white rounded-lg shadow p-5"><p className="text-sm text-gray-500">Pending POs</p><p className="text-2xl font-bold">—</p></div>
        <div className="bg-white rounded-lg shadow p-5"><p className="text-sm text-gray-500">Returns</p><p className="text-2xl font-bold">—</p></div>
        <div className="bg-white rounded-lg shadow p-5"><p className="text-sm text-gray-500">Total Earnings</p><p className="text-2xl font-bold">—</p></div>
      </div>
      <p className="text-gray-500">Manage your product listings, fulfill purchase orders, and track payments.</p>
    </div>
  );
}
