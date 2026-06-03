"use client";

import { useEffect, useState } from "react";
import {
  getDeliveryZones,
  createDeliveryZone,
  updateDeliveryZone,
  deleteDeliveryZone,
} from "@/server/actions/delivery-actions";
import { DeliveryZoneMap } from "@/components/map/DeliveryZoneMap";


import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function DeliveryZonesPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [zones, setZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedZoneId, setSelectedZoneId] = useState<string>();

  const loadZones = async () => {
    try {
      const data = await getDeliveryZones({ includeInactive: true });
      setZones(data.map((z) => ({
        ...z,
        centerLat: Number(z.centerLat),
        centerLng: Number(z.centerLng),
        radius: Number(z.radiusKm) * 1000,
        etaMinutes: z.deliveryTimeMax,
        deliveryFee: Number(z.deliveryFee),
        points: z.coveragePolygon ? JSON.parse(z.coveragePolygon as string) : undefined,
      })));
    } catch {
      toast.error("Failed to load zones");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadZones();
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- complex type from external source
  const handleSave = async (zone: any) => {
    try {
      if (zone.id) {
        await updateDeliveryZone(zone.id, {
          name: zone.name,
          centerLat: zone.centerLat,
          centerLng: zone.centerLng,
          radiusKm: zone.type === "circle" ? (zone.radius || 5000) / 1000 : undefined,
          deliveryTimeMin: zone.etaMinutes ? Math.max(5, zone.etaMinutes - 5) : undefined,
          deliveryTimeMax: zone.etaMinutes || 15,
          deliveryFee: zone.deliveryFee,
          coveragePolygon: zone.points || undefined,
        });
      } else {
        await createDeliveryZone({
          name: zone.name,
          centerLat: zone.centerLat,
          centerLng: zone.centerLng,
          radiusKm: zone.type === "circle" ? (zone.radius || 5000) / 1000 : 3,
          deliveryTimeMin: zone.etaMinutes ? Math.max(5, zone.etaMinutes - 5) : 10,
          deliveryTimeMax: zone.etaMinutes || 15,
          deliveryFee: zone.deliveryFee,
          coveragePolygon: zone.points || undefined,
        });
      }
      toast.success("Zone saved");
      loadZones();
    } catch {
      toast.error("Failed to save zone");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this zone?")) return;
    try {
      await deleteDeliveryZone(id);
      toast.success("Zone deleted");
      loadZones();
    } catch {
      toast.error("Failed to delete zone");
    }
  };

  if (loading) return <div className="p-6"><Loader2 className="animate-spin" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Delivery Zones</h1>
      </div>

      <DeliveryZoneMap
        zones={zones}
        selectedZoneId={selectedZoneId}
        onSelectZone={setSelectedZoneId}
        onSaveZone={handleSave}
        onDeleteZone={handleDelete}
      />
    </div>
  );
}
