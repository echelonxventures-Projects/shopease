"use client";

import { useState, useEffect, useCallback } from "react";
import {
  browseCatalogForSupplier,
  getSupplierListings,
  createSupplierListing,
  enableSupplierListing,
  disableSupplierListing,
  updateListingQuantity,
  updateListingPrice,
} from "@/server/actions/product-master-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Search, Plus, ShoppingBag, Check, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  stock: number;
  masterStatus: string;
  masterCategory?: string;
  tags: string[];
  avgRating: number;
  reviewCount: number;
  shortDesc?: string;
  category?: { name: string };
  brand?: { name: string };
}

interface Listing {
  id: string;
  productId: string;
  listingPrice: number;
  comparePrice?: number;
  quantity: number;
  status: string;
  listingSku?: string;
  description?: string;
  tags: string[];
  enabledAt?: string;
  disabledAt?: string;
  product: Product;
}

const SUPPLIER_ID = "default-supplier"; // In production, derive from session

export default function SupplierCatalogPage() {
  const [tab, setTab] = useState<"browse" | "my-listings">("browse");
  const [browseProducts, setBrowseProducts] = useState<Product[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [showAlreadyListed, setShowAlreadyListed] = useState(false);
  const [listingFilter, setListingFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [priceForm, setPriceForm] = useState({ listingPrice: "", comparePrice: "", quantity: "", listingSku: "" });

  async function loadBrowse() {
    setLoading(true);
    try {
      const res = await browseCatalogForSupplier(SUPPLIER_ID, {
        search, category, alreadyListed: showAlreadyListed,
      });
      setBrowseProducts(res.products);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  }

  async function loadListings() {
    try {
      const res = await getSupplierListings(SUPPLIER_ID, {
        status: listingFilter || undefined,
      });
      setMyListings(res.listings as Listing[]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    }
  }

  useEffect(() => { loadBrowse(); }, [search, category, showAlreadyListed]);
  useEffect(() => { if (tab === "my-listings") loadListings(); }, [tab, listingFilter]);

  const handleCreateListing = useCallback(async () => {
    if (!selectedProduct) return;
    if (!priceForm.listingPrice || !priceForm.quantity) {
      toast.error("Price and quantity are required");
      return;
    }
    try {
      await createSupplierListing(SUPPLIER_ID, selectedProduct.id, {
        listingPrice: parseFloat(priceForm.listingPrice),
        comparePrice: priceForm.comparePrice ? parseFloat(priceForm.comparePrice) : undefined,
        quantity: parseInt(priceForm.quantity),
        listingSku: priceForm.listingSku || undefined,
      });
      toast.success(`Listing created for "${selectedProduct.name}"`);
      setSelectedProduct(null);
      setPriceForm({ listingPrice: "", comparePrice: "", quantity: "", listingSku: "" });
      loadBrowse();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    }
  }, [selectedProduct, priceForm]);

  const statusBadge = (s: string) => {
    const colors: Record<string, string> = {
      ACTIVE: "bg-green-100 text-green-800",
      DRAFT: "bg-yellow-100 text-yellow-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      OUT_OF_STOCK: "bg-red-100 text-red-800",
      REJECTED: "bg-red-100 text-red-800",
    };
    return colors[s] || "bg-gray-100 text-gray-800";
  };

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="w-6 h-6" />
          Supplier Product Catalog
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Browse master catalog to select products for sale, or manage your existing listings
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setTab("browse")}
          className={`pb-3 text-sm font-medium ${tab === "browse" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
        >
          Browse Catalog
        </button>
        <button
          onClick={() => setTab("my-listings")}
          className={`pb-3 text-sm font-medium ${tab === "my-listings" ? "text-blue-600 border-b-2 border-blue-600" : "text-gray-500"}`}
        >
          My Listings
        </button>
      </div>

      {/* Browse Tab */}
      {tab === "browse" && (
        <>
          <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search master catalog..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">All Categories</option>
              <option value="electronics">Electronics</option>
              <option value="fashion">Fashion</option>
              <option value="home-kitchen">Home & Kitchen</option>
              <option value="grocery">Grocery</option>
              <option value="beauty">Beauty</option>
              <option value="sports">Sports</option>
              <option value="books">Books</option>
              <option value="toys-games">Toys & Games</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <Switch
                checked={showAlreadyListed}
                onCheckedChange={setShowAlreadyListed}
              />
              Show listed only
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {loading ? (
              <div className="col-span-full text-center py-12 text-gray-400">Loading products...</div>
            ) : browseProducts.length === 0 ? (
              <div className="col-span-full text-center py-12 text-gray-400">No products found</div>
            ) : (
              browseProducts.map((p) => (
                <div key={p.id} className="bg-white rounded-lg shadow p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium">{p.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{p.shortDesc || p.category?.name}</p>
                    </div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                      {p.masterCategory || "-"}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-sm">
                    <span className="font-bold text-lg">₹{p.price.toLocaleString("en-IN")}</span>
                    {p.comparePrice && (
                      <span className="text-gray-400 line-through">₹{p.comparePrice.toLocaleString("en-IN")}</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Stock: {p.stock.toLocaleString("en-IN")}</span>
                    {p.avgRating > 0 && <span>⭐ {p.avgRating.toFixed(1)} ({p.reviewCount})</span>}
                  </div>

                  <Button
                    size="sm"
                    onClick={() => {
                      setSelectedProduct(p);
                      setPriceForm({
                        listingPrice: String(p.price),
                        comparePrice: p.comparePrice ? String(p.comparePrice) : "",
                        quantity: String(Math.min(p.stock, 50)),
                        listingSku: "",
                      });
                    }}
                    className="mt-auto"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    List for Sale
                  </Button>
                </div>
              ))
            )}
          </div>

          {/* Listing Modal */}
          {selectedProduct && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
                <div className="p-6 border-b">
                  <h2 className="text-lg font-bold">List &quot;{selectedProduct.name}&quot;</h2>
                  <p className="text-sm text-gray-500">Set your selling price and available quantity</p>
                </div>
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Your Price (₹) *</Label>
                      <Input
                        type="number"
                        value={priceForm.listingPrice}
                        onChange={(e) => setPriceForm({ ...priceForm, listingPrice: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>MRP (₹)</Label>
                      <Input
                        type="number"
                        value={priceForm.comparePrice}
                        onChange={(e) => setPriceForm({ ...priceForm, comparePrice: e.target.value })}
                        placeholder="Original price"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Your Stock *</Label>
                      <Input
                        type="number"
                        value={priceForm.quantity}
                        onChange={(e) => setPriceForm({ ...priceForm, quantity: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Your SKU</Label>
                      <Input
                        value={priceForm.listingSku}
                        onChange={(e) => setPriceForm({ ...priceForm, listingSku: e.target.value })}
                        placeholder="Supplier SKU"
                      />
                    </div>
                  </div>

                  {/* Profit Preview */}
                  <div className="bg-blue-50 rounded-lg p-3 text-sm">
                    <div className="flex justify-between">
                      <span>Your Price:</span>
                      <span className="font-medium">₹{priceForm.listingPrice || "0"}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Master Price:</span>
                      <span>₹{selectedProduct.price.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex justify-between font-medium mt-2 pt-2 border-t border-blue-200">
                      <span>Potential Margin:</span>
                      <span className="text-green-600">
                        ₹{((parseFloat(priceForm.listingPrice || "0") - selectedProduct.price)).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="p-6 border-t flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setSelectedProduct(null)}>Cancel</Button>
                  <Button onClick={handleCreateListing}>
                    <Check className="w-4 h-4 mr-1" />
                    Create Listing
                  </Button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* My Listings Tab */}
      {tab === "my-listings" && (
        <>
          <div className="flex gap-4 mb-4">
            <select
              value={listingFilter}
              onChange={(e) => setListingFilter(e.target.value)}
              className="border rounded px-3 py-2 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="DRAFT">Draft</option>
              <option value="INACTIVE">Inactive</option>
              <option value="OUT_OF_STOCK">Out of Stock</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 text-sm font-medium">Product</th>
                  <th className="text-right p-3 text-sm font-medium">Your Price</th>
                  <th className="text-right p-3 text-sm font-medium">MRP</th>
                  <th className="text-center p-3 text-sm font-medium">Qty</th>
                  <th className="text-center p-3 text-sm font-medium">Status</th>
                  <th className="text-center p-3 text-sm font-medium">Enabled</th>
                  <th className="text-center p-3 text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {myListings.length === 0 ? (
                  <tr><td colSpan={7} className="p-8 text-center text-gray-400">No listings yet. Browse catalog to add products.</td></tr>
                ) : (
                  myListings.map((l) => (
                    <tr key={l.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{l.product?.name}</div>
                        {l.listingSku && <div className="text-xs text-gray-500">SKU: {l.listingSku}</div>}
                      </td>
                      <td className="p-3 text-right font-medium">₹{Number(l.listingPrice).toLocaleString("en-IN")}</td>
                      <td className="p-3 text-right text-sm text-gray-400">
                        {l.comparePrice ? `₹${Number(l.comparePrice).toLocaleString("en-IN")}` : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="number"
                          value={l.quantity}
                          onChange={async (e) => {
                            const qty = parseInt(e.target.value) || 0;
                            await updateListingQuantity(SUPPLIER_ID, l.productId, qty);
                            setMyListings((prev) =>
                              prev.map((x) =>
                                x.id === l.id ? { ...x, quantity: qty, status: qty <= 0 ? "OUT_OF_STOCK" : "ACTIVE" } : x
                              )
                            );
                            toast.success("Quantity updated");
                          }}
                          className="w-20 text-center border rounded px-2 py-1 text-sm"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-xs px-2 py-1 rounded-full ${statusBadge(l.status)}`}>
                          {l.status}
                        </span>
                      </td>
                      <td className="p-3 text-center text-xs text-gray-500">
                        {l.enabledAt ? new Date(l.enabledAt).toLocaleDateString("en-IN") : "-"}
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {l.status === "ACTIVE" ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                await disableSupplierListing(SUPPLIER_ID, l.productId);
                                toast.success("Listing disabled");
                                loadListings();
                              }}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                if (l.quantity <= 0) {
                                  toast.error("Cannot enable: quantity is 0");
                                  return;
                                }
                                await enableSupplierListing(SUPPLIER_ID, l.productId);
                                toast.success("Listing enabled");
                                loadListings();
                              }}
                            >
                              <Check className="w-4 h-4 text-green-500" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
