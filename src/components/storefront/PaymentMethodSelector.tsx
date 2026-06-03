"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Check,
  Plus,
  Loader2,
  Star,
} from "lucide-react";
import {
  getSavedPaymentMethods,
  setDefaultMethod,
} from "@/server/actions/saved-payment-actions";

interface PaymentMethod {
  id: string;
  cardType: string;
  lastFour: string;
  expiryMonth?: string;
  expiryYear?: string;
  isDefault: boolean;
}

interface PaymentMethodSelectorProps {
  selectedId?: string;
  onSelect: (method: PaymentMethod | null) => void;
  onAddNew?: () => void;
}

const CARD_COLORS: Record<string, string> = {
  VISA: "from-blue-600 to-blue-800",
  MASTERCARD: "from-orange-500 to-red-600",
  RUPAY: "from-green-600 to-green-800",
  AMEX: "from-blue-400 to-blue-600",
  CARD: "from-gray-600 to-gray-800",
};

export function PaymentMethodSelector({
  selectedId,
  onSelect,
  onAddNew,
}: PaymentMethodSelectorProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(selectedId || null);

  const fetchMethods = useCallback(async () => {
    try {
      const data = await getSavedPaymentMethods();
      const methodsList = data as PaymentMethod[];
      setMethods(methodsList);
      // Auto-select default if nothing selected
      if (!selectedId) {
        const defaultMethod = methodsList.find((m) => m.isDefault);
        if (defaultMethod) {
          setSelected(defaultMethod.id);
          onSelect(defaultMethod);
        }
      }
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, [selectedId, onSelect]);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const handleSelect = async (method: PaymentMethod) => {
    setSelected(method.id);
    onSelect(method);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="font-semibold text-gray-900">Payment Method</h3>

      {methods.length === 0 ? (
        <div className="text-center py-6 border-2 border-dashed rounded-xl">
          <CreditCard className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No saved payment methods</p>
        </div>
      ) : (
        <div className="space-y-2">
          {methods.map((method) => {
            const isSelected = selected === method.id;
            const gradient =
              CARD_COLORS[method.cardType] || CARD_COLORS.CARD;

            return (
              <button
                key={method.id}
                onClick={() => handleSelect(method)}
                className={`w-full text-left border rounded-xl p-4 flex items-center gap-4 transition-all ${
                  isSelected
                    ? "border-blue-300 ring-2 ring-blue-100 bg-blue-50/50"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                {/* Card Visual */}
                <div
                  className={`w-12 h-8 bg-gradient-to-br ${gradient} rounded flex items-center justify-center shrink-0`}
                >
                  <CreditCard className="w-4 h-4 text-white" />
                </div>

                {/* Card Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">
                      {method.cardType} **** {method.lastFour}
                    </p>
                    {method.isDefault && (
                      <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                    )}
                  </div>
                  {(method.expiryMonth || method.expiryYear) && (
                    <p className="text-xs text-gray-500">
                      Exp {method.expiryMonth}/{method.expiryYear}
                    </p>
                  )}
                </div>

                {/* Selection Indicator */}
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    isSelected
                      ? "border-blue-600 bg-blue-600"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Add New */}
      <button
        onClick={onAddNew}
        className="w-full border-2 border-dashed border-gray-300 rounded-xl p-4 flex items-center justify-center gap-2 text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
      >
        <Plus className="w-5 h-5" />
        <span className="text-sm font-medium">Add New Payment Method</span>
      </button>
    </div>
  );
}
