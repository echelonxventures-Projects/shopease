"use client";

import { useEffect, useState, useCallback } from "react";
import { getSearchAnalytics } from "@/server/actions/search-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Search,
  TrendingUp,
  AlertTriangle,
  MousePointerClick,
  Calendar,
} from "lucide-react";

interface AnalyticsData {
  topQueries: { query: string; count: number; avgResults: number }[];
  zeroResultQueries: { query: string; count: number }[];
  totalSearches: number;
  clickedSearches: number;
  conversionRate: number;
  searchVolume: { date: string; count: number }[];
}

export default function SearchAnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAnalytics = useCallback(() => {
    setLoading(true);
    getSearchAnalytics({
      from: dateFrom || undefined,
      to: dateTo || undefined,
      limit: 50,
    })
      .then((result) => {
        if ("error" in result) {
          toast.error(String("error" in result && result.error ? result.error : ""));
          return;
        }
        setData(result as unknown as AnalyticsData);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : "Operation failed"))
      .finally(() => setLoading(false));
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const handleFilter = () => {
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="p-6">
        <p className="text-gray-500">Loading search analytics...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Search className="h-6 w-6" />
          Search Analytics
        </h1>

        {/* Date Range Filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-gray-500" />
          <Input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-40"
            placeholder="From"
          />
          <Input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-40"
            placeholder="To"
          />
          <Button onClick={handleFilter} size="sm">
            Apply
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatsCard
          title="Total Searches"
          value={data?.totalSearches ?? 0}
          icon={<Search className="h-5 w-5 text-blue-600" />}
          color="blue"
        />
        <StatsCard
          title="Click-through Searches"
          value={data?.clickedSearches ?? 0}
          icon={<MousePointerClick className="h-5 w-5 text-green-600" />}
          color="green"
        />
        <StatsCard
          title="Conversion Rate"
          value={`${data?.conversionRate ?? 0}%`}
          icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
          color="purple"
        />
        <StatsCard
          title="Zero-result Queries"
          value={data?.zeroResultQueries?.length ?? 0}
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          color="amber"
        />
      </div>

      {/* Top Search Queries */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold">Top Search Queries</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Query
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                  Searches
                </th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-600">
                  Avg Results
                </th>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-600">
                  Quality
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {(data?.topQueries ?? []).length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No search data available for the selected period.
                  </td>
                </tr>
              ) : (
                (data?.topQueries ?? []).map((item, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium">{item.query}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.count}</td>
                    <td className="px-4 py-3 text-sm text-right">{item.avgResults}</td>
                    <td className="px-4 py-3">
                      {item.avgResults === 0 ? (
                        <Badge variant="destructive">No results</Badge>
                      ) : item.avgResults < 5 ? (
                        <Badge variant="outline" className="text-amber-600 border-amber-300">
                          Low results
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          Good
                        </Badge>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zero-result Queries */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-4 py-3 border-b">
          <h2 className="text-lg font-semibold text-amber-700">
            Zero-result Queries (Content Gaps)
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Searches that returned no results — potential inventory or SEO gaps.
          </p>
        </div>
        <div className="p-4">
          {(data?.zeroResultQueries ?? []).length === 0 ? (
            <p className="text-gray-500 text-sm">No zero-result queries found.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(data?.zeroResultQueries ?? []).map((item, i) => (
                <Badge
                  key={i}
                  variant="outline"
                  className="text-amber-700 border-amber-300 bg-amber-50 px-3 py-1"
                >
                  {item.query}
                  <span className="ml-1 text-xs opacity-60">({item.count})</span>
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Search Volume Over Time */}
      {(data?.searchVolume ?? []).length > 0 && (
        <div className="bg-white rounded-lg shadow">
          <div className="px-4 py-3 border-b">
            <h2 className="text-lg font-semibold">Search Volume (Last 30 Days)</h2>
          </div>
          <div className="p-4">
            <div className="flex items-end gap-1 h-32">
              {(data?.searchVolume ?? []).map((point, i) => {
                const maxCount = Math.max(
                  ...(data?.searchVolume ?? []).map((p) => p.count),
                  1,
                );
                const height = Math.max((point.count / maxCount) * 100, 4);
                return (
                  <div
                    key={i}
                    className="flex-1 bg-blue-500 rounded-t-sm hover:bg-blue-600 transition-colors cursor-pointer relative group min-w-[4px]"
                    style={{ height: `${height}%` }}
                    title={`${point.date}: ${point.count} searches`}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {point.date}: {point.count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===================== STATS CARD =====================

function StatsCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}) {
  const bgMap: Record<string, string> = {
    blue: "bg-blue-50",
    green: "bg-green-50",
    purple: "bg-purple-50",
    amber: "bg-amber-50",
  };

  return (
    <div className={`rounded-lg shadow p-4 ${bgMap[color] || "bg-gray-50"}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
}
