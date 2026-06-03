"use client";

import Link from "next/link";
import { useState } from "react";
import { addToCart, updateCartItem, removeCartItem } from "@/server/actions/cart-actions";
import { addToWishlist, removeFromWishlist } from "@/server/actions/wishlist-actions";
import { Button } from "@/components/ui/button";
import { useCartStore } from "@/stores/useCartStore";
import { ShoppingCart, Heart, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface ProductCardProduct {
  id: string;
  slug: string;
  name: string;
  price: number | string;
  comparePrice?: number | string | null;
  stock?: number | string | null;
  images?: string[];
  productType?: string;
  brand?: { name: string } | null;
  hasVariants?: boolean;
  variantPriceRange?: { min: number; max: number } | null;
  avgRating?: number | string | null;
  reviewCount?: number;
  offerStartDate?: string | null;
  offerEndDate?: string | null;
}

export function ProductCard({ product, badgeData, deliveryInfo }: { product: ProductCardProduct; badgeData?: { bestSeller?: boolean; boughtLastMonth?: number; lowStock?: number | null }; deliveryInfo?: { deliveryDate?: string; isFree?: boolean; fee?: number } }) {
  const now = new Date();
  const offerStartDate = product.offerStartDate ? new Date(product.offerStartDate) : null;
  const offerEndDate = product.offerEndDate ? new Date(product.offerEndDate) : null;
  const hasOfferDates = offerStartDate && offerEndDate;
  const offerActive = hasOfferDates
    ? offerStartDate <= now && offerEndDate >= now
    : false;
  const hasDiscount = product.comparePrice && (!hasOfferDates || offerActive);
  const discount = hasDiscount
    ? Math.round(((Number(product.comparePrice) - Number(product.price)) / Number(product.comparePrice)) * 100)
    : 0;
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const storeItems = useCartStore((s) => s.items);
  const addItem = useCartStore((s) => s.addItem);
  const updateQty = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const cartItem = storeItems.find((i) => i.productId === product.id);
  const cartQty = cartItem?.quantity ?? 0;
  const stock = Number(product.stock ?? 0);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAdding(true);
    try {
      const result = await addToCart(product.id, 1);
      if (result.error) { toast.error(result.error); }
      else {
        addItem({
          id: product.id,
          productId: product.id,
          name: product.name,
          slug: product.slug,
          price: Number(product.price),
          image: product.images?.[0],
          quantity: cartQty + 1,
          stock,
        });
        toast.success("Added to cart");
      }
    } catch { toast.error("Failed to add to cart"); }
    finally { setAdding(false); }
  };

  const handleQtyChange = async (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newQty = cartQty + delta;
    if (newQty <= 0) {
      handleRemove(e);
      return;
    }
    try {
      const result = await updateCartItem(product.id, newQty);
      if (result.error) { toast.error(result.error); return; }
      updateQty(product.id, undefined, newQty);
    } catch { toast.error("Failed to update cart"); }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const result = await removeCartItem(product.id);
      if (result.error) { toast.error(result.error); return; }
      removeItem(product.id);
      toast.success("Removed from cart");
    } catch { toast.error("Failed to remove from cart"); }
  };

  const handleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (wishlisted) {
        await removeFromWishlist(product.id);
        setWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(product.id);
        setWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch { toast.error("Failed to update wishlist"); }
  };

  return (
    <Link href={`/products/${product.slug}`} className="group">
      <div className="bg-white border rounded-lg overflow-hidden hover:shadow-lg transition relative">
        <div className="aspect-square bg-gray-100 relative overflow-hidden">
          {product.images?.[0] ? (
            <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gray-100 flex items-center justify-center">
              <span className="text-4xl text-gray-400">📦</span>
            </div>
          )}
          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded">
              {discount}% off
            </span>
          )}
          {product.productType === "DIGITAL" && (
            <span className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-semibold">
              ⚡ Digital
            </span>
          )}
          {product.productType === "SUBSCRIPTION" && (
            <span className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-1 rounded font-semibold">
              🔄 Subscribe
            </span>
          )}
          {(product.productType === "BUNDLE" || product.productType === "COMBO") && (
            <span className="absolute top-2 left-2 bg-purple-600 text-white text-xs px-2 py-1 rounded font-semibold">
              📦 Bundle
            </span>
          )}
          <button
            onClick={handleWishlist}
            className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full shadow flex items-center justify-center hover:bg-gray-50 transition"
          >
            <Heart className={`w-4 h-4 ${wishlisted ? "fill-red-500 text-red-500" : "text-gray-400"}`} />
          </button>
        </div>
        <div className="p-4">
          <h3 className="font-medium text-sm group-hover:text-blue-600 line-clamp-2">
            {product.name}
          </h3>
          {product.brand && (
            <p className="text-xs text-gray-500 mt-1">{product.brand.name}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="font-bold">
              {product.hasVariants && product.variantPriceRange
                ? `From ₹${product.variantPriceRange.min.toLocaleString("en-IN")}`
                : `₹${Number(product.price).toLocaleString("en-IN")}`}
            </span>
            {!product.hasVariants && product.comparePrice && (
              <span className="text-sm text-gray-400 line-through">
                ₹{Number(product.comparePrice).toLocaleString("en-IN")}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1 mt-2">
            <span className="text-yellow-400">{"★".repeat(Math.round(Number(product.avgRating || 0)))}</span>
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {(badgeData?.bestSeller) && (
              <span className="text-xs bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-semibold">
                #1 Best Seller
              </span>
            )}
            {(badgeData?.boughtLastMonth ?? 0) > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                {badgeData!.boughtLastMonth} bought in past month
              </span>
            )}
            {stock > 0 && stock < 10 && (
              <span className="text-xs bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-medium">
                Only {stock} left
              </span>
            )}
          </div>

          {/* Delivery estimate */}
          {deliveryInfo?.deliveryDate && (
            <div className="text-xs text-green-600 mt-2 font-medium">
              Get it by {deliveryInfo.deliveryDate}
            </div>
          )}
          {deliveryInfo && (
            <div className="text-xs text-green-700 mt-0.5">
              {deliveryInfo.isFree ? "FREE Delivery" : `Delivery: ₹${deliveryInfo.fee}`}
            </div>
          )}

          {product.hasVariants ? (
            <Button
              size="sm"
              className="w-full mt-3"
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => { e.preventDefault(); e.stopPropagation(); }}
            >
              <ShoppingCart className="w-4 h-4 mr-1" /> Select Options
            </Button>
          ) : cartQty > 0 ? (
            <div className="flex items-center justify-between mt-3 bg-gray-50 rounded-lg overflow-hidden">
              <Button
                size="sm"
                variant="ghost"
                className="w-10 h-9 rounded-none p-0"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleQtyChange(-1, e)}
              >
                <Minus className="w-4 h-4" />
              </Button>
              <span className="font-bold text-lg w-10 text-center">{cartQty}</span>
              <Button
                size="sm"
                variant="ghost"
                className="w-10 h-9 rounded-none p-0"
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => handleQtyChange(1, e)}
                disabled={cartQty >= stock}
              >
                <Plus className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="w-10 h-9 rounded-none p-0 text-red-500 hover:text-red-700"
                onClick={handleRemove}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ) : stock > 0 ? (
            <Button
              size="sm"
              className="w-full mt-3"
              onClick={handleAddToCart}
              disabled={adding}
            >
              <ShoppingCart className="w-4 h-4 mr-1" /> {adding ? "Adding..." : "Add to Cart"}
            </Button>
          ) : (
            <Button size="sm" className="w-full mt-3" disabled>
              Out of Stock
            </Button>
          )}
        </div>
      </div>
    </Link>
  );
}
