"use client";

import { useMemo, useCallback } from "react";
import { getMapApiKey } from "@/lib/map-config";
import type { MapProps } from "./MapProvider";

// Mapbox is an optional provider. Install mapbox-gl and @vis.gl/react-mapbox when configuring MAP_PROVIDER=mapbox.
// Dynamic import avoids compile errors when the package isn't installed.

export default function MapboxMap({
  center,
  zoom = 13,
  height = "400px",
  markers: _markersProp,
  circles,
  polygons: _polygonsProp,
  polylines: _polylinesProp,
  onClick,
  onDragEnd,
  draggableMarker,
  initialPosition,
}: MapProps) {
  const _accessToken = getMapApiKey() || "";

  const mapStyle: React.CSSProperties = useMemo(
    () => ({ height, width: "100%", borderRadius: 8 }),
    [height]
  );

  const _handleClick = useCallback(
    (e: { lngLat: { lat: number; lng: number } }) => {
      onClick?.(e.lngLat.lat, e.lngLat.lng);
    },
    [onClick]
  );

  return (
    <div style={mapStyle}>
      <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-500">
          Mapbox map — install <code className="bg-gray-200 px-1 rounded">mapbox-gl react-map-gl</code> and set NEXT_PUBLIC_MAP_PROVIDER=mapbox
        </p>
      </div>
    </div>
  );
}
