import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Starting multi-site migration...");

  // 1. Create default site
  const defaultSite = await prisma.site.upsert({
    where: { slug: "platform" },
    update: {},
    create: {
      name: "Platform",
      slug: "platform",
      isDefault: true,
      status: "ACTIVE",
      primaryColor: "#2563eb",
      secondaryColor: "#f59e0b",
      fontFamily: "sans",
      settings: { taxInclusive: true, currency: "INR", maintenanceMode: false },
    },
  });
  console.log(`✅ Default site created: ${defaultSite.name} (${defaultSite.id})`);

  // 2. Assign all existing Users → siteId = platform
  const userResult = await prisma.user.updateMany({
    where: { siteId: null },
    data: { siteId: defaultSite.id },
  });
  console.log(`✅ Assigned ${userResult.count} users to default site`);

  // 3. Assign all existing Orders → siteId = platform
  const orderResult = await prisma.order.updateMany({
    where: { siteId: null },
    data: { siteId: defaultSite.id },
  });
  console.log(`✅ Assigned ${orderResult.count} orders to default site`);

  // 4. Assign all existing Carts → siteId = platform
  const cartResult = await prisma.cartItem.updateMany({
    where: { siteId: null },
    data: { siteId: defaultSite.id },
  });
  console.log(`✅ Assigned ${cartResult.count} cart items to default site`);

  // 5. Assign all existing Reviews → siteId = platform
  const reviewResult = await prisma.review.updateMany({
    where: { siteId: null },
    data: { siteId: defaultSite.id },
  });
  console.log(`✅ Assigned ${reviewResult.count} reviews to default site`);

  // 6. Assign all existing WishlistItems → siteId = platform
  const wishlistResult = await prisma.wishlistItem.updateMany({
    where: { siteId: null },
    data: { siteId: defaultSite.id },
  });
  console.log(`✅ Assigned ${wishlistResult.count} wishlist items to default site`);

  // 7. Assign all existing Banners → siteId = platform
  const bannerResult = await prisma.banner.updateMany({
    where: { siteId: null },
    data: { siteId: defaultSite.id },
  });
  console.log(`✅ Assigned ${bannerResult.count} banners to default site`);

  // 8. Create SiteProduct entries for ALL active products
  const products = await prisma.product.findMany({ where: { isActive: true }, select: { id: true } });
  let productCount = 0;
  for (const product of products) {
    await prisma.siteProduct.upsert({
      where: { siteId_productId: { siteId: defaultSite.id, productId: product.id } },
      update: {},
      create: { siteId: defaultSite.id, productId: product.id, isVisible: true, sortOrder: 0 },
    });
    productCount++;
  }
  console.log(`✅ Created SiteProduct entries for ${productCount} products`);

  // 9. Create SiteCategory entries for ALL active categories
  const categories = await prisma.category.findMany({ where: { isActive: true }, select: { id: true } });
  let catCount = 0;
  for (const cat of categories) {
    await prisma.siteCategory.upsert({
      where: { siteId_categoryId: { siteId: defaultSite.id, categoryId: cat.id } },
      update: {},
      create: { siteId: defaultSite.id, categoryId: cat.id, isVisible: true, sortOrder: 0 },
    });
    catCount++;
  }
  console.log(`✅ Created SiteCategory entries for ${catCount} categories`);

  // 10. Create SiteBrand entries for ALL active brands
  const brands = await prisma.brand.findMany({ where: { isActive: true }, select: { id: true } });
  let brandCount = 0;
  for (const brand of brands) {
    await prisma.siteBrand.upsert({
      where: { siteId_brandId: { siteId: defaultSite.id, brandId: brand.id } },
      update: {},
      create: { siteId: defaultSite.id, brandId: brand.id, isVisible: true, sortOrder: 0 },
    });
    brandCount++;
  }
  console.log(`✅ Created SiteBrand entries for ${brandCount} brands`);

  console.log("\n✨ Migration complete! All existing data assigned to the default site.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
