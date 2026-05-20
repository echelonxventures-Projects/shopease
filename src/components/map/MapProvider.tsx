import { getMapProvider } from "@/lib/map-config";
import dynamic from "next/dynamic";

const LeafletMap = dynamic(() => import("./LeafletMap"), { ssr: false });
const GoogleMap = dynamic(() => import("./GoogleMap"), { ssr: false });
const MapboxMap = dynamic(() => import("./MapboxMap"), { ssr: false });

export interface MapProps {
  center: [number, number];
  zoom?: number;
  height?: string;
  markers?: { lat: number; lng: number; title?: string }[];
  circles?: { center: [number, number]; radius: number; color?: string }[];
  polygons?: { points: [number, number][]; color?: string }[];
  polylines?: { points: [number, number][]; color?: string }[];
  onClick?: (lat: number, lng: number) => void;
  onDragEnd?: (lat: number, lng: number) => void;
  draggableMarker?: boolean;
  initialPosition?: [number, number];
}

export function DynamicMap(props: MapProps) {
  const provider = getMapProvider();
  if (provider === 'google') return <GoogleMap {...props} />;
  if (provider === 'mapbox') return <MapboxMap {...props} />;
  return <LeafletMap {...props} />;
}
