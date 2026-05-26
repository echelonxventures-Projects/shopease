"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  getBestsellerGiftCards,
  getNewArrivalGiftCards,
  getFeaturedGiftCards,
  getGiftCardsByOccasion,
  getGiftCardStoreCards,
  getAllOccasions,
  getGiftCardFilterOptions,
} from "@/server/actions/gift-card-store-actions";
import { GiftCardStoreCard } from "@/components/storefront/GiftCardStoreCard";
import { Button } from "@/components/ui/button";
import { ChevronRight, Gift, Filter, X } from "lucide-react";

function GiftCardsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab") || "all";
  const occasionSlug = searchParams.get("occasion") || "";
  const [cards, setCards] = useState<any[]>([]);
  const [occasions, setOccasions] = useState<any[]>([]);
  const [bestsellers, setBestsellers] = useState<any[]>([]);
  const [newArrivals, setNewArrivals] = useState<any[]>([]);
  const [featured, setFeatured] = useState<any[]>([]);
  const [occasionCards, setOccasionCards] = useState<any[]>([]);
  const [filterOptions, setFilterOptions] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [deliveryFilter, setDeliveryFilter] = useState("");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("popularity");

  const fetchCards = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === "all") {
        const result = await getGiftCardStoreCards({
          sortBy: sortBy as any,
          deliveryType: deliveryFilter || undefined,
          search: search || undefined,
          limit: 48,
        });
        setCards(result.cards);
      } else if (tab === "bestsellers") {
        const data = await getBestsellerGiftCards(24);
        setCards(data);
      } else if (tab === "new-arrivals") {
        const data = await getNewArrivalGiftCards(24);
        setCards(data);
      } else if (tab === "occasion" && occasionSlug) {
        const data = await getGiftCardsByOccasion(occasionSlug, 24);
        setCards(data);
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false);
    }
  }, [tab, occasionSlug, deliveryFilter, search, sortBy]);

  useEffect(() => {
    getAllOccasions().then(setOccasions).catch(() => {});
    getBestsellerGiftCards(12).then(setBestsellers).catch(() => {});
    getNewArrivalGiftCards(12).then(setNewArrivals).catch(() => {});
    getFeaturedGiftCards(8).then(setFeatured).catch(() => {});
    getGiftCardFilterOptions().then(setFilterOptions).catch(() => {});
  }, []);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  useEffect(() => {
    if (tab === "all") {
      const loadOccasionCards = async () => {
        const popular = ["birthday", "wedding", "anniversary", "congratulations", "christmas", "diwali"];
        const results = await Promise.all(
          popular.map(async (slug) => {
            const cards = await getGiftCardsByOccasion(slug, 8);
            return { slug, cards };
          })
        );
        setOccasionCards(results as any);
      };
      loadOccasionCards();
    }
  }, [tab]);

  const tabs = [
    { label: "Bestsellers", value: "bestsellers" },
    { label: "Birthday", value: "occasion", occasion: "birthday" },
    { label: "Wedding & Engagement", value: "occasion", occasion: "wedding" },
    { label: "Anniversary", value: "occasion", occasion: "anniversary" },
    { label: "Diwali", value: "occasion", occasion: "diwali" },
    { label: "Christmas", value: "occasion", occasion: "christmas" },
    { label: "New Arrivals", value: "new-arrivals" },
    { label: "By Occasion", value: "by-occasion" },
    { label: "By Brand", value: "by-brand" },
  ];

  const handleTabClick = (value: string, occasion?: string) => {
    const params = new URLSearchParams();
    params.set("tab", value);
    if (occasion) params.set("occasion", occasion);
    router.push(`/gift-cards?${params.toString()}`);
  };

  const activeTab = tabs.find((t) => t.value === tab);
  const pageTitle = occasionSlug
    ? occasions.find((o) => o.slug === occasionSlug)?.name || "Gift Cards"
    : activeTab?.label || "Gift Cards";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-gradient-to-r from-yellow-50 via-orange-50 to-pink-50 border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3 mb-4">
            <Gift className="w-8 h-8 text-orange-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Gift Cards</h1>
              <p className="text-sm text-gray-500">Give the gift of choice</p>
            </div>
          </div>
          <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
            {tabs.map((t) => (
              <button
                key={t.value + (t.occasion || "")}
                onClick={() => handleTabClick(t.value, t.occasion)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  (tab === t.value && (!t.occasion || occasionSlug === t.occasion))
                    ? "bg-orange-600 text-white"
                    : "bg-white text-gray-700 hover:bg-gray-100 border"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {featured.length > 0 && tab === "all" && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="bg-gradient-to-r from-orange-600 to-pink-600 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold mb-1">Send a Gift Card Today!</h2>
                <p className="text-sm text-orange-100">Instant eGift delivery. Starting from just ₹25.</p>
              </div>
              <Link href="/gift-cards/redeem">
                <Button variant="secondary" size="sm" className="bg-white text-orange-700 hover:bg-orange-100">
                  Redeem Now
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6 flex gap-6">
        {showFilters && (
          <div className="w-64 shrink-0 space-y-6">
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Delivery Type</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="delivery" checked={!deliveryFilter} onChange={() => setDeliveryFilter("")} />
                  All
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="delivery" checked={deliveryFilter === "E_GIFT"} onChange={() => setDeliveryFilter("E_GIFT")} />
                  eGift Cards
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="delivery" checked={deliveryFilter === "PHYSICAL"} onChange={() => setDeliveryFilter("PHYSICAL")} />
                  Physical Cards
                </label>
              </div>
            </div>
            <div className="bg-white rounded-lg border p-4">
              <h3 className="font-semibold text-sm mb-3">Sort By</h3>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full border rounded-lg px-3 py-2 text-sm">
                <option value="popularity">Popularity</option>
                <option value="newest">Newest</option>
                <option value="priceLow">Price: Low to High</option>
                <option value="priceHigh">Price: High to Low</option>
              </select>
            </div>
          </div>
        )}

        <div className="flex-1 space-y-8">
          <div className="bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className="flex items-center gap-2">
                  <Filter className="w-4 h-4" /> Filters
                </Button>
                <h2 className="text-lg font-bold">{pageTitle}</h2>
                <span className="text-sm text-gray-500">{cards.length} items</span>
              </div>
              <div className="flex items-center gap-2">
                <input type="text" placeholder="Search gift cards..." value={search} onChange={(e) => { setSearch(e.target.value); }} className="border rounded-lg px-3 py-2 text-sm w-64" />
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-4 border-orange-500 border-t-transparent" />
            </div>
          ) : cards.length === 0 ? (
            <div className="bg-white rounded-lg border text-center py-16 text-gray-400">
              <Gift className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-lg font-medium">No gift cards found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-4">
              {cards.map((card) => (
                <GiftCardStoreCard key={card.id} card={card} />
              ))}
            </div>
          )}

          {tab === "all" && (
            <>
              {bestsellers.length > 0 && (
                <section className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">Bestsellers in Gift Cards</h2>
                    <button onClick={() => handleTabClick("bestsellers")} className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
                      See all <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {bestsellers.map((card) => (
                      <GiftCardStoreCard key={card.id} card={card} compact />
                    ))}
                  </div>
                </section>
              )}
              {newArrivals.length > 0 && (
                <section className="bg-white rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold">New Arrivals</h2>
                    <button onClick={() => handleTabClick("new-arrivals")} className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
                      See all <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {newArrivals.map((card) => (
                      <GiftCardStoreCard key={card.id} card={card} compact />
                    ))}
                  </div>
                </section>
              )}
              {occasionCards.length > 0 &&
                occasionCards.map(({ slug, cards: oCards }: any) => {
                  const occasion = occasions.find((o) => o.slug === slug);
                  if (!occasion || oCards.length === 0) return null;
                  return (
                    <section key={slug} className="bg-white rounded-lg border p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">{occasion.icon} {occasion.name} Gift Cards</h2>
                        <button onClick={() => handleTabClick("occasion", slug)} className="text-sm text-orange-600 hover:text-orange-700 flex items-center gap-1">
                          See all <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {oCards.slice(0, 6).map((card: any) => (
                          <GiftCardStoreCard key={card.id} card={card} compact />
                        ))}
                      </div>
                    </section>
                  );
                })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function GiftCardsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    }>
      <GiftCardsContent />
    </Suspense>
  );
}
