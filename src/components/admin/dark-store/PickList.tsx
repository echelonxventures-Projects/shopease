"use client";

import { useState } from "react";
import { updatePickStatus } from "@/server/actions/dark-store-actions";
import { CheckSquare, Square, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PickItem {
  id: string;
  orderId: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  aisle: string;
  location: string;
  picked: boolean;
  assignmentId: string;
}

interface PickListProps {
  items: PickItem[];
  storeId: string;
  onRefresh: () => void;
}

export function PickList({ items, storeId, onRefresh }: PickListProps) {
  const [pickedItems, setPickedItems] = useState<Set<string>>(new Set());
  const [batchMode, setBatchMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState<string | null>(null);

  const handleTogglePick = async (item: PickItem) => {
    const isPicked = pickedItems.has(item.id);
    setProcessing(item.id);

    try {
      await updatePickStatus(item.id, !isPicked);
      const next = new Set(pickedItems);
      if (isPicked) {
        next.delete(item.id);
      } else {
        next.add(item.id);
      }
      setPickedItems(next);

      if (!isPicked) {
        toast.success(`Picked: ${item.productName}`);
      }
    } catch {
      toast.error("Failed to update pick status");
    } finally {
      setProcessing(null);
    }
  };

  const handleBatchSelect = (itemId: string) => {
    const next = new Set(selectedItems);
    if (next.has(itemId)) {
      next.delete(itemId);
    } else {
      next.add(itemId);
    }
    setSelectedItems(next);
  };

  const handleBatchPick = async () => {
    if (selectedItems.size === 0) {
      toast.error("No items selected for batch pick");
      return;
    }

    setProcessing("batch");
    let successCount = 0;

    for (const itemId of selectedItems) {
      try {
        await updatePickStatus(itemId, true);
        pickedItems.add(itemId);
        successCount++;
      } catch {
        // continue with next item
      }
    }

    setPickedItems(new Set(pickedItems));
    setSelectedItems(new Set());
    setBatchMode(false);
    setProcessing(null);
    toast.success(`Batch picked ${successCount} items`);
    onRefresh();
  };

  const unpickedItems = items.filter((item) => !pickedItems.has(item.id));
  const pickedCount = pickedItems.size;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-bold">Pick List</h2>
          <p className="text-sm text-gray-500">
            {pickedCount} of {items.length} items picked
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={batchMode ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setBatchMode(!batchMode);
              setSelectedItems(new Set());
            }}
          >
            {batchMode ? "Exit Batch Mode" : "Batch Pick"}
          </Button>
          {batchMode && selectedItems.size > 0 && (
            <Button size="sm" onClick={handleBatchPick} disabled={processing === "batch"}>
              {processing === "batch" ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : null}
              Pick Selected ({selectedItems.size})
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {items.length > 0 && (
        <div className="mb-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${items.length > 0 ? (pickedCount / items.length) * 100 : 0}%` }}
            />
          </div>
        </div>
      )}

      {items.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No items to pick. All orders have been fulfilled.
        </div>
      ) : (
        <div className="space-y-2">
          {unpickedItems.map((item) => (
            <div
              key={item.id}
              className={`border rounded-lg p-4 flex items-center gap-4 transition ${
                selectedItems.has(item.id) ? "border-blue-500 bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              {/* Checkbox / Pick Button */}
              {batchMode ? (
                <button onClick={() => handleBatchSelect(item.id)} className="shrink-0">
                  {selectedItems.has(item.id) ? (
                    <CheckSquare className="w-5 h-5 text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400" />
                  )}
                </button>
              ) : (
                <button
                  onClick={() => handleTogglePick(item)}
                  disabled={processing === item.id}
                  className="shrink-0"
                >
                  {processing === item.id ? (
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                  ) : (
                    <Square className="w-5 h-5 text-gray-400 hover:text-green-600" />
                  )}
                </button>
              )}

              {/* Item Details */}
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{item.productName}</p>
                <p className="text-sm text-gray-500">Order: {item.orderNumber}</p>
              </div>

              {/* Quantity */}
              <div className="text-center shrink-0">
                <p className="text-lg font-bold">{item.quantity}</p>
                <p className="text-xs text-gray-500">qty</p>
              </div>

              {/* Location */}
              <div className="text-right shrink-0">
                <div className="flex items-center gap-1 text-sm">
                  <MapPin className="w-3 h-3 text-gray-400" />
                  <span className="font-medium">{item.aisle}</span>
                </div>
                <p className="text-xs text-gray-500">{item.location}</p>
              </div>
            </div>
          ))}

          {/* Picked items (collapsed) */}
          {pickedCount > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-green-600 font-medium mb-2">
                ✓ {pickedCount} item{pickedCount !== 1 ? "s" : ""} picked
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
