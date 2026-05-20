import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const now = new Date();
    const activePromos = await prisma.promo.findMany({
      where: {
        isActive: true,
        OR: [
          { validUntil: { gte: now } },
          { validUntil: null },
        ],
      },
      take: 20,
    });

    const categories = await Promise.all(activePromos.map(async (promo: any) => {
      // Get products from applicableProductIds
      const products = promo.applicableProductIds?.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: promo.applicableProductIds } },
            take: 12,
          })
        : [];

      return {
        name: promo.title,
        appOnly: promo.appOnly || false,
        products: products.map((p: any) => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          price: typeof p.price?.toNumber === "function" ? p.price.toNumber() : p.price,
          comparePrice: p.comparePrice
            ? typeof p.comparePrice.toNumber === "function"
              ? p.comparePrice.toNumber()
              : p.comparePrice
            : null,
          images: p.images,
          appOnly: promo.appOnly || false,
        })),
      };
    }));

    return NextResponse.json(categories);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
