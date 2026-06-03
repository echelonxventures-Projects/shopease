import { PrismaClient, UserRole } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🏗️  Seeding demo sites (E-Commerce, Streaming, Trading)...\n");

  // ── Create test users for each site ────────────────────────────────────────
  const pw = await hash("Test@123", 10);

  const ecomAdmin = await prisma.user.upsert({
    where: { email: "ecom-admin@demo.com" },
    update: {},
    create: { email: "ecom-admin@demo.com", password: pw, name: "E-Com Admin", role: UserRole.ADMIN, phone: "9000000001" },
  });
  const ecomCustomer = await prisma.user.upsert({
    where: { email: "ecom-customer@demo.com" },
    update: {},
    create: { email: "ecom-customer@demo.com", password: pw, name: "E-Com Customer", role: UserRole.CUSTOMER, phone: "9000000002" },
  });
  const ecomSupport = await prisma.user.upsert({
    where: { email: "ecom-support@demo.com" },
    update: {},
    create: { email: "ecom-support@demo.com", password: pw, name: "E-Com Support", role: UserRole.SUPPORT, phone: "9000000003" },
  });

  const streamAdmin = await prisma.user.upsert({
    where: { email: "stream-admin@demo.com" },
    update: {},
    create: { email: "stream-admin@demo.com", password: pw, name: "Stream Admin", role: UserRole.ADMIN, phone: "9000000004" },
  });
  const streamCustomer = await prisma.user.upsert({
    where: { email: "stream-customer@demo.com" },
    update: {},
    create: { email: "stream-customer@demo.com", password: pw, name: "Stream Customer", role: UserRole.CUSTOMER, phone: "9000000005" },
  });
  const streamSupport = await prisma.user.upsert({
    where: { email: "stream-support@demo.com" },
    update: {},
    create: { email: "stream-support@demo.com", password: pw, name: "Stream Support", role: UserRole.SUPPORT, phone: "9000000006" },
  });

  const tradeAdmin = await prisma.user.upsert({
    where: { email: "trade-admin@demo.com" },
    update: {},
    create: { email: "trade-admin@demo.com", password: pw, name: "Trade Admin", role: UserRole.ADMIN, phone: "9000000007" },
  });
  const tradeCustomer = await prisma.user.upsert({
    where: { email: "trade-customer@demo.com" },
    update: {},
    create: { email: "trade-customer@demo.com", password: pw, name: "Trade Customer", role: UserRole.CUSTOMER, phone: "9000000008" },
  });
  const tradeSupport = await prisma.user.upsert({
    where: { email: "trade-support@demo.com" },
    update: {},
    create: { email: "trade-support@demo.com", password: pw, name: "Trade Support", role: UserRole.SUPPORT, phone: "9000000009" },
  });

  console.log("✓ Demo users created");

  // ── Get or create default parent site ──────────────────────────────────────
  let parentSite = await prisma.site.findFirst({ where: { isDefault: true } });
  if (!parentSite) {
    parentSite = await prisma.site.create({
      data: {
        name: "Main Platform", slug: "main", isDefault: true, status: "ACTIVE",
        canResell: true, resellableTypes: ["ecommerce", "streaming", "trading", "lms", "saas", "custom"],
        platformTypes: ["ecommerce", "streaming", "trading"],
        tier: 0,
      },
    });
  } else {
    await prisma.site.update({
      where: { id: parentSite.id },
      data: { canResell: true, resellableTypes: ["ecommerce", "streaming", "trading", "lms", "saas", "custom"], platformTypes: ["ecommerce", "streaming", "trading"], tier: 0 },
    });
  }

  // ── Create Site Plans ──────────────────────────────────────────────────────
  const ecomPlan = await prisma.sitePlan.upsert({
    where: { siteId_slug: { siteId: parentSite.id, slug: "pro-ecommerce" } },
    update: {},
    create: {
      siteId: parentSite.id, name: "Pro E-Commerce", slug: "pro-ecommerce",
      platformType: "ecommerce", price: 2999, interval: "MONTHLY", trialDays: 14,
      includedModules: ["ecommerce", "analytics", "email", "payments", "shipping", "inventory"],
      options: { maxProducts: "10000", customDomain: "true", maxUsers: "unlimited", storage: "50GB", support: "24/7", apiAccess: "true" },
      limits: { maxOrders: "unlimited", maxBandwidth: "500GB" },
    },
  });

  const streamPlan = await prisma.sitePlan.upsert({
    where: { siteId_slug: { siteId: parentSite.id, slug: "pro-streaming" } },
    update: {},
    create: {
      siteId: parentSite.id, name: "Pro Streaming", slug: "pro-streaming",
      platformType: "streaming", price: 4999, interval: "MONTHLY", trialDays: 7,
      includedModules: ["streaming", "analytics", "payments", "notifications", "profiles"],
      options: { maxContent: "unlimited", liveStreaming: "true", customDomain: "true", maxConcurrentViewers: "10000", CDN: "included", DRM: "Widevine + FairPlay", adSupport: "true" },
      limits: { maxStorage: "5TB", maxBandwidth: "50TB" },
    },
  });

  const tradePlan = await prisma.sitePlan.upsert({
    where: { siteId_slug: { siteId: parentSite.id, slug: "pro-trading" } },
    update: {},
    create: {
      siteId: parentSite.id, name: "Pro Trading", slug: "pro-trading",
      platformType: "trading", price: 9999, interval: "MONTHLY", trialDays: 7,
      includedModules: ["trading", "analytics", "payments", "portfolio", "watchlist", "alerts"],
      options: { maxInstruments: "unlimited", realTimeData: "true", customDomain: "true", paperTrading: "true", marginTrading: "true", algoTrading: "true", maxUsers: "unlimited" },
      limits: { maxOrdersPerSec: "1000", maxPositions: "unlimited" },
    },
  });

  console.log("✓ Site plans created");

  // ── Create E-Commerce Site ─────────────────────────────────────────────────
  const ecomSite = await prisma.site.upsert({
    where: { slug: "shopzone" },
    update: {},
    create: {
      name: "ShopZone", slug: "shopzone", subdomain: "shopzone",
      domain: "shopzone.localhost",
      status: "ACTIVE", parentSiteId: parentSite.id, tier: 1,
      platformTypes: ["ecommerce"],
      platformOptions: { maxProducts: "10000", customDomain: "true", storage: "50GB" },
      analyticsConfig: { ga4: "G-ECOM-DEMO", mixpanel: "ecom-demo-token" },
      canResell: true, resellableTypes: ["ecommerce"],
      subscribedPlanId: ecomPlan.id,
      logo: "/uploads/shopzone-logo.png",
      primaryColor: "#10b981", secondaryColor: "#f59e0b", fontFamily: "inter",
      theme: { layout: "modern", heroStyle: "carousel", productGrid: "4-col" },
      contactEmail: "ecom-admin@demo.com", contactPhone: "9000000001",
      settings: { taxInclusive: true, currency: "INR", timezone: "Asia/Kolkata" },
      description: "Full-featured e-commerce platform demo",
      metaTitle: "ShopZone - Your Online Store",
    },
  });

  // ── Create Streaming Site ──────────────────────────────────────────────────
  const streamSite = await prisma.site.upsert({
    where: { slug: "neoflix" },
    update: {},
    create: {
      name: "NeoFlix", slug: "neoflix", subdomain: "neoflix",
      domain: "neoflix.localhost",
      status: "ACTIVE", parentSiteId: parentSite.id, tier: 1,
      platformTypes: ["streaming"],
      platformOptions: { maxContent: "unlimited", liveStreaming: "true", CDN: "included", DRM: "enabled", maxConcurrentViewers: "10000" },
      analyticsConfig: { ga4: "G-STREAM-DEMO", mixpanel: "stream-demo-token", hotjar: "stream-hj-123" },
      canResell: true, resellableTypes: ["streaming"],
      subscribedPlanId: streamPlan.id,
      logo: "/uploads/neoflix-logo.png",
      primaryColor: "#e11d48", secondaryColor: "#1e1e1e", fontFamily: "sans",
      theme: { layout: "dark", heroStyle: "cinematic", cardStyle: "poster" },
      contactEmail: "stream-admin@demo.com", contactPhone: "9000000004",
      settings: { currency: "INR", timezone: "Asia/Kolkata" },
      description: "Netflix-like streaming platform demo",
      metaTitle: "NeoFlix - Stream Unlimited",
    },
  });

  // ── Create Trading Site ────────────────────────────────────────────────────
  const tradeSite = await prisma.site.upsert({
    where: { slug: "tradex" },
    update: {},
    create: {
      name: "TradeX", slug: "tradex", subdomain: "tradex",
      domain: "tradex.localhost",
      status: "ACTIVE", parentSiteId: parentSite.id, tier: 1,
      platformTypes: ["trading"],
      platformOptions: { realTimeData: "true", marginTrading: "true", algoTrading: "true", paperTrading: "true", maxInstruments: "unlimited" },
      analyticsConfig: { ga4: "G-TRADE-DEMO", mixpanel: "trade-demo-token" },
      canResell: false,
      subscribedPlanId: tradePlan.id,
      logo: "/uploads/tradex-logo.png",
      primaryColor: "#2563eb", secondaryColor: "#10b981", fontFamily: "mono",
      theme: { layout: "dashboard", chartStyle: "candlestick", darkMode: true },
      contactEmail: "trade-admin@demo.com", contactPhone: "9000000007",
      settings: { currency: "INR", timezone: "Asia/Kolkata" },
      description: "Groww/Zerodha-like trading platform demo",
      metaTitle: "TradeX - Smart Trading",
    },
  });

  console.log("✓ Demo sites created (ShopZone, NeoFlix, TradeX)");

  // ── Assign Site Admins with full permissions ───────────────────────────────
  const fullPerms = ["*"];
  const supportPerms = ["manage_orders", "manage_customers", "manage_reviews", "view_analytics"];

  for (const { siteId, adminId, supportId } of [
    { siteId: ecomSite.id, adminId: ecomAdmin.id, supportId: ecomSupport.id },
    { siteId: streamSite.id, adminId: streamAdmin.id, supportId: streamSupport.id },
    { siteId: tradeSite.id, adminId: tradeAdmin.id, supportId: tradeSupport.id },
  ]) {
    await prisma.siteAdmin.upsert({
      where: { siteId_userId: { siteId, userId: adminId } },
      update: { permissions: fullPerms },
      create: { siteId, userId: adminId, permissions: fullPerms },
    });
    await prisma.siteAdmin.upsert({
      where: { siteId_userId: { siteId, userId: supportId } },
      update: { permissions: supportPerms },
      create: { siteId, userId: supportId, permissions: supportPerms },
    });
  }

  console.log("✓ Site admins assigned with permissions");

  // ── Create domains ─────────────────────────────────────────────────────────
  for (const { siteId, hostname } of [
    { siteId: ecomSite.id, hostname: "shopzone.localhost" },
    { siteId: streamSite.id, hostname: "neoflix.localhost" },
    { siteId: tradeSite.id, hostname: "tradex.localhost" },
  ]) {
    await prisma.siteDomain.upsert({
      where: { hostname },
      update: {},
      create: { siteId, hostname, type: "CUSTOM", sslStatus: "ACTIVE" },
    });
  }

  console.log("✓ Site domains registered");

  // ── Enable streaming config for NeoFlix ────────────────────────────────────
  const existingStreamConfig = await prisma.streamingConfig.findFirst();
  if (existingStreamConfig) {
    await prisma.streamingConfig.update({ where: { id: existingStreamConfig.id }, data: { enabled: true, brandName: "NeoFlix", tagline: "Stream Unlimited Entertainment" } });
  } else {
    await prisma.streamingConfig.create({ data: { enabled: true, brandName: "NeoFlix", tagline: "Stream Unlimited Entertainment" } });
  }

  // Create streaming plans
  for (const plan of [
    { name: "Basic", slug: "basic", price: 149, quality: "SD", maxStreams: 1, maxProfiles: 1, adsEnabled: true, features: ["SD Quality", "1 Device"], options: { resolution: "480p", offlineDownloads: "0" } },
    { name: "Standard", slug: "standard", price: 499, quality: "FULL_HD", maxStreams: 2, maxProfiles: 3, features: ["Full HD", "2 Devices", "Downloads"], options: { resolution: "1080p", offlineDownloads: "10", HDR: "false" } },
    { name: "Premium", slug: "premium", price: 799, quality: "UHD_4K", maxStreams: 4, maxProfiles: 5, downloadAllowed: true, features: ["4K + HDR", "4 Devices", "Dolby Atmos", "Unlimited Downloads"], options: { resolution: "4K", HDR: "Dolby Vision", spatialAudio: "Dolby Atmos", offlineDownloads: "unlimited", watchParty: "true" } },
  ]) {
    await prisma.streamingPlan.upsert({
      where: { slug: plan.slug },
      update: {},
      create: { ...plan, quality: plan.quality as never },
    });
  }

  console.log("✓ Streaming config & plans created");

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log("\n🎉 Demo sites seeded successfully!\n");
  console.log("┌─────────────────────────────────────────────────────────────────┐");
  console.log("│  DEMO CREDENTIALS (password for all: Test@123)                  │");
  console.log("├─────────────────────────────────────────────────────────────────┤");
  console.log("│  🛒 E-COMMERCE (ShopZone) — shopzone.localhost                  │");
  console.log("│     Admin:    ecom-admin@demo.com     (Full Access)             │");
  console.log("│     Customer: ecom-customer@demo.com                            │");
  console.log("│     Support:  ecom-support@demo.com   (Partial Access)          │");
  console.log("├─────────────────────────────────────────────────────────────────┤");
  console.log("│  🎬 STREAMING (NeoFlix) — neoflix.localhost                     │");
  console.log("│     Admin:    stream-admin@demo.com   (Full Access)             │");
  console.log("│     Customer: stream-customer@demo.com                          │");
  console.log("│     Support:  stream-support@demo.com (Partial Access)          │");
  console.log("├─────────────────────────────────────────────────────────────────┤");
  console.log("│  📈 TRADING (TradeX) — tradex.localhost                         │");
  console.log("│     Admin:    trade-admin@demo.com    (Full Access)             │");
  console.log("│     Customer: trade-customer@demo.com                           │");
  console.log("│     Support:  trade-support@demo.com  (Partial Access)          │");
  console.log("├─────────────────────────────────────────────────────────────────┤");
  console.log("│  🔑 SUPER ADMIN (all sites)                                     │");
  console.log("│     admin@example.com / Admin@123                               │");
  console.log("└─────────────────────────────────────────────────────────────────┘");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
