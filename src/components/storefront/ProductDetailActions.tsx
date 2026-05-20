"use client";

import { useState } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { addToCart as serverAddToCart, updateCartItem, removeCartItem } from "@/server/actions/cart-actions";
import { addToWishlist, removeFromWishlist } from "@/server/actions/wishlist-actions";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Heart, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { SocialShareButtons, OneClickBuy } from "@/components/storefront/ShareAndBuy";

interface ProductDetailActionsProps {
  product: {
    id: string;
    slug: string;
    name: string;
    price: number;
    comparePrice: number | null;
    stock: number;
    images: string[];
    categoryId: string;
    brandId: string | null;
  };
  variantId?: string;
  variantPrice?: number;
  variantComparePrice?: number | null;
  variantStock?: number;
  variantOptionLabel?: string;
  variantImages?: string[];
}

export function ProductDetailActions({
  product,
  variantId,
  variantPrice,
  variantComparePrice,
  variantStock,
  variantOptionLabel,
  variantImages,
}: ProductDetailActionsProps) {
  const { addItem, updateQuantity: storeUpdate, removeItem: storeRemove } = useCartStore();
  const storeItems = useCartStore((s) => s.items);
  const cartItem = storeItems.find((i) => i.productId === product.id && i.variantId === variantId);
  const cartQty = cartItem?.quantity ?? 0;

  const [qty, setQty] = useState(1);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(false);

  const price = variantPrice ?? product.price;
  const comparePrice = variantComparePrice ?? product.comparePrice;
  const stock = variantStock !== undefined ? variantStock : product.stock;
  const images = variantImages && variantImages.length > 0 ? variantImages : product.images;

  const handleAddToCart = async () => {
    setLoading(true);
    try {
      const result = await serverAddToCart(product.id, qty, variantId);
      if (result.error) { toast.error(result.error); return; }
      addItem({
        id: variantId ? `${product.id}::${variantId}` : product.id,
        productId: product.id,
        variantId,
        variantOptions: variantOptionLabel,
        name: product.name,
        price,
        image: images?.[0],
        quantity: (cartQty || 0) + qty,
        stock,
      });
      setQty(1);
      toast.success("Added to cart");
    } catch { toast.error("Failed to add to cart"); }
    finally { setLoading(false); }
  };

  const handleQtyChange = async (newQty: number) => {
    if (newQty < 1) { handleRemove(); return; }
    setLoading(true);
    try {
      const result = await updateCartItem(product.id, newQty, variantId);
      if (result.error) { toast.error(result.error); return; }
      storeUpdate(product.id, variantId, newQty);
      setQty(newQty);
    } catch { toast.error("Failed to update"); }
    finally { setLoading(false); }
  };

  const handleRemove = async () => {
    setLoading(true);
    try {
      const result = await removeCartItem(product.id, variantId);
      if (result.error) { toast.error(result.error); return; }
      storeRemove(product.id, variantId);
      setQty(1);
      toast.success("Removed from cart");
    } catch { toast.error("Failed to remove"); }
    finally { setLoading(false); }
  };

  const handleWishlist = async () => {
    try {
      if (wishlisted) {
        await removeFromWishlist(product.id, variantId);
        setWishlisted(false);
        toast.success("Removed from wishlist");
      } else {
        await addToWishlist(product.id, variantId);
        setWishlisted(true);
        toast.success("Added to wishlist");
      }
    } catch { toast.error("Failed to update wishlist"); }
  };

  return (
    <div className="space-y-4">
      {variantOptionLabel && (
        <p className="text-sm text-gray-500">Options: {variantOptionLabel}</p>
      )}
      <div>
        <span className={`text-sm font-medium ${stock > 0 ? "text-green-600" : "text-red-600"}`}>
          {stock > 0 ? `In Stock (${stock})` : "Out of Stock"}
        </span>
      </div>

      {cartQty > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-gray-50 rounded-lg p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 text-lg"
              onClick={() => handleQtyChange(cartQty - 1)}
              disabled={loading}
            >
              <Minus className="w-5 h-5" />
            </Button>
            <span className="text-2xl font-bold w-16 text-center">{cartQty}</span>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 text-lg"
              onClick={() => handleQtyChange(cartQty + 1)}
              disabled={loading || cartQty >= stock}
            >
              <Plus className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="w-12 h-12 text-red-500 hover:text-red-700"
              onClick={handleRemove}
              disabled={loading}
            >
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-sm text-gray-500 text-center">
            {cartQty} item{cartQty > 1 ? "s" : ""} in your cart · ₹{(price * cartQty).toLocaleString()}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Quantity:</span>
            <div className="flex items-center border rounded-lg overflow-hidden">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                disabled={qty <= 1}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-12 text-center font-bold text-lg">{qty}</span>
              <button
                onClick={() => setQty(Math.min(stock, qty + 1))}
                className="w-10 h-10 flex items-center justify-center hover:bg-gray-100"
                disabled={qty >= stock}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              className="flex-1 h-12 text-lg"
              onClick={handleAddToCart}
              disabled={loading || stock === 0}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {loading ? "Adding..." : `Add to Cart — ₹${(price * qty).toLocaleString()}`}
            </Button>
            <Button variant="outline" size="lg" onClick={handleWishlist}>
              <Heart className={`w-5 h-5 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <OneClickBuy productId={product.id} productName={product.name} price={price} />
          </div>
        </div>
      )}

      {/* Social Sharing */}
      <div className="mt-4 pt-4 border-t">
        <SocialShareButtons productId={product.id} productName={product.name} />
      </div>
    </div>
  );
}
