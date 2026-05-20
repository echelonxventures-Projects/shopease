"use client";

interface AIProductBadgesProps {
  product: {
    id: string;
    aiScore?: number;
    avgRating?: number | string;
    reviewCount?: number | string;
    stock?: number | string;
    comparePrice?: number | string;
    price?: number | string;
  };
}

export function AIProductBadges({ product }: AIProductBadgesProps) {
  const score = product.aiScore || 50;
  const badges: { text: string; color: string }[] = [];

  // AI scoring badges
  if (score >= 80) badges.push({ text: "AI Recommended", color: "bg-violet-100 text-violet-700" });
  if (score >= 70) badges.push({ text: "Top Rated", color: "bg-green-100 text-green-700" });
  if (score < 30) badges.push({ text: "Low Stock", color: "bg-red-100 text-red-700" });

  // Trending badge based on review count
  const reviews = Number(product.reviewCount || 0);
  if (reviews > 100) badges.push({ text: "Trending", color: "bg-orange-100 text-orange-700" });

  // Deal badge
  const comparePrice = Number(product.comparePrice || 0);
  const price = Number(product.price || 0);
  if (comparePrice > 0 && price > 0 && comparePrice > price) {
    const discount = Math.round(((comparePrice - price) / comparePrice) * 100);
    badges.push({ text: `${discount}% Off — Hot Deal`, color: "bg-red-100 text-red-700" });
  }

  // Low stock warning
  const stock = Number(product.stock || 0);
  if (stock > 0 && stock < 5) {
    badges.push({ text: `Only ${stock} left!`, color: "bg-yellow-100 text-yellow-700" });
  }

  if (!badges.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-3" role="status" aria-label="AI product badges">
      {badges.map((badge) => (
        <span key={badge.text} className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.color}`}>
          {badge.text}
        </span>
      ))}
    </div>
  );
}
