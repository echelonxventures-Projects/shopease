"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, getProduct, getCategories, getBrands } from "@/server/actions/product-actions";
import { getAllUoms } from "@/server/actions/product-catalog-actions";
import {
  createOptionType, createOptionValue, generateVariants, getOptionTypes,
  upsertVariant, deleteVariant,
} from "@/server/actions/variant-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, X, RefreshCw, Edit, Check } from "lucide-react";
import { ImageUploader } from "@/components/admin/ImageUploader";

interface OptionValue {
  id: string;
  value: string;
  hexColor: string | null;
  optionTypeId: string;
}

interface OptionType {
  id: string;
  name: string;
  label: string;
  values: OptionValue[];
}

interface VariantRow {
  id: string;
  options: string[];
  price: string;
  comparePrice: string;
  stock: string;
  sku: string;
  discountType: string;
  discountValue: string;
}

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [uoms, setUoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [generating, setGenerating] = useState(false);
  const [editingVariant, setEditingVariant] = useState<string | null>(null);
  const [variantRows, setVariantRows] = useState<VariantRow[]>([]);

  const [form, setForm] = useState({
    name: "", shortDesc: "", description: "", price: "", comparePrice: "",
    categoryId: "", brandId: "", stock: "", sku: "", tags: "",
    discountType: "NONE", discountValue: "", offerStartDate: "", offerEndDate: "",
    isActive: true, isFeatured: false,
    productType: "PHYSICAL",
    taxCategory: "STANDARD",
    uom: "",
    freightClass: "",
    hsCode: "",
    trackingType: "NONE",
    expiryDays: "",
    digitalUrl: "",
    maxDownloads: "",
    subscriptionInterval: "",
    subscriptionTrialDays: "",
    barcodeInput: "",
    barcodes: [] as string[],
  });

  useEffect(() => {
    Promise.all([getCategories(), getBrands(), getAllUoms()])
      .then(([cats, brs, uoms]) => { setCategories(cats); setBrands(brs); setUoms(uoms); })
      .catch(() => router.push("/auth/login"));
  }, []);

  const handleAddOptionType = () => {
    if (!newTypeName) { toast.error("Option type name required"); return; }
    setOptionTypes(prev => [...prev, { id: `temp-${Date.now()}`, name: newTypeName, label: newTypeLabel || newTypeName, values: [] }]);
    setNewTypeName("");
    setNewTypeLabel("");
  };

  const handleDeleteOptionType = (idx: number) => {
    setOptionTypes(prev => prev.filter((_, i) => i !== idx));
  };

  const handleAddValue = (idx: number) => {
    const ot = optionTypes[idx];
    const value = prompt("Value name (e.g., 128GB, Blue):");
    if (!value) return;
    const hexColor = prompt("Hex color (optional, e.g., #000000):") || undefined;
    setOptionTypes(prev => prev.map((o, i) => i === idx ? {
      ...o,
      values: [...o.values, { id: `temp-val-${Date.now()}`, value, hexColor: hexColor || null, optionTypeId: o.id }],
    } : o));
  };

  const handleDeleteValue = (otIdx: number, valIdx: number) => {
    setOptionTypes(prev => prev.map((o, i) => i === otIdx ? {
      ...o, values: o.values.filter((_, j) => j !== valIdx),
    } : o));
  };

  const handleGenerate = () => {
    const totalCombinations = optionTypes.reduce((acc, ot) => acc * ot.values.length, 1);
    if (totalCombinations > 100) { toast.error("Maximum 100 variant combinations"); return; }

    // Compute cartesian product
    const allValues = optionTypes.map(ot => ot.values);
    const combinations = allValues.reduce(
      (acc: OptionValue[][], vals: OptionValue[]) =>
        acc.flatMap((combo: OptionValue[]) => vals.map((v: OptionValue) => [...combo, v])),
      [[]]
    );

    const basePrice = parseFloat(form.price) || 0;
    const rows: VariantRow[] = combinations.map((combo, i) => ({
      id: `var-${i}`,
      options: combo.map(v => v.value),
      price: basePrice.toString(),
      comparePrice: "",
      stock: "0",
      sku: "",
      discountType: "NONE",
      discountValue: "",
    }));

    setVariantRows(rows);
    toast.success(`Generated ${combinations.length} variant combinations`);
  };

  const handleSaveVariant = (variantId: string) => {
    setEditingVariant(null);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price || !form.categoryId) { toast.error("Name, price, and category are required"); return; }
    setLoading(true);
    try {
      const discountType = form.discountType;
      let comparePriceVal = form.comparePrice ? parseFloat(form.comparePrice) : undefined;

      if (discountType === "PERCENTAGE" && form.discountValue && !comparePriceVal) {
        comparePriceVal = parseFloat(form.price) / (1 - parseFloat(form.discountValue) / 100);
      } else if (discountType === "FLAT" && form.discountValue && !comparePriceVal) {
        comparePriceVal = parseFloat(form.price) + parseFloat(form.discountValue);
      }

      const product = await createProduct({
        name: form.name,
        shortDesc: form.shortDesc || undefined,
        description: form.description || undefined,
        price: parseFloat(form.price),
        comparePrice: comparePriceVal,
        discountType: discountType === "NONE" ? undefined : discountType,
        discountValue: discountType === "NONE" ? undefined : (form.discountValue ? parseFloat(form.discountValue) : undefined),
        offerStartDate: form.offerStartDate ? new Date(form.offerStartDate) : undefined,
        offerEndDate: form.offerEndDate ? new Date(form.offerEndDate) : undefined,
        categoryId: form.categoryId,
        brandId: form.brandId || undefined,
        stock: parseInt(form.stock) || 0,
        sku: form.sku || undefined,
        tags: form.tags,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        images: images,
        barcodes: form.barcodes,
        isSnappable: false,
        productType: form.productType as any,
        taxCategory: form.taxCategory as any,
        uom: form.uom as any || undefined,
        freightClass: form.freightClass as any || undefined,
        hsCode: form.hsCode || undefined,
        trackingType: form.trackingType as any,
        expiryDays: form.expiryDays ? parseInt(form.expiryDays) : undefined,
        digitalUrl: form.digitalUrl || undefined,
        maxDownloads: form.maxDownloads ? parseInt(form.maxDownloads) : undefined,
        subscriptionInterval: form.subscriptionInterval || undefined,
        subscriptionTrialDays: form.subscriptionTrialDays ? parseInt(form.subscriptionTrialDays) : undefined,
      });

      // If variants were configured, create them
      if (hasVariants && optionTypes.length > 0 && variantRows.length > 0) {
        const createdOptionTypes: { id: string; name: string }[] = [];

        for (const ot of optionTypes) {
          const created = await createOptionType(product.id, { name: ot.name, label: ot.label || undefined });
          createdOptionTypes.push({ id: created.id, name: ot.name });

          for (const val of ot.values) {
            await createOptionValue(created.id, { value: val.value, hexColor: val.hexColor || undefined });
          }
        }

        // Generate variants
        const result = await generateVariants(product.id);

        // Fetch generated variants and update prices/stock
        const { getVariantsForProduct } = await import("@/server/actions/variant-actions");
        const generated = await getVariantsForProduct(product.id);

        for (const row of variantRows) {
          const variant = generated.find((v: any) => {
            const labels = v.options.map((o: any) => o.optionValue.value);
            return JSON.stringify(labels.sort()) === JSON.stringify(row.options.sort());
          });

          if (variant) {
            const dt = row.discountType && row.discountType !== "NONE" ? row.discountType : undefined;
            await upsertVariant({
              id: variant.id,
              productId: product.id,
              price: parseFloat(row.price) || 0,
              stock: parseInt(row.stock) || 0,
              sku: row.sku || undefined,
              comparePrice: row.comparePrice ? parseFloat(row.comparePrice) : undefined,
              discountType: dt as any,
              discountValue: row.discountValue ? parseFloat(row.discountValue) : undefined,
            });
          }
        }

        toast.success(`Created ${variantRows.length} variants`);
      }

      toast.success("Product created");
      router.push("/admin/products");
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const totalCombinations = optionTypes.length > 0
    ? optionTypes.reduce((acc, ot) => acc * Math.max(ot.values.length, 1), 1)
    : 0;

  return (
    <div className="p-6">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/admin/products")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Products
      </Button>
      <h1 className="text-2xl font-bold mb-6">Add New Product</h1>

      {/* Base Product Form */}
      <div className="bg-white rounded-lg shadow p-6 max-w-2xl space-y-4">
        <div><Label>Product Name *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div><Label>Short Description</Label><Input value={form.shortDesc} onChange={(e) => setForm({ ...form, shortDesc: e.target.value })} /></div>
        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} /></div>
        <div>
          <Label>Product Images</Label>
          <ImageUploader images={images} onChange={setImages} />
        </div>

        {/* Variant Toggle */}
        <div className="border-t pt-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasVariants}
              onChange={(e) => setHasVariants(e.target.checked)}
              className="w-5 h-5 text-blue-600 rounded"
            />
            <div>
              <span className="font-semibold text-gray-700">This product has variants</span>
              <p className="text-xs text-gray-500">Enable to add options like size, color, storage, etc.</p>
            </div>
          </label>
        </div>

        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Discount & Offers</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Discount Type</Label>
              <Select value={form.discountType} onValueChange={(v) => setForm({ ...form, discountType: v || "NONE" })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                  <SelectItem value="FLAT">Flat (₹)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Discount Value</Label>
              <Input type="number" value={form.discountValue}
                onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                placeholder={form.discountType === "PERCENTAGE" ? "e.g. 20" : form.discountType === "FLAT" ? "e.g. 500" : ""} />
            </div>
            <div>
              <Label>Offer Start Date</Label>
              <Input type="datetime-local" value={form.offerStartDate}
                onChange={(e) => setForm({ ...form, offerStartDate: e.target.value })} />
            </div>
            <div>
              <Label>Offer End Date</Label>
              <Input type="datetime-local" value={form.offerEndDate}
                onChange={(e) => setForm({ ...form, offerEndDate: e.target.value })} />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">Leave all empty for no discount. When dates are set, discount only shows during the active window.</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div><Label>Base Price *</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
          <div><Label>Compare Price</Label><Input type="number" value={form.comparePrice} onChange={(e) => setForm({ ...form, comparePrice: e.target.value })} /></div>
          <div><Label>Base Stock</Label><Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} /></div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Category *</Label>
            <Select value={form.categoryId} onValueChange={(v) => v && setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c: any) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Brand</Label>
            <Select value={form.brandId} onValueChange={(v) => v && setForm({ ...form, brandId: v })}>
              <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No brand</SelectItem>
                {brands.map((b: any) => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div><Label>SKU</Label><Input value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} /></div>
        <div><Label>Tags (comma separated)</Label><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="electronics, phone, 5g" /></div>

        {/* Product Type */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Product Type & Catalog</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Product Type</Label>
              <Select value={form.productType} onValueChange={(v) => setForm({ ...form, productType: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="PHYSICAL">Physical</SelectItem>
                  <SelectItem value="DIGITAL">Digital</SelectItem>
                  <SelectItem value="SUBSCRIPTION">Subscription</SelectItem>
                  <SelectItem value="SERVICE">Service</SelectItem>
                  <SelectItem value="BUNDLE">Bundle</SelectItem>
                  <SelectItem value="COMBO">Combo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tax Category</Label>
              <Select value={form.taxCategory} onValueChange={(v) => setForm({ ...form, taxCategory: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="FOOD">Food</SelectItem>
                  <SelectItem value="BOOKS">Books</SelectItem>
                  <SelectItem value="PHARMA">Pharma</SelectItem>
                  <SelectItem value="CLOTHING">Clothing</SelectItem>
                  <SelectItem value="LUXURY">Luxury</SelectItem>
                  <SelectItem value="ALCOHOL">Alcohol</SelectItem>
                  <SelectItem value="TOBACCO">Tobacco</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Unit of Measure</Label>
              <Select value={form.uom} onValueChange={(v) => setForm({ ...form, uom: v as any })}>
                <SelectTrigger><SelectValue placeholder="Select UOM" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {uoms.map((u: any) => (
                    <SelectItem key={u.code} value={u.code}>{u.name} ({u.symbol})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Freight Class</Label>
              <Select value={form.freightClass} onValueChange={(v) => setForm({ ...form, freightClass: v as any })}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="STANDARD">Standard</SelectItem>
                  <SelectItem value="OVERSIZED">Oversized</SelectItem>
                  <SelectItem value="FRAGILE">Fragile</SelectItem>
                  <SelectItem value="HAZARDOUS">Hazardous</SelectItem>
                  <SelectItem value="PERISHABLE">Perishable</SelectItem>
                  <SelectItem value="REFRIGERATED">Refrigerated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tracking Type</Label>
              <Select value={form.trackingType} onValueChange={(v) => setForm({ ...form, trackingType: v as any })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">None</SelectItem>
                  <SelectItem value="SERIAL">Serial</SelectItem>
                  <SelectItem value="LOT">Lot</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>HS Code</Label><Input value={form.hsCode} onChange={(e) => setForm({ ...form, hsCode: e.target.value })} placeholder="Harmonized code" /></div>
          </div>

          {/* Conditional: Digital */}
          {form.productType === "DIGITAL" && (
            <div className="grid grid-cols-2 gap-4 mt-4 p-3 bg-blue-50 rounded-lg">
              <div><Label>Digital Download URL</Label><Input value={form.digitalUrl} onChange={(e) => setForm({ ...form, digitalUrl: e.target.value })} placeholder="/downloads/file.pdf" /></div>
              <div><Label>Max Downloads</Label><Input type="number" value={form.maxDownloads} onChange={(e) => setForm({ ...form, maxDownloads: e.target.value })} placeholder="5" /></div>
            </div>
          )}

          {/* Conditional: Subscription */}
          {form.productType === "SUBSCRIPTION" && (
            <div className="grid grid-cols-3 gap-4 mt-4 p-3 bg-green-50 rounded-lg">
              <div>
                <Label>Interval</Label>
                <Select value={form.subscriptionInterval} onValueChange={(v) => setForm({ ...form, subscriptionInterval: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="week">Week</SelectItem>
                    <SelectItem value="month">Month</SelectItem>
                    <SelectItem value="year">Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Trial Days</Label><Input type="number" value={form.subscriptionTrialDays} onChange={(e) => setForm({ ...form, subscriptionTrialDays: e.target.value })} placeholder="0" /></div>
              <div></div>
            </div>
          )}

          {/* Conditional: Perishable/Perishable */}
          {(form.trackingType === "LOT" || form.freightClass === "PERISHABLE") && (
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div><Label>Expiry Days</Label><Input type="number" value={form.expiryDays} onChange={(e) => setForm({ ...form, expiryDays: e.target.value })} placeholder="Number of days until expiry" /></div>
            </div>
          )}

          {/* Barcodes */}
          <div className="mt-4">
            <Label>Barcodes</Label>
            <div className="flex gap-2">
              <Input value={form.barcodeInput} onChange={(e) => setForm({ ...form, barcodeInput: e.target.value })} placeholder="Scan or type barcode" onKeyDown={(e) => {
                if (e.key === "Enter" && form.barcodeInput.trim()) {
                  setForm({ ...form, barcodes: [...form.barcodes, form.barcodeInput.trim()], barcodeInput: "" });
                }
              }} />
              <Button type="button" variant="outline" onClick={() => {
                if (form.barcodeInput.trim()) {
                  setForm({ ...form, barcodes: [...form.barcodes, form.barcodeInput.trim()], barcodeInput: "" });
                }
              }}>Add</Button>
            </div>
            {form.barcodes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {form.barcodes.map((bc, i) => (
                  <Badge key={i} variant="secondary" className="flex items-center gap-1">
                    {bc}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => setForm({ ...form, barcodes: form.barcodes.filter((_, j) => j !== i) })} />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} /> Active
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} /> Featured
          </label>
        </div>

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Creating..." : "Create Product"}
        </Button>
      </div>

      {/* Variant Builder */}
      {hasVariants && (
        <div className="bg-white rounded-lg shadow p-6 max-w-4xl mt-6">
          <h2 className="text-lg font-bold mb-2">Product Variants</h2>
          <p className="text-sm text-gray-500 mb-6">
            Define option types (e.g., Storage, Color, Size), then generate all variant combinations.
          </p>

          {/* Option Types */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Option Types</h3>
            <div className="flex gap-2 mb-4">
              <Input
                placeholder="Name (e.g., Storage, Color, Size)"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                className="flex-1"
              />
              <Input
                placeholder="Label (optional, e.g., RAM Size)"
                value={newTypeLabel}
                onChange={(e) => setNewTypeLabel(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleAddOptionType} disabled={!newTypeName}>
                <Plus className="w-4 h-4 mr-1" /> Add Type
              </Button>
            </div>

            {optionTypes.length === 0 ? (
              <p className="text-sm text-gray-400 py-4">No option types yet. Add one above to get started.</p>
            ) : (
              <div className="space-y-4">
                {optionTypes.map((ot, otIdx) => (
                  <div key={ot.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">
                        {ot.label}
                        <span className="text-xs text-gray-400 ml-2">({ot.name})</span>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteOptionType(otIdx)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {ot.values.map((val, valIdx) => (
                        <div key={val.id} className="flex items-center gap-2 bg-gray-50 border rounded-lg px-3 py-1.5">
                          {val.hexColor && (
                            <span className="w-4 h-4 rounded-full border" style={{ backgroundColor: val.hexColor }} />
                          )}
                          <span className="text-sm">{val.value}</span>
                          <button onClick={() => handleDeleteValue(otIdx, valIdx)} className="text-gray-400 hover:text-red-500">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => handleAddValue(otIdx)}
                        className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                      >
                        <Plus className="w-3 h-3" /> Add Value
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {optionTypes.length > 0 && (
              <div className="flex items-center gap-4 mt-4">
                <p className="text-sm text-gray-600">
                  {optionTypes.length} type{optionTypes.length > 1 ? "s" : ""} × {totalCombinations} combination{totalCombinations !== 1 ? "s" : ""}
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={generating || totalCombinations === 0}
                  variant="default"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${generating ? "animate-spin" : ""}`} />
                  {generating ? "Generating..." : "Generate Variants"}
                </Button>
              </div>
            )}
          </div>

          {/* Variants Table */}
          {variantRows.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold mb-3">
                Variant Combinations ({variantRows.length})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left py-2 px-3">Options</th>
                      <th className="text-left py-2 px-3">SKU</th>
                      <th className="text-right py-2 px-3">Price</th>
                      <th className="text-right py-2 px-3">Compare Price</th>
                      <th className="text-right py-2 px-3">Discount</th>
                      <th className="text-right py-2 px-3">Val</th>
                      <th className="text-right py-2 px-3">Stock</th>
                      <th className="py-2 px-3 w-24"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {variantRows.map((v) => {
                      const isEditing = editingVariant === v.id;
                      return (
                        <tr key={v.id} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-3 font-medium">{v.options.join(" · ")}</td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <Input value={v.sku} onChange={(e) => setVariantRows(prev => prev.map(r => r.id === v.id ? { ...r, sku: e.target.value } : r))} className="h-8 w-28" placeholder="SKU" />
                            ) : (
                              <span className="text-xs text-gray-500">{v.sku || "—"}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <Input value={v.price} onChange={(e) => setVariantRows(prev => prev.map(r => r.id === v.id ? { ...r, price: e.target.value } : r))} className="h-8 w-20 ml-auto" placeholder="Price" type="number" />
                            ) : (
                              <span>₹{parseFloat(v.price).toLocaleString()}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <Input value={v.comparePrice} onChange={(e) => setVariantRows(prev => prev.map(r => r.id === v.id ? { ...r, comparePrice: e.target.value } : r))} className="h-8 w-20 ml-auto" placeholder="Compare" type="number" />
                            ) : (
                              <span className="text-xs text-gray-500">{v.comparePrice ? `₹${parseFloat(v.comparePrice).toLocaleString()}` : "—"}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <select value={v.discountType} onChange={(e) => setVariantRows(prev => prev.map(r => r.id === v.id ? { ...r, discountType: e.target.value } : r))} className="h-8 w-24 text-xs border rounded px-1">
                                <option value="NONE">No Discount</option>
                                <option value="PERCENTAGE">% Off</option>
                                <option value="FLAT">Flat ₹</option>
                              </select>
                            ) : (
                              <span className="text-xs text-gray-500">
                                {v.discountType === "PERCENTAGE" ? `${v.discountValue}%` : v.discountType === "FLAT" ? `₹${v.discountValue}` : "—"}
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <Input value={v.discountValue} onChange={(e) => setVariantRows(prev => prev.map(r => r.id === v.id ? { ...r, discountValue: e.target.value } : r))} className="h-8 w-16 ml-auto" placeholder="Val" type="number" />
                            ) : (
                              <span className="text-xs text-gray-500">{v.discountValue || "—"}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <Input value={v.stock} onChange={(e) => setVariantRows(prev => prev.map(r => r.id === v.id ? { ...r, stock: e.target.value } : r))} className="h-8 w-16 ml-auto" placeholder="Stock" type="number" />
                            ) : (
                              <span className={parseInt(v.stock) <= 0 ? "text-red-600" : ""}>{v.stock}</span>
                            )}
                          </td>
                          <td className="py-2 px-3">
                            {isEditing ? (
                              <Button size="sm" variant="ghost" onClick={() => handleSaveVariant(v.id)}>
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setEditingVariant(v.id)}>
                                <Edit className="w-3.5 h-3.5 text-gray-400" />
                              </Button>
                            )}
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
      )}
    </div>
  );
}
