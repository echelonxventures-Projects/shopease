"use client";

import { useState, useEffect } from "react";
import { listB2BProducts, createB2BOrder } from "@/server/actions/b2b-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Building2, Package, ShoppingCart, Tag } from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  productId: string;
  productName: string;
  qty: number;
  unitPrice: number;
  totalPrice: number;
  discount: number;
}

export default function B2BPortal() {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    listB2BProducts().then(setProducts).catch(() => {});
  }, []);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const updateQty = (productId: string, qty: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const tiers = product.tierPrices || [];
    let bestTier: any = null;
    for (const tier of tiers) {
      if (qty >= tier.minQty && (!tier.maxQty || qty <= tier.maxQty)) {
        bestTier = tier;
      }
    }

    const unitPrice = bestTier?.price ? Number(bestTier.price) : Number(product.price);
    const discount = bestTier?.discountPercentage ? Number(bestTier.discountPercentage) : 0;

    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing) {
        if (qty <= 0) return prev.filter((c) => c.productId !== productId);
        return prev.map((c) =>
          c.productId === productId
            ? { ...c, qty, unitPrice, totalPrice: unitPrice * qty, discount }
            : c
        );
      }
      if (qty > 0) {
        return [...prev, { productId, productName: product.name, qty, unitPrice, totalPrice: unitPrice * qty, discount }];
      }
      return prev;
    });
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const items = cart.map((c) => ({
        productId: c.productId,
        quantity: c.qty,
        unitPrice: c.unitPrice,
        discount: c.discount,
      }));
      await createB2BOrder({ items, notes: "B2B bulk order" });
      toast.success("B2B order placed successfully!");
      setCart([]);
    } catch {
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = cart.reduce((sum, c) => sum + c.totalPrice, 0);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <Building2 className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">B2B Wholesale Portal</h1>
          <p className="text-gray-500">Bulk pricing for business customers</p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products for bulk purchase..."
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Products */}
        <div className="lg:col-span-2 space-y-4">
          {filtered.map((product) => {
            const inCart = cart.find((c) => c.productId === product.id);
            return (
              <div key={product.id} className="bg-white rounded-xl shadow p-5 border">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500">MRP: ₹{Number(product.price).toFixed(2)}</p>
                  </div>
                  {inCart && (
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {inCart.qty} in cart
                    </span>
                  )}
                </div>

                {/* Tier pricing */}
                {product.tierPrices && product.tierPrices.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs font-medium text-gray-500 mb-1">Tier Pricing:</p>
                    <div className="flex flex-wrap gap-2">
                      {product.tierPrices.map((tp: any) => (
                        <div key={tp.id} className="flex items-center gap-1 bg-gray-50 px-3 py-1.5 rounded-lg text-sm">
                          <Tag className="w-3 h-3 text-green-600" />
                          <span className="text-xs">{tp.minQty}+ pcs</span>
                          {tp.discountPercentage && (
                            <span className="text-xs text-green-700 font-medium">{tp.discountPercentage}% off</span>
                          )}
                          {tp.price && (
                            <span className="text-xs font-bold">₹{Number(tp.price).toFixed(2)}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Qty selector */}
                <div className="flex items-center gap-3">
                  <Input
                    type="number"
                    min={1}
                    placeholder="Quantity"
                    value={inCart?.qty || ""}
                    onChange={(e) => updateQty(product.id, parseInt(e.target.value) || 0)}
                    className="w-32"
                  />
                  <Button
                    onClick={() => updateQty(product.id, (inCart?.qty || 0) + 1)}
                    variant="outline"
                    size="sm"
                  >
                    +
                  </Button>
                  <Button
                    onClick={() => updateQty(product.id, Math.max(0, (inCart?.qty || 0) - 1))}
                    variant="outline"
                    size="sm"
                  >
                    −
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Cart */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow p-5 sticky top-6">
            <div className="flex items-center gap-2 mb-4">
              <ShoppingCart className="w-5 h-5" />
              <h2 className="font-bold text-lg">Order Summary</h2>
              <span className="ml-auto bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">
                {cart.length} items
              </span>
            </div>

            {cart.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Package className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Add items to your order</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex justify-between text-sm border-b pb-2">
                      <div>
                        <p className="font-medium">{item.productName}</p>
                        <p className="text-gray-500">{item.qty} × ₹{item.unitPrice.toFixed(2)}</p>
                        {item.discount > 0 && (
                          <span className="text-xs text-green-600">{item.discount}% discount</span>
                        )}
                      </div>
                      <p className="font-bold">₹{item.totalPrice.toFixed(2)}</p>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between font-bold text-lg mb-4">
                  <span>Total</span>
                  <span>₹{totalAmount.toFixed(2)}</span>
                </div>
                <Button onClick={handleSubmitOrder} disabled={loading} className="w-full">
                  {loading ? "Placing..." : "Place Order"}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
