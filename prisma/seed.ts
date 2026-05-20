import { PrismaClient, UserRole, DiscountType, ActivitySeverity, NotifType, TierBalanceMode, ProductType, TaxCategory, FreightClass, ProductTrackingType } from "@prisma/client";
import { hash } from "bcryptjs";
import slugify from "slugify";
import { encrypt, hash as hashVal, generateSecureCode } from "@/lib/encryption";
import {
  seedCategories,
  seedBrands,
  seedProducts,
  seedExtendedProducts,
  seedBanners,
  seedCoupons,
  seedSystemConfigs,
  seedBarcodes,
  seedUomData,
  seedUomConversions,
  seedTaxCategoryRules,
} from "./seed-data/products";
import { seedSuppliers, seedProductSuppliers, seedInventory } from "./seed-data/suppliers";
import { seedLocations } from "./seed-locations";
import {
  seedCountries,
  seedCurrencies,
  seedTaxRates,
  seedShippingMethods,
  seedCarriers,
  seedLanguages,
  seedTimezones,
  seedAIFeatureConfigs,
  seedAdditionalProducts,
} from "./seed-data/universal-master-data";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create admin user
  const adminPassword = await hash("Admin@123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin",
      role: UserRole.ADMIN,
      phone: "9876543210",
    },
  });

  // Create customer care user
  const ccPassword = await hash("Care@123", 10);
  const ccUser = await prisma.user.upsert({
    where: { email: "care@example.com" },
    update: {},
    create: {
      email: "care@example.com",
      password: ccPassword,
      name: "Customer Care",
      role: UserRole.CUSTOMER_CARE,
      phone: "9876543211",
    },
  });

  // Create support user
  const supportPassword = await hash("Support@123", 10);
  const supportUser = await prisma.user.upsert({
    where: { email: "support@example.com" },
    update: {},
    create: {
      email: "support@example.com",
      password: supportPassword,
      name: "Support",
      role: UserRole.SUPPORT,
      phone: "9876543212",
    },
  });

  console.log("✓ Users created");

  // Create regions
  const regions = [
    { code: "IN", name: "India", currency: "INR", currencySymbol: "₹", defaultLocale: "en-IN", supportedLocales: ["en", "hi"], taxRate: 0.18, timezone: "Asia/Kolkata" },
    { code: "US", name: "United States", currency: "USD", currencySymbol: "$", defaultLocale: "en-US", supportedLocales: ["en"], taxRate: 0.08, timezone: "America/New_York" },
    { code: "GB", name: "United Kingdom", currency: "GBP", currencySymbol: "£", defaultLocale: "en-GB", supportedLocales: ["en"], taxRate: 0.20, timezone: "Europe/London" },
    { code: "DE", name: "Germany", currency: "EUR", currencySymbol: "€", defaultLocale: "de-DE", supportedLocales: ["de", "en"], taxRate: 0.19, timezone: "Europe/Berlin" },
    { code: "FR", name: "France", currency: "EUR", currencySymbol: "€", defaultLocale: "fr-FR", supportedLocales: ["fr", "en"], taxRate: 0.20, timezone: "Europe/Paris" },
    { code: "JP", name: "Japan", currency: "JPY", currencySymbol: "¥", defaultLocale: "ja-JP", supportedLocales: ["ja", "en"], taxRate: 0.10, timezone: "Asia/Tokyo" },
    { code: "AU", name: "Australia", currency: "AUD", currencySymbol: "A$", defaultLocale: "en-AU", supportedLocales: ["en"], taxRate: 0.10, timezone: "Australia/Sydney" },
    { code: "AE", name: "UAE", currency: "AED", currencySymbol: "د.إ", defaultLocale: "ar-AE", supportedLocales: ["ar", "en"], taxRate: 0.05, timezone: "Asia/Dubai" },
  ];

  for (const region of regions) {
    await prisma.region.upsert({
      where: { code: region.code },
      update: {},
      create: region,
    });
  }

  console.log("✓ Regions created");

  // Create location hierarchy
  await seedLocations();

  // Create categories (parent first, then children)
  const parentCategories = seedCategories.filter((c) => !c.parentId);
  const childCategories = seedCategories.filter((c) => c.parentId);

  const parentMap: Record<string, string> = {};
  for (const pc of parentCategories) {
    const cat = await prisma.category.upsert({
      where: { slug: pc.slug },
      update: {},
      create: { ...pc },
    });
    parentMap[pc.slug] = cat.id;
  }

  const slugToId: Record<string, string> = { ...parentMap };
  for (const cc of childCategories) {
    const parentKey = cc.parentId!.replace("PARENT_", "");
    const parentId = parentMap[parentKey.toLowerCase()] || parentMap[Object.keys(parentMap).find(k => parentKey.toLowerCase().includes(k)) || 'electronics'] || '';
    const cat = await prisma.category.upsert({
      where: { slug: cc.slug },
      update: {},
      create: { ...cc, parentId },
    });
    slugToId[cc.slug] = cat.id;
  }

  console.log("✓ Categories created");

  // Create brands
  const brandMap: Record<string, string> = {};
  for (const brand of seedBrands) {
    const b = await prisma.brand.upsert({
      where: { slug: brand.slug },
      update: {},
      create: brand,
    });
    brandMap[brand.slug] = b.id;
  }

  console.log("✓ Brands created");

  // Create products
  const defaultCategoryId = slugToId["electronics"] || "";
  for (const product of seedProducts) {
    const categoryId = slugToId[product.categoryId] || defaultCategoryId;
    const brandId = brandMap[product.brand] || null;
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {},
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDesc: product.shortDesc,
        price: product.price,
        comparePrice: product.comparePrice,
        categoryId,
        brandId,
        stock: product.stock,
        tags: product.tags,
        isFeatured: product.isFeatured || false,
        hasVariants: product.hasVariants || false,
        images: product.images,
        sku: `SKU-${product.slug.toUpperCase().replace(/-/g, "")}`,
        productType: (product as any).productType || ProductType.PHYSICAL,
        taxCategory: (product as any).taxCategory || TaxCategory.STANDARD,
        uom: (product as any).uom || null,
        trackingType: (product as any).trackingType || ProductTrackingType.NONE,
        expiryDays: (product as any).expiryDays || null,
        freightClass: (product as any).freightClass || null,
        digitalUrl: (product as any).digitalUrl || null,
        maxDownloads: (product as any).maxDownloads || null,
        subscriptionInterval: (product as any).subscriptionInterval || null,
        subscriptionTrialDays: (product as any).subscriptionTrialDays || null,
      },
    });
  }

  console.log("✓ Products created");

  // Seed Inventory from Product stock
  const allProductsForInventory = await prisma.product.findMany();
  for (const p of allProductsForInventory) {
    const existing = await prisma.inventory.findFirst({
      where: { productId: p.id, locationId: null },
    });
    if (!existing) {
      await prisma.inventory.create({
        data: {
          productId: p.id,
          locationId: null,
          quantity: p.stock,
          lowStock: p.stock <= 20 ? p.stock : 20,
        },
      });
    }
  }
  console.log(`✓ Inventory seeded (${allProductsForInventory.length} products)`);

  // Seed Suppliers
  for (const s of seedSuppliers) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  console.log(`✓ Suppliers seeded (${seedSuppliers.length} suppliers)`);

  // Seed Product-Supplier links
  const productMap: Record<string, string> = {};
  for (const p of allProductsForInventory) productMap[p.slug] = p.id;
  const supplierMap: Record<string, string> = {};
  for (const s of seedSuppliers) {
    const sup = await prisma.supplier.findUnique({ where: { code: s.code } });
    if (sup) supplierMap[s.code] = sup.id;
  }
  for (const ps of seedProductSuppliers) {
    const productId = productMap[ps.productSlug];
    const supplierId = supplierMap[ps.supplierCode];
    if (!productId || !supplierId) continue;
    await prisma.productSupplier.upsert({
      where: { productId_supplierId: { productId, supplierId } },
      update: {},
      create: {
        productId,
        supplierId,
        costPrice: ps.costPrice,
        leadTimeDays: ps.leadTimeDays,
        isPreferred: ps.isPreferred || false,
      },
    });
  }
  console.log(`✓ Product-Supplier links seeded (${seedProductSuppliers.length} links)`);

  // Seed Supplier-specific Inventory (replaces global inventory with per-supplier tracking)
  for (const si of seedInventory) {
    const productId = productMap[si.productSlug];
    const supplierId = supplierMap[si.supplierCode];
    if (!productId || !supplierId) continue;
    const existing = await prisma.inventory.findFirst({
      where: { productId, supplierId, locationId: null },
    });
    if (!existing) {
      await prisma.inventory.create({
        data: {
          productId,
          supplierId,
          locationId: null,
          quantity: si.quantity,
          lowStock: si.lowStock,
          avgCost: si.avgCost,
        },
      });
    }
  }
  console.log(`✓ Supplier inventory seeded (${seedInventory.length} records)`);

  // Seed Supplier Product Listings (suppliers list products for sale)
  const listingSlugs = [
    { productSlug: "iphone-15-pro-max", supplierCode: "SUP-001", listingPrice: 139900, comparePrice: 149900, quantity: 25 },
    { productSlug: "iphone-15-pro-max", supplierCode: "SUP-002", listingPrice: 137900, comparePrice: 149900, quantity: 20 },
    { productSlug: "samsung-galaxy-s24-ultra", supplierCode: "SUP-001", listingPrice: 109999, comparePrice: 119999, quantity: 75 },
    { productSlug: "macbook-pro-14-m3", supplierCode: "SUP-002", listingPrice: 169900, comparePrice: 189900, quantity: 30 },
    { productSlug: "dell-xps-15", supplierCode: "SUP-002", listingPrice: 149990, comparePrice: 169990, quantity: 40 },
    { productSlug: "sony-wh-1000xm5", supplierCode: "SUP-001", listingPrice: 28990, comparePrice: 34990, quantity: 100 },
    { productSlug: "airpods-pro-2", supplierCode: "SUP-002", listingPrice: 21999, comparePrice: 24900, quantity: 150 },
    { productSlug: "bose-quietcomfort-earbuds", supplierCode: "SUP-001", listingPrice: 23990, comparePrice: 27900, quantity: 80 },
    { productSlug: "samsung-55-oled-tv", supplierCode: "SUP-001", listingPrice: 99990, comparePrice: 119990, quantity: 20 },
    { productSlug: "lg-65-4k-smart-tv", supplierCode: "SUP-001", listingPrice: 74990, comparePrice: 89990, quantity: 15 },
    { productSlug: "hp-spectre-x360-14", supplierCode: "SUP-001", listingPrice: 129990, comparePrice: 149990, quantity: 25 },
    { productSlug: "nike-air-max-270", supplierCode: "SUP-003", listingPrice: 9995, comparePrice: 12995, quantity: 200 },
    { productSlug: "adidas-ultraboost-22", supplierCode: "SUP-003", listingPrice: 11999, comparePrice: 14999, quantity: 120 },
    { productSlug: "levis-501-original", supplierCode: "SUP-003", listingPrice: 2999, comparePrice: 3999, quantity: 300 },
    // Extended products
    { productSlug: "organics-1kg", supplierCode: "SUP-004", listingPrice: 299, comparePrice: 399, quantity: 500 },
    { productSlug: "himalayan-glow-serum", supplierCode: "SUP-003", listingPrice: 499, comparePrice: 699, quantity: 200 },
    { productSlug: "yoga-mat-5mm", supplierCode: "SUP-005", listingPrice: 899, comparePrice: 1499, quantity: 150 },
    { productSlug: "the-alchemist", supplierCode: "SUP-004", listingPrice: 199, comparePrice: 299, quantity: 300 },
  ];
  const supplierListingsCreated = new Set<string>();
  for (const sl of listingSlugs) {
    const productId = productMap[sl.productSlug];
    const supplierId = supplierMap[sl.supplierCode];
    if (!productId || !supplierId) continue;
    const key = `${supplierId}-${productId}`;
    if (supplierListingsCreated.has(key)) continue;
    supplierListingsCreated.add(key);
    await prisma.supplierProductListing.upsert({
      where: { supplierId_productId: { supplierId, productId } },
      update: {
        listingPrice: sl.listingPrice,
        comparePrice: sl.comparePrice,
        quantity: sl.quantity,
        status: "ACTIVE",
        enabledAt: new Date(),
      },
      create: {
        supplierId,
        productId,
        listingPrice: sl.listingPrice,
        comparePrice: sl.comparePrice,
        quantity: sl.quantity,
        listingSku: `${sl.supplierCode}-SKU-${sl.productSlug.toUpperCase()}`,
        status: "ACTIVE",
        enabledAt: new Date(),
      },
    });
  }
  console.log(`✓ Supplier product listings seeded (${supplierListingsCreated.size} active listings)`);

  // Create product translations for development/demo
  const allProducts = await prisma.product.findMany();
  const productSlugMap: Record<string, string> = {};
  for (const p of allProducts) productSlugMap[p.slug] = p.id;

  const translationData: Array<[string, { locale: string; name: string; slug: string; shortDesc?: string; description?: string }]> = [
    ["iphone-15-pro-max", { locale: "hi", name: "iPhone 15 Pro मैक्स", slug: "iphone-15-pro-max-hi", shortDesc: "A17 Pro चिप के साथ Apple का फ्लैगशिप स्मार्टफोन", description: "iPhone 15 Pro Max में A17 Pro चिप, कस्टमाइज़ करने योग्य एक्शन बटन और सबसे शक्तिशाली iPhone कैमरा सिस्टम है।" }],
    ["iphone-15-pro-max", { locale: "de", name: "iPhone 15 Pro Max", slug: "iphone-15-pro-max-de", shortDesc: "Apples Flagship-Smartphone mit A17 Pro Chip", description: "Das iPhone 15 Pro Max verfügt über den A17 Pro Chip und das leistungsstärkste iPhone Kamerasystem." }],
    ["samsung-galaxy-s24-ultra", { locale: "hi", name: "Samsung Galaxy S24 अल्ट्रा", slug: "samsung-galaxy-s24-ultra-hi", shortDesc: "S पेन के साथ AI-संचालित स्मार्टफोन", description: "Galaxy S24 Ultra आपके स्मार्टफोन अनुभव में AI की शक्ति लाता है।" }],
    ["samsung-galaxy-s24-ultra", { locale: "de", name: "Samsung Galaxy S24 Ultra", slug: "samsung-galaxy-s24-ultra-de", shortDesc: "KI-gestütztes Smartphone mit S Pen", description: "Das Galaxy S24 Ultra bringt die Kraft der KI in Ihr Smartphone-Erlebnis." }],
    ["macbook-pro-14-m3", { locale: "hi", name: "MacBook Pro 14-इंच M3 Pro", slug: "macbook-pro-14-m3-hi", shortDesc: "M3 Pro चिप द्वारा सुपरचार्ज्ड", description: "M3 Pro चिप वाला MacBook Pro प्रो वर्कफ़्लो के लिए असाधारण प्रदर्शन देता है।" }],
    ["macbook-pro-14-m3", { locale: "de", name: "MacBook Pro 14 Zoll M3 Pro", slug: "macbook-pro-14-m3-de", shortDesc: "Übertaktet mit M3 Pro Chip", description: "MacBook Pro mit M3 Pro Chip liefert außergewöhnliche Leistung für Pro-Workflows." }],
    ["sony-wh-1000xm5", { locale: "hi", name: "Sony WH-1000XM5", slug: "sony-wh-1000xm5-hi", shortDesc: "उद्योग-अग्रणी शोर रद्द करना", description: "Sony WH-1000XM5 हेडफ़ोन में उद्योग-अग्रणी शोर रद्दीकरण और 30 घंटे की बैटरी लाइफ़ है।" }],
    ["sony-wh-1000xm5", { locale: "de", name: "Sony WH-1000XM5", slug: "sony-wh-1000xm5-de", shortDesc: "Branchenführende Geräuschunterdrückung", description: "Die Sony WH-1000XM5 Kopfhörer bieten branchenführende Geräuschunterdrückung und 30 Stunden Akkulaufzeit." }],
    ["airpods-pro-2", { locale: "hi", name: "AirPods Pro 2", slug: "airpods-pro-2-hi", shortDesc: "Adaptive Audio के साथ Active Noise Cancellation", description: "AirPods Pro 2 में Adaptive Audio, Active Noise Cancellation और USB-C Charging Case है।" }],
    ["airpods-pro-2", { locale: "de", name: "AirPods Pro 2", slug: "airpods-pro-2-de", shortDesc: "Aktive Geräuschunterdrückung mit Adaptive Audio", description: "AirPods Pro 2 verfügen über Adaptive Audio und ein MagSafe-Ladeetui mit USB-C." }],
    ["nike-air-max-270", { locale: "hi", name: "Nike Air Max 270", slug: "nike-air-max-270-hi", shortDesc: "हल्का, सांस लेने योग्य रनिंग शू", description: "Nike Air Max 270 एक बड़े Air unit के साथ दिखने वाली कुशनिंग प्रदान करता है।" }],
    ["nike-air-max-270", { locale: "de", name: "Nike Air Max 270", slug: "nike-air-max-270-de", shortDesc: "Leichter, atmungsaktiver Laufschuh", description: "Der Nike Air Max 270 bietet sichtbare Dämpfung mit einer großen Air Unit." }],
  ];

  for (const [productSlug, t] of translationData) {
    const productId = productSlugMap[productSlug];
    if (!productId) continue;
    await prisma.productTranslation.upsert({
      where: { productId_locale: { productId, locale: t.locale } },
      update: {},
      create: {
        productId,
        locale: t.locale,
        name: t.name,
        slug: t.slug,
        shortDesc: t.shortDesc || null,
        description: t.description || null,
        tags: [],
      },
    });
  }

  console.log("✓ Product translations created");

  // Create banners
  for (const banner of seedBanners) {
    const existing = await prisma.banner.findFirst({ where: { title: banner.title } });
    if (!existing) {
      await prisma.banner.create({ data: banner });
    }
  }

  console.log("✓ Banners created");

  // Create coupons
  for (const coupon of seedCoupons) {
    const rawCode = coupon.code.toUpperCase().trim();
    const codeHash = hashVal(rawCode);
    const encryptedCode = encrypt(rawCode);
    await prisma.coupon.upsert({
      where: { code: coupon.code },
      update: {},
      create: {
        ...coupon,
        code: rawCode,
        codeHash,
        encryptedCode,
        discountType: coupon.discountType as unknown as DiscountType,
      },
    });
  }

  console.log("✓ Coupons created");

  // Create system configs
  for (const config of seedSystemConfigs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
  }

  console.log("✓ System configs created");

  // Create voucher tiers
  const voucherTiers = [
    { slug: "shopping", name: "Shopping Voucher", icon: "shopping-voucher", description: "Apply to all shopping orders", color: "#2563eb", balanceMode: TierBalanceMode.SHARED, sortOrder: 1 },
    { slug: "fresh", name: "Fresh Voucher", icon: "fresh-voucher", description: "Apply to groceries and fresh items", color: "#16a34a", balanceMode: TierBalanceMode.SEPARATE, sortOrder: 2 },
    { slug: "gold", name: "Gold Voucher", icon: "gold-voucher", description: "Premium vouchers with extra benefits", color: "#d97706", balanceMode: TierBalanceMode.SEPARATE, sortOrder: 3 },
    { slug: "prime", name: "Prime Voucher", icon: "prime-voucher", description: "Exclusive member vouchers", color: "#7c3aed", balanceMode: TierBalanceMode.SEPARATE, sortOrder: 4 },
  ];

  for (const tier of voucherTiers) {
    await prisma.voucherTier.upsert({
      where: { slug: tier.slug },
      update: {},
      create: tier,
    });
  }

  console.log("✓ Voucher tiers created");

  // Seed payment gateways
  const gateways = [
    {
      provider: "stripe",
      name: "Stripe",
      description: "Global payment gateway supporting cards, wallets, and more",
      isActive: true,
    },
    {
      provider: "razorpay",
      name: "Razorpay",
      description: "Indian payment gateway with UPI, netbanking, wallets",
      isActive: true,
    },
    {
      provider: "paypal",
      name: "PayPal",
      description: "Global PayPal payments",
      isActive: true,
    },
  ];

  for (const gw of gateways) {
    await prisma.paymentGateway.upsert({
      where: { provider: gw.provider },
      update: {},
      create: gw,
    });
  }

  // Get gateway IDs
  const stripeGw = await prisma.paymentGateway.findUnique({ where: { provider: "stripe" } });
  const razorpayGw = await prisma.paymentGateway.findUnique({ where: { provider: "razorpay" } });
  const paypalGw = await prisma.paymentGateway.findUnique({ where: { provider: "paypal" } });

  // Seed gateway methods
  if (stripeGw) {
    const stripeMethods = [
      { method: "CARD", name: "Credit/Debit Card", config: { networks: ["VISA", "MASTERCARD", "AMEX", "RUPAY"], feePercentage: 2.9, feeFixed: 0.3 } },
      { method: "APPLE_PAY", name: "Apple Pay" },
      { method: "GOOGLE_PAY", name: "Google Pay" },
      { method: "PAYPAL", name: "PayPal" },
      { method: "KLARNA", name: "Klarna" },
    ];
    for (const m of stripeMethods) {
      await prisma.paymentGatewayMethod.upsert({
        where: { gatewayId_method: { gatewayId: stripeGw.id, method: m.method as any } },
        update: {},
        create: { gatewayId: stripeGw.id, method: m.method as any, name: m.name, config: m.config as any, isEnabled: true },
      });
    }
  }

  if (razorpayGw) {
    const razorpayMethods = [
      { method: "CARD", name: "Credit/Debit Card", config: { networks: ["VISA", "MASTERCARD", "AMEX", "RUPAY"], feePercentage: 2.0, feeFixed: 3.0 } },
      { method: "UPI", name: "UPI", config: { feePercentage: 0, feeFixed: 0 } },
      { method: "NETBANKING", name: "Net Banking", config: { banks: ["SBI", "HDFC", "ICICI", "AXIS", "KOTAK"] } },
      { method: "WALLET", name: "Wallets", config: { wallets: ["PAYTM", "MOBIKVIK", "FREECHARGES"] } },
      { method: "BNPL", name: "Buy Now Pay Later" },
      { method: "CASH_ON_DELIVERY", name: "Cash on Delivery" },
    ];
    for (const m of razorpayMethods) {
      await prisma.paymentGatewayMethod.upsert({
        where: { gatewayId_method: { gatewayId: razorpayGw.id, method: m.method as any } },
        update: {},
        create: { gatewayId: razorpayGw.id, method: m.method as any, name: m.name, config: m.config as any, isEnabled: true },
      });
    }
  }

  if (paypalGw) {
    const paypalMethods = [
      { method: "PAYPAL", name: "PayPal" },
      { method: "CARD", name: "Credit/Debit Card", config: { networks: ["VISA", "MASTERCARD", "AMEX"] } },
    ];
    for (const m of paypalMethods) {
      await prisma.paymentGatewayMethod.upsert({
        where: { gatewayId_method: { gatewayId: paypalGw.id, method: m.method as any } },
        update: {},
        create: { gatewayId: paypalGw.id, method: m.method as any, name: m.name, config: m.config as any, isEnabled: true },
      });
    }
  }

  // Seed gateway-region configs
  const dbRegions = await prisma.region.findMany();
  const indiaRegion = dbRegions.find((r) => r.code === "IN");
  const usRegion = dbRegions.find((r) => r.code === "US");
  const gbRegion = dbRegions.find((r) => r.code === "GB");
  const deRegion = dbRegions.find((r) => r.code === "DE");

  if (razorpayGw && indiaRegion) {
    await prisma.paymentGatewayRegion.upsert({
      where: { gatewayId_regionId: { gatewayId: razorpayGw.id, regionId: indiaRegion.id } },
      update: {},
      create: { gatewayId: razorpayGw.id, regionId: indiaRegion.id, isPrimary: true, priority: 1, currency: "INR" },
    });
  }
  if (stripeGw && usRegion) {
    await prisma.paymentGatewayRegion.upsert({
      where: { gatewayId_regionId: { gatewayId: stripeGw.id, regionId: usRegion.id } },
      update: {},
      create: { gatewayId: stripeGw.id, regionId: usRegion.id, isPrimary: true, priority: 1, currency: "USD" },
    });
  }
  if (stripeGw && gbRegion) {
    await prisma.paymentGatewayRegion.upsert({
      where: { gatewayId_regionId: { gatewayId: stripeGw.id, regionId: gbRegion.id } },
      update: {},
      create: { gatewayId: stripeGw.id, regionId: gbRegion.id, isPrimary: true, priority: 1, currency: "GBP" },
    });
  }
  if (stripeGw && deRegion) {
    await prisma.paymentGatewayRegion.upsert({
      where: { gatewayId_regionId: { gatewayId: stripeGw.id, regionId: deRegion.id } },
      update: {},
      create: { gatewayId: stripeGw.id, regionId: deRegion.id, isPrimary: true, priority: 1, currency: "EUR" },
    });
  }
  // PayPal as fallback for all regions
  if (paypalGw) {
    for (const region of dbRegions) {
      await prisma.paymentGatewayRegion.upsert({
        where: { gatewayId_regionId: { gatewayId: paypalGw.id, regionId: region.id } },
        update: {},
        create: { gatewayId: paypalGw.id, regionId: region.id, isPrimary: false, priority: 10, currency: region.currency },
      });
    }
  }

  console.log("✓ Payment gateways seeded");

  // Create sample system activities and audit logs
  await prisma.systemActivity.createMany({
    data: [
      { activityType: "SERVER_START", details: "Server started successfully", severity: ActivitySeverity.INFO, source: "system" },
      { activityType: "DB_CONNECTED", details: "Database connection established", severity: ActivitySeverity.INFO, source: "system" },
      { activityType: "SEED_COMPLETED", details: "Database seeded successfully", severity: ActivitySeverity.INFO, source: "system" },
    ],
    skipDuplicates: true,
  });

  await prisma.auditLog.createMany({
    data: [
      { userId: admin.id, action: "SEED", entityType: "SYSTEM", entityId: null, details: { message: "Database seeded" }, ipAddress: "127.0.0.1" },
    ],
    skipDuplicates: true,
  });

  console.log("✓ System activities & audit logs created");

  // Seed extended product types
  const bookCategoryId = slugToId["books"] || "";
  const groceryCategoryId = slugToId["grocery"] || "";
  for (const ep of seedExtendedProducts) {
    const categoryId = ep.categoryId === "books" ? bookCategoryId : ep.categoryId === "grocery" ? groceryCategoryId : defaultCategoryId;
    const brandId = (ep as any).brand ? brandMap[(ep as any).brand] || null : null;
    await prisma.product.upsert({
      where: { slug: ep.slug },
      update: {},
      create: {
        name: ep.name,
        slug: ep.slug,
        description: ep.description,
        shortDesc: ep.shortDesc,
        price: ep.price,
        comparePrice: ep.comparePrice,
        categoryId,
        brandId,
        stock: ep.stock,
        tags: ep.tags,
        isFeatured: ep.isFeatured || false,
        images: ep.images,
        sku: `SKU-${ep.slug.toUpperCase().replace(/-/g, "")}`,
        productType: (ep as any).productType || ProductType.PHYSICAL,
        taxCategory: (ep as any).taxCategory || TaxCategory.STANDARD,
        uom: (ep as any).uom || null,
        trackingType: (ep as any).trackingType || ProductTrackingType.NONE,
        expiryDays: (ep as any).expiryDays || null,
        freightClass: (ep as any).freightClass || null,
        digitalUrl: (ep as any).digitalUrl || null,
        maxDownloads: (ep as any).maxDownloads || null,
        subscriptionInterval: (ep as any).subscriptionInterval || null,
        subscriptionTrialDays: (ep as any).subscriptionTrialDays || null,
      },
    });
  }
  console.log(`✓ Extended products created (${seedExtendedProducts.length} new types)`);

  // Seed UOM data
  for (const u of seedUomData) {
    await prisma.unitOfMeasure.upsert({
      where: { code: u.code as any },
      update: {},
      create: { code: u.code as any, name: u.name, category: u.category as any, symbol: u.symbol },
    });
  }
  console.log(`✓ UOM data seeded (${seedUomData.length} units)`);

  // Seed UOM conversions
  const uomMap: Record<string, string> = {};
  const allUoms = await prisma.unitOfMeasure.findMany();
  for (const u of allUoms) uomMap[u.code] = u.id;
  for (const c of seedUomConversions) {
    const fromId = uomMap[c.from];
    const toId = uomMap[c.to];
    if (fromId && toId) {
      await prisma.uOMConversion.upsert({
        where: { fromUomId_toUomId: { fromUomId: fromId, toUomId: toId } },
        update: {},
        create: { fromUomId: fromId, toUomId: toId, factor: c.factor },
      });
    }
  }
  console.log(`✓ UOM conversions seeded (${seedUomConversions.length} rules)`);

  // Seed tax category rules
  const taxRegions = await prisma.region.findMany();
  const regionMap: Record<string, string> = {};
  for (const r of taxRegions) regionMap[r.code] = r.id;
  for (const t of seedTaxCategoryRules) {
    const regionId = regionMap[t.regionCode];
    if (regionId) {
      await prisma.taxCategoryRule.upsert({
        where: { taxCategory_regionId: { taxCategory: t.taxCategory as any, regionId } },
        update: {},
        create: { taxCategory: t.taxCategory as any, regionId, taxRate: t.taxRate },
      });
    }
  }
  console.log(`✓ Tax category rules seeded (${seedTaxCategoryRules.length} rules)`);

  // Seed barcodes
  for (const b of seedBarcodes) {
    const productId = productSlugMap[b.productSlug];
    if (productId) {
      await prisma.productBarcode.upsert({
        where: { barcode: b.barcode },
        update: {},
        create: { productId, barcode: b.barcode, type: b.type },
      });
    }
  }
  console.log(`✓ Product barcodes seeded (${seedBarcodes.length} barcodes)`);

  // ===================== PROMOTION ENGINE SEED DATA =====================
  console.log("\n📢 Seeding promotion engine data...");
  const crypto = require("crypto");

  // Stack rules
  await prisma.promotionStackRule.upsert({
    where: { group: "GENERAL" },
    update: {},
    create: { group: "GENERAL", strategy: "BEST_WINS", maxPromos: 1, description: "General stacking — only best promo wins" },
  });

  await prisma.promotionStackRule.upsert({
    where: { group: "BANK" },
    update: {},
    create: { group: "BANK", strategy: "BEST_WINS", maxPromos: 1, description: "Bank offers — only one bank promo per order" },
  });

  // 1. Bank Offer: HDFC card 10% off
  const hdfcHash = crypto.createHash("sha256").update("HDFC10").digest("hex");
  await prisma.promo.upsert({
    where: { codeHash: hdfcHash },
    update: {},
    create: {
      code: "HDFC10",
      codeHash: hdfcHash,
      type: "BANK_OFFER",
      title: "HDFC Bank 10% Off",
      description: "Get 10% off on HDFC card payments",
      status: "ACTIVE",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscount: 500,
      minOrderValue: 1000,
      validFrom: new Date(),
      stackingGroup: "BANK",
      priority: 5,
      rules: { banks: ["HDFC"], bankDiscount: { HDFC: { type: "PERCENTAGE", value: 10, max: 500 } } },
    },
  });

  // 2. Shipping Promo: Free shipping over ₹999
  const shipHash = crypto.createHash("sha256").update("FREESHIP").digest("hex");
  const shippingPromo = await prisma.promo.upsert({
    where: { codeHash: shipHash },
    update: {},
    create: {
      code: "FREESHIP",
      codeHash: shipHash,
      type: "SEASONAL",
      title: "Free Shipping Over ₹999",
      description: "Free delivery on orders above ₹999",
      status: "ACTIVE",
      discountType: "FLAT",
      discountValue: 50,
      minOrderValue: 999,
      validFrom: new Date(),
      priority: 10,
    },
  });

  await prisma.shippingPromotion.upsert({
    where: { promotionId: shippingPromo.id },
    update: {},
    create: {
      promotionId: shippingPromo.id,
      type: "FREE_SHIPPING",
      minOrderValue: 999,
      appliesToZone: "ALL",
      isActive: true,
    },
  });

  // 3. UPI Cashback: 5% flat up to ₹200
  const upiHash = crypto.createHash("sha256").update("UPICASH").digest("hex");
  const upiPromo = await prisma.promo.upsert({
    where: { codeHash: upiHash },
    update: {},
    create: {
      code: "UPICASH",
      codeHash: upiHash,
      type: "SEASONAL",
      title: "UPI Payment 5% Cashback",
      description: "Get 5% cashback on UPI payments",
      status: "ACTIVE",
      discountType: "PERCENTAGE",
      discountValue: 5,
      maxDiscount: 200,
      minOrderValue: 500,
      validFrom: new Date(),
      stackingGroup: "BANK",
      priority: 5,
    },
  });

  await prisma.paymentMethodPromotion.upsert({
    where: { promotionId: upiPromo.id },
    update: {},
    create: {
      promotionId: upiPromo.id,
      methodType: "UPI",
      discountType: "PERCENTAGE_OFF",
      discountValue: 5,
      maxDiscount: 200,
      minOrderValue: 500,
      isActive: true,
    },
  });

  // 4. Flash sale promo
  const flashHash = crypto.createHash("sha256").update("FLASH20").digest("hex");
  await prisma.promo.upsert({
    where: { codeHash: flashHash },
    update: {},
    create: {
      code: "FLASH20",
      codeHash: flashHash,
      type: "FLASH_SALE",
      title: "Flash Sale 20% Off",
      description: "20% off on selected products",
      status: "ACTIVE",
      discountType: "PERCENTAGE",
      discountValue: 20,
      maxDiscount: 1000,
      validFrom: new Date(),
      priority: 8,
    },
  });

  console.log(`✓ Promotion engine seeded (4 promos, 2 stack rules, 1 bank offer, 1 shipping, 1 payment method)`);

  // ===================== AMAZON/BLINKIT PARITY SEED DATA =====================

  // 1. Loyalty Program
  const existingLoyalty = await prisma.loyaltyProgram.findFirst();
  if (!existingLoyalty) {
    await prisma.loyaltyProgram.create({
      data: {
        name: "ShopEase Rewards",
        pointsPerRupee: 1,
        minRedeemPoints: 100,
        pointsExpiryDays: 365,
        tierBronzeMin: 0,
        tierSilverMin: 5000,
        tierGoldMin: 20000,
        tierPlatinumMin: 50000,
      },
    });
  }
  console.log("  ✓ Loyalty program seeded");

  // 2. Lightning Deal
  const flashPromo = await prisma.promo.findFirst({ where: { code: "FLASH20" } });
  if (flashPromo) {
    await prisma.lightningDeal.upsert({
      where: { promoId: flashPromo.id },
      update: {},
      create: {
        promoId: flashPromo.id,
        totalSlots: 50,
        claimedSlots: 0,
        startTime: new Date(),
        endTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        perUserLimit: 1,
      },
    });
    console.log("  ✓ Lightning deal seeded");
  }

  // 3. Referral Promo
  const existingReferral = await prisma.referralPromo.findFirst();
  if (!existingReferral) {
    await prisma.referralPromo.create({
      data: {
        name: "Refer & Earn ₹200",
        referrerReward: 200,
        refereeReward: 200,
        rewardType: "FLAT",
        rewardValue: 200,
        maxRewardUsages: 10,
        minOrderValue: 500,
        validFrom: new Date(),
      },
    });
  }
  console.log("  ✓ Referral promo seeded");

  // 4. Gamified Promo (Spin Wheel)
  const existingGamified = await prisma.gamifiedPromo.findFirst();
  if (!existingGamified) {
    await prisma.gamifiedPromo.create({
      data: {
        name: "Spin & Win",
        type: "SPIN_WHEEL",
        prizes: JSON.stringify([
        { type: "PERCENTAGE", value: 10, weight: 30 },
        { type: "PERCENTAGE", value: 20, weight: 20 },
        { type: "FLAT", value: 50, weight: 25 },
        { type: "FLAT", value: 200, weight: 10 },
        { type: "FLAT", value: 500, weight: 5 },
        { type: "NONE", value: 0, weight: 10 },
        ]),
        maxPerUser: 1,
        validFrom: new Date(),
        totalPrizes: 1000,
      },
    });
  }
  console.log("  ✓ Gamified promo seeded");

  // 5. Behavioral Trigger — Cart Abandonment
  const cartAbandonPromo = await prisma.promo.create({
    data: {
      type: "MINIMUM_SPEND",
      title: "Come back! 10% off your cart",
      status: "ACTIVE",
      discountType: "PERCENTAGE",
      discountValue: 10,
      maxDiscount: 200,
      validFrom: new Date(),
      priority: 5,
    },
  });
  await prisma.behavioralPromoTrigger.create({
    data: {
      name: "Cart Abandonment — 10% off",
      type: "CART_ABANDONMENT",
      condition: JSON.stringify({
        daysSinceLastView: 1,
        discountType: "PERCENTAGE",
        discountValue: 10,
      }),
      promoId: cartAbandonPromo.id,
      maxTriggersPerUser: 3,
      cooldownHours: 48,
    },
  });
  console.log("  ✓ Behavioral trigger seeded (cart abandonment)");

  // 6. Subscribe & Save
  const firstProduct = await prisma.product.findFirst();
  if (firstProduct) {
    const subPromo = await prisma.promo.create({
      data: {
        type: "COUPON",
        title: "Subscribe & Save",
        status: "ACTIVE",
        discountType: "PERCENTAGE",
        discountValue: 5,
        maxDiscount: 100,
        validFrom: new Date(),
        priority: 10,
      },
    });
    await prisma.subscribePromo.create({
      data: {
        promoId: subPromo.id,
        productId: firstProduct.id,
        tieredDiscounts: JSON.stringify([
          { cycle: 1, discount: 5 },
          { cycle: 3, discount: 10 },
          { cycle: 6, discount: 15 },
        ]),
      },
    });
    console.log("  ✓ Subscribe & Save seeded");
  }

  console.log(`✓ Amazon/Blinkit parity features seeded`);

  // ===================== UNIVERSAL MASTER DATA =====================
  console.log("\n🌍 Seeding universal master data...");

  // 1. Currencies
  const exchangeRates: Record<string, number> = {
    USD: 83.5, EUR: 91.2, GBP: 106.5, JPY: 0.58, INR: 1, AUD: 55.3,
    CAD: 62.1, CHF: 95.8, CNY: 11.6, SGD: 62.4, AED: 22.7, SAR: 22.3,
    KRW: 0.063, BRL: 16.8, MXN: 4.1, ZAR: 4.6, THB: 2.4, IDR: 0.0054,
    MYR: 18.5, VND: 0.0035, TRY: 2.7, RUB: 0.92, PLN: 20.3, SEK: 8.1,
    NOK: 7.9, DKK: 12.2, NZD: 51.8, PHP: 1.5, PKR: 0.29, BDT: 0.78,
    EGP: 2.7, NGN: 0.055, COP: 0.02, CLP: 0.09, ARS: 0.092, KES: 0.65,
  };
  for (const c of seedCurrencies) {
    await prisma.currency.upsert({
      where: { code: c.code },
      update: {},
      create: {
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        rateToINR: exchangeRates[c.code] || 1,
        isActive: true,
      },
    });
  }
  console.log(`  ✓ Currencies seeded (${seedCurrencies.length} currencies with INR rates)`);

  // 2. Tax Rates
  for (const t of seedTaxRates) {
    const existing = await prisma.taxRate.findFirst({
      where: { country: t.country, name: `${t.countryName} ${t.taxType}` },
    });
    if (!existing) {
      await prisma.taxRate.create({
        data: {
          country: t.country,
          taxType: t.taxType,
          rate: t.standardRate,
          name: `${t.countryName} ${t.taxType}`,
          description: `${t.note}. Standard rate: ${(t.standardRate * 100).toFixed(0)}%`,
          isActive: true,
        },
      });
    }
  }
  console.log(`  ✓ Tax rates seeded (${seedTaxRates.length} tax configurations)`);

  // 3. Countries as Location entries with CountryProfiles
  const earth = await prisma.location.findFirst({ where: { code: "Earth" } });
  if (earth) {
    const usLoc = await prisma.location.findFirst({ where: { code: "US" } });
    for (const country of seedCountries) {
      const existingCode = await prisma.location.findFirst({
        where: { code: country.iso },
        select: { id: true },
      });
      if (existingCode) continue; // Already exists from seed-locations

      const parentLoc = usLoc ? (await prisma.location.findFirst({ where: { code: "AS", type: "REGION" } }))?.id || earth.id : earth.id;
      await prisma.location.upsert({
        where: { code: `MSTR-${country.iso}` },
        update: {},
        create: {
          code: `MSTR-${country.iso}`,
          name: country.name,
          type: "COUNTRY",
          parentId: parentLoc,
          isActive: true,
          isVerified: true,
          countryProfile: {
            create: {
              isoCode: country.iso,
              currency: country.currency,
              currencySymbol: country.currencySymbol,
              defaultLocale: country.languages[0] || "en",
              supportedLocales: country.languages,
              taxRate: 0.18,
              timezone: country.timezone,
              callingCode: country.dialCode,
              isActive: true,
            },
          },
        },
      });
    }
  }
  console.log(`  ✓ Countries seeded (${seedCountries.length} countries with profiles)`);

  // 4. Shipping Methods
  const existingShipping = await prisma.systemConfig.findFirst({ where: { key: "shipping_methods" } });
  if (!existingShipping) {
    await prisma.systemConfig.create({
      data: {
        key: "shipping_methods",
        value: JSON.stringify(seedShippingMethods),
        description: "Available shipping methods and their configurations",
        category: "shipping",
      },
    });
  }
  console.log(`  ✓ Shipping methods seeded (${seedShippingMethods.length} methods)`);

  // 5. Carriers
  const existingCarriers = await prisma.systemConfig.findFirst({ where: { key: "shipping_carriers" } });
  if (!existingCarriers) {
    await prisma.systemConfig.create({
      data: {
        key: "shipping_carriers",
        value: JSON.stringify(seedCarriers),
        description: "Shipping carrier integrations and tracking URLs",
        category: "shipping",
      },
    });
  }
  console.log(`  ✓ Carriers seeded (${seedCarriers.length} carriers)`);

  // 6. Languages
  const existingLangs = await prisma.systemConfig.findFirst({ where: { key: "supported_languages" } });
  if (!existingLangs) {
    await prisma.systemConfig.create({
      data: {
        key: "supported_languages",
        value: JSON.stringify(seedLanguages),
        description: "All supported languages with locale patterns and direction",
        category: "general",
      },
    });
  }
  console.log(`  ✓ Languages seeded (${seedLanguages.length} languages)`);

  // 7. Timezones
  const existingTZ = await prisma.systemConfig.findFirst({ where: { key: "timezone_list" } });
  if (!existingTZ) {
    await prisma.systemConfig.create({
      data: {
        key: "timezone_list",
        value: JSON.stringify(seedTimezones),
        description: "Supported timezones with UTC offsets",
        category: "general",
      },
    });
  }
  console.log(`  ✓ Timezones seeded (${seedTimezones.length} timezones)`);

  // 8. AI Feature Configs
  for (const aiConfig of seedAIFeatureConfigs) {
    await prisma.aIConfig.upsert({
      where: { feature: aiConfig.feature },
      update: {},
      create: {
        feature: aiConfig.feature,
        enabled: aiConfig.enabled,
        provider: aiConfig.provider,
        config: aiConfig.config,
      },
    });
  }
  console.log(`  ✓ AI configs seeded (${seedAIFeatureConfigs.length} features)`);

  // 9. Additional Products (cross-category enrichment)
  const allCategories = await prisma.category.findMany();
  const catMap: Record<string, string> = {};
  for (const c of allCategories) catMap[c.slug] = c.id;

  const existingProdSlugs = new Set((await prisma.product.findMany({ select: { slug: true } })).map(p => p.slug));
  let newAdditionalProducts = 0;
  for (const ep of seedAdditionalProducts) {
    if (existingProdSlugs.has(ep.slug)) continue;
    existingProdSlugs.add(ep.slug);
    const categoryId = catMap[ep.categoryId] || catMap["electronics"] || "";
    await prisma.product.upsert({
      where: { slug: ep.slug },
      update: {},
      create: {
        name: ep.name,
        slug: ep.slug,
        description: ep.description,
        shortDesc: ep.shortDesc,
        price: ep.price,
        comparePrice: ep.comparePrice,
        categoryId,
        stock: ep.stock,
        tags: ep.tags,
        isFeatured: false,
        images: ep.images,
        sku: `SKU-${ep.slug.toUpperCase().replace(/-/g, "")}`,
        productType: (ep as any).productType || ProductType.PHYSICAL,
        taxCategory: (ep as any).taxCategory || TaxCategory.STANDARD,
        uom: (ep as any).uom || null,
        trackingType: (ep as any).trackingType || ProductTrackingType.NONE,
        expiryDays: (ep as any).expiryDays || null,
        freightClass: (ep as any).freightClass || null,
      },
    });
    newAdditionalProducts++;
  }
  console.log(`  ✓ Additional products seeded (${newAdditionalProducts} new products across all categories)`);

  // 10. Initialize Default AI Agents
  console.log("\n🤖 Seeding default AI agents...");
  const defaultAgents = [
    { name: "Daily Recommendation Refresh", type: "RECOMMENDER", description: "Refreshes personalized recommendations for all active users daily", config: { schedule: "0 2 * * *", maxUsers: 10000 } },
    { name: "Hourly Pricing Optimization", type: "PRICER", description: "Analyzes demand and optimizes prices for top-selling products", config: { schedule: "0 * * * *", productsLimit: 500 } },
    { name: "Weekly Inventory Forecast", type: "INVENTORY", description: "Predicts demand and flags stockout risks weekly", config: { schedule: "0 6 * * 1", forecastDays: 30 } },
    { name: "Real-time Fraud Scoring", type: "FRAUD", description: "Scores new orders and flag suspicious transactions", config: { trigger: "ORDER_CREATED", threshold: 0.7 } },
    { name: "Monthly Churn Analysis", type: "CHURN", description: "Updates churn predictions and identifies at-risk customers", config: { schedule: "0 8 1 * *", inactivityDays: 30 } },
    { name: "Auto Content Generation", type: "CONTENT", description: "Generates product descriptions and tags for new products", config: { trigger: "PRODUCT_CREATED", provider: "groq" } },
  ];
  for (const agent of defaultAgents) {
    await prisma.aIAgent.upsert({
      where: { name: agent.name },
      update: {},
      create: {
        name: agent.name,
        type: agent.type,
        description: agent.description,
        status: "ACTIVE",
        config: agent.config,
      },
    });
  }
  console.log(`  ✓ AI agents seeded (${defaultAgents.length} agents)`);

  console.log("\n🎉 Seeding complete!");
  console.log("\n📧 Login credentials:");
  console.log("   Admin:      admin@example.com / Admin@123");
  console.log("   Customer:   care@example.com  / Care@123");
  console.log("   Support:    support@example.com / Support@123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
