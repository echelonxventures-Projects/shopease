"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DynamicMap } from "@/components/map/MapProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, MapPin, Navigation, Clock, Package } from "lucide-react";
import { toast } from "sonner";

interface LocationPickerResult {
  lat: number;
  lng: number;
  landmark?: string;
  addressLabel?: string;
  deliveryNote?: string;
  formattedAddress?: string;
  zone?: {
    id: string;
    name: string;
    etaMinutes: number;
    deliveryFee: number;
  };
}

interface LocationPickerProps {
  value?: LocationPickerResult;
  onChange: (result: LocationPickerResult) => void;
  defaultCenter?: [number, number];
  defaultZoom?: number;
}

export function LocationPicker({
  value,
  onChange,
  defaultCenter = [28.6139, 77.2090],
  defaultZoom = 13,
}: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>(
    value ? [value.lat, value.lng] : defaultCenter
  );
  const [landmark, setLandmark] = useState(value?.landmark || "");
  const [addressLabel, setAddressLabel] = useState(value?.addressLabel || "Home");
  const [deliveryNote, setDeliveryNote] = useState(value?.deliveryNote || "");
  const [formattedAddress, setFormattedAddress] = useState(value?.formattedAddress || "");
  const [zone, setZone] = useState<any>(value?.zone || undefined);
  const [loading, setLoading] = useState(false);
  const [resolving, setResolving] = useState(false);

  // Sync external value changes — only update if fields actually differ
  // to avoid infinite loop from parent creating new object reference each render
  const prevValueRef = useRef(value);
  useEffect(() => {
    if (!value) return;
    const prev = prevValueRef.current;
    if (
      prev?.lat === value.lat &&
      prev?.lng === value.lng &&
      prev?.landmark === value.landmark &&
      prev?.addressLabel === value.addressLabel &&
      prev?.deliveryNote === value.deliveryNote &&
      prev?.formattedAddress === value.formattedAddress &&
      prev?.zone === value.zone
    ) {
      return; // no actual change, skip
    }
    prevValueRef.current = value;

    setPosition([value.lat, value.lng]);
    setLandmark(value.landmark || "");
    setAddressLabel(value.addressLabel || "Home");
    setDeliveryNote(value.deliveryNote || "");
    setFormattedAddress(value.formattedAddress || "");
    setZone(value.zone);
  }, [value]);

  // Reverse geocode coordinates to get address
  const reverseGeocode = useCallback(async (lat: number, lng: number) => {
    setResolving(true);
    try {
      const res = await fetch("/api/location", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng, action: "reverse" }),
      });
      const data = await res.json();
      if (data.success) {
        setFormattedAddress(data.address || "");
      }
    } catch {
      // Silent fail — address is optional
    }
    setResolving(false);
  }, []);

  // Check delivery zone for coordinates
  const checkZone = useCallback(async (lat: number, lng: number) => {
    try {
      const { getNearbyDeliveryZones } = await import("@/server/actions/delivery-actions");
      const zones = await getNearbyDeliveryZones(lat, lng, 10);
      if (zones.length > 0) {
        setZone(zones[0]);
      } else {
        setZone(undefined);
      }
    } catch {
      setZone(undefined);
    }
  }, []);

  // Handle drag end (position change)
  const handleDragEnd = useCallback(
    async (lat: number, lng: number) => {
      setPosition([lat, lng]);
      await reverseGeocode(lat, lng);
      await checkZone(lat, lng);
    },
    [reverseGeocode, checkZone]
  );

  // Handle map click
  const handleMapClick = useCallback(
    async (lat: number, lng: number) => {
      setPosition([lat, lng]);
      await reverseGeocode(lat, lng);
      await checkZone(lat, lng);
    },
    [reverseGeocode, checkZone]
  );

  // GPS auto-detect
  const handleGPSDetect = useCallback(() => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setPosition([latitude, longitude]);
        await reverseGeocode(latitude, longitude);
        await checkZone(latitude, longitude);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        toast.error("Location access denied. Please enable GPS or select manually.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, [reverseGeocode, checkZone]);

  // Notify parent of changes
  useEffect(() => {
    if (!position[0] || !position[1]) return;
    onChange({
      lat: position[0],
      lng: position[1],
      landmark: landmark || undefined,
      addressLabel,
      deliveryNote: deliveryNote || undefined,
      formattedAddress,
      zone,
    });
  }, [position, landmark, addressLabel, deliveryNote, formattedAddress, zone]);

  const markers = position[0]
    ? [
        { lat: position[0], lng: position[1], title: "Delivery location" },
        ...(zone
          ? [{ lat: zone.centerLat, lng: zone.centerLng, title: `${zone.name} fulfillment center` }]
          : []),
      ]
    : [];

  const circles = zone
    ? [{ center: [zone.centerLat, zone.centerLng] as [number, number], radius: zone.radius, color: "#2563eb" }]
    : [];

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="relative">
        <DynamicMap
          center={position}
          zoom={defaultZoom}
          height="350px"
          markers={markers}
          circles={circles}
          onClick={handleMapClick}
          onDragEnd={handleDragEnd}
          draggableMarker
          initialPosition={position}
        />

        {/* GPS button overlay */}
        <button
          type="button"
          onClick={handleGPSDetect}
          className="absolute top-3 right-3 z-[1000] bg-white rounded-lg shadow-lg p-2.5 hover:bg-gray-50 transition"
          title="Use my location"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
          ) : (
            <Navigation className="w-5 h-5 text-blue-600" />
          )}
        </button>

        {/* Resolving overlay */}
        {resolving && (
          <div className="absolute top-3 left-3 z-[1000] bg-white rounded-lg shadow-lg px-3 py-1.5 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-gray-500" />
            <span className="text-xs text-gray-600">Finding address...</span>
          </div>
        )}
      </div>

      {/* Formatted address */}
      {formattedAddress && (
        <div className="flex items-start gap-2 p-3 bg-blue-50 rounded-lg border border-blue-100">
          <MapPin className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800">{formattedAddress}</p>
        </div>
      )}

      {/* Delivery zone / ETA */}
      {zone && (
        <div className="flex items-center gap-4 p-3 bg-green-50 rounded-lg border border-green-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            <span className="text-sm font-semibold text-green-800">
              ETA: {zone.etaMinutes} min
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-green-600" />
            <span className="text-sm text-green-700">
              Delivery: ₹{zone.deliveryFee}
            </span>
          </div>
          <span className="text-xs text-green-600 ml-auto font-medium">{zone.name}</span>
        </div>
      )}

      {/* Address label (Home/Work/Other) */}
      <div>
        <Label className="text-sm font-medium">Save as</Label>
        <div className="flex gap-2 mt-2">
          {["Home", "Work", "Other"].map((label) => (
            <button
              key={label}
              type="button"
              onClick={() => setAddressLabel(label)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                addressLabel === label
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Landmark */}
      <div>
        <Label htmlFor="landmark" className="text-sm font-medium">
          Landmark (optional)
        </Label>
        <Input
          id="landmark"
          value={landmark}
          onChange={(e) => setLandmark(e.target.value)}
          placeholder="Near Shiv Mall, opposite SBI Bank, etc."
          className="mt-1"
        />
      </div>

      {/* Delivery instructions */}
      <div>
        <Label htmlFor="deliveryNote" className="text-sm font-medium">
          Delivery instructions (optional)
        </Label>
        <Textarea
          id="deliveryNote"
          value={deliveryNote}
          onChange={(e) => setDeliveryNote(e.target.value)}
          placeholder="Ring bell 2, 3rd floor, call on arrival, etc."
          className="mt-1 resize-none"
          rows={2}
        />
      </div>
    </div>
  );
}
