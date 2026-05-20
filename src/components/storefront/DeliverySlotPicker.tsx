"use client";

import { useEffect, useState } from "react";
import { listDeliverySlots } from "@/server/actions/commerce-actions";

interface DeliverySlotPickerProps {
  onSelect: (slotId: string, fee: number) => void;
  selectedSlotId?: string;
}

export function DeliverySlotPicker({ onSelect, selectedSlotId }: DeliverySlotPickerProps) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);

    listDeliverySlots(
      tomorrow.toISOString().split("T")[0],
      nextWeek.toISOString().split("T")[0]
    )
      .then(setSlots)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p className="text-gray-500">Loading delivery slots...</p>;
  if (slots.length === 0) return <p className="text-gray-500">No delivery slots available</p>;

  const grouped: Record<string, any[]> = {};
  slots.forEach(slot => {
    const date = new Date(slot.date).toLocaleDateString();
    if (!grouped[date]) grouped[date] = [];
    grouped[date].push(slot);
  });

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">Select Delivery Slot</h4>
      {Object.entries(grouped).map(([date, dateSlots]) => (
        <div key={date}>
          <p className="text-sm font-medium text-gray-600 mb-2">{date}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {dateSlots.map(slot => {
              const timeFrom = new Date(slot.timeFrom).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const timeTo = new Date(slot.timeTo).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
              const remaining = slot.maxOrders - slot.bookedOrders;
              const isSelected = slot.id === selectedSlotId;
              const fee = Number(slot.fee);

              return (
                <button
                  key={slot.id}
                  onClick={() => remaining > 0 && onSelect(slot.id, fee)}
                  disabled={remaining <= 0}
                  className={`p-3 rounded-lg border text-left ${
                    isSelected
                      ? "border-blue-600 bg-blue-50"
                      : remaining <= 0
                      ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 hover:border-blue-400 hover:bg-blue-50"
                  }`}
                >
                  <p className="text-sm font-medium">{timeFrom} - {timeTo}</p>
                  <p className="text-xs text-gray-500">{remaining} slots left</p>
                  {fee > 0 ? (
                    <p className="text-xs text-green-600 font-medium">+₹{fee} delivery fee</p>
                  ) : (
                    <p className="text-xs text-green-600">Free</p>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
