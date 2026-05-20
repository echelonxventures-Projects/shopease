import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/server/actions/api-key-actions";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = request.headers.get("Authorization");
  const key = auth?.replace("Bearer ", "");
  const validated = key ? await validateApiKey(key) : null;

  if (!validated) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const { slug } = await params;
  const [resource, id] = slug;
  const searchParams = request.nextUrl.searchParams;

  // Permission check
  const requiredPermission = `${resource}:read`;
  if (!validated.permissions.includes(requiredPermission) && !validated.permissions.includes("*:read")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    switch (resource) {
      case "products": {
        if (id) {
          const { getProduct } = await import("@/server/actions/product-actions");
          const product = await getProduct(id);
          if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
          return NextResponse.json(product);
        }
        const { getProducts } = await import("@/server/actions/product-actions");
        const products = await getProducts({
          limit: Number(searchParams.get("limit")) || 20,
          page: Number(searchParams.get("page")) || 1,
        });
        return NextResponse.json(products);
      }
      case "orders": {
        if (id) {
          const { getOrder } = await import("@/server/actions/order-actions");
          const order = await getOrder(id);
          if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
          return NextResponse.json(order);
        }
        const { getOrders } = await import("@/server/actions/order-actions");
        const orders = await getOrders();
        return NextResponse.json(orders);
      }
      case "categories": {
        const { getCategories } = await import("@/server/actions/product-actions");
        const categories = await getCategories();
        return NextResponse.json(categories);
      }
      case "customers": {
        const { getAllCustomers } = await import("@/server/actions/admin-actions");
        const customers = await getAllCustomers({
          limit: Number(searchParams.get("limit")) || 20,
          page: Number(searchParams.get("page")) || 1,
        });
        return NextResponse.json(customers);
      }
      case "reviews": {
        const productId = id || searchParams.get("productId") || undefined;
        const { getReviews } = await import("@/server/actions/review-actions");
        const reviews = productId ? await getReviews(productId) : await getReviews("");
        return NextResponse.json(reviews);
      }
      case "inventory": {
        const { getInventory } = await import("@/server/actions/admin-actions");
        const inventory = await getInventory();
        return NextResponse.json(inventory);
      }
      case "coupons": {
        const { getPromos } = await import("@/server/actions/promo-actions");
        const promos = await getPromos({ type: "COUPON" });
        return NextResponse.json(promos);
      }
      case "brands": {
        const { getBrands } = await import("@/server/actions/product-actions");
        const brands = await getBrands();
        return NextResponse.json(brands);
      }
      default:
        return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 404 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = request.headers.get("Authorization");
  const key = auth?.replace("Bearer ", "");
  const validated = key ? await validateApiKey(key) : null;

  if (!validated) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const { slug } = await params;
  const [resource] = slug;

  const requiredPermission = `${resource}:write`;
  if (!validated.permissions.includes(requiredPermission) && !validated.permissions.includes("*:write")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    if (resource === "products") {
      const { createProduct } = await import("@/server/actions/product-actions");
      const product = await createProduct(body);
      return NextResponse.json(product, { status: 201 });
    }

    if (resource === "orders") {
      const { createOrder } = await import("@/server/actions/order-actions");
      const order = await createOrder(body);
      return NextResponse.json(order, { status: 201 });
    }

    if (resource === "reviews") {
      const { submitReview } = await import("@/server/actions/review-actions");
      const review = await submitReview(body.productId, body.rating, body.comment);
      return NextResponse.json(review, { status: 201 });
    }

    return NextResponse.json({ error: `Unknown resource: ${resource}` }, { status: 404 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = request.headers.get("Authorization");
  const key = auth?.replace("Bearer ", "");
  const validated = key ? await validateApiKey(key) : null;

  if (!validated) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const { slug } = await params;
  const [resource, id] = slug;

  if (!id) {
    return NextResponse.json({ error: "Resource ID required for updates" }, { status: 400 });
  }

  const requiredPermission = `${resource}:write`;
  if (!validated.permissions.includes(requiredPermission) && !validated.permissions.includes("*:write")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    if (resource === "products") {
      const { updateProduct } = await import("@/server/actions/product-actions");
      const product = await updateProduct(id, body);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json(product);
    }

    return NextResponse.json({ error: `Resource ${resource} does not support PUT` }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = request.headers.get("Authorization");
  const key = auth?.replace("Bearer ", "");
  const validated = key ? await validateApiKey(key) : null;

  if (!validated) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const { slug } = await params;
  const [resource, id] = slug;

  if (!id) {
    return NextResponse.json({ error: "Resource ID required for partial updates" }, { status: 400 });
  }

  const requiredPermission = `${resource}:write`;
  if (!validated.permissions.includes(requiredPermission) && !validated.permissions.includes("*:write")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));

  try {
    if (resource === "orders") {
      const { updateOrderStatus } = await import("@/server/actions/admin-actions");
      const order = await updateOrderStatus(id, body.status);
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(order);
    }

    if (resource === "products") {
      const { updateProduct } = await import("@/server/actions/product-actions");
      const product = await updateProduct(id, body);
      if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json(product);
    }

    return NextResponse.json({ error: `Resource ${resource} does not support PATCH` }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> }) {
  const auth = request.headers.get("Authorization");
  const key = auth?.replace("Bearer ", "");
  const validated = key ? await validateApiKey(key) : null;

  if (!validated) {
    return NextResponse.json({ error: "Invalid or missing API key" }, { status: 401 });
  }

  const { slug } = await params;
  const [resource, id] = slug;

  if (!id) {
    return NextResponse.json({ error: "Resource ID required for deletion" }, { status: 400 });
  }

  const requiredPermission = `${resource}:write`;
  if (!validated.permissions.includes(requiredPermission) && !validated.permissions.includes("*:write")) {
    return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
  }

  try {
    if (resource === "products") {
      const { deleteProduct } = await import("@/server/actions/product-actions");
      const result = await deleteProduct(id);
      if (!result) return NextResponse.json({ error: "Product not found" }, { status: 404 });
      return NextResponse.json({ message: "Product deleted", id });
    }

    return NextResponse.json({ error: `Resource ${resource} does not support DELETE` }, { status: 405 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
