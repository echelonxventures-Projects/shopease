"use client";

import { useEffect, useState } from "react";
import { getCohortRetention, getCohortRevenue } from "@/server/actions/conversion-actions";
import { Users, TrendingUp, Calendar } from "lucide-react";

export default function CohortAnalysisPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [retention, setRetention] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [revenue, setRevenue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getCohortRetention(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString(), 6),
      getCohortRevenue(new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1).toISOString(), 6),
    ]).then(([ret, rev]) => {
      setRetention(ret);
      setRevenue(rev);
      setLoading(false);
    });
  }, []);

  if (loading) return <p className="text-gray-500 px-6 py-4">Loading...</p>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Users className="w-7 h-7 text-purple-600" />
        Cohort Analysis
      </h1>

      {/* Retention Table */}
      <div className="bg-white rounded-xl border p-6 mb-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-purple-500" />
          Retention by Cohort
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Cohort</th>
                <th className="text-right py-2 px-3">Size</th>
                <th className="text-right py-2 px-3">Month 1</th>
                <th className="text-right py-2 px-3">Month 2</th>
                <th className="text-right py-2 px-3">Month 3</th>
              </tr>
            </thead>
            <tbody>
              {retention.map((c) => (
                <tr key={c.month} className="border-b">
                  <td className="py-2 px-3 font-medium">{c.month}</td>
                  <td className="text-right py-2 px-3">{c.cohortSize}</td>
                  {Array.from({ length: 3 }).map((_, i) => {
                    const ret = c.retention[i];
                    return (
                      <td key={i} className="text-right py-2 px-3">
                        {ret ? (
                          <span className={parseFloat(ret.rate) > 30 ? "text-green-600 font-bold" : "text-red-500"}>
                            {ret.rate}%
                          </span>
                        ) : (
                          <span className="text-gray-300">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Revenue by Cohort */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-green-500" />
          Revenue by Cohort
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-3">Cohort</th>
                <th className="text-right py-2 px-3">Total Revenue</th>
                <th className="text-right py-2 px-3">Avg Revenue / User</th>
              </tr>
            </thead>
            <tbody>
              {revenue.map((c) => (
                <tr key={c.month} className="border-b">
                  <td className="py-2 px-3 font-medium">{c.month}</td>
                  <td className="text-right py-2 px-3">₹{Number(c.revenue).toLocaleString("en-IN")}</td>
                  <td className="text-right py-2 px-3">₹{Number(c.avgRevenue).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
