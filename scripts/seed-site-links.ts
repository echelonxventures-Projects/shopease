import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🔗 Seeding site navigation links...");

  const links = [
    // ─── About ShopEase ────────────────────────────────────────────────────
    { section: "About ShopEase", label: "About Us", href: "/about", sortOrder: 1 },
    { section: "About ShopEase", label: "Careers", href: "/careers", sortOrder: 2 },
    { section: "About ShopEase", label: "Press", href: "/press", sortOrder: 3 },
    { section: "About ShopEase", label: "Blog", href: "/blog", sortOrder: 4 },
    { section: "About ShopEase", label: "Investor Relations", href: "/investors", sortOrder: 5 },

    // ─── Make Money with Us ────────────────────────────────────────────────
    { section: "Make Money with Us", label: "Sell on ShopEase", href: "/sell", sortOrder: 1 },
    { section: "Make Money with Us", label: "Sell under ShopEase Accelerator", href: "/sell/accelerator", sortOrder: 2 },
    { section: "Make Money with Us", label: "Protect and Build Your Brand", href: "/brand-registry", sortOrder: 3 },
    { section: "Make Money with Us", label: "Amazon Global Selling", href: "/global-sell", sortOrder: 4 },
    { section: "Make Money with Us", label: "Supply to ShopEase", href: "/supply", sortOrder: 5 },
    { section: "Make Money with Us", label: "Become an Affiliate", href: "/affiliate", sortOrder: 6 },
    { section: "Make Money with Us", label: "Fulfilment by ShopEase", href: "/fba", sortOrder: 7 },
    { section: "Make Money with Us", label: "Advertise Your Products", href: "/advertise", sortOrder: 8 },
    { section: "Make Money with Us", label: "ShopEase Pay on Merchants", href: "/pay/merchants", sortOrder: 9 },

    // ─── Programs ──────────────────────────────────────────────────────────
    { section: "Programs", label: "Accessibility", href: "/accessibility", sortOrder: 1 },
    { section: "Programs", label: "Gift Cards", href: "/gift-cards", sortOrder: 2 },
    { section: "Programs", label: "ShopEase Business", href: "/b2b", sortOrder: 3 },
    { section: "Programs", label: "App Developers", href: "/developers", sortOrder: 4 },
    { section: "Programs", label: "ShopEase Prime", href: "/prime", sortOrder: 5 },

    // ─── Let Us Help You ───────────────────────────────────────────────────
    { section: "Let Us Help You", label: "Your Account", href: "/account", sortOrder: 1 },
    { section: "Let Us Help You", label: "Returns Centre", href: "/account/returns", sortOrder: 2 },
    { section: "Let Us Help You", label: "Recalls and Product Safety Alerts", href: "/recalls", sortOrder: 3 },
    { section: "Let Us Help You", label: "100% Purchase Protection", href: "/buyer-protection", sortOrder: 4 },
    { section: "Let Us Help You", label: "ShopEase App Download", href: "/app", sortOrder: 5 },
    { section: "Let Us Help You", label: "Help", href: "/help", sortOrder: 6 },

    // ─── Connect With Us ───────────────────────────────────────────────────
    { section: "Connect With Us", label: "Facebook", href: "https://facebook.com", sortOrder: 1 },
    { section: "Connect With Us", label: "X (Twitter)", href: "https://twitter.com", sortOrder: 2 },
    { section: "Connect With Us", label: "Instagram", href: "https://instagram.com", sortOrder: 3 },
    { section: "Connect With Us", label: "YouTube", href: "https://youtube.com", sortOrder: 4 },

    // ─── Legal ─────────────────────────────────────────────────────────────
    { section: "Legal", label: "Conditions of Use", href: "/terms", sortOrder: 1 },
    { section: "Legal", label: "Privacy Notice", href: "/privacy", sortOrder: 2 },
    { section: "Legal", label: "Interest-Based Ads", href: "/ads", sortOrder: 3 },
    { section: "Legal", label: "Cookie Preferences", href: "/cookies", sortOrder: 4 },
  ];

  for (const link of links) {
    await prisma.siteLink.upsert({
      where: { href: link.href },
      update: { label: link.label, section: link.section, sortOrder: link.sortOrder },
      create: link,
    });
  }

  console.log(`  ✅ ${links.length} site links seeded`);
  console.log("✅ Site navigation seeding complete!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
