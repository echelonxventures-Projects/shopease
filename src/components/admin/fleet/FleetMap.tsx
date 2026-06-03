"use client";

import { useState } from "react";
import { MapPin, X, Phone, Star, Navigation } from "lucide-react";

interface AgentPosition {
  id: string;
  name: string;
  image?: string | null;
  status: string;
  lat: number;
  lng: number;
  zoneName: string;
  phone?: string | null;
  rating?: number;
  deliveriesToday?: number;
  lastSeenAt?: string | Date | null;
}

interface FleetMapProps {
  agents: AgentPosition[];
  onAgentClick?: (agentId: string) => void;
}

const STATUS_COLORS: Record<string, string> = {
  ONLINE: "bg-green-500",
  AVAILABLE: "bg-green-500",
  ON_DELIVERY: "bg-yellow-500",
  OFFLINE: "bg-gray-400",
  UNAVAILABLE: "bg-gray-400",
};

const STATUS_LABELS: Record<string, string> = {
  ONLINE: "Online",
  AVAILABLE: "Available",
  ON_DELIVERY: "On Delivery",
  OFFLINE: "Offline",
  UNAVAILABLE: "Unavailable",
};

export function FleetMap({ agents, onAgentClick }: FleetMapProps) {
  const [selectedAgent, setSelectedAgent] = useState<AgentPosition | null>(null);

  const handleAgentClick = (agent: AgentPosition) => {
    setSelectedAgent(agent);
    onAgentClick?.(agent.id);
  };

  if (!agents.length) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Fleet Map</h3>
        <div className="flex items-center justify-center h-64 text-gray-400">
          <div className="text-center">
            <MapPin className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No agents with location data available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold">Fleet Map</h3>
        </div>
        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            Online
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
            On Delivery
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
            Offline
          </span>
        </div>
      </div>

      {/* Grid layout as placeholder for actual map */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {agents.map((agent) => (
          <button
            key={agent.id}
            onClick={() => handleAgentClick(agent)}
            className={`relative p-3 rounded-lg border text-left transition-all hover:shadow-md hover:border-blue-300 ${
              selectedAgent?.id === agent.id
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 bg-gray-50"
            }`}
          >
            {/* Status dot */}
            <span
              className={`absolute top-2 right-2 w-2.5 h-2.5 rounded-full ${
                STATUS_COLORS[agent.status] || "bg-gray-400"
              }`}
            />

            {/* Agent avatar */}
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center mb-2 overflow-hidden">
              {agent.image ? (
                <img
                  src={agent.image}
                  alt={agent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-sm font-bold text-gray-500">
                  {agent.name.charAt(0)}
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-gray-900 truncate">
              {agent.name}
            </p>
            <p className="text-xs text-gray-500 truncate">{agent.zoneName}</p>

            {/* Coordinates */}
            <p className="text-[10px] text-gray-400 mt-1 font-mono">
              {agent.lat.toFixed(4)}, {agent.lng.toFixed(4)}
            </p>
          </button>
        ))}
      </div>

      {/* Agent Detail Popup */}
      {selectedAgent && (
        <div className="mt-4 p-4 border rounded-lg bg-gray-50 relative">
          <button
            onClick={() => setSelectedAgent(null)}
            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
              {selectedAgent.image ? (
                <img
                  src={selectedAgent.image}
                  alt={selectedAgent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-gray-500">
                  {selectedAgent.name.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-gray-900">
                {selectedAgent.name}
              </h4>
              <div className="flex items-center gap-1 mt-1">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${
                    STATUS_COLORS[selectedAgent.status] || "bg-gray-400"
                  }`}
                >
                  {STATUS_LABELS[selectedAgent.status] || selectedAgent.status}
                </span>
                <span className="text-xs text-gray-500 ml-2">
                  {selectedAgent.zoneName}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-sm text-gray-600">
                  <Navigation className="w-3.5 h-3.5" />
                  <span className="font-mono text-xs">
                    {selectedAgent.lat.toFixed(6)}, {selectedAgent.lng.toFixed(6)}
                  </span>
                </div>
                {selectedAgent.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Phone className="w-3.5 h-3.5" />
                    {selectedAgent.phone}
                  </div>
                )}
                {selectedAgent.rating != null && (
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Star className="w-3.5 h-3.5 text-yellow-500" />
                    {selectedAgent.rating.toFixed(1)}
                  </div>
                )}
                {selectedAgent.deliveriesToday != null && (
                  <div className="text-sm text-gray-600">
                    {selectedAgent.deliveriesToday} deliveries today
                  </div>
                )}
              </div>

              {selectedAgent.lastSeenAt && (
                <p className="text-xs text-gray-400 mt-2">
                  Last seen: {new Date(selectedAgent.lastSeenAt).toLocaleString("en-IN")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
