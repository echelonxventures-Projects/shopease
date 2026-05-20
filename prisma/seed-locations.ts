import { PrismaClient, LocationType } from "@prisma/client";

const prisma = new PrismaClient();

interface RegionSeed {
  code: string;
  name: string;
  currency: string;
  currencySymbol: string;
  defaultLocale: string;
  supportedLocales: string[];
  taxRate: number;
  timezone: string;
  regionSlug: string; // which geographic region it belongs to
}

const REGIONS: RegionSeed[] = [
  { code: "IN", name: "India", currency: "INR", currencySymbol: "₹", defaultLocale: "en-IN", supportedLocales: ["en", "hi"], taxRate: 0.18, timezone: "Asia/Kolkata", regionSlug: "asia-pacific" },
  { code: "US", name: "United States", currency: "USD", currencySymbol: "$", defaultLocale: "en-US", supportedLocales: ["en"], taxRate: 0.08, timezone: "America/New_York", regionSlug: "north-america" },
  { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£", defaultLocale: "en-GB", supportedLocales: ["en"], taxRate: 0.20, timezone: "Europe/London", regionSlug: "europe" },
  { code: "DE", name: "Germany", currency: "EUR", currencySymbol: "€", defaultLocale: "de-DE", supportedLocales: ["de", "en"], taxRate: 0.19, timezone: "Europe/Berlin", regionSlug: "europe" },
  { code: "FR", name: "France", currency: "EUR", currencySymbol: "€", defaultLocale: "fr-FR", supportedLocales: ["fr", "en"], taxRate: 0.20, timezone: "Europe/Paris", regionSlug: "europe" },
  { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "¥", defaultLocale: "ja-JP", supportedLocales: ["ja", "en"], taxRate: 0.10, timezone: "Asia/Tokyo", regionSlug: "asia-pacific" },
  { code: "CN", name: "China", currency: "CNY", currencySymbol: "¥", defaultLocale: "zh-CN", supportedLocales: ["zh", "en"], taxRate: 0.13, timezone: "Asia/Shanghai", regionSlug: "asia-pacific" },
  { code: "AE", name: "UAE", currency: "AED", currencySymbol: "د.إ", defaultLocale: "ar-AE", supportedLocales: ["ar", "en"], taxRate: 0.05, timezone: "Asia/Dubai", regionSlug: "middle-east" },
  { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "A$", defaultLocale: "en-AU", supportedLocales: ["en"], taxRate: 0.10, timezone: "Australia/Sydney", regionSlug: "oceania" },
  { code: "CA", name: "Canada", currency: "CAD", currencySymbol: "C$", defaultLocale: "en-CA", supportedLocales: ["en", "fr"], taxRate: 0.05, timezone: "America/Toronto", regionSlug: "north-america" },
  { code: "CH", name: "Switzerland", currency: "CHF", currencySymbol: "Fr", defaultLocale: "de-CH", supportedLocales: ["de", "fr", "it", "en"], taxRate: 0.077, timezone: "Europe/Zurich", regionSlug: "europe" },
  { code: "ES", name: "Spain", currency: "EUR", currencySymbol: "€", defaultLocale: "es-ES", supportedLocales: ["es", "en"], taxRate: 0.21, timezone: "Europe/Madrid", regionSlug: "europe" },
  { code: "KR", name: "South Korea", currency: "KRW", currencySymbol: "₩", defaultLocale: "ko-KR", supportedLocales: ["ko", "en"], taxRate: 0.10, timezone: "Asia/Seoul", regionSlug: "asia-pacific" },
  { code: "BR", name: "Brazil", currency: "BRL", currencySymbol: "R$", defaultLocale: "pt-BR", supportedLocales: ["pt", "en"], taxRate: 0.17, timezone: "America/Sao_Paulo", regionSlug: "south-america" },
  { code: "RU", name: "Russia", currency: "RUB", currencySymbol: "₽", defaultLocale: "ru-RU", supportedLocales: ["ru", "en"], taxRate: 0.20, timezone: "Europe/Moscow", regionSlug: "europe" },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", currencySymbol: "﷼", defaultLocale: "ar-SA", supportedLocales: ["ar", "en"], taxRate: 0.15, timezone: "Asia/Riyadh", regionSlug: "middle-east" },
];

const GEO_REGIONS = [
  { slug: "asia-pacific", name: "Asia-Pacific", code: "APAC" },
  { slug: "europe", name: "Europe", code: "EUR" },
  { slug: "north-america", name: "North America", code: "NA" },
  { slug: "south-america", name: "South America", code: "SA" },
  { slug: "africa", name: "Africa", code: "AF" },
  { slug: "middle-east", name: "Middle East", code: "ME" },
  { slug: "oceania", name: "Oceania", code: "OC" },
];

const INDIAN_STATES = [
  { name: "Andhra Pradesh", code: "AP" },
  { name: "Bihar", code: "BR" },
  { name: "Chhattisgarh", code: "CG" },
  { name: "Delhi", code: "DL" },
  { name: "Goa", code: "GA" },
  { name: "Gujarat", code: "GJ" },
  { name: "Haryana", code: "HR" },
  { name: "Karnataka", code: "KA" },
  { name: "Kerala", code: "KL" },
  { name: "Madhya Pradesh", code: "MP" },
  { name: "Maharashtra", code: "MH" },
  { name: "Odisha", code: "OR" },
  { name: "Punjab", code: "PB" },
  { name: "Rajasthan", code: "RJ" },
  { name: "Tamil Nadu", code: "TN" },
  { name: "Telangana", code: "TG" },
  { name: "Uttar Pradesh", code: "UP" },
  { name: "West Bengal", code: "WB" },
];

export async function seedLocations() {
  console.log("📍 Seeding location hierarchy...");

  // 1. Create Earth planet
  const earth = await prisma.location.upsert({
    where: { code: "Earth" },
    update: {},
    create: {
      name: "Earth",
      code: "Earth",
      type: "PLANET" as LocationType,
      isActive: true,
      isVerified: true,
    },
  });

  // 2. Create geographic regions
  const regionMap: Record<string, string> = {};
  for (const gr of GEO_REGIONS) {
    const loc = await prisma.location.upsert({
      where: { code: gr.code },
      update: {},
      create: {
        name: gr.name,
        code: gr.code,
        type: "REGION" as LocationType,
        parentId: earth.id,
        isActive: true,
        isVerified: true,
      },
    });
    regionMap[gr.slug] = loc.id;
  }

  // 3. Create countries + CountryProfiles from existing Region data
  const existingRegions = await prisma.region.findMany();
  const existingRegionMap = new Map(existingRegions.map((r) => [r.code, r]));

  for (const r of REGIONS) {
    const parentRegionId = regionMap[r.regionSlug];
    if (!parentRegionId) continue;

    // Create Location (COUNTRY type)
    const loc = await prisma.location.upsert({
      where: { code: r.code },
      update: { name: r.name },
      create: {
        name: r.name,
        code: r.code,
        type: "COUNTRY" as LocationType,
        parentId: parentRegionId,
        isActive: true,
        isVerified: true,
      },
    });

    // Create or update CountryProfile
    const existingRegion = existingRegionMap.get(r.code);
    await prisma.countryProfile.upsert({
      where: { locationId: loc.id },
      update: {},
      create: {
        locationId: loc.id,
        isoCode: r.code,
        currency: r.currency,
        currencySymbol: r.currencySymbol,
        defaultLocale: r.defaultLocale,
        supportedLocales: r.supportedLocales,
        taxRate: existingRegion ? existingRegion.taxRate : r.taxRate,
        timezone: r.timezone,
        isActive: existingRegion ? existingRegion.isActive : true,
      },
    });
  }

  // 4. Create Indian states
  const indiaLoc = await prisma.location.findFirst({
    where: { code: "IN", type: "COUNTRY" },
  });
  if (indiaLoc) {
    for (const state of INDIAN_STATES) {
      await prisma.location.upsert({
        where: { code: `IN-${state.code}` },
        update: {},
        create: {
          name: state.name,
          code: `IN-${state.code}`,
          type: "STATE" as LocationType,
          parentId: indiaLoc.id,
          isActive: true,
          isVerified: true,
        },
      });
    }
  }

  console.log(`✓ Location hierarchy seeded (${REGIONS.length} countries, ${INDIAN_STATES.length} Indian states)`);
}
