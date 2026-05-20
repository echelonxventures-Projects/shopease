import Link from "next/link";
import { Star, Truck, Gift, Zap } from "lucide-react";

interface GiftCardStoreCardProps {
  card: any;
  compact?: boolean;
}

export function GiftCardStoreCard({ card, compact = false }: GiftCardStoreCardProps) {
  const minAmount = Number(card.minAmount);
  const maxAmount = Number(card.maxAmount);
  const deliveryTypes = card.deliveryTypes?.split(",") || [];
  const isEGift = deliveryTypes.includes("E_GIFT");
  const isPhysical = deliveryTypes.includes("PHYSICAL");

  const fixedAmounts = card.fixedAmounts ? (card.fixedAmounts as number[]).slice(0, 3) : [];

  if (compact) {
    return (
      <Link href={`/gift-cards/purchase/${card.id}`} className="group block">
        <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow border">
          <div className="aspect-square bg-gray-50 overflow-hidden">
            <img
              src={card.imageUrl}
              alt={card.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect fill="%23f3f4f6" width="200" height="200"/><text x="50%" y="50%" text-anchor="middle" fill="%23d1d5db" font-size="60">🎁</text></svg>`;
              }}
            />
          </div>
          <div className="p-2">
            <p className="text-xs font-medium line-clamp-2 group-hover:text-orange-600 transition-colors">
              {card.name}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              ₹{minAmount.toLocaleString()} onwards
            </p>
            {card.isBestseller && (
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded">
                BESTSELLER
              </span>
            )}
            {card.isNewArrival && (
              <span className="inline-block mt-1 px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded">
                NEW
              </span>
            )}
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/gift-cards/purchase/${card.id}`} className="group block">
      <div className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow border h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-50 overflow-hidden">
          <img
            src={card.imageUrl}
            alt={card.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
            onError={(e) => {
              (e.target as HTMLImageElement).src = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 150"><rect fill="%23f3f4f6" width="200" height="150"/><text x="50%" y="50%" text-anchor="middle" fill="%23d1d5db" font-size="60">🎁</text></svg>`;
            }}
          />

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {card.isBestseller && (
              <span className="px-2 py-0.5 bg-orange-600 text-white text-[10px] font-bold rounded">
                BESTSELLER
              </span>
            )}
            {card.isNewArrival && (
              <span className="px-2 py-0.5 bg-green-600 text-white text-[10px] font-bold rounded">
                NEW ARRIVAL
              </span>
            )}
            {card.isFeatured && (
              <span className="px-2 py-0.5 bg-purple-600 text-white text-[10px] font-bold rounded">
                FEATURED
              </span>
            )}
          </div>

          {/* Delivery badges */}
          <div className="absolute top-2 right-2 flex gap-1">
            {isEGift && (
              <div className="bg-white/90 rounded px-1.5 py-0.5" title="eGift Card">
                <Gift className="w-3.5 h-3.5 text-blue-600" />
              </div>
            )}
            {isPhysical && (
              <div className="bg-white/90 rounded px-1.5 py-0.5" title="Physical Card">
                <Truck className="w-3.5 h-3.5 text-green-600" />
              </div>
            )}
          </div>

          {/* Sponsored badge (placeholder) */}
          {card.seller === "Amazon" && Math.random() > 0.7 && (
            <div className="absolute bottom-2 left-2">
              <span className="px-1.5 py-0.5 bg-black/70 text-white text-[9px] rounded">
                Sponsored
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 flex-1 flex flex-col">
          <h3 className="font-medium text-sm text-gray-900 group-hover:text-orange-600 transition-colors line-clamp-2">
            {card.name}
          </h3>

          {/* Occasions */}
          {card.occasions && card.occasions.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {card.occasions.slice(0, 2).map((o: any) => (
                <span key={o.slug} className="text-xs text-gray-500">
                  {o.icon} {o.name}
                </span>
              ))}
            </div>
          )}

          {/* Recipients */}
          {card.recipients && card.recipients.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {card.recipients.slice(0, 3).map((r: any) => (
                <span key={r.slug} className="text-xs px-1.5 py-0.5 bg-gray-100 rounded">
                  {r.name}
                </span>
              ))}
            </div>
          )}

          {/* Price */}
          <div className="mt-auto pt-2">
            <p className="text-sm text-gray-600">
              From <span className="font-bold text-gray-900">₹{minAmount.toLocaleString()}</span>
              {card.customAmount && (
                <span className="text-xs text-gray-400 ml-1">or custom</span>
              )}
            </p>

            {/* Preset amounts */}
            {fixedAmounts.length > 0 && (
              <div className="flex gap-1 mt-1 flex-wrap">
                {fixedAmounts.map((amt: number) => (
                  <span
                    key={amt}
                    className="text-xs px-1.5 py-0.5 bg-orange-50 text-orange-700 rounded font-medium"
                  >
                    ₹{amt.toLocaleString()}
                  </span>
                ))}
              </div>
            )}

            {/* Cashback offer placeholder */}
            {Math.random() > 0.5 && (
              <div className="flex items-center gap-1 mt-2 text-xs text-green-700">
                <Zap className="w-3 h-3" />
                <span>2% back with Amazon Pay</span>
              </div>
            )}

            {/* Seller */}
            {card.seller && (
              <p className="text-xs text-gray-400 mt-1">Sold by {card.seller}</p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
