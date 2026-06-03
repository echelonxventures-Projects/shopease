"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getOptionTypes,
  createOptionType,
  deleteOptionType,
  createOptionValue,
  deleteOptionValue,
  generateVariants,
  getVariantsForProduct,
  upsertVariant,
  deleteVariant,
} from "@/server/actions/variant-actions";
import { getProduct } from "@/server/actions/product-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ArrowLeft, Plus, Trash2, X, RefreshCw, Edit, Check, Save } from "lucide-react";

interface OptionValue { id: string; value: string; hexColor: string | null; image: string | null; sortOrder: number; }
interface OptionType { id: string; name: string; label: string | null; sortOrder: number; values: OptionValue[]; }
interface Variant {
  id: string; sku: string | null; price: number; comparePrice: number | null;
  discountType: string; discountValue: number | null; stock: number;
  weight: string | null; images: string[]; isActive: boolean;
  options: { optionValue: { value: string; optionType: { name: string } } }[];
}

export default function VariantsPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;

  const [productName, setProductName] = useState("");
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([]);
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: "", stock: "", sku: "", comparePrice: "", discountType: "NONE", discountValue: "" });

  // New option type form
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeLabel, setNewTypeLabel] = useState("");
  // New value input per option type
  const [newValueInputs, setNewValueInputs] = useState<Record<string, string>>({});
  const [newColorInputs, setNewColorInputs] = useState<Record<string, string>>({});

  useEffect(() => { loadAll(); }, [productId]);

  async function loadAll() {
    setLoading(true);
    try {
      const [product, ots, vars] = await Promise.all([
        getProduct(productId),
        getOptionTypes(productId),
        getVariantsForProduct(productId),
      ]);
      setProductName(product?.name || "Product");
      setOptionTypes(ots as OptionType[]);
      setVariants(vars as unknown as Variant[]);
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  }

  async function handleAddOptionType() {
    if (!newTypeName.trim()) { toast.error("Name required"); return; }
    try {
      await createOptionType(productId, { name: newTypeName, label: newTypeLabel || undefined });
      setNewTypeName(""); setNewTypeLabel("");
      toast.success("Option type added");
      loadAll();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleDeleteOptionType(id: string) {
    if (!confirm("Delete this option type and all its values?")) return;
    try { await deleteOptionType(id); toast.success("Deleted"); loadAll(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleAddValue(optionTypeId: string) {
    const value = newValueInputs[optionTypeId]?.trim();
    if (!value) { toast.error("Value required"); return; }
    const hexColor = newColorInputs[optionTypeId]?.trim() || undefined;
    try {
      await createOptionValue(optionTypeId, { value, hexColor });
      setNewValueInputs(p => ({ ...p, [optionTypeId]: "" }));
      setNewColorInputs(p => ({ ...p, [optionTypeId]: "" }));
      toast.success("Value added");
      loadAll();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleDeleteValue(id: string) {
    try { await deleteOptionValue(id); toast.success("Deleted"); loadAll(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleGenerate() {
    if (!confirm("This will regenerate all variants. Existing variant data (prices, stock) will be reset. Continue?")) return;
    setGenerating(true);
    try {
      const result = await generateVariants(productId);
      toast.success(`Generated ${result.count} variants`);
      loadAll();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
    finally { setGenerating(false); }
  }

  function startEdit(v: Variant) {
    setEditingId(v.id);
    setEditForm({
      price: v.price.toString(), stock: v.stock.toString(), sku: v.sku || "",
      comparePrice: v.comparePrice?.toString() || "", discountType: v.discountType || "NONE",
      discountValue: v.discountValue?.toString() || "",
    });
  }

  async function handleSaveVariant(v: Variant) {
    try {
      await upsertVariant({
        id: v.id, productId,
        price: parseFloat(editForm.price) || 0,
        stock: parseInt(editForm.stock) || 0,
        sku: editForm.sku || undefined,
        comparePrice: editForm.comparePrice ? parseFloat(editForm.comparePrice) : undefined,
        discountType: editForm.discountType !== "NONE" ? editForm.discountType as "PERCENTAGE" | "FLAT" : undefined,
        discountValue: editForm.discountValue ? parseFloat(editForm.discountValue) : undefined,
      });
      setEditingId(null);
      toast.success("Variant saved");
      loadAll();
    } catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  async function handleDeleteVariant(id: string) {
    if (!confirm("Delete this variant?")) return;
    try { await deleteVariant(id); toast.success("Deleted"); loadAll(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Failed"); }
  }

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading variants...</p></div>;

  return (
    <div className="p-6 max-w-5xl">
      <Button variant="ghost" className="mb-4" onClick={() => router.push(`/admin/products/${productId}`)}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Product
      </Button>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Variant Management</h1>
        <p className="text-sm text-gray-500">Product: {productName}</p>
      </div>

      {/* ── Option Types ─────────────────────────────────────────── */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Option Types</h2>
        <p className="text-sm text-gray-500 mb-4">Define attributes like Color, Size, Storage, Material, etc.</p>

        {/* Add new option type */}
        <div className="flex gap-2 mb-6">
          <Input placeholder="Name (e.g. Color, Size)" value={newTypeName} onChange={(e) => setNewTypeName(e.target.value)} className="flex-1" />
          <Input placeholder="Label (optional)" value={newTypeLabel} onChange={(e) => setNewTypeLabel(e.target.value)} className="flex-1" />
          <Button onClick={handleAddOptionType} disabled={!newTypeName.trim()}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>

        {optionTypes.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No option types yet. Add one above.</p>
        ) : (
          <div className="space-y-4">
            {optionTypes.map((ot) => (
              <div key={ot.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="font-medium">{ot.label || ot.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({ot.name})</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteOptionType(ot.id)} className="text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>

                {/* Values */}
                <div className="flex flex-wrap gap-2 mb-3">
                  {ot.values.map((val) => (
                    <div key={val.id} className="flex items-center gap-1.5 bg-gray-50 border rounded-lg px-3 py-1.5">
                      {val.hexColor && <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: val.hexColor }} />}
                      <span className="text-sm">{val.value}</span>
                      <button onClick={() => handleDeleteValue(val.id)} className="text-gray-400 hover:text-red-500 ml-1">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add value */}
                <div className="flex gap-2">
                  <Input
                    placeholder="Value (e.g. Red, XL, 128GB)"
                    value={newValueInputs[ot.id] || ""}
                    onChange={(e) => setNewValueInputs(p => ({ ...p, [ot.id]: e.target.value }))}
                    className="flex-1"
                    onKeyDown={(e) => { if (e.key === "Enter") handleAddValue(ot.id); }}
                  />
                  <Input
                    placeholder="Color hex (optional)"
                    value={newColorInputs[ot.id] || ""}
                    onChange={(e) => setNewColorInputs(p => ({ ...p, [ot.id]: e.target.value }))}
                    className="w-32"
                  />
                  <Button variant="outline" size="sm" onClick={() => handleAddValue(ot.id)}>
                    <Plus className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Generate button */}
        {optionTypes.length > 0 && optionTypes.every(ot => ot.values.length > 0) && (
          <div className="mt-6 flex items-center gap-4 border-t pt-4">
            <p className="text-sm text-gray-600">
              {optionTypes.reduce((acc, ot) => acc * ot.values.length, 1)} possible combinations
            </p>
            <Button onClick={handleGenerate} disabled={generating}>
              <RefreshCw className={`w-4 h-4 mr-1 ${generating ? "animate-spin" : ""}`} />
              {generating ? "Generating..." : "Generate Variants"}
            </Button>
          </div>
        )}
      </div>

      {/* ── Variants Table ────────────────────────────────────────── */}
      {variants.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Variants ({variants.length})</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left py-2 px-3">Options</th>
                  <th className="text-left py-2 px-3">SKU</th>
                  <th className="text-right py-2 px-3">Price</th>
                  <th className="text-right py-2 px-3">Compare</th>
                  <th className="text-right py-2 px-3">Discount</th>
                  <th className="text-right py-2 px-3">Stock</th>
                  <th className="text-center py-2 px-3">Status</th>
                  <th className="py-2 px-3 w-28"></th>
                </tr>
              </thead>
              <tbody>
                {variants.map((v) => {
                  const isEditing = editingId === v.id;
                  const optionLabel = v.options.map(o => o.optionValue.value).join(" · ");
                  return (
                    <tr key={v.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{optionLabel}</td>
                      <td className="py-2 px-3">
                        {isEditing ? <Input value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })} className="h-8 w-28" /> : <span className="text-gray-500">{v.sku || "—"}</span>}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isEditing ? <Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="h-8 w-24 ml-auto" /> : `₹${Number(v.price).toLocaleString("en-IN")}`}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isEditing ? <Input type="number" value={editForm.comparePrice} onChange={(e) => setEditForm({ ...editForm, comparePrice: e.target.value })} className="h-8 w-24 ml-auto" /> : <span className="text-gray-400">{v.comparePrice ? `₹${Number(v.comparePrice).toLocaleString("en-IN")}` : "—"}</span>}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isEditing ? (
                          <div className="flex gap-1 justify-end">
                            <select value={editForm.discountType} onChange={(e) => setEditForm({ ...editForm, discountType: e.target.value })} className="h-8 text-xs border rounded px-1">
                              <option value="NONE">—</option>
                              <option value="PERCENTAGE">%</option>
                              <option value="FLAT">₹</option>
                            </select>
                            {editForm.discountType !== "NONE" && <Input type="number" value={editForm.discountValue} onChange={(e) => setEditForm({ ...editForm, discountValue: e.target.value })} className="h-8 w-16" />}
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            {v.discountType === "PERCENTAGE" ? `${v.discountValue}%` : v.discountType === "FLAT" ? `₹${v.discountValue}` : "—"}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right">
                        {isEditing ? <Input type="number" value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} className="h-8 w-20 ml-auto" /> : <span className={Number(v.stock) <= 0 ? "text-red-600 font-medium" : ""}>{v.stock}</span>}
                      </td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant={v.isActive ? "default" : "secondary"}>{v.isActive ? "Active" : "Inactive"}</Badge>
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1 justify-end">
                          {isEditing ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleSaveVariant(v)}><Check className="w-4 h-4 text-green-600" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-4 h-4" /></Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => startEdit(v)}><Edit className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDeleteVariant(v.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
