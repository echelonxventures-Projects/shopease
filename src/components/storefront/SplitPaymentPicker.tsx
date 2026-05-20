"use client";

import { useState, useEffect } from "react";
import { getWalletBalance } from "@/server/actions/wallet-actions";
import { Wallet, ArrowRight, CreditCard, Smartphone, Banknote } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface SplitPaymentPickerProps {
  totalAmount: number;
  onSplitChange?: (split: { walletAmount: number; cardAmount: number; upiAmount: number; codAmount: number }) => void;
}

export function SplitPaymentPicker({ totalAmount, onSplitChange }: SplitPaymentPickerProps) {
  const [walletBalance, setWalletBalance] = useState(0);
  const [walletAmount, setWalletAmount] = useState(0);
  const [cardAmount, setCardAmount] = useState(0);
  const [upiAmount, setUpiAmount] = useState(0);
  const [codAmount, setCodAmount] = useState(0);

  useEffect(() => {
    getWalletBalance().then((data) => {
      if (data.balance !== null) setWalletBalance(data.balance);
    }).catch(() => {});
  }, []);

  const remaining = Math.max(0, totalAmount - walletAmount - cardAmount - upiAmount - codAmount);

  useEffect(() => {
    onSplitChange?.({ walletAmount, cardAmount, upiAmount, codAmount });
  }, [walletAmount, cardAmount, upiAmount, codAmount, onSplitChange]);

  const autoFillRemaining = (setter: (v: number) => void, current: number) => {
    setter(current + remaining);
  };

  return (
    <div className="border rounded-lg p-4 bg-gradient-to-br from-green-50 to-blue-50 space-y-4">
      <div className="flex items-center gap-2">
        <Wallet className="w-5 h-5 text-green-600" />
        <span className="font-bold text-green-800">Split Payment</span>
      </div>

      {/* Wallet */}
      <div className="border rounded-lg p-3 bg-white space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-600" />
            <span className="font-medium text-sm">Wallet</span>
            <span className="text-xs text-gray-500">Balance: ₹{walletBalance.toFixed(2)}</span>
          </div>
          <Input
            type="number"
            value={walletAmount || ""}
            onChange={(e) => setWalletAmount(Math.min(parseFloat(e.target.value) || 0, walletBalance))}
            placeholder="0.00"
            className="w-32 h-8 text-right text-sm"
            max={walletBalance}
          />
        </div>
        {walletBalance > 0 && (
          <Button variant="outline" size="sm" className="h-6 px-2 text-xs" onClick={() => setWalletAmount(walletBalance)}>
            Use Max: ₹{walletBalance.toFixed(2)}
          </Button>
        )}
      </div>

      {/* Card */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-blue-600" />
            <span className="font-medium text-sm">Credit/Debit Card</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={cardAmount || ""}
              onChange={(e) => setCardAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-32 h-8 text-right text-sm"
            />
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => autoFillRemaining(setCardAmount, cardAmount)}>
              Fill
            </Button>
          </div>
        </div>
      </div>

      {/* UPI */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-purple-600" />
            <span className="font-medium text-sm">UPI</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={upiAmount || ""}
              onChange={(e) => setUpiAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-32 h-8 text-right text-sm"
            />
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => autoFillRemaining(setUpiAmount, upiAmount)}>
              Fill
            </Button>
          </div>
        </div>
      </div>

      {/* COD */}
      <div className="border rounded-lg p-3 bg-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Banknote className="w-4 h-4 text-orange-600" />
            <span className="font-medium text-sm">Cash on Delivery</span>
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={codAmount || ""}
              onChange={(e) => setCodAmount(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="w-32 h-8 text-right text-sm"
            />
            <Button variant="outline" size="sm" className="h-8 px-2 text-xs" onClick={() => autoFillRemaining(setCodAmount, codAmount)}>
              Fill
            </Button>
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-lg p-3 space-y-1 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Order</span>
          <span className="font-bold">₹{totalAmount.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-green-600">
          <span>Wallet</span>
          <span>₹{walletAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-blue-600">
          <span>Card</span>
          <span>₹{cardAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-purple-600">
          <span>UPI</span>
          <span>₹{upiAmount.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-orange-600">
          <span>COD</span>
          <span>₹{codAmount.toFixed(2)}</span>
        </div>
        <div className="border-t pt-2 flex justify-between font-bold">
          <span>Remaining</span>
          <span className={remaining > 0 ? "text-red-500" : "text-green-600"}>
            ₹{remaining.toFixed(2)}
          </span>
        </div>
      </div>

      {remaining > 0 && (
        <Button
          variant="outline"
          className="w-full text-sm"
          onClick={() => setCardAmount(cardAmount + remaining)}
        >
          <ArrowRight className="w-3 h-3 mr-1" />
          Assign remaining to Card
        </Button>
      )}
    </div>
  );
}
