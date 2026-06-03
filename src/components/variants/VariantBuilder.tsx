"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getOptionTypes, createOptionType, deleteOptionType,
  createOptionValue, deleteOptionValue, bulkAddOptionValues,
  generateVariants, upsertVariant, deleteVariant, getVariantsForProduct,
  bulkUpdateVariants, bulkUpdateVariantPrices, autoGenerateSKUs,
  setVariantImages, setDefaultVariant, bulkDeleteVariants,
  duplicateVariant, reorderOptionValues, getVariantsWithFilters,
  exportVariantsCSV, importVariantsCSV,
} from "@/server/actions/variant-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { DiscountType } from "@prisma/client";
import {
  Plus, Trash2, RefreshCw, X, Edit, Check, Image,
  Search, Filter, Eye, EyeOff, Download, Upload,
  Settings, LayoutGrid, List, FolderTree, ChevronLeft,
  ChevronRight, Copy, BarChart3, ArrowUp, ArrowDown,
  GripVertical, Palette, Type, Hash, Tag,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

interface OptionValue {
  id: string; value: string; hexColor: string | null; image: string | null;
  sortOrder: number;
}
interface OptionType {
  id: string; name: string; label: string | null; sortOrder: number;
  values: OptionValue[];
}
interface Variant {
  id: string; sku: string | null; isDefault: boolean; price: number;
  comparePrice: number | null; discountType: DiscountType;
  discountValue: number | null; stock: number; weight: string | null;
  images: string[]; isActive: boolean; barcodes: string[];
  options: { optionValue: OptionValue & { optionType: { name: string } } }[];
}

type TabId = "options" | "variants" | "rules" | "import-export";
type ViewMode = "table" | "grid" | "grouped";
type StatusFilter = "all" | "active" | "inactive" | "out-of-stock";
type BulkPriceOp = "add" | "subtract" | "multiply" | "set";

// ─── Main Container ──────────────────────────────────────────────────────────

export function VariantBuilder({ productId }: { productId: string }) {
  const [activeTab, setActiveTab] = useState<TabId>("options");
  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 max-w-6xl mt-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" /> Product Variants
          </h2>
          <p className="text-sm text-gray-500 mt-1">Configure options, manage variants, set rules, and bulk import</p>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 mb-6 bg-gray-50 p-1 rounded-lg">
        {([
          { id: "options" as TabId, icon: Type, label: "Options" },
          { id: "variants" as TabId, icon: List, label: "Variants" },
          { id: "rules" as TabId, icon: Settings, label: "Rules" },
          { id: "import-export" as TabId, icon: Download, label: "Import/Export" },
        ]).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-medium transition-all flex-1 justify-center ${
              activeTab === tab.id
                ? "bg-white text-blue-700 shadow-sm border border-gray-200"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "options" && <OptionsTab productId={productId} />}
      {activeTab === "variants" && <VariantsTab productId={productId} />}
      {activeTab === "rules" && <RulesTab productId={productId} />}
      {activeTab === "import-export" && <ImportExportTab productId={productId} />}
    </div>
  );
}

// ─── Options Tab ─────────────────────────────────────────────────────────────

function OptionsTab({ productId }: { productId: string }) {
  const [optionTypes, setOptionTypes] = useState<OptionType[]>([]);
  const [_loading, setLoading] = useState(true);
  const [newTypeName, setNewTypeName] = useState("");
  const [newTypeLabel, setNewTypeLabel] = useState("");
  const [bulkValues, setBulkValues] = useState<string>("");
  const [bulkTypeId, setBulkTypeId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const types = await getOptionTypes(productId);
      setOptionTypes(types);
    } catch { toast.error("Failed to load options"); }
    finally { setLoading(false); }
  }, [productId]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleAddType = async () => {
    if (!newTypeName) { toast.error("Option type name required"); return; }
    try {
      const created = await createOptionType(productId, { name: newTypeName, label: newTypeLabel || undefined });
      setOptionTypes((prev) => [...prev, { ...created, values: [] }]);
      setNewTypeName(""); setNewTypeLabel("");
      toast.success(`Option type "${newTypeName}" added`);
    } catch { toast.error("Failed to add option type"); }
  };

  const handleAddValue = async (optionTypeId: string, value: string, hexColor?: string) => {
    try {
      const created = await createOptionValue(optionTypeId, { value, hexColor });
      setOptionTypes((prev) => prev.map((ot) =>
        ot.id === optionTypeId ? { ...ot, values: [...ot.values, created] } : ot
      ));
      toast.success("Value added");
    } catch { toast.error("Failed to add value"); }
  };

  const handleBulkAddValues = async (optionTypeId: string) => {
    const values = bulkValues.trim().split("\n").map(v => v.trim()).filter(Boolean);
    if (values.length === 0) { toast.error("Enter at least one value"); return; }
    try {
      await bulkAddOptionValues(optionTypeId, values.map(v => ({ value: v })));
      await loadData();
      setBulkValues(""); setBulkTypeId(null);
      toast.success(`Added ${values.length} values`);
    } catch { toast.error("Failed to bulk add values"); }
  };

  const handleDeleteValue = async (optionTypeId: string, valueId: string) => {
    try {
      await deleteOptionValue(valueId);
      setOptionTypes((prev) => prev.map((ot) =>
        ot.id === optionTypeId ? { ...ot, values: ot.values.filter((v) => v.id !== valueId) } : ot
      ));
    } catch { toast.error("Failed to delete"); }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Delete this option type and all its values?")) return;
    try {
      await deleteOptionType(id);
      setOptionTypes((prev) => prev.filter((ot) => ot.id !== id));
      toast.success("Option type deleted");
    } catch { toast.error("Failed to delete"); }
  };

  const totalCombinations = optionTypes.length > 0
    ? optionTypes.reduce((acc, ot) => acc * Math.max(ot.values.length, 1), 1)
    : 0;

  return (
    <div>
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Plus className="w-4 h-4 text-blue-600" /> Add Option Type
        </h3>
        <div className="flex gap-2">
          <Input placeholder="Name (e.g., Color, Size, Storage)" value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)} className="flex-1" />
          <Input placeholder="Label (optional, e.g., RAM Size)" value={newTypeLabel}
            onChange={(e) => setNewTypeLabel(e.target.value)} className="flex-1" />
          <Button onClick={handleAddType} disabled={!newTypeName}>
            <Plus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      {optionTypes.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <Type className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>No option types yet. Add one above to start building variants.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {optionTypes.map((ot) => (
            <div key={ot.id} className="border rounded-xl p-4 space-y-3 bg-gray-50/50 hover:bg-gray-50 transition">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-gray-300 cursor-grab" />
                  <div>
                    <span className="font-semibold">{ot.label || ot.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({ot.name})</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleDeleteType(ot.id)}>
                  <Trash2 className="w-3.5 h-3.5 text-red-500" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ot.values.map((v) => (
                  <div key={v.id} className="flex items-center gap-2 bg-white border rounded-lg px-3 py-1.5 shadow-sm">
                    {v.hexColor && (
                      <span className="w-4 h-4 rounded-full border-2 border-gray-200" style={{ backgroundColor: v.hexColor }} />
                    )}
                    <span className="text-sm">{v.value}</span>
                    <button onClick={() => handleDeleteValue(ot.id, v.id)} className="text-gray-300 hover:text-red-500 transition">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 items-center">
                <button type="button" onClick={() => {
                  const value = prompt("Value name (e.g., Red, XL, 128GB):");
                  if (!value) return;
                  const hexColor = prompt("Hex color (optional, e.g., #FF0000):") || undefined;
                  handleAddValue(ot.id, value, hexColor);
                }} className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700">
                  <Plus className="w-3 h-3" /> Add Value
                </button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={() => setBulkTypeId(bulkTypeId === ot.id ? null : ot.id)}
                  className="flex items-center gap-1 text-sm text-purple-600 hover:text-purple-700">
                  <Hash className="w-3 h-3" /> Bulk Add
                </button>
              </div>
              {bulkTypeId === ot.id && (
                <div className="bg-white rounded-lg p-3 border">
                  <Label className="text-xs">Paste values (one per line)</Label>
                  <textarea value={bulkValues} onChange={(e) => setBulkValues(e.target.value)}
                    placeholder="Red&#10;Green&#10;Blue&#10;Yellow"
                    className="w-full h-24 p-2 text-sm border rounded-md mt-1 font-mono" />
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleBulkAddValues(ot.id)}>
                      Add {bulkValues.trim().split("\n").filter(Boolean).length} values
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => { setBulkTypeId(null); setBulkValues(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {optionTypes.length > 0 && (
        <div className="flex items-center justify-between mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
          <div>
            <p className="text-sm text-blue-700 font-medium">
              {optionTypes.length} type{optionTypes.length > 1 ? "s" : ""} × {totalCombinations} combination{totalCombinations !== 1 ? "s" : ""}
            </p>
            {optionTypes.map((ot) => (
              <p key={ot.id} className="text-xs text-blue-500 mt-1">
                {ot.label || ot.name}: {ot.values.map(v => v.value).join(", ")}
              </p>
            ))}
          </div>
          <GenerateButton productId={productId} onComplete={loadData} />
        </div>
      )}
    </div>
  );
}

function GenerateButton({ productId, onComplete }: { productId: string; onComplete: () => void }) {
  const [generating, setGenerating] = useState(false);
  const handleGenerate = async () => {
    if (!confirm("Generate all variant combinations? This will replace existing variants.")) return;
    setGenerating(true);
    try {
      const result = await generateVariants(productId);
      toast.success(`Generated ${result.count} variants`);
      onComplete();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Failed to generate"); }
    finally { setGenerating(false); }
  };
  return (
    <Button onClick={handleGenerate} disabled={generating}>
      <RefreshCw className={`w-4 h-4 mr-1 ${generating ? "animate-spin" : ""}`} />
      {generating ? "Generating..." : "Generate Variants"}
    </Button>
  );
}

// ─── Variants Tab ────────────────────────────────────────────────────────────

function VariantsTab({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ price: "", stock: "", sku: "", comparePrice: "", discountType: "NONE", discountValue: "" });
  const [bulkPriceOp, setBulkPriceOp] = useState<BulkPriceOp>("add");
  const [bulkPriceVal, setBulkPriceVal] = useState("");
  const [imageModal, setImageModal] = useState<string | null>(null);
  const [imageInput, setImageInput] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getVariantsWithFilters(productId, {
        search, status: statusFilter !== "all" ? statusFilter : undefined,
        sortBy: sortBy as "price" | "stock" | "sku" | "createdAt", sortOrder, page, pageSize,
      });
      setVariants(result.variants.map((v) => ({
        ...v,
        price: Number(v.price), comparePrice: v.comparePrice ? Number(v.comparePrice) : null,
        discountValue: v.discountValue ? Number(v.discountValue) : null,
      } as unknown as Variant)));
      setTotal(result.total); setTotalPages(result.totalPages);
    } catch { toast.error("Failed to load variants"); }
    finally { setLoading(false); }
  }, [productId, search, statusFilter, sortBy, sortOrder, page, pageSize]);

  useEffect(() => { loadData(); }, [loadData]);

  const stats = {
    total: variants.length,
    avgPrice: variants.length ? Math.round(variants.reduce((s, v) => s + v.price, 0) / variants.length) : 0,
    totalStock: variants.reduce((s, v) => s + v.stock, 0),
    outOfStock: variants.filter(v => v.stock <= 0).length,
    active: variants.filter(v => v.isActive).length,
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === variants.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(variants.map(v => v.id)));
    }
  };

  const handleBulkEdit = async (field: string, value: string | number | boolean) => {
    if (selectedIds.size === 0) return;
    try {
      await bulkUpdateVariants([...selectedIds], { [field]: value });
      toast.success(`Updated ${selectedIds.size} variants`);
      setSelectedIds(new Set());
      loadData();
    } catch { toast.error("Bulk update failed"); }
  };

  const handleBulkPrice = async () => {
    if (selectedIds.size === 0 || !bulkPriceVal) return;
    try {
      await bulkUpdateVariantPrices([...selectedIds], bulkPriceOp, parseFloat(bulkPriceVal));
      toast.success(`Price updated for ${selectedIds.size} variants`);
      setBulkPriceVal("");
      loadData();
    } catch { toast.error("Bulk price update failed"); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} variants?`)) return;
    try {
      await bulkDeleteVariants([...selectedIds]);
      toast.success("Variants deleted");
      setSelectedIds(new Set());
      loadData();
    } catch { toast.error("Failed to delete"); }
  };

  const handleSaveVariant = async (id: string) => {
    try {
      await upsertVariant({
        id, productId,
        price: parseFloat(editForm.price) || 0,
        stock: parseInt(editForm.stock) || 0,
        sku: editForm.sku || undefined,
        comparePrice: editForm.comparePrice ? parseFloat(editForm.comparePrice) : undefined,
        discountType: editForm.discountType !== "NONE" ? editForm.discountType as DiscountType : undefined,
        discountValue: editForm.discountValue ? parseFloat(editForm.discountValue) : undefined,
      });
      setEditingId(null);
      toast.success("Variant updated");
      loadData();
    } catch { toast.error("Failed to update"); }
  };

  const handleImageSave = async (variantId: string) => {
    const images = imageInput.split(",").map(s => s.trim()).filter(Boolean);
    try {
      await setVariantImages(variantId, images);
      setImageModal(null);
      toast.success("Images updated");
      loadData();
    } catch { toast.error("Failed to update images"); }
  };

  const handleDuplicate = async (id: string) => {
    try {
      await duplicateVariant(id);
      toast.success("Variant duplicated");
      loadData();
    } catch { toast.error("Failed to duplicate"); }
  };

  const optionLabels = (v: Variant) => v.options.map(o => o.optionValue.value).join(" · ");

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  // ── Stats Cards ──
  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {[
          { label: "Total", value: stats.total, color: "blue" },
          { label: "Avg Price", value: `₹${stats.avgPrice}`, color: "green" },
          { label: "Total Stock", value: stats.totalStock.toLocaleString("en-IN"), color: "purple" },
          { label: "Out of Stock", value: stats.outOfStock, color: "red" },
          { label: "Active", value: stats.active, color: "emerald" },
        ].map((s) => (
          <div key={s.label} className={`p-3 rounded-lg bg-${s.color}-50 border border-${s.color}-200`}>
            <div className="text-xs text-gray-500">{s.label}</div>
            <div className={`text-xl font-bold text-${s.color}-700`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-blue-700">{selectedIds.size} selected</span>
          <div className="h-5 w-px bg-blue-300" />
          <select className="h-8 text-sm border rounded px-2"
            onChange={(e) => {
              if (e.target.value === "delete") return handleBulkDelete();
              if (e.target.value === "activate") return handleBulkEdit("isActive", true);
              if (e.target.value === "deactivate") return handleBulkEdit("isActive", false);
            }}>
            <option value="">Bulk action...</option>
            <option value="activate">Activate</option>
            <option value="deactivate">Deactivate</option>
            <option value="delete">Delete</option>
          </select>
          <select value={bulkPriceOp} onChange={(e) => setBulkPriceOp(e.target.value as BulkPriceOp)}
            className="h-8 text-sm border rounded px-2">
            <option value="add">+ Add</option>
            <option value="subtract">− Subtract</option>
            <option value="multiply">× Multiply</option>
            <option value="set">= Set to</option>
          </select>
          <Input type="number" value={bulkPriceVal} onChange={(e) => setBulkPriceVal(e.target.value)}
            className="h-8 w-24" placeholder="Value" />
          <Button size="sm" onClick={handleBulkPrice}>Apply Price</Button>
          <Button size="sm" variant="outline" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9 h-9" placeholder="Search by SKU..." />
        </div>
        <Button size="sm" variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters(!showFilters)}>
          <Filter className="w-4 h-4 mr-1" /> Filter
        </Button>
        <div className="flex border rounded-lg overflow-hidden">
          {([
            { mode: "table" as ViewMode, icon: List },
            { mode: "grid" as ViewMode, icon: LayoutGrid },
            { mode: "grouped" as ViewMode, icon: FolderTree },
          ]).map((m) => (
            <button key={m.mode} onClick={() => setViewMode(m.mode)}
              className={`p-2 ${viewMode === m.mode ? "bg-blue-100 text-blue-700" : "text-gray-400 hover:text-gray-600"}`}>
              <m.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg flex gap-3 items-center flex-wrap">
          <Label className="text-sm">Status:</Label>
          <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value as StatusFilter); setPage(1); }}
            className="h-8 text-sm border rounded px-2">
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
          <Label className="text-sm">Page size:</Label>
          <select value={pageSize} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
            className="h-8 text-sm border rounded px-2">
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && (
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left py-2.5 px-3 w-8">
                  <input type="checkbox" checked={selectedIds.size === variants.length && variants.length > 0}
                    onChange={toggleSelectAll} className="rounded" />
                </th>
                {[
                  { key: "sku", label: "SKU" },
                  { key: "price", label: "Price" },
                  { key: "stock", label: "Stock" },
                  { key: "createdAt", label: "Created" },
                ].map((col) => (
                  <th key={col.key} className="text-left py-2.5 px-3 cursor-pointer hover:bg-gray-100 select-none"
                    onClick={() => handleSort(col.key)}>
                    <div className="flex items-center gap-1">
                      {col.label}
                      {sortBy === col.key && (sortOrder === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />)}
                    </div>
                  </th>
                ))}
                <th className="text-left py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 w-32">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">Loading...</td></tr>
              ) : variants.length === 0 ? (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No variants found</td></tr>
              ) : (
                variants.map((v) => {
                  const isEditing = editingId === v.id;
                  return (
                    <tr key={v.id} className={`border-b hover:bg-gray-50 ${selectedIds.has(v.id) ? "bg-blue-50" : ""}`}>
                      <td className="py-2 px-3">
                        <input type="checkbox" checked={selectedIds.has(v.id)}
                          onChange={() => toggleSelect(v.id)} className="rounded" />
                      </td>
                      <td className="py-2 px-3 font-medium">{optionLabels(v)}</td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <Input value={editForm.sku} onChange={(e) => setEditForm({ ...editForm, sku: e.target.value })}
                            className="h-8 w-28" placeholder="SKU" />
                        ) : (
                          <span className="text-xs text-gray-500 font-mono">{v.sku || "—"}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <div className="flex gap-1">
                            <Input value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })}
                              className="h-8 w-20" placeholder="Price" type="number" />
                            <Input value={editForm.comparePrice} onChange={(e) => setEditForm({ ...editForm, comparePrice: e.target.value })}
                              className="h-8 w-20" placeholder="Compare" type="number" />
                            <select value={editForm.discountType} onChange={(e) => setEditForm({ ...editForm, discountType: e.target.value })}
                              className="h-8 w-24 text-xs border rounded px-1">
                              <option value="NONE">No Discount</option>
                              <option value="PERCENTAGE">% Off</option>
                              <option value="FLAT">Flat ₹</option>
                            </select>
                            <Input value={editForm.discountValue} onChange={(e) => setEditForm({ ...editForm, discountValue: e.target.value })}
                              className="h-8 w-16" placeholder="Val" type="number" />
                          </div>
                        ) : (
                          <span>₹{v.price.toLocaleString("en-IN")}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {isEditing ? (
                          <Input value={editForm.stock} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })}
                            className="h-8 w-16" placeholder="Stock" type="number" />
                        ) : (
                          <span className={v.stock <= 0 ? "text-red-600 font-bold" : ""}>{v.stock}</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        <Badge variant={v.isActive ? "default" : "secondary"}>
                          {v.isActive ? "Active" : "Inactive"}
                        </Badge>
                        {v.isDefault && <Badge className="ml-1 bg-yellow-100 text-yellow-700">Default</Badge>}
                      </td>
                      <td className="py-2 px-3">
                        <div className="flex gap-1 justify-end">
                          {isEditing ? (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => handleSaveVariant(v.id)}>
                                <Check className="w-3.5 h-3.5 text-green-600" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                <X className="w-3.5 h-3.5 text-gray-400" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => {
                                setEditingId(v.id);
                                setEditForm({
                                  price: v.price.toString(), stock: v.stock.toString(),
                                  sku: v.sku || "", comparePrice: v.comparePrice?.toString() || "",
                                  discountType: v.discountType || "NONE",
                                  discountValue: v.discountValue?.toString() || "",
                                });
                              }}><Edit className="w-3.5 h-3.5 text-gray-400" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => {
                                setImageModal(v.id);
                                setImageInput(v.images.join(","));
                              }}><Image className="w-3.5 h-3.5 text-gray-400" aria-label="Edit images" /></Button>
                              <Button size="sm" variant="ghost" onClick={() => handleDuplicate(v.id)}>
                                <Copy className="w-3.5 h-3.5 text-gray-400" />
                              </Button>
                              <Button size="sm" variant="ghost" onClick={async () => {
                                if (!confirm("Delete variant?")) return;
                                await deleteVariant(v.id); loadData(); toast.success("Deleted");
                              }}><Trash2 className="w-3.5 h-3.5 text-red-400" /></Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Grid View */}
      {viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {variants.map((v) => (
            <div key={v.id} className={`border rounded-xl p-4 hover:shadow-md transition cursor-pointer ${selectedIds.has(v.id) ? "ring-2 ring-blue-500" : ""}`}
              onClick={() => toggleSelect(v.id)}>
              <div className="flex items-start justify-between mb-2">
                <div className="font-medium text-sm">{optionLabels(v)}</div>
                <div className="flex gap-1">
                  <Badge variant={v.isActive ? "default" : "secondary"} className="text-xs">{v.isActive ? "Active" : "Inactive"}</Badge>
                  {v.isDefault && <Badge className="text-xs bg-yellow-100 text-yellow-700">★</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                <div><span className="font-medium">Price:</span> ₹{v.price.toLocaleString("en-IN")}</div>
                <div><span className="font-medium">Stock:</span> <span className={v.stock <= 0 ? "text-red-600 font-bold" : ""}>{v.stock}</span></div>
                <div className="col-span-2"><span className="font-medium">SKU:</span> <span className="font-mono">{v.sku || "—"}</span></div>
              </div>
              {v.images.length > 0 && (
                <div className="flex gap-1 mt-2">
                  {v.images.slice(0, 3).map((img, i) => (
                    <div key={i} className="w-8 h-8 bg-gray-100 rounded border" />
                  ))}
                  {v.images.length > 3 && <div className="w-8 h-8 bg-gray-50 rounded border text-xs flex items-center justify-center text-gray-400">+{v.images.length - 3}</div>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Grouped View */}
      {viewMode === "grouped" && (() => {
        const groups: Record<string, Variant[]> = {};
        variants.forEach(v => {
          const key = v.options[0]?.optionValue.value || "Uncategorized";
          if (!groups[key]) groups[key] = [];
          groups[key].push(v);
        });
        return (
          <div className="space-y-4">
            {Object.entries(groups).map(([group, vars]) => (
              <div key={group} className="border rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 flex items-center justify-between">
                  <span className="font-semibold text-sm">{group}</span>
                  <span className="text-xs text-gray-500">{vars.length} variant{vars.length > 1 ? "s" : ""}</span>
                </div>
                <div className="divide-y">
                  {vars.map(v => (
                    <div key={v.id} className="px-4 py-2 flex items-center justify-between text-sm hover:bg-gray-50">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={selectedIds.has(v.id)} onChange={() => toggleSelect(v.id)} className="rounded" />
                        <span className="font-medium">{v.options.map(o => o.optionValue.value).join(" · ")}</span>
                        <Badge variant={v.isActive ? "default" : "secondary"} className="text-xs">{v.isActive ? "Active" : "Inactive"}</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>₹{v.price.toLocaleString("en-IN")}</span>
                        <span>Stock: {v.stock}</span>
                        <span className="font-mono">{v.sku || "—"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      })()}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-sm text-gray-500">{total} variants, page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2 + i, totalPages));
              return (
                <Button key={p} size="sm" variant={p === page ? "default" : "outline"}
                  onClick={() => setPage(p)}>{p}</Button>
              );
            })}
            <Button size="sm" variant="outline" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {imageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setImageModal(null)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-3">Variant Images</h3>
            <Label>Image URLs (comma separated)</Label>
            <Input value={imageInput} onChange={(e) => setImageInput(e.target.value)}
              placeholder="https://..., https://..." className="mt-1" />
            <div className="flex gap-2 mt-4">
              <Button size="sm" onClick={() => handleImageSave(imageModal)}>Save</Button>
              <Button size="sm" variant="outline" onClick={() => setImageModal(null)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Rules Tab ───────────────────────────────────────────────────────────────

function RulesTab({ productId }: { productId: string }) {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [skuTemplate, setSkuTemplate] = useState("{base}-{color}-{size}");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getVariantsForProduct(productId)
      .then((v: unknown[]) => setVariants((v as Variant[]).map((x) => ({ ...x, price: Number(x.price), comparePrice: x.comparePrice ? Number(x.comparePrice) : null, discountValue: x.discountValue ? Number(x.discountValue) : null }))))
      .catch(() => {});
  }, [productId]);

  const handleGenerateSKUs = async () => {
    if (!confirm("Auto-generate SKUs for all variants using this template?")) return;
    setLoading(true);
    try {
      await autoGenerateSKUs(productId, skuTemplate);
      toast.success("SKUs generated");
      getVariantsForProduct(productId)
        .then((v: unknown[]) => setVariants((v as Variant[]).map((x) => ({ ...x, price: Number(x.price), comparePrice: x.comparePrice ? Number(x.comparePrice) : null, discountValue: x.discountValue ? Number(x.discountValue) : null }))))
        .catch(() => {});
    } catch { toast.error("Failed to generate SKUs"); }
    finally { setLoading(false); }
  };

  const optionTypes = [...new Set(variants.flatMap(v => v.options.map(o => o.optionValue.optionType.name)))];
  const availableTokens = ["{base}", "{productId}", ...optionTypes.map(t => `{${t.toLowerCase()}}`)];

  return (
    <div className="space-y-6">
      {/* SKU Template */}
      <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Hash className="w-4 h-4" /> SKU Auto-Generation Template
        </h3>
        <p className="text-sm text-blue-600 mb-3">Use tokens to build SKU patterns. Tokens are replaced with option values.</p>
        <div className="flex gap-2">
          <Input value={skuTemplate} onChange={(e) => setSkuTemplate(e.target.value)}
            className="font-mono" placeholder="{base}-{color}-{size}" />
          <Button onClick={handleGenerateSKUs} disabled={loading}>
            {loading ? "Generating..." : "Generate SKUs"}
          </Button>
        </div>
        <div className="flex flex-wrap gap-1 mt-3">
          {availableTokens.map((t) => (
            <button key={t} onClick={() => setSkuTemplate(prev => prev + t)}
              className="px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs font-mono transition">
              {t}
            </button>
          ))}
        </div>
        <p className="text-xs text-blue-500 mt-2">Click a token to append it. Example: <code className="bg-blue-100 px-1 rounded">{skuTemplate}</code></p>
      </div>

      {/* Default Variant */}
      <div className="p-4 bg-gray-50 rounded-xl border">
        <h3 className="font-semibold mb-2">Default Variant</h3>
        <p className="text-sm text-gray-500 mb-3">The default variant is shown when customers first view the product.</p>
        <select className="border rounded-lg px-3 py-2 w-full max-w-md text-sm"
          onChange={async (e) => {
            try {
              await setDefaultVariant(e.target.value);
              toast.success("Default variant set");
              getVariantsForProduct(productId)
                .then((v: unknown[]) => setVariants((v as Variant[]).map((x) => ({ ...x, price: Number(x.price), comparePrice: x.comparePrice ? Number(x.comparePrice) : null, discountValue: x.discountValue ? Number(x.discountValue) : null }))))
                .catch(() => {});
            } catch { toast.error("Failed to set default"); }
          }}>
          <option value="">Select default variant...</option>
          {variants.map(v => (
            <option key={v.id} value={v.id}>
              {v.options.map(o => o.optionValue.value).join(" / ")} {v.isDefault ? "(Default)" : ""}
            </option>
          ))}
        </select>
      </div>

      {/* Bulk Price Rules */}
      <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
        <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
          <BarChart3 className="w-4 h-4" /> Bulk Price Rules
        </h3>
        <p className="text-sm text-emerald-600 mb-3">Apply price adjustments across all variants at once.</p>
        <div className="flex gap-2 flex-wrap">
          <select className="border rounded-lg px-3 py-2 text-sm" id="bulk-price-op">
            <option value="add">Add flat amount</option>
            <option value="subtract">Subtract flat amount</option>
            <option value="multiply">Multiply by factor</option>
            <option value="set">Set to fixed price</option>
          </select>
          <Input type="number" placeholder="Amount" className="w-32" id="bulk-price-val" />
          <Button size="sm" variant="outline" onClick={() => {
            const op = (document.getElementById("bulk-price-op") as HTMLSelectElement)?.value as BulkPriceOp;
            const val = parseFloat((document.getElementById("bulk-price-val") as HTMLInputElement)?.value);
            if (!val) { toast.error("Enter a value"); return; }
            bulkUpdateVariantPrices(variants.map(v => v.id), op, val).then(() => {
              toast.success(`Applied ${op} ${val} to all variants`);
            }).catch(() => toast.error("Failed"));
          }}>
            Apply to All
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Import/Export Tab ───────────────────────────────────────────────────────

function ImportExportTab({ productId }: { productId: string }) {
  const [loading, setLoading] = useState(false);
  const [csvPreview, setCsvPreview] = useState<string[][] | null>(null);
  const [csvContent, setCsvContent] = useState("");

  const handleExport = async () => {
    setLoading(true);
    try {
      const { csv, filename } = await exportVariantsCSV(productId);
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = filename; a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported");
    } catch { toast.error("Export failed"); }
    finally { setLoading(false); }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvContent(text);
      const lines = text.trim().split("\n");
      setCsvPreview(lines.map(line => line.split(",").map(c => c.replace(/"/g, "").trim())));
    };
    reader.readAsText(file);
  };

  const handleImport = async () => {
    if (!csvContent.trim()) { toast.error("Upload a CSV file first"); return; }
    setLoading(true);
    try {
      const result = await importVariantsCSV(productId, csvContent);
      if (result.errors.length > 0) {
        toast.error(`${result.success} succeeded, ${result.errors.length} errors`);
      } else {
        toast.success(`Imported ${result.success} variants`);
      }
    } catch { toast.error("Import failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6">
      {/* Export */}
      <div className="p-5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
          <Download className="w-4 h-4" /> Export Variants
        </h3>
        <p className="text-sm text-blue-600 mb-4">Download all variants as CSV for offline editing.</p>
        <Button onClick={handleExport} disabled={loading}>
          <Download className="w-4 h-4 mr-1" />
          {loading ? "Exporting..." : "Export CSV"}
        </Button>
      </div>

      {/* Import */}
      <div className="p-5 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-200">
        <h3 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
          <Upload className="w-4 h-4" /> Import Variants
        </h3>
        <p className="text-sm text-emerald-600 mb-4">Upload a CSV to bulk update variants. Must include variant ID column.</p>
        <div className="flex gap-2 mb-4">
          <label className="flex-1 flex items-center justify-center px-4 py-8 border-2 border-dashed border-emerald-300 rounded-lg cursor-pointer hover:bg-emerald-50 transition">
            <Upload className="w-8 h-8 text-emerald-400 mb-2" />
            <div className="text-center">
              <p className="text-sm text-gray-500">Click to upload or drag CSV here</p>
              <p className="text-xs text-gray-400">.csv files only</p>
            </div>
            <input type="file" accept=".csv" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {csvPreview && (
          <div>
            <Label className="text-sm">Preview ({csvPreview.length - 1} rows)</Label>
            <div className="overflow-x-auto mt-1 rounded-lg border max-h-64">
              <table className="text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>{csvPreview[0]?.map((h, i) => <th key={i} className="text-left px-3 py-2 font-medium">{h}</th>)}</tr>
                </thead>
                <tbody>
                  {csvPreview.slice(1, 11).map((row, i) => (
                    <tr key={i} className="border-t">{row.map((cell, j) => <td key={j} className="px-3 py-1.5">{cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
            {csvPreview.length > 11 && <p className="text-xs text-gray-400 mt-1">... and {csvPreview.length - 11} more rows</p>}
            <div className="flex gap-2 mt-3">
              <Button onClick={handleImport} disabled={loading}>
                {loading ? "Importing..." : "Import"}
              </Button>
              <Button variant="outline" onClick={() => { setCsvPreview(null); setCsvContent(""); }}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
