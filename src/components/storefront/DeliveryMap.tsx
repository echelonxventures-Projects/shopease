"use client";

import { useState, useEffect, useRef } from "react";
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  Truck,
  Package,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

interface TrackingEvent {
  id: string;
  type: string;
  message: string;
  lat: number | null;
  lng: number | null;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

interface AgentInfo {
  name: string;
  phone?: string;
  avatar?: string;
}

interface DeliveryMapProps {
  assignmentId: string;
  agent?: AgentInfo;
  eta?: string;
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  PICKED_UP: Package,
  IN_TRANSIT: Truck,
  NEARBY: Navigation,
  DELIVERED: CheckCircle,
  EXCEPTION: AlertCircle,
  LOCATION_UPDATE: MapPin,
};

const EVENT_COLORS: Record<string, string> = {
  PICKED_UP: "text-blue-600 bg-blue-50",
  IN_TRANSIT: "text-purple-600 bg-purple-50",
  NEARBY: "text-cyan-600 bg-cyan-50",
  DELIVERED: "text-green-600 bg-green-50",
  EXCEPTION: "text-red-600 bg-red-50",
  LOCATION_UPDATE: "text-gray-600 bg-gray-50",
};

export function DeliveryMap({ assignmentId, agent, eta }: DeliveryMapProps) {
  const [events, setEvents] = useState<TrackingEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [latestLocation, setLatestLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!assignmentId) return;

    const es = new EventSource(`/api/delivery/track/${assignmentId}`);
    eventSourceRef.current = es;

    es.onopen = () => setConnected(true);

    // Handle typed events
    const eventTypes = [
      "picked_up",
      "in_transit",
      "nearby",
      "delivered",
      "exception",
      "location_update",
    ];

    const handleEvent = (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        const event: TrackingEvent = {
          id: data.id || crypto.randomUUID(),
          type: data.type || e.type,
          message: data.message || "",
          lat: data.lat,
          lng: data.lng,
          createdAt: data.createdAt || new Date().toISOString(),
          metadata: data.metadata,
        };

        setEvents((prev) => [...prev, event]);

        if (data.lat != null && data.lng != null) {
          setLatestLocation({ lat: data.lat, lng: data.lng });
        }
      } catch {
        // Ignore parse errors
      }
    };

    for (const type of eventTypes) {
      es.addEventListener(type, handleEvent as EventListener);
    }

    es.addEventListener("heartbeat", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);
        if (data.status === "DELIVERED") {
          es.close();
        }
      } catch {
        // Ignore
      }
    });

    es.onerror = () => {
      setConnected(false);
      es.close();
    };

    return () => {
      es.close();
    };
  }, [assignmentId]);

  return (
    <div className="space-y-4">
      {/* Map Placeholder */}
      <div className="relative bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl h-64 md:h-80 flex items-center justify-center overflow-hidden border">
        <div className="absolute inset-0 opacity-10">
          <div
            className="w-full h-full"
            style={{
              backgroundImage:
                "radial-gradient(circle, #6366f1 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        </div>

        <div className="text-center z-10">
          <div className="w-16 h-16 bg-white rounded-full shadow-lg flex items-center justify-center mx-auto mb-3">
            <Navigation className="w-8 h-8 text-blue-600" />
          </div>
          <p className="font-semibold text-gray-700">Live Delivery Tracking</p>
          <p className="text-sm text-gray-500 mt-1">
            {connected ? "Connected to live updates" : "Connecting..."}
          </p>
          {latestLocation && (
            <p className="text-xs text-gray-400 mt-1">
              Last location: {latestLocation.lat.toFixed(4)},{" "}
              {latestLocation.lng.toFixed(4)}
            </p>
          )}
        </div>

        {/* ETA Badge */}
        {eta && (
          <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 flex items-center gap-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <div>
              <p className="text-xs text-gray-500">Estimated arrival</p>
              <p className="text-sm font-semibold">{eta}</p>
            </div>
          </div>
        )}

        {/* Connection Status */}
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/80 rounded-full px-2.5 py-1">
          <div
            className={`w-2 h-2 rounded-full ${
              connected ? "bg-green-500 animate-pulse" : "bg-red-400"
            }`}
          />
          <span className="text-xs font-medium">
            {connected ? "Live" : "Offline"}
          </span>
        </div>
      </div>

      {/* Agent Details */}
      {agent && (
        <div className="bg-white rounded-xl border p-4 flex items-center gap-4">
          {agent.avatar ? (
            <img
              src={agent.avatar}
              alt={agent.name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center">
              <Truck className="w-6 h-6 text-blue-600" />
            </div>
          )}
          <div className="flex-1">
            <p className="font-medium">{agent.name}</p>
            <p className="text-sm text-gray-500">Delivery Agent</p>
          </div>
          {agent.phone && (
            <a
              href={`tel:${agent.phone}`}
              className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center hover:bg-green-100 transition-colors"
            >
              <Phone className="w-5 h-5 text-green-600" />
            </a>
          )}
        </div>
      )}

      {/* Tracking Events */}
      <div className="bg-white rounded-xl border p-4">
        <h4 className="font-semibold mb-3">Tracking Events</h4>
        {events.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">
            Waiting for tracking updates...
          </p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {[...events].reverse().map((event) => {
              const Icon = EVENT_ICONS[event.type] || MapPin;
              const colorClass = EVENT_COLORS[event.type] || EVENT_COLORS.LOCATION_UPDATE;
              const [textColor, bgColor] = colorClass.split(" ");

              return (
                <div key={event.id} className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${bgColor}`}
                  >
                    <Icon className={`w-4 h-4 ${textColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{event.message}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(event.createdAt).toLocaleTimeString("en-IN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
