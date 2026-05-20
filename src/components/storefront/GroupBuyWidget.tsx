"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { addToCart } from "@/server/actions/cart-actions";
import { Button } from "@/components/ui/button";
import { Users, Share2, Clock, Loader2, Gift } from "lucide-react";
import { toast } from "sonner";

interface GroupBuyProps {
  productId: string;
  productName: string;
  price: number;
  groupSize?: number;
  groupDiscount?: number;
  groupExpiry?: string;
}

export function GroupBuyWidget({
  productId,
  productName,
  price,
  groupSize = 5,
  groupDiscount = 15,
  groupExpiry,
}: GroupBuyProps) {
  const [joining, setJoining] = useState(false);
  const [members, setMembers] = useState(2);
  const [timeLeft, setTimeLeft] = useState("");
  const router = useRouter();

  // Mock member count (in production, fetch from API)
  useEffect(() => {
    const interval = setInterval(() => {
      setMembers((m) => Math.min(m + (Math.random() > 0.7 ? 1 : 0), groupSize));
    }, 5000);
    return () => clearInterval(interval);
  }, [groupSize]);

  useEffect(() => {
    const end = groupExpiry ? new Date(groupExpiry).getTime() : Date.now() + 2 * 3600 * 1000;
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setTimeLeft("Expired"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(`${h}h ${m}m`);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [groupExpiry]);

  const handleJoin = async () => {
    setJoining(true);
    try {
      await addToCart(productId, 1, undefined);
      const discountPrice = Math.round(price * (1 - groupDiscount / 100));
      toast.success(`Joined group buy! Price: ₹${discountPrice} (saved ₹${price - discountPrice})`);
      router.push("/checkout");
    } catch {
      toast.error("Failed to join group buy");
    } finally {
      setJoining(false);
    }
  };

  const discountedPrice = Math.round(price * (1 - groupDiscount / 100));
  const progress = (members / groupSize) * 100;

  return (
    <div className="border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <Share2 className="w-5 h-5 text-green-600" />
        <span className="font-bold text-green-800">Social Group Buy</span>
        <span className="ml-auto text-xs bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-semibold">
          -{groupDiscount}%
        </span>
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-gray-600">Price</span>
        <div className="flex items-center gap-2">
          <span className="line-through text-gray-400">₹{price}</span>
          <span className="text-xl font-bold text-green-700">₹{discountedPrice}</span>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            {members}/{groupSize} members
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {timeLeft || "2h"}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className="h-2.5 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <Button
        onClick={handleJoin}
        disabled={joining}
        className="w-full bg-green-600 hover:bg-green-700 text-white"
        aria-label="Join group buy and save"
      >
        {joining ? <Loader2 className="w-4 h-4 animate-spin" /> : <Gift className="w-4 h-4 mr-2" />}
        Join Group Buy & Save ₹{price - discountedPrice}
      </Button>

      <p className="text-xs text-center text-gray-500">
        Need {groupSize - members} more member{groupSize - members !== 1 ? "s" : ""} to unlock discount
      </p>
    </div>
  );
}
