"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSession, isAdminRole } from "@/lib/auth";
import { initializeProviders, searchContent as searchContentAPI, getContentDetails as getContentDetailsAPI, getTrendingContent as getTrendingAPI } from "@/lib/providers";
import { validate, vId, vStr } from "@/lib/validate";
import { buildHlsManifest, generateAdBreaks, issueDrmLicense, type StreamQuality } from "@/lib/streaming/playback";
import slugify from "slugify";

// Active playback sessions are tracked as StreamingNotification rows (type "STREAM",
// message=contentId, linkUrl=deviceId, imageUrl=last-seen epoch) and expire after this TTL.
const STREAM_TTL_MS = 90_000;

// ── Config ──────────────────────────────────────────────────────────────────

export async function getStreamingConfig() {
  let config = await prisma.streamingConfig.findFirst();
  if (!config) {
    config = await prisma.streamingConfig.create({ data: {} });
  }
  return config;
}

export async function updateStreamingConfig(data: Record<string, unknown>) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  const existing = await prisma.streamingConfig.findFirst();
  if (existing) {
    return prisma.streamingConfig.update({ where: { id: existing.id }, data: data as never });
  }
  return prisma.streamingConfig.create({ data: data as never });
}

// ── Plans ───────────────────────────────────────────────────────────────────

export async function getStreamingPlans(activeOnly = true) {
  return prisma.streamingPlan.findMany({
    where: activeOnly ? { isActive: true } : undefined,
    orderBy: { sortOrder: "asc" },
  });
}

export async function createStreamingPlan(data: {
  name: string; price: number; interval?: string; maxStreams?: number;
  maxProfiles?: number; quality?: string; downloadAllowed?: boolean;
  adsEnabled?: boolean; features?: string[]; trialDays?: number;
  options?: Record<string, string>;
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  const input = validate(z.object({
    name: vStr(100),
    price: z.number().positive(),
    interval: z.enum(["MONTHLY", "QUARTERLY", "YEARLY"]).default("MONTHLY"),
    maxStreams: z.number().int().min(1).max(10).default(1),
    maxProfiles: z.number().int().min(1).max(10).default(1),
    quality: z.enum(["SD", "HD", "FULL_HD", "UHD_4K", "DOLBY_VISION"]).default("HD"),
    downloadAllowed: z.boolean().default(false),
    adsEnabled: z.boolean().default(false),
    features: z.array(z.string().max(200)).max(20).default([]),
    trialDays: z.number().int().min(0).max(90).default(0),
    options: z.record(z.string().max(100), z.string().max(500)).optional(),
  }), data);

  const { options, ...rest } = input;
  return prisma.streamingPlan.create({
    data: {
      ...rest,
      name: rest.name as string,
      slug: slugify(rest.name as string, { lower: true }),
      quality: rest.quality as never,
      options: options ?? undefined,
    },
  });
}

export async function updateStreamingPlan(id: string, data: Record<string, unknown>) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  validate(z.object({ id: vId }), { id });
  return prisma.streamingPlan.update({ where: { id }, data: data as never });
}

export async function deleteStreamingPlan(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.streamingPlan.update({ where: { id }, data: { isActive: false } });
}

// ── Content ─────────────────────────────────────────────────────────────────

export async function getStreamingContent(filters?: {
  type?: string; genre?: string; language?: string; featured?: boolean;
  search?: string; page?: number; limit?: number;
}) {
  const page = filters?.page || 1;
  const limit = filters?.limit || 20;

  const where: Record<string, unknown> = { isActive: true };
  if (filters?.type) where.type = filters.type;
  if (filters?.language) where.language = filters.language;
  if (filters?.featured) where.isFeatured = true;
  if (filters?.genre) where.genres = { has: filters.genre };
  if (filters?.search) where.title = { contains: filters.search, mode: "insensitive" };

  const [items, total] = await Promise.all([
    prisma.streamingContent.findMany({
      where: where as never,
      orderBy: [{ isFeatured: "desc" }, { releaseDate: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.streamingContent.count({ where: where as never }),
  ]);

  return { items, total, totalPages: Math.ceil(total / limit) };
}

export async function getContentById(id: string) {
  return prisma.streamingContent.findUnique({
    where: { id },
    include: { episodes: { orderBy: [{ seasonNumber: "asc" }, { episodeNumber: "asc" }] } },
  });
}

export async function createStreamingContent(data: {
  title: string; type: string; description?: string; thumbnailUrl?: string;
  bannerUrl?: string; trailerUrl?: string; videoUrl?: string; duration?: number;
  releaseDate?: string; rating?: string; language?: string; genres?: string[];
  cast?: string[]; director?: string; studio?: string; seasonNumber?: number;
  episodeNumber?: number; seriesId?: string; isFeatured?: boolean; isExclusive?: boolean;
  tags?: string[];
}) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  const input = validate(z.object({
    title: vStr(300),
    type: z.enum(["MOVIE", "SERIES", "EPISODE", "DOCUMENTARY", "SHORT", "LIVE", "MUSIC_VIDEO", "PODCAST"]),
    description: z.string().trim().max(5000).optional(),
    thumbnailUrl: z.string().url().max(2048).optional().or(z.literal("")),
    bannerUrl: z.string().url().max(2048).optional().or(z.literal("")),
    trailerUrl: z.string().url().max(2048).optional().or(z.literal("")),
    videoUrl: z.string().url().max(2048).optional().or(z.literal("")),
    duration: z.number().int().min(0).optional(),
    releaseDate: z.string().optional(),
    rating: z.string().max(10).optional(),
    language: z.string().max(10).default("en"),
    genres: z.array(z.string().max(50)).max(10).default([]),
    cast: z.array(z.string().max(100)).max(50).default([]),
    director: z.string().max(200).optional(),
    studio: z.string().max(200).optional(),
    seasonNumber: z.number().int().min(1).optional(),
    episodeNumber: z.number().int().min(1).optional(),
    seriesId: z.string().optional().or(z.literal("")),
    isFeatured: z.boolean().default(false),
    isExclusive: z.boolean().default(false),
    tags: z.array(z.string().max(50)).max(20).default([]),
  }), data);

  return prisma.streamingContent.create({
    data: {
      ...input,
      title: input.title as string,
      slug: slugify(input.title as string, { lower: true }) + "-" + Date.now().toString(36),
      type: input.type as never,
      releaseDate: input.releaseDate ? new Date(input.releaseDate) : undefined,
      seriesId: input.seriesId || undefined,
      thumbnailUrl: input.thumbnailUrl || undefined,
      bannerUrl: input.bannerUrl || undefined,
      trailerUrl: input.trailerUrl || undefined,
      videoUrl: input.videoUrl || undefined,
      director: input.director || undefined,
      studio: input.studio || undefined,
    },
  });
}

export async function updateStreamingContent(id: string, data: Record<string, unknown>) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.streamingContent.update({ where: { id }, data: data as never });
}

export async function deleteStreamingContent(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.streamingContent.update({ where: { id }, data: { isActive: false } });
}

// ── User Subscription ───────────────────────────────────────────────────────

export async function getUserSubscription() {
  const session = await getSession();
  if (!session?.user?.id) return null;

  return prisma.streamingSubscription.findFirst({
    where: { userId: session.user.id as string, status: { in: ["ACTIVE", "TRIAL"] } },
    include: { plan: true },
  });
}

export async function subscribeToPlan(planId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;

  // Check existing active subscription
  const existing = await prisma.streamingSubscription.findFirst({
    where: { userId, status: { in: ["ACTIVE", "TRIAL"] } },
  });
  if (existing) throw new Error("You already have an active subscription");

  const plan = await prisma.streamingPlan.findUnique({ where: { id: planId } });
  if (!plan || !plan.isActive) throw new Error("Plan not available");

  const startDate = new Date();
  const trialEndsAt = plan.trialDays > 0 ? new Date(startDate.getTime() + plan.trialDays * 86400000) : null;

  // Grant streaming platform access
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { platforms: true } });
  if (user && !user.platforms.includes("streaming")) {
    await prisma.user.update({ where: { id: userId }, data: { platforms: { push: "streaming" } } });
  }

  return prisma.streamingSubscription.create({
    data: {
      userId,
      planId,
      status: trialEndsAt ? "TRIAL" : "ACTIVE",
      startDate,
      trialEndsAt,
      endDate: new Date(startDate.getTime() + (plan.interval === "YEARLY" ? 365 : plan.interval === "QUARTERLY" ? 90 : 30) * 86400000),
    },
  });
}

export async function cancelSubscription() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const sub = await prisma.streamingSubscription.findFirst({
    where: { userId: session.user.id as string, status: { in: ["ACTIVE", "TRIAL"] } },
  });
  if (!sub) throw new Error("No active subscription");

  return prisma.streamingSubscription.update({
    where: { id: sub.id },
    data: { status: "CANCELLED", cancelledAt: new Date(), autoRenew: false },
  });
}

// ── Watch History & Watchlist ────────────────────────────────────────────────

export async function updateWatchProgress(contentId: string, progress: number) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;

  const content = await prisma.streamingContent.findUnique({ where: { id: contentId }, select: { duration: true } });
  const completed = content?.duration ? progress >= content.duration * 0.9 : false;

  await prisma.watchHistory.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: { userId, contentId, progress, completed },
    update: { progress, completed, lastWatched: new Date() },
  });

  // Increment view count on first watch
  if (progress <= 10) {
    await prisma.streamingContent.update({ where: { id: contentId }, data: { viewCount: { increment: 1 } } });
  }
}

export async function getWatchHistory(limit = 20) {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return prisma.watchHistory.findMany({
    where: { userId: session.user.id as string },
    include: { content: true },
    orderBy: { lastWatched: "desc" },
    take: limit,
  });
}

export async function getContinueWatching() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const config = await prisma.streamingConfig.findFirst();
  const limit = config?.continueWatchingLimit ?? 10;

  return prisma.watchHistory.findMany({
    where: { userId: session.user.id as string, completed: false, progress: { gt: 0 } },
    include: { content: true },
    orderBy: { lastWatched: "desc" },
    take: limit,
  });
}

export async function toggleWatchlist(contentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;

  const existing = await prisma.streamingWatchlist.findUnique({
    where: { userId_contentId: { userId, contentId } },
  });

  if (existing) {
    await prisma.streamingWatchlist.delete({ where: { id: existing.id } });
    return { added: false };
  }

  await prisma.streamingWatchlist.create({ data: { userId, contentId } });
  return { added: true };
}

export async function getWatchlist() {
  const session = await getSession();
  if (!session?.user?.id) return [];

  return prisma.streamingWatchlist.findMany({
    where: { userId: session.user.id as string },
    include: { content: true },
    orderBy: { addedAt: "desc" },
  });
}

// ── Profiles ────────────────────────────────────────────────────────────────

export async function getProfiles() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  return prisma.streamingProfile.findMany({ where: { userId: session.user.id as string }, orderBy: { createdAt: "asc" } });
}

export async function createProfile(data: { name: string; avatarUrl?: string; isKids?: boolean }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;
  const count = await prisma.streamingProfile.count({ where: { userId } });
  const config = await prisma.streamingConfig.findFirst();
  const maxProfiles = config?.maxProfiles ?? 5;
  if (count >= maxProfiles) throw new Error(`Maximum ${maxProfiles} profiles allowed`);
  return prisma.streamingProfile.create({ data: { userId, name: data.name, avatarUrl: data.avatarUrl, isKids: data.isKids ?? false } });
}

export async function updateProfile(id: string, data: { name?: string; avatarUrl?: string; maturityRating?: string; language?: string; autoPlayNext?: boolean; pin?: string }) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.streamingProfile.update({ where: { id, userId: session.user.id as string }, data });
}

export async function deleteProfile(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.streamingProfile.delete({ where: { id, userId: session.user.id as string } });
}

// ── Ratings & Reviews ───────────────────────────────────────────────────────

export async function rateContent(contentId: string, rating: number, review?: string, spoiler?: boolean) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  if (rating < 1 || rating > 5) throw new Error("Rating must be 1-5");
  return prisma.streamingRating.upsert({
    where: { userId_contentId: { userId: session.user.id as string, contentId } },
    create: { userId: session.user.id as string, contentId, rating, review, spoiler: spoiler ?? false },
    update: { rating, review, spoiler: spoiler ?? false },
  });
}

export async function getContentRatings(contentId: string) {
  const [ratings, avg] = await Promise.all([
    prisma.streamingRating.findMany({ where: { contentId }, orderBy: { createdAt: "desc" }, take: 20 }),
    prisma.streamingRating.aggregate({ where: { contentId }, _avg: { rating: true }, _count: true }),
  ]);
  return { ratings, average: avg._avg.rating ?? 0, count: avg._count };
}

export async function markReviewHelpful(ratingId: string) {
  return prisma.streamingRating.update({ where: { id: ratingId }, data: { helpful: { increment: 1 } } });
}

// ── Recommendations ─────────────────────────────────────────────────────────

export async function getRecommendations() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const userId = session.user.id as string;
  const config = await prisma.streamingConfig.findFirst();
  const limit = config?.recommendationLimit ?? 20;
  const historyLimit = config?.watchHistoryLimit ?? 50;

  const history = await prisma.watchHistory.findMany({ where: { userId }, include: { content: { select: { genres: true } } }, take: historyLimit, orderBy: { lastWatched: "desc" } });
  const watchedIds = history.map((h) => h.contentId);
  if (watchedIds.length === 0) {
    return prisma.streamingContent.findMany({ where: { isActive: true, isFeatured: true }, take: limit });
  }

  // Item-based collaborative filtering: "viewers who watched what you watched also watched…"
  const peers = await prisma.watchHistory.findMany({ where: { contentId: { in: watchedIds }, userId: { not: userId } }, select: { userId: true }, take: 1000 });
  const peerIds = [...new Set(peers.map((p) => p.userId))];

  let recIds: string[] = [];
  if (peerIds.length > 0) {
    const coWatched = await prisma.watchHistory.groupBy({
      by: ["contentId"],
      where: { userId: { in: peerIds }, contentId: { notIn: watchedIds } },
      _count: { contentId: true },
      orderBy: { _count: { contentId: "desc" } },
      take: limit,
    });
    recIds = coWatched.map((c) => c.contentId);
  }

  const found = recIds.length ? await prisma.streamingContent.findMany({ where: { id: { in: recIds }, isActive: true } }) : [];
  let result = recIds.map((id) => found.find((c) => c.id === id)).filter(Boolean) as typeof found;

  // Cold-start / sparse-overlap fallback: fill remaining slots by genre affinity.
  if (result.length < limit) {
    const genres = [...new Set(history.flatMap((h) => h.content.genres))];
    const exclude = [...watchedIds, ...result.map((c) => c.id)];
    const fill = await prisma.streamingContent.findMany({
      where: { isActive: true, id: { notIn: exclude }, ...(genres.length ? { genres: { hasSome: genres } } : {}) },
      orderBy: { viewCount: "desc" },
      take: limit - result.length,
    });
    result = [...result, ...fill];
  }
  return result;
}

export async function getSimilarContent(contentId: string) {
  const content = await prisma.streamingContent.findUnique({ where: { id: contentId } });
  if (!content) return [];
  return prisma.streamingContent.findMany({
    where: { isActive: true, id: { not: contentId }, OR: [{ genres: { hasSome: content.genres } }, { language: content.language }] },
    orderBy: { viewCount: "desc" },
    take: 12,
  });
}

// ── Collections ─────────────────────────────────────────────────────────────

export async function getCollections() {
  return prisma.streamingCollection.findMany({
    where: { isActive: true },
    include: { items: { include: { content: true }, orderBy: { sortOrder: "asc" }, take: 20 } },
    orderBy: { sortOrder: "asc" },
  });
}

export async function getCollectionBySlug(slug: string) {
  return prisma.streamingCollection.findUnique({
    where: { slug },
    include: { items: { include: { content: true }, orderBy: { sortOrder: "asc" } } },
  });
}

export async function createCollection(data: { title: string; type?: string; genre?: string; description?: string }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  const slug = slugify(data.title, { lower: true, strict: true }) + "-" + Date.now().toString(36);
  return prisma.streamingCollection.create({ data: { ...data, slug } });
}

export async function addToCollection(collectionId: string, contentId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  const max = await prisma.streamingCollectionItem.aggregate({ where: { collectionId }, _max: { sortOrder: true } });
  return prisma.streamingCollectionItem.upsert({
    where: { collectionId_contentId: { collectionId, contentId } },
    create: { collectionId, contentId, sortOrder: (max._max.sortOrder ?? 0) + 1 },
    update: {},
  });
}

export async function removeFromCollection(collectionId: string, contentId: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.streamingCollectionItem.delete({ where: { collectionId_contentId: { collectionId, contentId } } });
}

export async function deleteCollection(id: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  return prisma.streamingCollection.update({ where: { id }, data: { isActive: false } });
}

// ── Notifications ───────────────────────────────────────────────────────────

export async function getNotifications() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  return prisma.streamingNotification.findMany({ where: { userId: session.user.id as string, type: { notIn: ["STREAM", "DEVICE", "HIDDEN"] } }, orderBy: { createdAt: "desc" }, take: 30 });
}

export async function markNotificationRead(id: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.streamingNotification.update({ where: { id, userId: session.user.id as string }, data: { isRead: true } });
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.streamingNotification.updateMany({ where: { userId: session.user.id as string, isRead: false }, data: { isRead: true } });
}

// Admin: send notification to all users or specific user
export async function sendNotification(data: { userId?: string; type: string; title: string; message: string; imageUrl?: string; linkUrl?: string }) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");
  if (data.userId) {
    return prisma.streamingNotification.create({ data: { userId: data.userId, type: data.type, title: data.title, message: data.message, imageUrl: data.imageUrl, linkUrl: data.linkUrl } });
  }
  // Broadcast: get all users with streaming subscriptions
  const subs = await prisma.streamingSubscription.findMany({ where: { status: { in: ["ACTIVE", "TRIAL"] } }, select: { userId: true } });
  const notifications = subs.map((s) => ({ userId: s.userId, type: data.type, title: data.title, message: data.message, imageUrl: data.imageUrl, linkUrl: data.linkUrl }));
  return prisma.streamingNotification.createMany({ data: notifications });
}

// ── Downloads ───────────────────────────────────────────────────────────────

export async function getDownloads() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  return prisma.streamingDownload.findMany({
    where: { userId: session.user.id as string, status: { in: ["DOWNLOADING", "COMPLETED"] } },
    include: { content: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function requestDownload(contentId: string, quality?: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;

  const config = await prisma.streamingConfig.findFirst();
  if (!config?.downloadEnabled) throw new Error("Downloads are not enabled");

  const count = await prisma.streamingDownload.count({ where: { userId, status: { in: ["DOWNLOADING", "COMPLETED"] } } });
  const maxDownloads = config.maxDownloads ?? 25;
  if (count >= maxDownloads) throw new Error(`Download limit reached (max ${maxDownloads})`);

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + (config.offlineViewingDays ?? 30));

  return prisma.streamingDownload.upsert({
    where: { userId_contentId: { userId, contentId } },
    create: { userId, contentId, quality: (quality as StreamQuality) ?? "HD", status: "COMPLETED", expiresAt },
    update: { quality: (quality as StreamQuality) ?? "HD", status: "COMPLETED", expiresAt },
  });
}

export async function deleteDownload(contentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.streamingDownload.updateMany({ where: { userId: session.user.id as string, contentId }, data: { status: "DELETED" } });
}

// ── Live API Content Discovery (TMDB/OMDb) ──────────────────────────────────

export async function searchExternalContent(query: string, type?: string) {
  initializeProviders();
  return searchContentAPI(query, type);
}

export async function getExternalContentDetails(externalId: string, mediaType?: string) {
  initializeProviders();
  return getContentDetailsAPI(externalId, mediaType);
}

export async function getTrendingExternal(timeWindow?: string) {
  initializeProviders();
  return getTrendingAPI(timeWindow);
}

/** Import content from external API into local DB */
export async function importExternalContent(externalId: string, mediaType?: string) {
  const session = await getSession();
  if (!session || !isAdminRole(session.user?.role)) throw new Error("Unauthorized");

  initializeProviders();
  const details = await getContentDetailsAPI(externalId, mediaType);
  if (!details) throw new Error("Content not found");

  const slug = details.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 80) + "-" + Date.now().toString(36);
  return prisma.streamingContent.create({
    data: {
      title: details.title,
      slug,
      type: details.type === "SERIES" ? "SERIES" : details.type === "DOCUMENTARY" ? "DOCUMENTARY" : "MOVIE",
      description: details.description || "",
      thumbnailUrl: details.posterUrl,
      bannerUrl: details.backdropUrl,
      trailerUrl: details.trailerKey ? `https://www.youtube.com/watch?v=${details.trailerKey}` : null,
      duration: details.runtime ? details.runtime * 60 : null,
      releaseDate: details.releaseDate ? new Date(details.releaseDate) : null,
      imdbRating: details.imdbRating,
      language: details.language || "en",
      genres: details.genres,
      cast: details.cast,
      director: details.director,
      isFeatured: false,
    },
  });
}

// ── Content Hiding ("Not Interested") ───────────────────────────────────────

export async function hideContent(contentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;
  // Store in a simple JSON array on user preferences (using watchlist with a flag)
  const existing = await prisma.streamingWatchlist.findUnique({ where: { userId_contentId: { userId, contentId } } });
  if (existing) await prisma.streamingWatchlist.delete({ where: { id: existing.id } });
  // Use notification as a "hidden" marker (type: "HIDDEN")
  await prisma.streamingNotification.upsert({
    where: { id: `hide_${userId}_${contentId}` },
    create: { id: `hide_${userId}_${contentId}`, userId, type: "HIDDEN", title: "Hidden", message: contentId },
    update: {},
  });
  return { hidden: true };
}

export async function getHiddenContentIds() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const hidden = await prisma.streamingNotification.findMany({ where: { userId: session.user.id as string, type: "HIDDEN" } });
  return hidden.map((h) => h.message);
}

export async function unhideContent(contentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.streamingNotification.deleteMany({ where: { userId: session.user.id as string, type: "HIDDEN", message: contentId } });
  return { hidden: false };
}

// ── My List with Sorting ────────────────────────────────────────────────────

export async function getWatchlistSorted(sortBy: "addedAt" | "title" | "releaseDate" = "addedAt") {
  const session = await getSession();
  if (!session?.user?.id) return [];
  const list = await prisma.streamingWatchlist.findMany({
    where: { userId: session.user.id as string },
    include: { content: true },
    orderBy: sortBy === "addedAt" ? { addedAt: "desc" } : undefined,
  });
  if (sortBy === "title") return list.sort((a, b) => a.content.title.localeCompare(b.content.title));
  if (sortBy === "releaseDate") return list.sort((a, b) => (b.content.releaseDate?.getTime() || 0) - (a.content.releaseDate?.getTime() || 0));
  return list;
}

// ── Coming Soon & New & Popular & Top 10 ────────────────────────────────────

export async function getComingSoon() {
  const config = await prisma.streamingConfig.findFirst();
  const limit = config?.recommendationLimit ?? 20;
  return prisma.streamingContent.findMany({
    where: { isActive: true, releaseDate: { gt: new Date() } },
    orderBy: { releaseDate: "asc" },
    take: limit,
  });
}

export async function getNewAndPopular() {
  const config = await prisma.streamingConfig.findFirst();
  const windowDays = config?.newPopularWindowDays ?? 30;
  const limit = config?.recommendationLimit ?? 20;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  return prisma.streamingContent.findMany({
    where: { isActive: true, releaseDate: { gte: cutoff } },
    orderBy: { viewCount: "desc" },
    take: limit,
  });
}

export async function getTop10Trending() {
  const config = await prisma.streamingConfig.findFirst();
  const windowDays = config?.trendingWindowDays ?? 7;
  const topN = config?.topNTrending ?? 10;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - windowDays);
  const trending = await prisma.watchHistory.groupBy({
    by: ["contentId"],
    where: { lastWatched: { gte: cutoff } },
    _count: { contentId: true },
    orderBy: { _count: { contentId: "desc" } },
    take: topN,
  });
  const ids = trending.map((t) => t.contentId);
  const content = await prisma.streamingContent.findMany({ where: { id: { in: ids }, isActive: true } });
  return ids.map((id) => content.find((c) => c.id === id)).filter(Boolean);
}

// ── Kids Mode Enforcement ───────────────────────────────────────────────────

export async function getContentForProfile(profileId?: string, filters?: { type?: string; genre?: string; search?: string; limit?: number }) {
  const config = await prisma.streamingConfig.findFirst();
  const maturityOrder = config?.maturityLevels ?? ["U", "U/A 7+", "U/A 13+", "U/A 16+", "A"];
  let maxMaturity = maturityOrder[maturityOrder.length - 1];

  if (profileId) {
    const profile = await prisma.streamingProfile.findUnique({ where: { id: profileId } });
    if (profile) {
      maxMaturity = profile.maturityRating;
      if (profile.isKids) maxMaturity = maturityOrder[1] || "U/A 7+";
    }
  }

  const allowedRatings = maturityOrder.slice(0, maturityOrder.indexOf(maxMaturity) + 1);
  const hiddenIds = await getHiddenContentIds();

  const where: Record<string, unknown> = { isActive: true, maturityRating: { in: allowedRatings } };
  if (hiddenIds.length > 0) where.id = { notIn: hiddenIds };
  if (filters?.type) where.type = filters.type;
  if (filters?.genre) where.genres = { has: filters.genre };
  if (filters?.search) where.title = { contains: filters.search, mode: "insensitive" };

  return prisma.streamingContent.findMany({ where: where as never, orderBy: { viewCount: "desc" }, take: filters?.limit || (config?.recommendationLimit ?? 50) });
}

// ── Device/Session Management ───────────────────────────────────────────────

export async function getActiveDevices() {
  const session = await getSession();
  if (!session?.user?.id) return [];
  // Track via notifications as device sessions (type: "DEVICE")
  return prisma.streamingNotification.findMany({
    where: { userId: session.user.id as string, type: "DEVICE" },
    orderBy: { createdAt: "desc" },
  });
}

export async function registerDevice(deviceInfo: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;
  // Check max concurrent streams
  const config = await prisma.streamingConfig.findFirst();
  const sub = await prisma.streamingSubscription.findFirst({ where: { userId, status: { in: ["ACTIVE", "TRIAL"] } }, include: { plan: true } });
  const maxStreams = sub?.plan?.maxStreams || config?.maxConcurrentStreams || 1;
  const devices = await prisma.streamingNotification.count({ where: { userId, type: "DEVICE" } });
  if (devices >= maxStreams) throw new Error(`Maximum ${maxStreams} devices allowed. Remove a device first.`);

  return prisma.streamingNotification.create({
    data: { userId, type: "DEVICE", title: "Device", message: deviceInfo },
  });
}

export async function removeDevice(deviceId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.streamingNotification.delete({ where: { id: deviceId, userId: session.user.id as string } });
}

export async function signOutAllDevices() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.streamingNotification.deleteMany({ where: { userId: session.user.id as string, type: "DEVICE" } });
}

// ── Geo-Restrictions ────────────────────────────────────────────────────────

export async function getContentByRegion(region: string) {
  // Content with no region restriction OR matching region in tags
  return prisma.streamingContent.findMany({
    where: { isActive: true, OR: [{ tags: { isEmpty: true } }, { tags: { has: `region:${region}` } }, { tags: { has: "region:GLOBAL" } }] },
    orderBy: { viewCount: "desc" },
    take: 50,
  });
}

// ── Coming Soon Reminders ───────────────────────────────────────────────────

export async function setReminder(contentId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const content = await prisma.streamingContent.findUnique({ where: { id: contentId } });
  if (!content) throw new Error("Content not found");
  return prisma.streamingNotification.create({
    data: { userId: session.user.id as string, type: "REMINDER", title: `Reminder: ${content.title}`, message: `We'll notify you when "${content.title}" is available.`, linkUrl: `/streaming/watch/${contentId}` },
  });
}

// ── Playback Pipeline (manifest + DRM + ads + concurrent-stream enforcement) ──

/**
 * Authorize playback and return an ABR manifest, ad cue-points (ad tier), and a
 * DRM license. Enforces the plan's concurrent-stream cap at stream start.
 */
export async function getPlaybackManifest(contentId: string, deviceId?: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;

  const sub = await prisma.streamingSubscription.findFirst({ where: { userId, status: { in: ["ACTIVE", "TRIAL"] } }, include: { plan: true } });
  if (!sub) throw new Error("Active subscription required");

  const content = await prisma.streamingContent.findUnique({ where: { id: contentId } });
  if (!content || !content.isActive) throw new Error("Content unavailable");

  // Concurrent-stream enforcement (Netflix-style), reaping stale sessions first.
  const maxStreams = sub.plan?.maxStreams || 1;
  const now = Date.now();
  const device = deviceId || "web";
  const sessions = await prisma.streamingNotification.findMany({ where: { userId, type: "STREAM" } });
  const staleIds = sessions.filter((s) => now - Number(s.imageUrl || 0) >= STREAM_TTL_MS).map((s) => s.id);
  if (staleIds.length) await prisma.streamingNotification.deleteMany({ where: { id: { in: staleIds } } });
  const active = sessions.filter((s) => now - Number(s.imageUrl || 0) < STREAM_TTL_MS);
  const mine = active.find((s) => s.linkUrl === device && s.message === contentId);
  if (!mine && active.length >= maxStreams) throw new Error(`Stream limit reached (${maxStreams}). Stop another stream to continue.`);

  const sess = mine
    ? await prisma.streamingNotification.update({ where: { id: mine.id }, data: { imageUrl: String(now) } })
    : await prisma.streamingNotification.create({ data: { userId, type: "STREAM", title: "Playback", message: contentId, linkUrl: device, imageUrl: String(now) } });

  const maxQuality = ((sub.plan?.quality as StreamQuality) || "HD");
  const manifest = buildHlsManifest(content.videoUrl, maxQuality);
  const adBreaks = sub.plan?.adsEnabled ? generateAdBreaks(content.duration) : [];
  const drm = await issueDrmLicense({ contentId, userId, deviceId: device });
  const progress = await prisma.watchHistory.findUnique({ where: { userId_contentId: { userId, contentId } }, select: { progress: true } });

  return { sessionId: sess.id, manifest, adBreaks, drm, maxQuality, isLive: content.type === "LIVE", resumeFrom: progress?.progress ?? 0 };
}

/** Keep a playback session alive (call periodically while playing). */
export async function heartbeatPlayback(sessionId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.streamingNotification.updateMany({ where: { id: sessionId, userId: session.user.id as string, type: "STREAM" }, data: { imageUrl: String(Date.now()) } });
}

/** End a playback session, freeing a concurrent-stream slot. */
export async function stopPlayback(sessionId: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return prisma.streamingNotification.deleteMany({ where: { id: sessionId, userId: session.user.id as string, type: "STREAM" } });
}

/** Issue an offline-playback (download) DRM license, enforcing the expiry window. */
export async function getDownloadLicense(contentId: string, deviceId?: string) {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  const userId = session.user.id as string;

  const download = await prisma.streamingDownload.findUnique({ where: { userId_contentId: { userId, contentId } } });
  if (!download || download.status === "DELETED") throw new Error("No active download");
  if (download.status === "EXPIRED" || download.expiresAt.getTime() < Date.now()) {
    if (download.status !== "EXPIRED") await prisma.streamingDownload.update({ where: { id: download.id }, data: { status: "EXPIRED" } });
    throw new Error("Download license expired");
  }

  const ttl = Math.max(60, Math.floor((download.expiresAt.getTime() - Date.now()) / 1000));
  const license = await issueDrmLicense({ contentId, userId, deviceId, ttlSeconds: ttl });
  return { license, expiresAt: download.expiresAt, quality: download.quality };
}
