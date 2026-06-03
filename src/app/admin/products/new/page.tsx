"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, getCategories, getBrands } from "@/server/actions/product-actions";
import { getCategoryBrands } from "@/server/actions/brand-category-actions";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [categories, setCategories] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [brands, setBrands] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [filteredBrands, setFilteredBrands] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [uoms, setUoms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<string[]>([]);
  const [hasVariants, setHasVariants] = useState(false);
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([]);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [generating, _setGenerating] = useState(false);
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
    // International fields
    gtin: "", mpn: "", isbn: "", upc: "", ean: "", asin: "", unspsc: "",
    condition: "NEW", manufacturer: "", countryOfOrigin: "",
    weightGrams: "", lengthMm: "", widthMm: "", heightMm: "",
    costPrice: "", wholesalePrice: "", msrp: "", mapPrice: "",
    warrantyType: "NONE", warrantyDurationMonths: "", returnPolicy: "DAYS_30",
    ageRestriction: "NONE", safetyClass: "GENERAL", hazardClass: "NONE",
    energyRating: "NOT_RATED",
    // Food
    ingredients: "", allergens: [] as string[], dietaryFlags: [] as string[],
    halalCertified: false, kosherCertified: false, glutenFree: false, veganFriendly: false, organicCertified: false,
    // Pharma
    activeIngredient: "", dosageForm: "", strength: "", prescriptionRequired: false, genericName: "",
    // Automotive
    vehicleMake: "", vehicleModel: "", vehicleYear: "", vehicleFuelType: "",
    // Electronics
    powerConsumption: "", voltage: "", batteryType: "", batteryCapacity: "", connectivity: [] as string[],
    displaySize: "", processorType: "", ramSize: "", storageSize: "", operatingSystem: "",
    // Fashion
    material: "", fitType: "", gender: "", season: "", colorFamily: "", careInstructions: [] as string[],
    // Logistics
    shippable: true, freeShipping: false, shipsFrom: "", deliveryLeadTimeDays: "",
    coldChainRequired: false, dangerousGoods: false, lithiumBattery: false, oversized: false,
    // SEO
    metaTitle: "", metaDescription: "", videoUrl: "", googleProductCategory: "",
  });

  useEffect(() => {
    Promise.all([getCategories(), getBrands(), getAllUoms()])
      .then(([cats, brs, uoms]) => { setCategories(cats); setBrands(brs); setUoms(uoms); })
      .catch(() => router.push("/auth/login"));
  }, []);

  // Filter brands based on selected category
  useEffect(() => {
    if (!form.categoryId) { setFilteredBrands(brands); return; }
    getCategoryBrands(form.categoryId).then((mappings) => {
      if (mappings.length === 0) { setFilteredBrands(brands); return; }
      const allowedIds = new Set(mappings.map((m: { brand: { id: string } }) => m.brand.id));
      setFilteredBrands(brands.filter((b: { id: string }) => allowedIds.has(b.id)));
    }).catch(() => setFilteredBrands(brands));
  }, [form.categoryId, brands]);

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
    const _ot = optionTypes[idx];
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

  const handleSaveVariant = (_variantId: string) => {
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
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        productType: form.productType as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        taxCategory: form.taxCategory as any,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        uom: form.uom as any || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        freightClass: form.freightClass as any || undefined,
        hsCode: form.hsCode || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
        trackingType: form.trackingType as any,
        expiryDays: form.expiryDays ? parseInt(form.expiryDays) : undefined,
        digitalUrl: form.digitalUrl || undefined,
        maxDownloads: form.maxDownloads ? parseInt(form.maxDownloads) : undefined,
        subscriptionInterval: form.subscriptionInterval || undefined,
        subscriptionTrialDays: form.subscriptionTrialDays ? parseInt(form.subscriptionTrialDays) : undefined,
        // International fields
        gtin: form.gtin || undefined,
        mpn: form.mpn || undefined,
        isbn: form.isbn || undefined,
        upc: form.upc || undefined,
        ean: form.ean || undefined,
        asin: form.asin || undefined,
        unspsc: form.unspsc || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        condition: form.condition as any || undefined,
        manufacturer: form.manufacturer || undefined,
        countryOfOrigin: form.countryOfOrigin || undefined,
        weightGrams: form.weightGrams ? parseFloat(form.weightGrams) : undefined,
        lengthMm: form.lengthMm ? parseFloat(form.lengthMm) : undefined,
        widthMm: form.widthMm ? parseFloat(form.widthMm) : undefined,
        heightMm: form.heightMm ? parseFloat(form.heightMm) : undefined,
        costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
        wholesalePrice: form.wholesalePrice ? parseFloat(form.wholesalePrice) : undefined,
        msrp: form.msrp ? parseFloat(form.msrp) : undefined,
        mapPrice: form.mapPrice ? parseFloat(form.mapPrice) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        warrantyType: form.warrantyType as any || undefined,
        warrantyDurationMonths: form.warrantyDurationMonths ? parseInt(form.warrantyDurationMonths) : undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        returnPolicy: form.returnPolicy as any || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ageRestriction: form.ageRestriction as any || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        safetyClass: form.safetyClass as any || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hazardClass: form.hazardClass as any || undefined,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        energyRating: form.energyRating as any || undefined,
        ingredients: form.ingredients || undefined,
        allergens: form.allergens.length ? form.allergens : [],
        dietaryFlags: form.dietaryFlags.length ? form.dietaryFlags : [],
        halalCertified: form.halalCertified,
        kosherCertified: form.kosherCertified,
        glutenFree: form.glutenFree,
        veganFriendly: form.veganFriendly,
        organicCertified: form.organicCertified,
        activeIngredient: form.activeIngredient || undefined,
        dosageForm: form.dosageForm || undefined,
        strength: form.strength || undefined,
        prescriptionRequired: form.prescriptionRequired,
        genericName: form.genericName || undefined,
        vehicleMake: form.vehicleMake || undefined,
        vehicleModel: form.vehicleModel || undefined,
        vehicleYear: form.vehicleYear ? parseInt(form.vehicleYear) : undefined,
        vehicleFuelType: form.vehicleFuelType || undefined,
        powerConsumption: form.powerConsumption || undefined,
        voltage: form.voltage || undefined,
        batteryType: form.batteryType || undefined,
        batteryCapacity: form.batteryCapacity || undefined,
        connectivity: form.connectivity.length ? form.connectivity : [],
        displaySize: form.displaySize || undefined,
        processorType: form.processorType || undefined,
        ramSize: form.ramSize || undefined,
        storageSize: form.storageSize || undefined,
        operatingSystem: form.operatingSystem || undefined,
        material: form.material || undefined,
        fitType: form.fitType || undefined,
        gender: form.gender || undefined,
        season: form.season || undefined,
        colorFamily: form.colorFamily || undefined,
        careInstructions: form.careInstructions.length ? form.careInstructions : [],
        shippable: form.shippable,
        freeShipping: form.freeShipping,
        shipsFrom: form.shipsFrom || undefined,
        deliveryLeadTimeDays: form.deliveryLeadTimeDays ? parseInt(form.deliveryLeadTimeDays) : undefined,
        coldChainRequired: form.coldChainRequired,
        dangerousGoods: form.dangerousGoods,
        lithiumBattery: form.lithiumBattery,
        oversized: form.oversized,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        videoUrl: form.videoUrl || undefined,
        googleProductCategory: form.googleProductCategory || undefined,
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
        const _result = await generateVariants(product.id);

        // Fetch generated variants and update prices/stock
        const { getVariantsForProduct } = await import("@/server/actions/variant-actions");
        const generated = await getVariantsForProduct(product.id);

        for (const row of variantRows) {
          const variant = generated.find((v) => {
            const labels = v.options.map((o) => o.optionValue.value);
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
              discountType: dt as any,
              discountValue: row.discountValue ? parseFloat(row.discountValue) : undefined,
            });
          }
        }

        toast.success(`Created ${variantRows.length} variants`);
      }

      toast.success("Product created");
      router.push("/admin/products");
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
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
              <Select value={form.discountType} onValueChange={(v) => { if (v) setForm({ ...form, discountType: v || "NONE" }); }}>
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

        {/* Tax Estimate Preview */}
        {form.price && parseFloat(form.price) > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-xs font-semibold text-blue-700 mb-1">💰 Tax Estimate ({form.taxCategory.toLowerCase()})</p>
            <p className="text-sm text-blue-900">
              Price: ₹{parseFloat(form.price).toLocaleString("en-IN")}
              {form.taxCategory !== "BOOKS" && form.taxCategory !== "ALCOHOL" && (
                <>
                  {" "}→ Tax incl.: ₹{(parseFloat(form.price) * 1.18).toFixed(2)} (est. 18% GST)
                </>
              )}
              {(form.taxCategory === "BOOKS" || form.taxCategory === "ALCOHOL") && (
                <>
                  {" "}<span className="font-medium text-green-700">Nil-rated (0% tax)</span>
                </>
              )}
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Category *</Label>
            <Select value={form.categoryId} onValueChange={(v) => v && setForm({ ...form, categoryId: v })}>
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
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
                {filteredBrands.map((b) => (
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
              <Select value={form.productType} onValueChange={(v) => { if (v) setForm({ ...form, productType: v as any }); }}>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
              <Select value={form.taxCategory} onValueChange={(v) => { if (v) setForm({ ...form, taxCategory: v as any }); }}>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
              <Select value={form.uom} onValueChange={(v) => { if (v) setForm({ ...form, uom: v as any }); }}>
                <SelectTrigger><SelectValue placeholder="Select UOM" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {uoms.map((u) => (
                    <SelectItem key={u.code} value={u.code}>{u.name} ({u.symbol})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Freight Class</Label>
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
              <Select value={form.freightClass} onValueChange={(v) => { if (v) setForm({ ...form, freightClass: v as any }); }}>
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
              // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
              <Select value={form.trackingType} onValueChange={(v) => { if (v) setForm({ ...form, trackingType: v as any }); }}>
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any -- type assertion needed for dynamic data
                <Select value={form.subscriptionInterval} onValueChange={(v) => { if (v) setForm({ ...form, subscriptionInterval: v as any }); }}>
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

        {/* ── Advanced International Fields (Tabbed) ─────────────────── */}
        <div className="border-t pt-4">
          <h3 className="text-sm font-semibold mb-3">Advanced Product Details</h3>
          <Tabs defaultValue="identification" className="w-full">
            <TabsList className="flex flex-wrap w-full">
              <TabsTrigger value="identification">IDs</TabsTrigger>
              <TabsTrigger value="physical">Physical</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="compliance">Compliance</TabsTrigger>
              <TabsTrigger value="logistics">Logistics</TabsTrigger>
              <TabsTrigger value="food">Food</TabsTrigger>
              <TabsTrigger value="pharma">Pharma</TabsTrigger>
              <TabsTrigger value="electronics">Electronics</TabsTrigger>
              <TabsTrigger value="fashion">Fashion</TabsTrigger>
              <TabsTrigger value="automotive">Automotive</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
            </TabsList>

            <TabsContent value="identification" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>GTIN</Label><Input value={form.gtin} onChange={(e) => setForm({ ...form, gtin: e.target.value })} placeholder="Global Trade Item Number" /></div>
                <div><Label>MPN</Label><Input value={form.mpn} onChange={(e) => setForm({ ...form, mpn: e.target.value })} placeholder="Manufacturer Part Number" /></div>
                <div><Label>ISBN</Label><Input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} /></div>
                <div><Label>UPC</Label><Input value={form.upc} onChange={(e) => setForm({ ...form, upc: e.target.value })} /></div>
                <div><Label>EAN</Label><Input value={form.ean} onChange={(e) => setForm({ ...form, ean: e.target.value })} /></div>
                <div><Label>ASIN</Label><Input value={form.asin} onChange={(e) => setForm({ ...form, asin: e.target.value })} /></div>
                <div><Label>UNSPSC</Label><Input value={form.unspsc} onChange={(e) => setForm({ ...form, unspsc: e.target.value })} /></div>
                <div><Label>Manufacturer</Label><Input value={form.manufacturer} onChange={(e) => setForm({ ...form, manufacturer: e.target.value })} /></div>
                <div><Label>Country of Origin</Label><Input value={form.countryOfOrigin} onChange={(e) => setForm({ ...form, countryOfOrigin: e.target.value })} placeholder="ISO code e.g. IN" /></div>
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={form.condition} onValueChange={(v) => v && setForm({ ...form, condition: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NEW">New</SelectItem>
                    <SelectItem value="LIKE_NEW">Like New</SelectItem>
                    <SelectItem value="OPEN_BOX">Open Box</SelectItem>
                    <SelectItem value="REFURBISHED">Refurbished</SelectItem>
                    <SelectItem value="CERTIFIED_REFURBISHED">Certified Refurbished</SelectItem>
                    <SelectItem value="USED_EXCELLENT">Used - Excellent</SelectItem>
                    <SelectItem value="USED_GOOD">Used - Good</SelectItem>
                    <SelectItem value="USED_FAIR">Used - Fair</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="physical" className="space-y-3 pt-3">
              <div className="grid grid-cols-4 gap-3">
                <div><Label>Weight (g)</Label><Input type="number" value={form.weightGrams} onChange={(e) => setForm({ ...form, weightGrams: e.target.value })} /></div>
                <div><Label>Length (mm)</Label><Input type="number" value={form.lengthMm} onChange={(e) => setForm({ ...form, lengthMm: e.target.value })} /></div>
                <div><Label>Width (mm)</Label><Input type="number" value={form.widthMm} onChange={(e) => setForm({ ...form, widthMm: e.target.value })} /></div>
                <div><Label>Height (mm)</Label><Input type="number" value={form.heightMm} onChange={(e) => setForm({ ...form, heightMm: e.target.value })} /></div>
              </div>
            </TabsContent>

            <TabsContent value="pricing" className="space-y-3 pt-3">
              <div className="grid grid-cols-4 gap-3">
                <div><Label>Cost Price</Label><Input type="number" value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} /></div>
                <div><Label>Wholesale Price</Label><Input type="number" value={form.wholesalePrice} onChange={(e) => setForm({ ...form, wholesalePrice: e.target.value })} /></div>
                <div><Label>MSRP</Label><Input type="number" value={form.msrp} onChange={(e) => setForm({ ...form, msrp: e.target.value })} /></div>
                <div><Label>MAP Price</Label><Input type="number" value={form.mapPrice} onChange={(e) => setForm({ ...form, mapPrice: e.target.value })} /></div>
              </div>
            </TabsContent>

            <TabsContent value="compliance" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Age Restriction</Label>
                  <Select value={form.ageRestriction} onValueChange={(v) => v && setForm({ ...form, ageRestriction: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="AGE_12_PLUS">12+</SelectItem>
                      <SelectItem value="AGE_16_PLUS">16+</SelectItem>
                      <SelectItem value="AGE_18_PLUS">18+</SelectItem>
                      <SelectItem value="AGE_21_PLUS">21+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Safety Class</Label>
                  <Select value={form.safetyClass} onValueChange={(v) => v && setForm({ ...form, safetyClass: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GENERAL">General</SelectItem>
                      <SelectItem value="CE_MARKED">CE Marked</SelectItem>
                      <SelectItem value="FCC_APPROVED">FCC Approved</SelectItem>
                      <SelectItem value="UL_LISTED">UL Listed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Hazard Class</Label>
                  <Select value={form.hazardClass} onValueChange={(v) => v && setForm({ ...form, hazardClass: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="CLASS_3_FLAMMABLE_LIQUIDS">Flammable Liquids</SelectItem>
                      <SelectItem value="CLASS_6_TOXINS">Toxins</SelectItem>
                      <SelectItem value="CLASS_8_CORROSIVES">Corrosives</SelectItem>
                      <SelectItem value="CLASS_9_MISC_DANGEROUS">Misc Dangerous</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Warranty</Label>
                  <Select value={form.warrantyType} onValueChange={(v) => v && setForm({ ...form, warrantyType: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">None</SelectItem>
                      <SelectItem value="MANUFACTURER">Manufacturer</SelectItem>
                      <SelectItem value="SELLER">Seller</SelectItem>
                      <SelectItem value="EXTENDED">Extended</SelectItem>
                      <SelectItem value="LIFETIME">Lifetime</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Warranty (months)</Label><Input type="number" value={form.warrantyDurationMonths} onChange={(e) => setForm({ ...form, warrantyDurationMonths: e.target.value })} /></div>
                <div>
                  <Label>Return Policy</Label>
                  <Select value={form.returnPolicy} onValueChange={(v) => v && setForm({ ...form, returnPolicy: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NO_RETURN">No Return</SelectItem>
                      <SelectItem value="DAYS_7">7 Days</SelectItem>
                      <SelectItem value="DAYS_14">14 Days</SelectItem>
                      <SelectItem value="DAYS_30">30 Days</SelectItem>
                      <SelectItem value="DAYS_90">90 Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Energy Rating</Label>
                <Select value={form.energyRating} onValueChange={(v) => v && setForm({ ...form, energyRating: v })}>
                  <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NOT_RATED">Not Rated</SelectItem>
                    <SelectItem value="A_PLUS_PLUS_PLUS">A+++</SelectItem>
                    <SelectItem value="A_PLUS_PLUS">A++</SelectItem>
                    <SelectItem value="A_PLUS">A+</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                    <SelectItem value="B">B</SelectItem>
                    <SelectItem value="C">C</SelectItem>
                    <SelectItem value="ENERGY_STAR">Energy Star</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="logistics" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Ships From</Label><Input value={form.shipsFrom} onChange={(e) => setForm({ ...form, shipsFrom: e.target.value })} placeholder="Warehouse/Country" /></div>
                <div><Label>Lead Time (days)</Label><Input type="number" value={form.deliveryLeadTimeDays} onChange={(e) => setForm({ ...form, deliveryLeadTimeDays: e.target.value })} /></div>
              </div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.shippable} onChange={(e) => setForm({ ...form, shippable: e.target.checked })} /> Shippable</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.freeShipping} onChange={(e) => setForm({ ...form, freeShipping: e.target.checked })} /> Free Shipping</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.oversized} onChange={(e) => setForm({ ...form, oversized: e.target.checked })} /> Oversized</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.coldChainRequired} onChange={(e) => setForm({ ...form, coldChainRequired: e.target.checked })} /> Cold Chain</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.dangerousGoods} onChange={(e) => setForm({ ...form, dangerousGoods: e.target.checked })} /> Dangerous Goods</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.lithiumBattery} onChange={(e) => setForm({ ...form, lithiumBattery: e.target.checked })} /> Lithium Battery</label>
              </div>
            </TabsContent>

            <TabsContent value="food" className="space-y-3 pt-3">
              <div><Label>Ingredients</Label><Textarea value={form.ingredients} onChange={(e) => setForm({ ...form, ingredients: e.target.value })} rows={2} /></div>
              <div><Label>Allergens (comma-separated)</Label><Input value={form.allergens.join(", ")} onChange={(e) => setForm({ ...form, allergens: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="gluten, nuts, dairy" /></div>
              <div><Label>Dietary Flags (comma-separated)</Label><Input value={form.dietaryFlags.join(", ")} onChange={(e) => setForm({ ...form, dietaryFlags: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="vegan, keto, gluten-free" /></div>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.veganFriendly} onChange={(e) => setForm({ ...form, veganFriendly: e.target.checked })} /> Vegan</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.organicCertified} onChange={(e) => setForm({ ...form, organicCertified: e.target.checked })} /> Organic</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.glutenFree} onChange={(e) => setForm({ ...form, glutenFree: e.target.checked })} /> Gluten Free</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.halalCertified} onChange={(e) => setForm({ ...form, halalCertified: e.target.checked })} /> Halal</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={form.kosherCertified} onChange={(e) => setForm({ ...form, kosherCertified: e.target.checked })} /> Kosher</label>
              </div>
            </TabsContent>

            <TabsContent value="pharma" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Active Ingredient</Label><Input value={form.activeIngredient} onChange={(e) => setForm({ ...form, activeIngredient: e.target.value })} /></div>
                <div><Label>Dosage Form</Label><Input value={form.dosageForm} onChange={(e) => setForm({ ...form, dosageForm: e.target.value })} placeholder="tablet, capsule, syrup" /></div>
                <div><Label>Strength</Label><Input value={form.strength} onChange={(e) => setForm({ ...form, strength: e.target.value })} placeholder="500mg" /></div>
                <div><Label>Generic Name</Label><Input value={form.genericName} onChange={(e) => setForm({ ...form, genericName: e.target.value })} /></div>
              </div>
              <label className="flex items-center gap-2"><input type="checkbox" checked={form.prescriptionRequired} onChange={(e) => setForm({ ...form, prescriptionRequired: e.target.checked })} /> Prescription Required</label>
            </TabsContent>

            <TabsContent value="electronics" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Power</Label><Input value={form.powerConsumption} onChange={(e) => setForm({ ...form, powerConsumption: e.target.value })} placeholder="65W" /></div>
                <div><Label>Voltage</Label><Input value={form.voltage} onChange={(e) => setForm({ ...form, voltage: e.target.value })} placeholder="100-240V" /></div>
                <div><Label>Battery Type</Label><Input value={form.batteryType} onChange={(e) => setForm({ ...form, batteryType: e.target.value })} placeholder="Li-ion" /></div>
                <div><Label>Battery Capacity</Label><Input value={form.batteryCapacity} onChange={(e) => setForm({ ...form, batteryCapacity: e.target.value })} placeholder="5000mAh" /></div>
                <div><Label>Display Size</Label><Input value={form.displaySize} onChange={(e) => setForm({ ...form, displaySize: e.target.value })} placeholder="6.7 inches" /></div>
                <div><Label>Processor</Label><Input value={form.processorType} onChange={(e) => setForm({ ...form, processorType: e.target.value })} /></div>
                <div><Label>RAM</Label><Input value={form.ramSize} onChange={(e) => setForm({ ...form, ramSize: e.target.value })} placeholder="16GB" /></div>
                <div><Label>Storage</Label><Input value={form.storageSize} onChange={(e) => setForm({ ...form, storageSize: e.target.value })} placeholder="512GB" /></div>
                <div><Label>OS</Label><Input value={form.operatingSystem} onChange={(e) => setForm({ ...form, operatingSystem: e.target.value })} /></div>
              </div>
              <div><Label>Connectivity (comma-separated)</Label><Input value={form.connectivity.join(", ")} onChange={(e) => setForm({ ...form, connectivity: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="WiFi 6, Bluetooth 5.3, USB-C" /></div>
            </TabsContent>

            <TabsContent value="fashion" className="space-y-3 pt-3">
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Material</Label><Input value={form.material} onChange={(e) => setForm({ ...form, material: e.target.value })} placeholder="100% cotton" /></div>
                <div><Label>Fit Type</Label><Input value={form.fitType} onChange={(e) => setForm({ ...form, fitType: e.target.value })} placeholder="regular, slim, relaxed" /></div>
                <div>
                  <Label>Gender</Label>
                  <Select value={form.gender} onValueChange={(v) => v && setForm({ ...form, gender: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                      <SelectItem value="kids">Kids</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Season</Label><Input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} placeholder="summer, winter, all-season" /></div>
                <div><Label>Color Family</Label><Input value={form.colorFamily} onChange={(e) => setForm({ ...form, colorFamily: e.target.value })} /></div>
              </div>
              <div><Label>Care Instructions (comma-separated)</Label><Input value={form.careInstructions.join(", ")} onChange={(e) => setForm({ ...form, careInstructions: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })} placeholder="Machine wash cold, Do not bleach" /></div>
            </TabsContent>

            <TabsContent value="automotive" className="space-y-3 pt-3">
              <div className="grid grid-cols-4 gap-3">
                <div><Label>Make</Label><Input value={form.vehicleMake} onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })} /></div>
                <div><Label>Model</Label><Input value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} /></div>
                <div><Label>Year</Label><Input type="number" value={form.vehicleYear} onChange={(e) => setForm({ ...form, vehicleYear: e.target.value })} /></div>
                <div><Label>Fuel Type</Label><Input value={form.vehicleFuelType} onChange={(e) => setForm({ ...form, vehicleFuelType: e.target.value })} placeholder="petrol, diesel, electric" /></div>
              </div>
            </TabsContent>

            <TabsContent value="seo" className="space-y-3 pt-3">
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Meta Title</Label><Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} /></div>
                <div><Label>Google Product Category</Label><Input value={form.googleProductCategory} onChange={(e) => setForm({ ...form, googleProductCategory: e.target.value })} /></div>
              </div>
              <div><Label>Meta Description</Label><Textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} rows={2} /></div>
              <div><Label>Video URL</Label><Input value={form.videoUrl} onChange={(e) => setForm({ ...form, videoUrl: e.target.value })} placeholder="https://youtube.com/..." /></div>
            </TabsContent>
          </Tabs>
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
                              <span>₹{parseFloat(v.price).toLocaleString("en-IN")}</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right">
                            {isEditing ? (
                              <Input value={v.comparePrice} onChange={(e) => setVariantRows(prev => prev.map(r => r.id === v.id ? { ...r, comparePrice: e.target.value } : r))} className="h-8 w-20 ml-auto" placeholder="Compare" type="number" />
                            ) : (
                              <span className="text-xs text-gray-500">{v.comparePrice ? `₹${parseFloat(v.comparePrice).toLocaleString("en-IN")}` : "—"}</span>
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
