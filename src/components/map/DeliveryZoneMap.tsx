"use client";

import { useState, useCallback } from "react";
import { DynamicMap } from "@/components/map/MapProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Save, Pencil, MapPin } from "lucide-react";

interface DeliveryZoneData {
  id?: string;
  name: string;
  type: "circle" | "polygon";
  centerLat: number;
  centerLng: number;
  radius?: number;
  points?: [number, number][];
  etaMinutes: number;
  deliveryFee: number;
  isActive: boolean;
}

interface DeliveryZoneMapProps {
  zones: DeliveryZoneData[];
  selectedZoneId?: string;
  onSelectZone: (id: string) => void;
  onSaveZone: (zone: DeliveryZoneData) => void;
  onDeleteZone: (id: string) => void;
}

export function DeliveryZoneMap({
  zones,
  selectedZoneId,
  onSelectZone,
  onSaveZone,
  onDeleteZone,
}: DeliveryZoneMapProps) {
  const [drawingMode, setDrawingMode] = useState<"circle" | "polygon" | null>(null);
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([]);
  const [editingZone, setEditingZone] = useState<DeliveryZoneData | null>(null);
  const [circleCenter, setCircleCenter] = useState<[number, number] | null>(null);
  const [circleRadius, setCircleRadius] = useState(5000);

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  // Calculate map bounds to fit all zones
  const center: [number, number] = zones.length > 0
    ? [
        zones.reduce((sum, z) => sum + z.centerLat, 0) / zones.length,
        zones.reduce((sum, z) => sum + z.centerLng, 0) / zones.length,
      ]
    : [28.6139, 77.2090];

  // Map click handler for polygon drawing
  const handleMapClick = useCallback(
    (lat: number, lng: number) => {
      if (drawingMode === "polygon") {
        setPolygonPoints((prev) => [...prev, [lat, lng]]);
      } else if (drawingMode === "circle") {
        setCircleCenter([lat, lng]);
        setCircleRadius(5000);
      }
    },
    [drawingMode]
  );

  // Save polygon zone
  const handleSavePolygon = useCallback(() => {
    if (polygonPoints.length < 3) return;
    const centerLat = polygonPoints.reduce((sum, p) => sum + p[0], 0) / polygonPoints.length;
    const centerLng = polygonPoints.reduce((sum, p) => sum + p[1], 0) / polygonPoints.length;

    onSaveZone({
      id: editingZone?.id,
      name: editingZone?.name || `Zone ${zones.length + 1}`,
      type: "polygon",
      centerLat,
      centerLng,
      points: polygonPoints,
      etaMinutes: editingZone?.etaMinutes || 15,
      deliveryFee: editingZone?.deliveryFee || 0,
      isActive: editingZone?.isActive ?? true,
    });

    setPolygonPoints([]);
    setDrawingMode(null);
    setEditingZone(null);
  }, [polygonPoints, editingZone, zones.length, onSaveZone]);

  // Save circle zone
  const handleSaveCircle = useCallback(() => {
    if (!circleCenter) return;
    onSaveZone({
      id: editingZone?.id,
      name: editingZone?.name || `Zone ${zones.length + 1}`,
      type: "circle",
      centerLat: circleCenter[0],
      centerLng: circleCenter[1],
      radius: circleRadius,
      etaMinutes: editingZone?.etaMinutes || 15,
      deliveryFee: editingZone?.deliveryFee || 0,
      isActive: editingZone?.isActive ?? true,
    });

    setCircleCenter(null);
    setCircleRadius(5000);
    setDrawingMode(null);
    setEditingZone(null);
  }, [circleCenter, circleRadius, editingZone, zones.length, onSaveZone]);

  // Start editing existing zone
  const handleEditZone = useCallback((zone: DeliveryZoneData) => {
    setEditingZone(zone);
    if (zone.type === "polygon") {
      setPolygonPoints(zone.points || []);
    }
    setDrawingMode(zone.type);
  }, []);

  // Map overlays
  const circles = zones
    .filter((z) => z.type === "circle")
    .map((z) => ({
      center: [z.centerLat, z.centerLng] as [number, number],
      radius: z.radius || 5000,
      color: selectedZoneId === z.id ? "#ef4444" : "#2563eb",
    }));

  const polygons = zones
    .filter((z) => z.type === "polygon" && z.points && z.points.length >= 3)
    .map((z) => ({
      points: z.points!,
      color: selectedZoneId === z.id ? "#ef4444" : "#2563eb",
    }));

  const markers = zones.map((z) => ({
    lat: z.centerLat,
    lng: z.centerLng,
    title: `${z.name} (${z.type})`,
  }));

  // Add polygon drawing points
  const drawingMarkers = polygonPoints.map((p, i) => ({
    lat: p[0],
    lng: p[1],
    title: `Point ${i + 1}`,
  }));

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant={drawingMode === "circle" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDrawingMode("circle");
            setEditingZone(null);
            setPolygonPoints([]);
          }}
        >
          <Plus className="w-4 h-4 mr-1" /> Circle Zone
        </Button>
        <Button
          variant={drawingMode === "polygon" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setDrawingMode("polygon");
            setEditingZone(null);
            setCircleCenter(null);
          }}
        >
          <MapPin className="w-4 h-4 mr-1" /> Polygon Zone
        </Button>
        {drawingMode && (
          <div className="flex gap-2 ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDrawingMode(null);
                setPolygonPoints([]);
                setCircleCenter(null);
                setEditingZone(null);
              }}
            >
              Cancel
            </Button>
            {drawingMode === "polygon" && polygonPoints.length >= 3 && (
              <Button size="sm" onClick={handleSavePolygon}>
                <Save className="w-4 h-4 mr-1" /> Save Polygon
              </Button>
            )}
            {drawingMode === "circle" && circleCenter && (
              <Button size="sm" onClick={handleSaveCircle}>
                <Save className="w-4 h-4 mr-1" /> Save Circle
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Zone list */}
      {!drawingMode && zones.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {zones.map((z) => (
            <div
              key={z.id}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition ${
                selectedZoneId === z.id
                  ? "border-red-400 bg-red-50"
                  : "border-gray-200 hover:border-blue-300"
              }`}
            >
              <button
                type="button"
                onClick={() => onSelectZone(z.id!)}
                className="text-sm font-medium"
              >
                {z.name}
              </button>
              <span className="text-xs text-gray-500">
                {z.type === "circle" ? `${(z.radius || 0) / 1000}km` : `${z.points?.length} pts`}
              </span>
              <button
                type="button"
                onClick={() => handleEditZone(z)}
                className="p-1 text-gray-400 hover:text-blue-600"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onDeleteZone(z.id!)}
                className="p-1 text-gray-400 hover:text-red-600"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Circle radius slider */}
      {drawingMode === "circle" && circleCenter && (
        <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
          <Label className="text-sm font-medium whitespace-nowrap">Radius:</Label>
          <input
            type="range"
            min={500}
            max={50000}
            step={500}
            value={circleRadius}
            onChange={(e) => setCircleRadius(Number(e.target.value))}
            className="flex-1"
          />
          <span className="text-sm text-gray-600 w-20 text-right">
            {(circleRadius / 1000).toFixed(1)} km
          </span>
        </div>
      )}

      {/* Polygon point count */}
      {drawingMode === "polygon" && polygonPoints.length > 0 && (
        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {polygonPoints.length} point{polygonPoints.length > 1 ? "s" : ""} drawn
            {polygonPoints.length < 3 && " (need 3+ to close polygon)"}
          </span>
        </div>
      )}

      {/* Map */}
      <DynamicMap
        center={editingZone ? [editingZone.centerLat, editingZone.centerLng] : center}
        zoom={11}
        height="500px"
        markers={[...markers, ...drawingMarkers]}
        circles={[...circles, ...(circleCenter ? [{ center: circleCenter, radius: circleRadius, color: "#3b82f6" }] : [])]}
        polygons={polygons}
        onClick={handleMapClick}
      />

      {/* Zone properties (when editing) */}
      {selectedZone && !drawingMode && (
        <ZonePropertiesForm
          zone={selectedZone}
          onSave={(updated) => {
            onSaveZone({ ...selectedZone, ...updated });
          }}
        />
      )}
    </div>
  );
}

// Zone properties editing form
function ZonePropertiesForm({
  zone,
  onSave,
}: {
  zone: DeliveryZoneData;
  onSave: (zone: Partial<DeliveryZoneData>) => void;
}) {
  const [name, setName] = useState(zone.name);
  const [etaMinutes, setEtaMinutes] = useState(zone.etaMinutes);
  const [deliveryFee, setDeliveryFee] = useState(zone.deliveryFee);

  return (
    <div className="p-4 bg-gray-50 rounded-lg border space-y-3">
      <h3 className="font-bold text-sm">Zone Properties</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <Label className="text-xs">Zone Name</Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">ETA (minutes)</Label>
          <Input
            type="number"
            value={etaMinutes}
            onChange={(e) => setEtaMinutes(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <Label className="text-xs">Delivery Fee (₹)</Label>
          <Input
            type="number"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(Number(e.target.value))}
            className="h-8 text-sm"
          />
        </div>
      </div>
      <Button size="sm" onClick={() => onSave({ name, etaMinutes, deliveryFee })}>
        <Save className="w-4 h-4 mr-1" /> Save Changes
      </Button>
    </div>
  );
}
