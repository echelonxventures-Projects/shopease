"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Users,
  Wifi,
  WifiOff,
  Truck,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react";
import {
  getFleetOverview,
  updateAgentStatus,
  getFleetStats,
} from "@/server/actions/fleet-actions";
import { FleetMap } from "@/components/admin/fleet/FleetMap";
import { AgentPerformance } from "@/components/admin/fleet/AgentPerformance";
import { DeliveryAgentStatus } from "@prisma/client";

interface AgentData {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  image: string | null;
  status: string;
  vehicleType: string;
  vehicleNumber: string | null;
  zoneId: string | null;
  zoneName: string;
  rating: number;
  totalDeliveries: number;
  currentLat: number | null;
  currentLng: number | null;
  lastSeenAt: string | Date | null;
  deliveriesToday: number;
  avgDeliveryTime: number | null;
}

interface FleetSummary {
  totalAgents: number;
  onlineAgents: number;
  offlineAgents: number;
  activeDeliveries: number;
}

interface Zone {
  id: string;
  name: string;
  isActive: boolean;
}

export default function FleetPage() {
  const { data: _session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [agents, setAgents] = useState<AgentData[]>([]);
  const [summary, setSummary] = useState<FleetSummary>({
    totalAgents: 0,
    onlineAgents: 0,
    offlineAgents: 0,
    activeDeliveries: 0,
  });
  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedZone, setSelectedZone] = useState<string>("");
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [overviewRes, statsRes] = await Promise.all([
        getFleetOverview(),
        getFleetStats(selectedZone || undefined),
      ]);

      if ("error" in overviewRes) {
        console.error("Failed to load fleet overview:", overviewRes.error);
      } else {
        setAgents(overviewRes.agents);
        setSummary(overviewRes.summary);
      }

      if (!("error" in statsRes)) {
        setZones(statsRes.zones);
      }
    } catch {
      // State remains stale; user can retry
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedZone]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") fetchData();
  }, [status, fetchData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleStatusToggle = async (
    agentId: string,
    currentStatus: string
  ) => {
    // Cycle through statuses
    const cycle: Record<string, DeliveryAgentStatus> = {
      OFFLINE: "ONLINE",
      UNAVAILABLE: "ONLINE",
      ONLINE: "AVAILABLE",
      AVAILABLE: "ON_DELIVERY",
      ON_DELIVERY: "OFFLINE",
    };
    const nextStatus = cycle[currentStatus] || "ONLINE";

    setStatusUpdating(agentId);
    try {
      const result = await updateAgentStatus(agentId, nextStatus);
      if ("error" in result) {
        console.error("Failed to update status:", result.error);
        return;
      }
      setAgents((prev) =>
        prev.map((a) => (a.id === agentId ? { ...a, status: nextStatus } : a))
      );
    } finally {
      setStatusUpdating(null);
    }
  };

  const filteredAgents = selectedZone
    ? agents.filter((a) => a.zoneId === selectedZone)
    : agents;

  const mapAgents = filteredAgents
    .filter((a) => a.currentLat != null && a.currentLng != null)
    .map((a) => ({
      id: a.id,
      name: a.name,
      image: a.image,
      status: a.status,
      lat: a.currentLat!,
      lng: a.currentLng!,
      zoneName: a.zoneName,
      phone: a.phone,
      rating: a.rating,
      deliveriesToday: a.deliveriesToday,
      lastSeenAt: a.lastSeenAt,
    }));

  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Fleet Management</h1>
          <p className="text-sm text-gray-500">
            Monitor and manage delivery agents in real time
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Zone Filter */}
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="text-sm bg-transparent outline-none pr-2"
            >
              <option value="">All Zones</option>
              {zones.map((z) => (
                <option key={z.id} value={z.id}>
                  {z.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{summary.totalAgents}</p>
              <p className="text-sm text-gray-500">Total Agents</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {summary.onlineAgents}
              </p>
              <p className="text-sm text-gray-500">Online</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <WifiOff className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-500">
                {summary.offlineAgents}
              </p>
              <p className="text-sm text-gray-500">Offline</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border p-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">
                {summary.activeDeliveries}
              </p>
              <p className="text-sm text-gray-500">Active Deliveries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fleet Map */}
      <FleetMap agents={mapAgents} />

      {/* Agent Performance Table */}
      <AgentPerformance
        agents={filteredAgents.map((a) => ({
          id: a.id,
          name: a.name,
          image: a.image,
          zoneName: a.zoneName,
          status: a.status,
          deliveriesToday: a.deliveriesToday,
          avgDeliveryTime: a.avgDeliveryTime,
          rating: a.rating,
          totalDeliveries: a.totalDeliveries,
        }))}
      />

      {/* Agent Table with Status Toggle */}
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Agent Roster</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="pb-3 font-medium">Agent</th>
                <th className="pb-3 font-medium">Phone</th>
                <th className="pb-3 font-medium">Status</th>
                <th className="pb-3 font-medium">Zone</th>
                <th className="pb-3 font-medium text-right">Today</th>
                <th className="pb-3 font-medium text-right">Avg Time</th>
                <th className="pb-3 font-medium text-right">Rating</th>
                <th className="pb-3 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredAgents.map((agent) => (
                <tr
                  key={agent.id}
                  className="border-b last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="py-3">
                    <div className="flex items-center gap-3">
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
                      <div>
                        <p className="font-medium text-gray-900">{agent.name}</p>
                        <p className="text-xs text-gray-500">{agent.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 text-gray-600">{agent.phone || "--"}</td>
                  <td className="py-3">
                    <StatusBadge status={agent.status} />
                  </td>
                  <td className="py-3 text-gray-600">{agent.zoneName}</td>
                  <td className="py-3 text-right font-medium">
                    {agent.deliveriesToday}
                  </td>
                  <td className="py-3 text-right text-gray-600">
                    {agent.avgDeliveryTime != null
                      ? `${agent.avgDeliveryTime} min`
                      : "--"}
                  </td>
                  <td className="py-3 text-right">
                    <span className="font-medium">{agent.rating.toFixed(1)}</span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      onClick={() => handleStatusToggle(agent.id, agent.status)}
                      disabled={statusUpdating === agent.id}
                      className="text-xs px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors disabled:opacity-50"
                    >
                      {statusUpdating === agent.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        "Toggle"
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Status badge subcomponent
const STATUS_STYLES: Record<string, string> = {
  ONLINE: "bg-green-50 text-green-700 border-green-200",
  AVAILABLE: "bg-green-50 text-green-700 border-green-200",
  ON_DELIVERY: "bg-yellow-50 text-yellow-700 border-yellow-200",
  OFFLINE: "bg-gray-50 text-gray-600 border-gray-200",
  UNAVAILABLE: "bg-red-50 text-red-600 border-red-200",
};

function StatusBadge({ status }: { status: string }) {
  const style =
    STATUS_STYLES[status] || "bg-gray-50 text-gray-600 border-gray-200";
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full border ${style}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}
