"use client";

import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Star, Clock, Package } from "lucide-react";

interface AgentMetrics {
  id: string;
  name: string;
  image?: string | null;
  zoneName: string;
  status: string;
  deliveriesToday: number;
  avgDeliveryTime: number | null;
  rating: number;
  totalDeliveries: number;
  onTimePercent?: number;
}

interface AgentPerformanceProps {
  agents: AgentMetrics[];
  onAgentClick?: (agentId: string) => void;
}

type SortField = "name" | "deliveriesToday" | "avgDeliveryTime" | "rating" | "onTimePercent" | "totalDeliveries";
type SortDir = "asc" | "desc";

const STATUS_DOT: Record<string, string> = {
  ONLINE: "bg-green-500",
  AVAILABLE: "bg-green-500",
  ON_DELIVERY: "bg-yellow-500",
  OFFLINE: "bg-gray-400",
  UNAVAILABLE: "bg-gray-400",
};

export function AgentPerformance({ agents, onAgentClick }: AgentPerformanceProps) {
  const [sortField, setSortField] = useState<SortField>("deliveriesToday");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const sorted = useMemo(() => {
    return [...agents].sort((a, b) => {
      let aVal: number | string = a[sortField] ?? 0;
      let bVal: number | string = b[sortField] ?? 0;

      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [agents, sortField, sortDir]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field)
      return <ArrowUpDown className="w-3.5 h-3.5 text-gray-400" />;
    return sortDir === "asc" ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600" />
    );
  };

  if (!agents.length) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Agent Performance</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No agent data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Agent Performance</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 font-medium w-10">#</th>
              <th className="pb-3 font-medium">
                <button
                  onClick={() => handleSort("name")}
                  className="flex items-center gap-1 hover:text-gray-700"
                >
                  Agent <SortIcon field="name" />
                </button>
              </th>
              <th className="pb-3 font-medium text-right">
                <button
                  onClick={() => handleSort("deliveriesToday")}
                  className="flex items-center gap-1 ml-auto hover:text-gray-700"
                >
                  Today <SortIcon field="deliveriesToday" />
                </button>
              </th>
              <th className="pb-3 font-medium text-right">
                <button
                  onClick={() => handleSort("totalDeliveries")}
                  className="flex items-center gap-1 ml-auto hover:text-gray-700"
                >
                  Total <SortIcon field="totalDeliveries" />
                </button>
              </th>
              <th className="pb-3 font-medium text-right">
                <button
                  onClick={() => handleSort("avgDeliveryTime")}
                  className="flex items-center gap-1 ml-auto hover:text-gray-700"
                >
                  Avg Time <SortIcon field="avgDeliveryTime" />
                </button>
              </th>
              <th className="pb-3 font-medium text-right">
                <button
                  onClick={() => handleSort("onTimePercent")}
                  className="flex items-center gap-1 ml-auto hover:text-gray-700"
                >
                  On-Time % <SortIcon field="onTimePercent" />
                </button>
              </th>
              <th className="pb-3 font-medium text-right">
                <button
                  onClick={() => handleSort("rating")}
                  className="flex items-center gap-1 ml-auto hover:text-gray-700"
                >
                  Rating <SortIcon field="rating" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((agent, index) => (
              <tr
                key={agent.id}
                onClick={() => onAgentClick?.(agent.id)}
                className="border-b last:border-0 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <td className="py-3 text-gray-400">{index + 1}</td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                        {agent.image ? (
                          <img
                            src={agent.image}
                            alt={agent.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-xs font-bold text-gray-500">
                            {agent.name.charAt(0)}
                          </span>
                        )}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                          STATUS_DOT[agent.status] || "bg-gray-400"
                        }`}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{agent.name}</p>
                      <p className="text-xs text-gray-500">{agent.zoneName}</p>
                    </div>
                  </div>
                </td>
                <td className="py-3 text-right font-medium">
                  {agent.deliveriesToday}
                </td>
                <td className="py-3 text-right text-gray-600">
                  {agent.totalDeliveries.toLocaleString("en-IN")}
                </td>
                <td className="py-3 text-right">
                  {agent.avgDeliveryTime != null ? (
                    <span className="flex items-center gap-1 justify-end text-gray-600">
                      <Clock className="w-3.5 h-3.5" />
                      {agent.avgDeliveryTime} min
                    </span>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  {agent.onTimePercent != null ? (
                    <span
                      className={`font-medium ${
                        agent.onTimePercent >= 90
                          ? "text-green-600"
                          : agent.onTimePercent >= 70
                            ? "text-yellow-600"
                            : "text-red-600"
                      }`}
                    >
                      {agent.onTimePercent}%
                    </span>
                  ) : (
                    <span className="text-gray-400">--</span>
                  )}
                </td>
                <td className="py-3 text-right">
                  <span className="flex items-center gap-1 justify-end">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    <span className="font-medium">{agent.rating.toFixed(1)}</span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
