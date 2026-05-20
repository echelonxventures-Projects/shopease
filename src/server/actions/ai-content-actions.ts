"use server";
import { prisma } from "@/lib/prisma";
import { getAIProvider, isAIFeatureEnabled } from "@/lib/ai/orchestrator";

export async function generateProductDescription(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const enabled = await isAIFeatureEnabled("ai_content");
  if (!enabled) {
    return {
      title: product.name,
      description: product.description || `Quality product: ${product.name}`,
      tags: product.tags,
    };
  }

  try {
    const provider = await getAIProvider("ai_content");
    const result = await provider.generate(
      `Generate a compelling product description for: ${product.name}. Category: ${product.categoryId}. Price: ${product.price}. Current tags: ${product.tags.join(", ")}. Return JSON: { title, description, tags[] }`,
      { maxTokens: 300 }
    );

    const json = result.text.match(/\{[\s\S]*\}/)?.[0];
    if (json) {
      const parsed = JSON.parse(json);
      // Store AI tags on the product
      if (parsed.tags) {
        await prisma.product.update({
          where: { id: productId },
          data: { aiTags: parsed.tags as any },
        });
      }
      return parsed;
    }
  } catch {
    // Fallback to template
  }

  return {
    title: product.name,
    description: product.description || `Premium ${product.name} — Shop now at ShopEase!`,
    tags: product.tags,
  };
}

export async function generateProductTags(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  const category = await prisma.category.findUnique({ where: { id: product.categoryId } });
  const brand = product.brandId ? await prisma.brand.findUnique({ where: { id: product.brandId } }) : null;

  return [
    ...product.tags,
    ...(category?.name ? [category.name.toLowerCase()] : []),
    ...(brand?.name ? [brand.name.toLowerCase()] : []),
    product.productType?.toLowerCase(),
  ].filter(Boolean);
}

export async function scoreProduct(productId: string) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw new Error("Product not found");

  // AI-powered product score (0-100)
  let score = 50; // Base score

  // Rating factor
  score += Number(product.avgRating) * 5;

  // Review count factor
  if (product.reviewCount > 100) score += 10;
  else if (product.reviewCount > 50) score += 5;

  // Stock factor
  if (product.stock > 0) score += 5;
  if (product.stock < 5 && product.stock > 0) score -= 10; // Low stock penalty

  // Featured factor
  if (product.isFeatured) score += 10;

  // Image quality
  if ((product.images as string[]).length > 2) score += 5;

  // Tags completeness
  if ((product.tags as string[]).length > 3) score += 5;

  score = Math.max(0, Math.min(100, score));

  await prisma.product.update({
    where: { id: productId },
    data: { aiScore: score },
  });

  return score;
}
