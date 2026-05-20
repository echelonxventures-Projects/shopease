"use client";

import { useEffect, useState } from "react";
import { playGamifiedPromo, listGamifiedPromos, getGamifiedPromoStats } from "@/server/actions/gamified-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

interface GamifiedPromoWidgetProps {
  userId: string;
  onWin?: (prizeType: string, prizeValue: number) => void;
}

export function GamifiedPromoWidget({ userId, onWin }: GamifiedPromoWidgetProps) {
  const [promos, setPromos] = useState<any[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<{ type: string; value: number } | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    listGamifiedPromos().then(setPromos).catch(() => {});
  }, []);

  if (promos.length === 0) return null;
  const promo = promos[0];

  const handlePlay = async () => {
    setSpinning(true);
    setPrize(null);
    setRotation((r) => r + 1440 + Math.random() * 720);

    try {
      const result = await playGamifiedPromo(promo.id, userId);
      setPrize({ type: result.prizeType, value: Number(result.prizeValue) });

      if (result.prizeType === "NONE") {
        toast.info("Better luck next time!");
      } else {
        toast.success(`🎉 You won ${result.prizeType} ${result.prizeValue}!`);
        onWin?.(result.prizeType, Number(result.prizeValue));
      }
    } catch (err: any) {
      toast.error(err.message);
    }
    setSpinning(false);
  };

  const prizes: { type: string; value: number; weight: number }[] =
    typeof promo.prizes === "string" ? JSON.parse(promo.prizes) : promo.prizes;

  return (
    <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-xl border border-pink-200 text-center">
      <div className="text-2xl mb-2">🎡</div>
      <h3 className="font-bold text-pink-800">{promo.name}</h3>
      <p className="text-sm text-gray-500 mb-3">{promo.totalPrizes - promo.claimedPrizes} prizes remaining</p>

      <Button onClick={() => setOpen(true)} className="bg-pink-600 hover:bg-pink-700">
        Play Now
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{promo.name}</DialogTitle></DialogHeader>

          <div className="flex flex-col items-center gap-4 py-6">
            {/* Spin wheel */}
            <div
              className="relative w-64 h-64 rounded-full border-4 border-pink-300 overflow-hidden"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
                background: `conic-gradient(
                  ${prizes.map((p, i) => {
                    const angle = (i / prizes.length) * 360;
                    const nextAngle = ((i + 1) / prizes.length) * 360;
                    const colors = ["#EC4899", "#F59E0B", "#10B981", "#6366F1", "#EF4444", "#8B5CF6"];
                    return `${colors[i % colors.length]} ${angle}deg ${nextAngle}deg`;
                  }).join(", ")}
                )`,
              }}
            >
              <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 border-2 border-gray-800 z-10" />
              {/* Pointer */}
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-12 border-l-transparent border-r-transparent border-t-gray-800" />
            </div>

            {prize && (
              <div className="text-center p-4 bg-pink-100 rounded-lg">
                {prize.type === "NONE" ? (
                  <p className="text-gray-600">No luck this time. Try again!</p>
                ) : (
                  <>
                    <p className="text-2xl font-bold text-pink-800">🎉 You won!</p>
                    <p className="text-lg font-semibold">{prize.type} {prize.value}</p>
                  </>
                )}
              </div>
            )}

            <Button onClick={handlePlay} disabled={spinning} className="bg-pink-600 hover:bg-pink-700">
              {spinning ? "Spinning..." : "Spin the Wheel!"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
