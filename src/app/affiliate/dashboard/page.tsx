"use client";

export default function AffiliateDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Affiliate Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow p-5"><p className="text-sm text-gray-500">Total Clicks</p><p className="text-2xl font-bold">—</p></div>
        <div className="bg-white rounded-lg shadow p-5"><p className="text-sm text-gray-500">Conversions</p><p className="text-2xl font-bold">—</p></div>
        <div className="bg-white rounded-lg shadow p-5"><p className="text-sm text-gray-500">Pending Commission</p><p className="text-2xl font-bold">—</p></div>
        <div className="bg-white rounded-lg shadow p-5"><p className="text-sm text-gray-500">Total Earned</p><p className="text-2xl font-bold">—</p></div>
      </div>
      <p className="text-gray-500">Generate referral links, track conversions, and manage your payouts.</p>
    </div>
  );
}
