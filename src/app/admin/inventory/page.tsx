"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllInventory,
  getStockValuation,
  getSuppliers,
  getStockMovements,
  createStockMovement,
  getInventoryLogs,
  adjustStock,
} from "@/server/actions/inventory-actions";
import { updateStock } from "@/server/actions/admin-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, RefreshCw, Sliders, History, FileText, Check, X } from "lucide-react";

const MOVEMENT_TYPES = [
  { value: "IN", label: "Stock In", icon: ArrowDownLeft, color: "text-green-600" },
  { value: "OUT", label: "Stock Out", icon: ArrowUpRight, color: "text-red-600" },
  { value: "TRANSFER", label: "Transfer", icon: RefreshCw, color: "text-blue-600" },
  { value: "ADJUSTMENT", label: "Adjustment", icon: Sliders, color: "text-yellow-600" },
];

export default function InventoryPage() {
  const router = useRouter();
  const [inventory, setInventory] = useState<any[]>([]);
  const [movements, setMovements] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState("");
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [valuation, setValuation] = useState<{ totalValue: number; bySupplier: any[]; byLocation: any[] }>({ totalValue: 0, bySupplier: [], byLocation: [] });
  const [movementForm, setMovementForm] = useState({
    productId: "",
    supplierId: "",
    locationId: "",
    type: "IN",
    quantity: "",
    reference: "",
    notes: "",
  });

  const fetch = async () => {
    try {
      const [inv, val, sups] = await Promise.all([
        getAllInventory(supplierFilter ? { supplierId: supplierFilter } : {}),
        getStockValuation(),
        getSuppliers({ limit: 100 }),
      ]);
      setInventory(inv);
      setValuation(val);
      setSuppliers(sups.suppliers);
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [supplierFilter]);

  const fetchMovements = async (productId: string) => {
    try {
      const data = await getStockMovements(productId);
      setMovements(data);
    } catch {
      toast.error("Failed to load stock history");
    }
  };

  const fetchAuditLogs = async (productId?: string) => {
    try {
      const data = await getInventoryLogs({ productId, limit: 50 });
      setAuditLogs(data);
    } catch {
      toast.error("Failed to load audit logs");
    }
  };

  const handleSave = async (productId: string, inventoryId: string) => {
    const qty = parseInt(editQty);
    if (isNaN(qty) || qty < 0) { toast.error("Enter valid quantity"); return; }
    try {
      // Calculate delta
      const currentInv = inventory.find((i) => i.productId === productId);
      const delta = qty - (currentInv?.quantity || 0);
      if (delta === 0) { toast.info("Quantity unchanged"); return; }
      await adjustStock(inventoryId, delta, `Manual stock adjustment from ${currentInv?.quantity || 0} to ${qty}`);
      toast.success("Stock updated");
      setEditingId(null);
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleMovement = async () => {
    if (!movementForm.productId || !movementForm.quantity) {
      toast.error("Product and quantity are required");
      return;
    }
    const qty = parseInt(movementForm.quantity);
    if (isNaN(qty)) { toast.error("Invalid quantity"); return; }

    const actualQty = movementForm.type === "OUT" || movementForm.type === "ADJUSTMENT"
      ? (movementForm.type === "OUT" ? -Math.abs(qty) : qty)
      : Math.abs(qty);

    try {
      await createStockMovement({
        productId: movementForm.productId,
        supplierId: movementForm.supplierId || undefined,
        locationId: movementForm.locationId || undefined,
        type: movementForm.type,
        quantity: actualQty,
        reference: movementForm.reference || undefined,
        notes: movementForm.notes || undefined,
      });
      toast.success("Stock movement recorded");
      setMovementDialogOpen(false);
      setMovementForm({ productId: "", supplierId: "", locationId: "", type: "IN", quantity: "", reference: "", notes: "" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  const lowStock = inventory.filter((i: any) => i.quantity <= (i.lowStock || 5));
  const outOfStock = inventory.filter((i: any) => i.quantity <= 0);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Inventory</h1>
        <Button onClick={() => setMovementDialogOpen(true)}>
          <ArrowUpRight className="w-4 h-4 mr-2" />
          Stock Movement
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-sm text-gray-500">Total Products</p>
          <p className="text-2xl font-bold">{inventory.length}</p>
        </div>
        <div className="bg-yellow-50 rounded-lg shadow p-4">
          <p className="text-sm text-yellow-700 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Low Stock</p>
          <p className="text-2xl font-bold text-yellow-800">{lowStock.length}</p>
        </div>
        <div className="bg-red-50 rounded-lg shadow p-4">
          <p className="text-sm text-red-700">Out of Stock</p>
          <p className="text-2xl font-bold text-red-800">{outOfStock.length}</p>
        </div>
        <div className="bg-blue-50 rounded-lg shadow p-4">
          <p className="text-sm text-blue-700">Inventory Value</p>
          <p className="text-2xl font-bold text-blue-800">₹{Math.round(valuation.totalValue).toLocaleString()}</p>
        </div>
      </div>

      {/* Valuation by Supplier */}
      {valuation.bySupplier.length > 0 && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <h3 className="font-bold text-sm text-gray-500 mb-2">Stock Value by Supplier</h3>
          <div className="flex flex-wrap gap-3">
            {valuation.bySupplier.map((s: any) => (
              <div key={s.supplierId} className="bg-gray-50 rounded-lg px-4 py-2">
                <p className="text-xs text-gray-500">{s.supplierName}</p>
                <p className="font-bold">₹{Math.round(s.value).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <h3 className="font-bold text-yellow-800 mb-2">Low Stock Alerts</h3>
          <div className="flex flex-wrap gap-2">
            {lowStock.map((i: any) => (
              <Badge key={i.id} variant="outline" className="bg-yellow-100">
                {i.product?.name}
                {i.supplier?.name && ` (${i.supplier.name})`}
                : {i.quantity} left
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Supplier Filter */}
      <div className="mb-4">
        <Select value={supplierFilter} onValueChange={(v: any) => setSupplierFilter(v)}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Filter by supplier" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Suppliers</SelectItem>
            {suppliers.map((s) => (
              <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Product</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Supplier</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Location</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Low Stock</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Avg Cost</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Value</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {inventory.length === 0 ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No inventory data</td></tr>
            ) : (
              inventory.map((item: any) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-3 font-medium">
                    <div>
                      {item.product?.name || "Unknown"}
                      <button
                        className="ml-2 text-gray-400 hover:text-blue-600"
                        onClick={() => { fetchMovements(item.productId); setHistoryDialogOpen(true); }}
                        title="View stock history"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.supplier?.name ? (
                      <Badge variant="outline">{item.supplier.name}</Badge>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {item.location?.name || <span className="text-gray-400">Global</span>}
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.productId ? (
                      <Input
                        type="number"
                        value={editQty}
                        onChange={(e) => setEditQty(e.target.value)}
                        className="w-24"
                        autoFocus
                        onKeyDown={(e) => { if (e.key === "Enter") handleSave(item.productId, item.id); if (e.key === "Escape") setEditingId(null); }}
                      />
                    ) : (
                      <span className={`font-bold ${item.quantity <= 0 ? "text-red-600" : item.quantity <= (item.lowStock || 5) ? "text-yellow-600" : "text-green-600"}`}>
                        {item.quantity}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{item.lowStock}</td>
                  <td className="px-4 py-3 text-sm">₹{item.avgCost?.toLocaleString() || "—"}</td>
                  <td className="px-4 py-3 text-sm font-bold">
                    ₹{Math.round((item.quantity || 0) * (item.avgCost || 0)).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={
                      item.quantity <= 0 ? "bg-red-100 text-red-800" :
                      item.quantity <= (item.lowStock || 5) ? "bg-yellow-100 text-yellow-800" :
                      "bg-green-100 text-green-800"
                    }>
                      {item.quantity <= 0 ? "Out of Stock" : item.quantity <= (item.lowStock || 5) ? "Low Stock" : "In Stock"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    {editingId === item.productId ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleSave(item.productId, item.id)}>Save</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => { setEditingId(item.productId); setEditQty(item.quantity.toString()); }}>
                          Update
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => { fetchAuditLogs(item.productId); setAuditLogOpen(true); }}>
                          <FileText className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Stock Movement Dialog */}
      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record Stock Movement</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <div className="flex gap-2 mt-2">
                {MOVEMENT_TYPES.map(({ value, label, icon: Icon, color }) => (
                  <Button
                    key={value}
                    variant={movementForm.type === value ? "default" : "outline"}
                    className="flex-1"
                    onClick={() => setMovementForm({ ...movementForm, type: value })}
                  >
                    <Icon className={`w-4 h-4 mr-1 ${movementForm.type === value ? "text-white" : color}`} />
                    <span className="text-xs">{label}</span>
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Supplier</Label>
              <Select value={movementForm.supplierId} onValueChange={(v: any) => setMovementForm({ ...movementForm, supplierId: v })}>
                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Product ID</Label>
              <Input
                value={movementForm.productId}
                onChange={(e) => setMovementForm({ ...movementForm, productId: e.target.value })}
                placeholder="Enter product ID or scan SKU"
              />
            </div>
            <div>
              <Label>Quantity</Label>
              <Input
                type="number"
                value={movementForm.quantity}
                onChange={(e) => setMovementForm({ ...movementForm, quantity: e.target.value })}
                placeholder="10"
              />
            </div>
            <div>
              <Label>Reference (optional)</Label>
              <Input
                value={movementForm.reference}
                onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })}
                placeholder="PO-1234, Transfer #5"
              />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input
                value={movementForm.notes}
                onChange={(e) => setMovementForm({ ...movementForm, notes: e.target.value })}
                placeholder="Reason for adjustment"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMovementDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleMovement}>Record Movement</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stock History Dialog */}
      <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Stock Movement History</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {movements.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No movements recorded</p>
            ) : (
              movements.map((m: any) => (
                <div key={m.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  {m.quantity > 0 ? (
                    <ArrowDownLeft className="w-5 h-5 text-green-600 shrink-0" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5 text-red-600 shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {m.quantity > 0 ? "+" : ""}{m.quantity}
                      <span className="ml-2 text-xs text-gray-500">{m.type}</span>
                    </p>
                    {m.notes && <p className="text-xs text-gray-500 truncate">{m.notes}</p>}
                    {m.reference && <p className="text-xs text-gray-400">Ref: {m.reference}</p>}
                  </div>
                  {m.location && (
                    <Badge variant="outline" className="text-xs">{m.location.name}</Badge>
                  )}
                  <p className="text-xs text-gray-400 shrink-0">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Audit Log Dialog */}
      <Dialog open={auditLogOpen} onOpenChange={setAuditLogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inventory Audit Log</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {auditLogs.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">No audit logs found</p>
            ) : (
              auditLogs.map((log: any) => (
                <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg text-sm">
                  {log.quantity > 0 ? (
                    <Check className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                  ) : (
                    <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{log.type.replace(/_/g, " ")}</span>
                      <Badge className={`text-xs ${
                        log.quantity > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {log.quantity > 0 ? "+" : ""}{log.quantity}
                      </Badge>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      <span className="font-medium">Before:</span> {log.beforeQuantity} → <span className="font-medium">After:</span> {log.afterQuantity}
                    </div>
                    {log.reference && <p className="text-xs text-gray-400">Ref: {log.reference}</p>}
                    {log.notes && <p className="text-xs text-gray-500">{log.notes}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      {log.user && <span className="text-xs text-gray-400">By: {log.user.name || log.user.email}</span>}
                      <span className="text-xs text-gray-300">•</span>
                      <span className="text-xs text-gray-400">{new Date(log.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
