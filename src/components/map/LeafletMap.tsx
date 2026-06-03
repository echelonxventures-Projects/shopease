"use client";

import { MapContainer, TileLayer, Marker, Popup, Circle, Polygon, Polyline, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapProps } from "./MapProvider";

// Fix default marker icon issue in Next.js
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

export default function LeafletMap({
  center,
  zoom = 13,
  height = "400px",
  markers,
  circles,
  polygons,
  polylines,
  onClick,
  onDragEnd,
  draggableMarker,
  initialPosition,
}: MapProps) {
  return (
    <div style={{ height, width: "100%", borderRadius: 8, overflow: "hidden" }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
      >
        <MapClickHandler onClick={onClick} />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Draggable marker for location picker */}
        {(draggableMarker || onDragEnd) && (
          <Marker
            position={initialPosition || center}
            draggable
            eventHandlers={{
              dragend: (e) => {
                const pos = e.target.getLatLng();
                onDragEnd?.(pos.lat, pos.lng);
              },
            }}
          >
            {onDragEnd && <Popup>Drag to adjust your location</Popup>}
          </Marker>
        )}

        {/* Static markers */}
        {markers?.map((m, i) => (
          <Marker key={`marker-${i}`} position={[m.lat, m.lng]}>
            {m.title && <Popup>{m.title}</Popup>}
          </Marker>
        ))}

        {/* Circles (delivery zones) */}
        {circles?.map((c, i) => (
          <Circle
            key={`circle-${i}`}
            center={c.center}
            radius={c.radius}
            pathOptions={{ color: c.color || "#2563eb", fillColor: c.color || "#2563eb", fillOpacity: 0.15 }}
          />
        ))}

        {/* Polygons (geofenced zones) */}
        {polygons?.map((p, i) => (
          <Polygon
            key={`polygon-${i}`}
            positions={p.points}
            pathOptions={{ color: p.color || "#2563eb", fillOpacity: 0.15 }}
          />
        ))}

        {/* Polylines (routes) */}
        {polylines?.map((p, i) => (
          <Polyline
            key={`polyline-${i}`}
            positions={p.points}
            pathOptions={{ color: p.color || "#2563eb", weight: 3 }}
          />
        ))}
      </MapContainer>
    </div>
  );
}

function MapClickHandler({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e: { latlng: { lat: number; lng: number } }) {
      onClick?.(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}
