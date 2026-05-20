"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllProducts } from "@/server/actions/admin-actions";
import { deleteProduct } from "@/server/actions/admin-actions";
import { getCategories } from "@/server/actions/product-actions";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

export default function AdminProductsPage() {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const limit = 20;

  const fetch = () => {
    setLoading(true);
    getAllProducts({ page, limit, search: searchTerm, category: categoryFilter, status: statusFilter })
      .then((data: any) => { setProducts(data.products); setTotal(data.total); })
      .catch((e: any) => { if (e.message === "Unauthorized") router.push("/auth/login"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page, searchTerm, categoryFilter, statusFilter]);

  useEffect(() => {
    getCategories().then(setCategories).catch(() => {});
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    try {
      await deleteProduct(id);
      toast.success("Product deleted");
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Products ({total})</h1>
        <Link href="/admin/products/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Add Product
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Search</Label>
          <div className="flex gap-2 mt-1">
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or SKU" />
            <Button onClick={() => { setPage(1); setSearchTerm(search); }}>Search</Button>
          </div>
        </div>
        <div>
          <Label>Category</Label>
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v || ""); setPage(1); }}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="All Categories" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {categories.map((c: any) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Status</Label>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v || ""); setPage(1); }}>
            <SelectTrigger className="mt-1"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              {statusOptions.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Product</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Brand</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Price</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium">SKU</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">Loading...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-500">No products found</td></tr>
            ) : (
              products.map((p: any) => (
                <tr key={p.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-blue-600">
                      {p.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{p.category?.name}</td>
                  <td className="px-4 py-3 text-sm">{p.brand?.name || "-"}</td>
                  <td className="px-4 py-3 text-sm">₹{Number(p.price).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm">
                    <span className={p.stock <= 5 ? "text-red-600 font-bold" : "text-green-600"}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">{p.sku || "-"}</td>
                  <td className="px-4 py-3">
                    <Badge className={p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}>
                      {p.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/products/${p.id}`} className="text-blue-600 hover:underline mr-3">Edit</Link>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} ({total} products)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(page - 1)} disabled={page <= 1}>
              Previous
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, totalPages - 4));
              const p = start + i;
              if (p > totalPages) return null;
              return (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(p)}
                >
                  {p}
                </Button>
              );
            })}
            <Button variant="outline" size="sm" onClick={() => setPage(page + 1)} disabled={page >= totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
