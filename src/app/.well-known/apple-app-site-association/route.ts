import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // Read from SystemConfig DB
  const configs = await prisma.systemConfig.findMany({
    where: {
      key: { in: ["deep_link_apple_team_id", "deep_link_apple_app_id"] },
    },
  });
  const map: Record<string, string> = {};
  for (const c of configs) map[c.key] = c.value;

  const teamId = map["deep_link_apple_team_id"] || "TEAM_ID";
  const bundleId = map["deep_link_apple_app_id"] || "com.shopease.app";

  return NextResponse.json({
    applinks: {
      details: [
        {
          appIDs: [`${teamId}.${bundleId}`],
          components: [
            { "/": "/deep/product/*", "comment": "Product deep links" },
            { "/": "/deep/category/*", "comment": "Category deep links" },
            { "/": "/deep/order/*", "comment": "Order deep links" },
            { "/": "/deep/deal/*", "comment": "Deal deep links" },
            { "/": "/deep/cart", "comment": "Cart deep link" },
            { "/": "/deep/wishlist", "comment": "Wishlist deep link" },
          ],
        },
      ],
    },
  });
}
