import { NextRequest, NextResponse } from "next/server";

// Deep link handler: routes mobile app deep links to appropriate pages
// Supports patterns: /deep/product/{slug}, /deep/category/{slug}, /deep/order/{id}, /deep/deal/{id}

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  try {
    const { slug } = await params;
    const [type, id] = slug;

    switch (type) {
      case "product": {
        return NextResponse.redirect(new URL(`/products/${id}`, req.url).toString(), 302);
      }
      case "category": {
        return NextResponse.redirect(new URL(`/products?category=${id}`, req.url).toString(), 302);
      }
      case "deal": {
        return NextResponse.redirect(new URL(`/deals#${id}`, req.url).toString(), 302);
      }
      case "order": {
        return NextResponse.redirect(new URL(`/account/orders/${id}`, req.url).toString(), 302);
      }
      case "cart": {
        return NextResponse.redirect(new URL(`/cart`, req.url).toString(), 302);
      }
      case "wishlist": {
        return NextResponse.redirect(new URL(`/wishlist`, req.url).toString(), 302);
      }
      default: {
        return NextResponse.redirect(new URL(`/`, req.url).toString(), 302);
      }
    }
  } catch {
    return NextResponse.redirect(new URL(`/`, req.url).toString(), 302);
  }
}
