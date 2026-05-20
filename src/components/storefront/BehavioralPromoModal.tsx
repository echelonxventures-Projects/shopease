"use client";

import { useEffect, useState } from "react";
import { getBehavioralPromoForUser } from "@/server/actions/phaseA-actions";

interface BehavioralPromoModalProps {
  userId?: string;
}

export function BehavioralPromoModal({ userId }: BehavioralPromoModalProps) {
  const [promo, setPromo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    getBehavioralPromoForUser(userId)
      .then((data: any) => setPromo(data))
      .finally(() => setLoading(false));
  }, [userId]);

  const [visible, setVisible] = useState(true);

  if (loading || !promo || !visible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white rounded-lg shadow-2xl border border-orange-200 max-w-sm p-6 animate-bounce">
      <div className="flex items-start justify-between mb-3">
        <span className="text-3xl">🎊</span>
        <button onClick={() => setVisible(false)} className="text-gray-400 hover:text-gray-600 text-lg">×</button>
      </div>
      <h3 className="font-bold text-lg text-gray-900 mb-1">
        {promo.trigger.name}
      </h3>
      <p className="text-sm text-gray-600 mb-3">
        {promo.trigger.type === "CART_ABANDONMENT" && "We noticed you left items in your cart. Here's a special offer!"}
        {promo.trigger.type === "BROWSE_ABANDONMENT" && "Still thinking about it? Here's 10% off to help you decide!"}
        {promo.trigger.type === "WIN_BACK" && "We miss you! Here's an exclusive offer just for you."}
        {promo.trigger.type === "INACTIVE_USER" && "Come back and explore what's new!"}
      </p>
      <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg px-4 py-3 mb-3">
        <p className="font-semibold text-orange-800">{promo.promo.title}</p>
        {promo.promo.description && <p className="text-sm text-orange-600">{promo.promo.description}</p>}
      </div>
      <button onClick={() => setVisible(false)}
        className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 font-medium text-sm">
        Claim Offer
      </button>
    </div>
  );
}
