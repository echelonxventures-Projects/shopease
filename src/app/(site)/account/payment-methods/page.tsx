"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Trash2,
  Star,
  Loader2,
  Plus,
  Shield,
  AlertTriangle,
} from "lucide-react";
import {
  getSavedPaymentMethods,
  deletePaymentMethod,
  setDefaultMethod,
} from "@/server/actions/saved-payment-actions";

interface PaymentMethod {
  id: string;
  cardType: string;
  lastFour: string;
  expiryMonth?: string;
  expiryYear?: string;
  cardholderName?: string;
  isDefault: boolean;
}

const CARD_BRANDS: Record<string, { label: string; color: string }> = {
  VISA: { label: "Visa", color: "text-blue-700" },
  MASTERCARD: { label: "Mastercard", color: "text-orange-600" },
  RUPAY: { label: "RuPay", color: "text-green-700" },
  AMEX: { label: "Amex", color: "text-blue-500" },
  CARD: { label: "Card", color: "text-gray-700" },
};

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const fetchMethods = useCallback(async () => {
    try {
      const data = await getSavedPaymentMethods();
      setMethods(data as PaymentMethod[]);
    } catch {
      // Non-critical
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMethods();
  }, [fetchMethods]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deletePaymentMethod(id);
      setMethods((prev) => prev.filter((m) => m.id !== id));
    } catch {
      // Error handled by server action
    } finally {
      setDeletingId(null);
      setShowDeleteConfirm(null);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultMethod(id);
      setMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === id })),
      );
    } catch {
      // Non-critical
    }
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">
          Your Account
        </Link>
        <span className="mx-2">&rsaquo;</span>
        <span className="text-gray-900 font-medium">Payment Methods</span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="w-6 h-6 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold">Payment Methods</h1>
            <p className="text-sm text-gray-500">
              Manage your saved cards and payment options
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          <Plus className="w-4 h-4" />
          Add New
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : methods.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl">
          <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-500">
            No saved payment methods
          </h3>
          <p className="text-sm text-gray-400 mt-2">
            Add a card for faster checkout next time.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {methods.map((method) => {
            const brand = CARD_BRANDS[method.cardType] || CARD_BRANDS.CARD;

            return (
              <div
                key={method.id}
                className={`bg-white rounded-xl border p-5 relative ${
                  method.isDefault ? "ring-2 ring-blue-200 border-blue-200" : ""
                }`}
              >
                {method.isDefault && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    <Star className="w-3 h-3 fill-blue-600" />
                    Default
                  </div>
                )}

                <div className="flex items-start gap-4">
                  <div className="w-12 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={`font-semibold ${brand.color}`}>
                      {brand.label}
                    </p>
                    <p className="text-lg font-mono tracking-wider mt-0.5">
                      **** **** **** {method.lastFour}
                    </p>
                    {(method.expiryMonth || method.expiryYear) && (
                      <p className="text-sm text-gray-500 mt-1">
                        Expires {method.expiryMonth}/{method.expiryYear}
                      </p>
                    )}
                    {method.cardholderName && (
                      <p className="text-xs text-gray-400 mt-1 uppercase">
                        {method.cardholderName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                  {!method.isDefault && (
                    <button
                      onClick={() => handleSetDefault(method.id)}
                      className="text-sm text-blue-600 hover:underline font-medium"
                    >
                      Set as default
                    </button>
                  )}
                  <div className="flex-1" />
                  {showDeleteConfirm === method.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-red-500 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" />
                        Delete?
                      </span>
                      <button
                        onClick={() => handleDelete(method.id)}
                        disabled={deletingId === method.id}
                        className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {deletingId === method.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          "Yes"
                        )}
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowDeleteConfirm(method.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Delete payment method"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-gray-500 bg-green-50 p-4 rounded-lg">
        <Shield className="w-5 h-5 text-green-600 shrink-0" />
        <p>
          Your payment information is encrypted and stored securely. We never
          store your full card number.
        </p>
      </div>
    </div>
  );
}
