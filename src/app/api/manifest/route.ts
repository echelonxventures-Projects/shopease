import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  let map: Record<string, string> = {};

  try {
    const keys = [
      "pwa_name", "pwa_short_name", "pwa_description", "pwa_start_url",
      "pwa_theme_color", "pwa_background_color", "pwa_display", "pwa_dir", "pwa_lang",
    ];
    const configs = await prisma.systemConfig.findMany({ where: { key: { in: keys } } });
    for (const c of configs) map[c.key] = c.value;
  } catch {
    // DB unavailable — fall back to defaults
  }

  const manifest = {
    name: map["pwa_name"] || "ShopEase - Your Online Shopping Destination",
    short_name: map["pwa_short_name"] || "ShopEase",
    description: map["pwa_description"] || "Shop everything you need with fast delivery and great prices",
    start_url: map["pwa_start_url"] || "/",
    display: map["pwa_display"] || "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    orientation: "any",
    background_color: map["pwa_background_color"] || "#ffffff",
    theme_color: map["pwa_theme_color"] || "#2563eb",
    categories: ["shopping", "ecommerce"],
    dir: map["pwa_dir"] || "auto",
    lang: map["pwa_lang"] || "en-US",
    scope: "/",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
    shortcuts: [
      { name: "My Orders", url: "/account/orders", description: "View your order history" },
      { name: "Wishlist", url: "/wishlist", description: "Browse your saved items" },
      { name: "Deals", url: "/deals", description: "Today's best deals" },
      { name: "Cart", url: "/cart", description: "View your shopping cart" },
    ],
    prefer_related_applications: false,
  };

  return NextResponse.json(manifest, {
    headers: {
      "Cache-Control": "no-cache",
    },
  });
}
