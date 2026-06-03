"use client";

import { useEffect, useState } from "react";
import { listAllMemberships, getMembershipStats } from "@/server/actions/membership-actions";
import { Crown, Users, TrendingUp } from "lucide-react";

export default function PrimeAdminPage() {
  const [memberships, setMemberships] = useState<Awaited<ReturnType<typeof listAllMemberships>>>([]);
  const [stats, setStats] = useState<Awaited<ReturnType<typeof getMembershipStats>> | null>(null);
  const [filter, setFilter] = useState("ACTIVE");

  const load = () => {
    Promise.all([listAllMemberships({ status: filter || undefined }), getMembershipStats()]).then(
      ([m, s]) => { setMemberships(m); setStats(s); }
    );
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Crown className="w-6 h-6 text-amber-500" /> Prime Membership Admin
      </h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-blue-500" />
              <span className="text-sm text-gray-500">Total Members</span>
            </div>
            <p className="text-3xl font-bold">{stats.total}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              <span className="text-sm text-gray-500">Active</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.active}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-5">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="w-5 h-5 text-amber-500" />
              <span className="text-sm text-gray-500">By Tier</span>
            </div>
            <div className="space-y-1">
              {stats.byTier.map((t) => (
                <p key={t.tier} className="text-sm">
                  {t.tier === "PRIME_PLUS" ? "Prime Plus" : "Prime"}: <b>{t._count}</b>
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filter */}
      <div className="flex gap-2 mb-4">
        {["ACTIVE", "EXPIRED", "CANCELLED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              filter === s ? "bg-amber-500 text-white" : "bg-gray-100"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3">User</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Tier</th>
              <th className="text-left p-3">Status</th>
              <th className="text-left p-3">Auto Renew</th>
              <th className="text-left p-3">End Date</th>
            </tr>
          </thead>
          <tbody>
            {memberships.map((m) => (
              <tr key={m.id} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{m.user.name || "—"}</td>
                <td className="p-3">{m.user.email}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    m.tier === "PRIME_PLUS" ? "bg-purple-100 text-purple-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {m.tier === "PRIME_PLUS" ? "Prime Plus" : "Prime"}
                  </span>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs ${
                    m.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {m.status}
                  </span>
                </td>
                <td className="p-3">{m.autoRenew ? "Yes" : "No"}</td>
                <td className="p-3">{m.endDate ? new Date(m.endDate).toLocaleDateString("en-IN") : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {memberships.length === 0 && <div className="text-center py-12 text-gray-500">No memberships found</div>}
    </div>
  );
}
