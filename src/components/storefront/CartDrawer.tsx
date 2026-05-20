"use client";

import Link from "next/link";
import { useCartStore, CartItem } from "@/stores/useCartStore";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, savedItems, totalItems, subtotal, updateQuantity, removeItem, clearCart, saveForLater, moveToCart, removeSavedItem } = useCartStore();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Shopping cart">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-bold">Shopping Cart ({totalItems})</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" aria-label="Close cart">
            ✕
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p className="text-gray-500">Your cart is empty</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-4" role="list" aria-label="Cart items">
              {items.map((item) => (
                <div key={`${item.productId}::${item.variantId || ""}`} className="flex gap-4 border-b pb-4" role="listitem">
                  <div className="w-20 h-20 bg-gray-100 rounded flex items-center justify-center shrink-0">
                    {item.image ? (
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover rounded" />
                    ) : (
                      <span className="text-2xl">📦</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    {item.variantOptions && <p className="text-xs text-gray-400">{item.variantOptions}</p>}
                    <p className="font-bold mt-1">₹{item.price.toLocaleString()}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                        className="w-8 h-8 border rounded flex items-center justify-center"
                        aria-label="Decrease quantity"
                      >
                        -
                      </button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                        className="w-8 h-8 border rounded flex items-center justify-center"
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="ml-auto text-red-500 text-sm"
                        aria-label={`Remove ${item.name} from cart`}
                      >
                        Remove
                      </button>
                    </div>
                    <button
                      onClick={() => saveForLater(item.productId, item.variantId)}
                      className="text-xs text-blue-600 hover:underline mt-1"
                      aria-label={`Save ${item.name} for later`}
                    >
                      Save for later
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t p-4">
              {savedItems.length > 0 && (
                <div className="mb-4 space-y-2" role="region" aria-label="Saved for later items">
                  <h3 className="text-sm font-semibold text-gray-500">Saved for Later ({savedItems.length})</h3>
                  {savedItems.map((item) => (
                    <div key={`${item.productId}::${item.variantId || ""}`} className="flex items-center gap-2 text-sm border-b pb-2">
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="font-bold">₹{item.price.toLocaleString()}</span>
                      <button
                        onClick={() => moveToCart(item.productId, item.variantId)}
                        className="text-blue-600 hover:underline text-xs"
                        aria-label={`Move ${item.name} to cart`}
                      >
                        Move to Cart
                      </button>
                      <button
                        onClick={() => removeSavedItem(item.productId, item.variantId)}
                        className="text-red-500 hover:underline text-xs"
                        aria-label={`Remove ${item.name} from saved items`}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex justify-between mb-4">
                <span className="font-semibold">Subtotal:</span>
                <span className="font-bold">₹{subtotal.toLocaleString()}</span>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-center block hover:bg-blue-700"
              >
                Checkout
              </Link>
              <button
                onClick={clearCart}
                className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
