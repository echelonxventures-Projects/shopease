"use client";

import Link from "next/link";
import { useEffect } from "react";
import { getCartItems } from "@/server/actions/cart-actions";
import { updateCartItem, removeCartItem } from "@/server/actions/cart-actions";
import { useCartStore, CartItem } from "@/stores/useCartStore";
import { useLocaleStore } from "@/stores/useLocaleStore";
import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const { items, totalItems, subtotal, updateQuantity: storeUpdate, removeItem: storeRemove, addItem } = useCartStore();
  const { locale } = useLocaleStore();

  useEffect(() => {
    getCartItems(locale).then((serverItems: any[]) => {
      serverItems.forEach((item: any) => {
        const existing = useCartStore.getState().items.find(
          (i) => i.productId === item.productId && i.variantId === item.variantId
        );
        if (!existing) {
          addItem({
            id: item.id,
            productId: item.productId,
            variantId: item.variantId,
            variantOptions: item.variant?.optionLabel,
            name: item.product?.name || "Product",
            slug: item.product?.slug,
            price: item.variant?.price ?? item.product?.price ?? 0,
            image: item.product?.images?.[0],
            quantity: item.quantity,
            stock: item.variant?.stock ?? item.product?.stock ?? 0,
          });
        }
      });
    });
  }, [locale]);

  const handleUpdate = async (productId: string, variantId: string | undefined, newQty: number) => {
    if (newQty < 1) {
      await handleRemove(productId, variantId);
      return;
    }
    try {
      const result = await updateCartItem(productId, newQty, variantId);
      if (result.error) { toast.error(result.error); return; }
      storeUpdate(productId, variantId, newQty);
    } catch { toast.error("Failed to update"); }
  };

  const handleRemove = async (productId: string, variantId?: string) => {
    try {
      const result = await removeCartItem(productId, variantId);
      if (result.error) { toast.error(result.error); return; }
      storeRemove(productId, variantId);
      toast.success("Removed from cart");
    } catch { toast.error("Failed to remove"); }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500 text-lg">Your cart is empty</p>
        <Link href="/products" className="text-blue-600 hover:underline mt-4 inline-block">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({totalItems} items)</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: CartItem) => (
            <div key={`${item.productId}::${item.variantId || ""}`} className="flex gap-4 border rounded-lg p-4">
              <div className="w-24 h-24 bg-gray-100 rounded flex items-center justify-center shrink-0">
                {item.image ? (
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                ) : (
                  <span className="text-3xl">📦</span>
                )}
              </div>
              <div className="flex-1">
                <Link href={`/products/${item.slug || item.productId}`} className="font-semibold hover:text-blue-600">
                  {item.name}
                </Link>
                {item.variantOptions && (
                  <p className="text-xs text-gray-500 mt-0.5">{item.variantOptions}</p>
                )}
                <p className="font-bold mt-1">₹{item.price.toLocaleString("en-IN")}</p>
                <div className="flex items-center gap-2 mt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8"
                    onClick={() => handleUpdate(item.productId, item.variantId, item.quantity - 1)}
                  >
                    <Minus className="w-3 h-3" />
                  </Button>
                  <span className="w-12 text-center font-bold">{item.quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-8 h-8"
                    onClick={() => handleUpdate(item.productId, item.variantId, item.quantity + 1)}
                  >
                    <Plus className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemove(item.productId, item.variantId)}
                  >
                    <Trash2 className="w-4 h-4" /> Remove
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border rounded-lg p-6 h-fit">
          <h2 className="text-lg font-bold mb-4">Price Details</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>₹{subtotal.toLocaleString("en-IN")}</span>
            </div>
            <div className="flex justify-between">
              <span>Shipping</span>
              <span className="text-green-600">Free</span>
            </div>
            <div className="flex justify-between">
              <span>Tax (18%)</span>
              <span>₹{Math.round(subtotal * 0.18).toLocaleString("en-IN")}</span>
            </div>
            <div className="border-t pt-2 mt-2">
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>₹{(Math.round(subtotal * 1.18)).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
          <Link
            href="/checkout"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-center block mt-6 hover:bg-blue-700"
          >
            Proceed to Checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
