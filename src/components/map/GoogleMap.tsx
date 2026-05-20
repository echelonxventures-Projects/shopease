"use client";

import type { MapProps } from "./MapProvider";

/**
 * Google Maps implementation for the DynamicMap system.
 *
 * Install the required package when configuring MAP_PROVIDER=google:
 *   npm install @googlemaps/js-api-loader
 *
 * Then replace this file with the full implementation.
 */
export default function GoogleMapComponent(_props: MapProps) {
  return (
    <div style={{ height: "100%", width: "100%", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "#f3f4f6" }}>
      <p className="text-sm text-gray-500">
        Google Maps — install <code className="bg-gray-200 px-1 rounded">npm i @googlemaps/js-api-loader</code> and set <code className="bg-gray-200 px-1 rounded">NEXT_PUBLIC_MAP_PROVIDER=google</code>
      </p>
    </div>
  );
}
