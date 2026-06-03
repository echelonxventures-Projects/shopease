"use client";

import { useEffect, useState } from "react";
import {
  getStreamingConfig, getStreamingContent, getStreamingPlans,
  getUserSubscription, subscribeToPlan, cancelSubscription,
  getContinueWatching, toggleWatchlist, getWatchlist,
} from "@/server/actions/streaming-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function StreamingPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [config, setConfig] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [content, setContent] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [plans, setPlans] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [subscription, setSubscription] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [continueWatching, setContinueWatching] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [genre, setGenre] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([
      getStreamingConfig(),
      getStreamingContent({ featured: true, limit: 50 }),
      getStreamingPlans(),
      getUserSubscription(),
      getContinueWatching(),
      getWatchlist(),
    ]).then(([cfg, ct, pl, sub, cw, wl]) => {
      setConfig(cfg);
      setContent(ct.items);
      setPlans(pl);
      setSubscription(sub);
      setContinueWatching(cw);
      setWatchlist(wl);
    }).finally(() => setLoading(false));
  }, []);

  const handleSearch = async () => {
    const result = await getStreamingContent({ search, genre: genre || undefined });
    setContent(result.items);
  };

  const handleSubscribe = async (planId: string) => {
    try {
      const sub = await subscribeToPlan(planId);
      setSubscription(sub);
      toast.success("Subscribed successfully!");
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleCancel = async () => {
    try {
      await cancelSubscription();
      setSubscription(null);
      toast.success("Subscription cancelled");
    } catch (e) { toast.error((e as Error).message); }
  };

  const handleWatchlist = async (contentId: string) => {
    const result = await toggleWatchlist(contentId);
    toast.success(result.added ? "Added to watchlist" : "Removed from watchlist");
    const wl = await getWatchlist();
    setWatchlist(wl);
  };

  if (loading) return <div className="flex items-center justify-center py-20">Loading...</div>;
  if (!config?.enabled) return <div className="flex items-center justify-center py-20"><p className="text-lg">Streaming service is not available yet.</p></div>;

  const genres = [...new Set(content.flatMap((c) => c.genres || []))];

  return (
    <div>
      {/* Hero */}
      {config.heroImageUrl && (
        <div className="relative h-[60vh] bg-cover bg-center" style={{ backgroundImage: `url(${config.heroImageUrl})` }}>
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
          <div className="absolute bottom-10 left-10 space-y-3">
            <h1 className="text-5xl font-bold">{config.brandName}</h1>
            {config.tagline && <p className="text-xl text-gray-300">{config.tagline}</p>}
            {!subscription && <Button size="lg" onClick={() => document.getElementById("plans")?.scrollIntoView({ behavior: "smooth" })}>Start Free Trial</Button>}
          </div>
        </div>
      )}

      <div className="px-6 py-8 space-y-10">
        {/* Search & Filter */}
        <div className="flex gap-3 items-center">
          <input
            className="bg-gray-900 border border-gray-700 rounded px-4 py-2 text-white flex-1 max-w-md"
            placeholder="Search movies, shows..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <select className="bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white" value={genre} onChange={(e) => { setGenre(e.target.value); }}>
            <option value="">All Genres</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
          <Button onClick={handleSearch}>Search</Button>
        </div>

        {/* Continue Watching */}
        {continueWatching.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">Continue Watching</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {continueWatching.map((item) => (
                <ContentCard key={item.id} content={item.content} progress={item.progress} duration={item.content.duration} onWatchlist={() => handleWatchlist(item.contentId)} />
              ))}
            </div>
          </section>
        )}

        {/* My List */}
        {watchlist.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4">My List</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {watchlist.map((item) => (
                <ContentCard key={item.id} content={item.content} onWatchlist={() => handleWatchlist(item.contentId)} />
              ))}
            </div>
          </section>
        )}

        {/* Browse Content */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Browse</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {content.map((item) => (
              <ContentCard key={item.id} content={item} onWatchlist={() => handleWatchlist(item.id)} />
            ))}
          </div>
          {content.length === 0 && <p className="text-gray-500">No content found.</p>}
        </section>

        {/* Subscription Plans */}
        {!subscription && (
          <section id="plans" className="py-10">
            <h2 className="text-2xl font-bold text-center mb-8">Choose Your Plan</h2>
            <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              {plans.map((plan) => (
                <div key={plan.id} className="border border-gray-700 rounded-xl p-6 space-y-4 hover:border-red-500 transition">
                  <h3 className="text-xl font-bold">{plan.name}</h3>
                  <p className="text-3xl font-bold">₹{Number(plan.price)}<span className="text-sm text-gray-400">/{plan.interval?.toLowerCase()}</span></p>
                  <ul className="space-y-2 text-sm text-gray-300">
                    <li>✓ {plan.quality} quality</li>
                    <li>✓ {plan.maxStreams} simultaneous stream{plan.maxStreams > 1 ? "s" : ""}</li>
                    <li>✓ {plan.maxProfiles} profile{plan.maxProfiles > 1 ? "s" : ""}</li>
                    {plan.downloadAllowed && <li>✓ Downloads enabled</li>}
                    {plan.trialDays > 0 && <li>✓ {plan.trialDays}-day free trial</li>}
                    {plan.adsEnabled && <li className="text-yellow-400">• Includes ads</li>}
                    {(plan.features || []).map((f: string) => <li key={f}>✓ {f}</li>)}
                    {plan.options && Object.entries(plan.options as Record<string, string>).map(([k, v]) => <li key={k}>✓ {k}: {v}</li>)}
                  </ul>
                  <Button className="w-full" onClick={() => handleSubscribe(plan.id)}>
                    {plan.trialDays > 0 ? "Start Free Trial" : "Subscribe"}
                  </Button>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Active Subscription */}
        {subscription && (
          <section className="border border-gray-700 rounded-xl p-6 max-w-md">
            <h3 className="font-semibold">Your Subscription</h3>
            <p className="text-lg">{subscription.plan?.name} — <Badge>{subscription.status}</Badge></p>
            {subscription.endDate && <p className="text-sm text-gray-400">Renews: {new Date(subscription.endDate).toLocaleDateString()}</p>}
            <Button variant="destructive" size="sm" className="mt-3" onClick={handleCancel}>Cancel Subscription</Button>
          </section>
        )}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ContentCard({ content, progress, duration, onWatchlist }: { content: any; progress?: number; duration?: number; onWatchlist: () => void }) {
  const progressPct = progress && duration ? Math.round((progress / duration) * 100) : 0;

  return (
    <div className="group relative min-w-[180px] w-[180px] rounded-lg overflow-hidden bg-gray-900 hover:scale-105 transition cursor-pointer">
      <div className="aspect-[2/3] bg-gray-800">
        {content.thumbnailUrl ? (
          <img src={content.thumbnailUrl} alt={content.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-600 text-xs">{content.title}</div>
        )}
      </div>
      {progressPct > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
          <div className="h-full bg-red-600" style={{ width: `${progressPct}%` }} />
        </div>
      )}
      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3">
        <p className="font-semibold text-sm truncate">{content.title}</p>
        <div className="flex gap-1 mt-1">
          <Badge variant="secondary" className="text-[10px]">{content.type}</Badge>
          {content.rating && <Badge variant="outline" className="text-[10px]">{content.rating}</Badge>}
        </div>
        <button onClick={(e) => { e.stopPropagation(); onWatchlist(); }} className="mt-2 text-xs text-gray-300 hover:text-white">+ My List</button>
      </div>
    </div>
  );
}
