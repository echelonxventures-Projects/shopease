"use client";

import { useState, useEffect } from "react";
import {
  getMasterProducts,
  getMasterCategories,
  createMasterProduct,
  updateMasterProduct,
  checkProductDuplicate,
} from "@/server/actions/product-master-actions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { Search, Plus, AlertTriangle, Package, Edit, Eye } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  stock: number;
  masterStatus: string;
  masterCategory?: string;
  isActive: boolean;
  category?: { name: string };
  brand?: { name: string };
  tags: string[];
  avgRating: number;
  reviewCount: number;
  createdAt: string;
}

export default function MasterCatalogPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showCreate, setShowCreate] = useState(false);

  const perPage = 20;

  async function loadProducts() {
    setLoading(true);
    try {
      const res = await getMasterProducts({ search, category, status, sort, page, limit: perPage });
      setProducts(res.products);
      setTotal(res.total);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadProducts(); }, [search, category, status, sort, page]);

  useEffect(() => {
    getMasterCategories().then(setCategories);
  }, []);

  const statusColor = (s: string) => {
    switch (s) {
      case "ACTIVE": return "bg-green-100 text-green-800";
      case "DRAFT": return "bg-yellow-100 text-yellow-800";
      case "ARCHIVED": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6" />
            Product Master Catalog
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {total} products • Central catalog that suppliers select from to list for sale
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Product
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="pl-10"
            />
          </div>
        </div>
        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DRAFT">Draft</option>
          <option value="ARCHIVED">Archived</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border rounded px-3 py-2 text-sm"
        >
          <option value="newest">Newest</option>
          <option value="name">Name A-Z</option>
          <option value="price_asc">Price: Low</option>
          <option value="price_desc">Price: High</option>
          <option value="rating">Top Rated</option>
        </select>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left p-3 text-sm font-medium">Product</th>
              <th className="text-left p-3 text-sm font-medium">Category</th>
              <th className="text-right p-3 text-sm font-medium">Price</th>
              <th className="text-center p-3 text-sm font-medium">Stock</th>
              <th className="text-center p-3 text-sm font-medium">Rating</th>
              <th className="text-center p-3 text-sm font-medium">Status</th>
              <th className="text-center p-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={7} className="p-8 text-center text-gray-400">No products found</td></tr>
            ) : (
              products.map((p) => (
                <tr key={p.id} className="border-b hover:bg-gray-50">
                  <td className="p-3">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-gray-500">{p.slug}</div>
                  </td>
                  <td className="p-3 text-sm">
                    <div>{p.category?.name || "-"}</div>
                    {p.masterCategory && <div className="text-xs text-gray-500">{p.masterCategory}</div>}
                  </td>
                  <td className="p-3 text-right text-sm font-medium">
                    ₹{p.price.toLocaleString("en-IN")}
                    {p.comparePrice && (
                      <span className="text-xs text-gray-400 line-through ml-1">
                        ₹{p.comparePrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center text-sm">{p.stock.toLocaleString("en-IN")}</td>
                  <td className="p-3 text-center text-sm">
                    {p.avgRating > 0 ? `${p.avgRating.toFixed(1)} (${p.reviewCount})` : "-"}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColor(p.masterStatus)}`}>
                      {p.masterStatus}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const newStatus = p.masterStatus === "ACTIVE" ? "ARCHIVED" : "ACTIVE";
                          await updateMasterProduct(p.id, { masterStatus: newStatus });
                          toast.success(`Status changed to ${newStatus}`);
                          loadProducts();
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > perPage && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">
            Page {page} of {Math.ceil(total / perPage)}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Prev
            </Button>
            <Button variant="outline" size="sm" disabled={page >= Math.ceil(total / perPage)} onClick={() => setPage(page + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && <CreateProductModal onClose={() => setShowCreate(false)} onSuccess={() => { setShowCreate(false); loadProducts(); }} />}
    </div>
  );
}

function CreateProductModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({
    name: "", slug: "", description: "", shortDesc: "", price: "", comparePrice: "",
    categoryId: "", brandId: "", stock: "", tags: "", images: "", sku: "",
    masterCategory: "", productType: "PHYSICAL", taxCategory: "STANDARD",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [_checking, setChecking] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((f) => ({ ...f, slug: form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-+$/, "") }));
  }, [form.name]);

  async function checkDup() {
    if (!form.name && !form.sku) return;
    setChecking(true);
    try {
      const res = await checkProductDuplicate({ name: form.name, sku: form.sku });
      setDuplicates(res.duplicates);
    } catch {} finally {
      setChecking(false);
    }
  }

  async function handleSave() {
    if (!form.name || !form.price || !form.categoryId) {
      toast.error("Name, price, and category are required");
      return;
    }
    if (duplicates.length > 0) {
      toast.error("Cannot create: duplicate product exists");
      return;
    }
    setSaving(true);
    try {
      await createMasterProduct({
        name: form.name,
        slug: form.slug,
        description: form.description,
        shortDesc: form.shortDesc,
        price: parseFloat(form.price),
        comparePrice: form.comparePrice ? parseFloat(form.comparePrice) : undefined,
        categoryId: form.categoryId,
        stock: parseInt(form.stock) || 0,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()) : [],
        sku: form.sku || undefined,
        masterCategory: form.masterCategory || undefined,
        productType: form.productType,
        taxCategory: form.taxCategory,
      });
      toast.success("Product added to master catalog");
      onSuccess();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-auto">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold">Add to Master Catalog</h2>
        </div>
        <div className="p-6 space-y-4">
          {/* Duplicates Warning */}
          {duplicates.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-red-800">Duplicate found!</div>
                <div className="text-xs text-red-600 mt-1">
                  &ldquo;{form.name}&rdquo; already exists as &ldquo;{duplicates[0].name}&rdquo; (slug: {duplicates[0].slug})
                </div>
              </div>
            </div>
          )}

          <div>
            <Label>Product Name *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} onBlur={checkDup} />
          </div>
          <div>
            <Label>Slug (auto-generated)</Label>
            <Input value={form.slug} readOnly className="bg-gray-50" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Price (₹) *</Label>
              <Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </div>
            <div>
              <Label>Compare Price (₹)</Label>
              <Input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Category *</Label>
              <select
                value={form.categoryId}
                onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                <option value="smartphones">Smartphones</option>
                <option value="laptops">Laptops</option>
                <option value="audio">Audio</option>
                <option value="fashion">Fashion</option>
                <option value="footwear">Footwear</option>
                <option value="home-kitchen">Home & Kitchen</option>
                <option value="grocery">Grocery</option>
                <option value="beauty">Beauty</option>
                <option value="sports">Sports</option>
                <option value="books">Books</option>
                <option value="toys-games">Toys & Games</option>
              </select>
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Master Category</Label>
              <select value={form.masterCategory} onChange={(e) => setForm({ ...form, masterCategory: e.target.value })} className="w-full border rounded px-3 py-2 text-sm">
                <option value="">None</option>
                <option value="electronics">Electronics</option>
                <option value="fashion">Fashion</option>
                <option value="home-kitchen">Home & Kitchen</option>
                <option value="grocery">Grocery</option>
                <option value="beauty">Beauty</option>
                <option value="sports">Sports</option>
                <option value="books">Books</option>
                <option value="toys-games">Toys & Games</option>
              </select>
            </div>
            <div>
              <Label>SKU</Label>
              <Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} onBlur={checkDup} />
            </div>
          </div>
          <div>
            <Label>Tags (comma-separated)</Label>
            <Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="e.g. smartphone, 5g, apple" />
          </div>
          <div>
            <Label>Description</Label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full border rounded px-3 py-2 text-sm h-20"
            />
          </div>
        </div>
        <div className="p-6 border-t flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={saving || duplicates.length > 0}>
            {saving ? "Saving..." : "Add to Catalog"}
          </Button>
        </div>
      </div>
    </div>
  );
}
