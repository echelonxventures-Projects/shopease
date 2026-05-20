"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllPurchaseOrders,
  getPurchaseOrder,
  createPurchaseOrder,
  submitPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  markPurchaseOrderSent,
  receivePurchaseOrder,
  cancelPurchaseOrder,
  getSuppliers,
} from "@/server/actions/inventory-actions";
import { getProducts } from "@/server/actions/product-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-purple-100 text-purple-700",
  SENT: "bg-sky-100 text-sky-700",
  ACKNOWLEDGED: "bg-indigo-100 text-indigo-700",
  PARTIALLY_RECEIVED: "bg-yellow-100 text-yellow-700",
  RECEIVED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function PurchaseOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ supplierId: "", locationId: "", expectedDate: "", notes: "" });
  const [createItems, setCreateItems] = useState<{ productId: string; quantity: string; unitPrice: string }[]>([
    { productId: "", quantity: "1", unitPrice: "" },
  ]);

  // Receive dialog
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [receiveItems, setReceiveItems] = useState<{ productId: string; quantity: string }[]>([]);

  // Approve/Reject dialog
  const [approveNotes, setApproveNotes] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  // Mark as Sent dialog
  const [sentOpen, setSentOpen] = useState(false);
  const [sentItems, setSentItems] = useState<{ productId: string; sentQuantity: string }[]>([]);

  const fetch = async () => {
    try {
      const data = await getAllPurchaseOrders({
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setOrders(data.orders);
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const viewOrder = async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await getPurchaseOrder(id);
      setSelectedOrder(data);
    } catch {
      toast.error("Failed to load order details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!createForm.supplierId) { toast.error("Select a supplier"); return; }
    const validItems = createItems.filter((i) => i.productId && i.quantity && i.unitPrice);
    if (validItems.length === 0) { toast.error("Add at least one item"); return; }

    try {
      const po = await createPurchaseOrder({
        supplierId: createForm.supplierId,
        locationId: createForm.locationId || undefined,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: parseInt(i.quantity),
          unitPrice: parseFloat(i.unitPrice),
        })),
        expectedDate: createForm.expectedDate || undefined,
        notes: createForm.notes || undefined,
      });
      toast.success(`PO ${po.poNumber} created`);
      setCreateOpen(false);
      setCreateForm({ supplierId: "", locationId: "", expectedDate: "", notes: "" });
      setCreateItems([{ productId: "", quantity: "1", unitPrice: "" }]);
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleSubmitPO = async (id: string) => {
    try {
      await submitPurchaseOrder(id);
      toast.success("Purchase order submitted");
      fetch();
      if (selectedOrder?.id === id) viewOrder(id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePurchaseOrder(id, approveNotes || undefined);
      toast.success("Purchase order approved");
      setApproveNotes("");
      fetch();
      viewOrder(id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) { toast.error("Provide a rejection reason"); return; }
    try {
      await rejectPurchaseOrder(id, rejectReason);
      toast.success("Purchase order rejected");
      setRejectReason("");
      fetch();
      viewOrder(id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleMarkSent = async (id: string) => {
    try {
      const items = sentItems
        .filter((i) => i.productId && parseInt(i.sentQuantity) > 0)
        .map((i) => ({ productId: i.productId, sentQuantity: parseInt(i.sentQuantity) }));
      await markPurchaseOrderSent(id, items.length > 0 ? items : undefined);
      toast.success("Purchase order marked as sent");
      setSentOpen(false);
      setSentItems([]);
      fetch();
      viewOrder(id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleCancelPO = async (id: string) => {
    try {
      await cancelPurchaseOrder(id);
      toast.success("Purchase order cancelled");
      fetch();
      if (selectedOrder?.id === id) viewOrder(id);
    } catch (err: any) { toast.error(err.message); }
  };

  const handleReceive = async () => {
    if (!selectedOrder) return;
    const validItems = receiveItems.filter((i) => i.productId && i.quantity && parseInt(i.quantity) > 0);
    if (validItems.length === 0) { toast.error("Enter quantities to receive"); return; }

    try {
      await receivePurchaseOrder(
        selectedOrder.id,
        validItems.map((i) => ({ productId: i.productId, quantity: parseInt(i.quantity) })),
      );
      toast.success("Stock received");
      setReceiveOpen(false);
      setReceiveItems([]);
      viewOrder(selectedOrder.id);
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  // Open sent dialog with pre-filled quantities
  const openSentDialog = (order: any) => {
    setSentItems(order.items.map((item: any) => ({
      productId: item.productId,
      sentQuantity: (item.sentQuantity || item.quantity).toString(),
    })));
    setSentOpen(true);
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Purchase Orders</h1>
        <Button onClick={() => setCreateOpen(true)}>+ Create PO</Button>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="PARTIALLY_RECEIVED">Partially Received</SelectItem>
            <SelectItem value="RECEIVED">Received</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Order List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">PO Number</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Supplier</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Items</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Total</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Date</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No purchase orders</td></tr>
            ) : (
              orders.map((o) => (
                <tr key={o.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-sm font-bold">{o.poNumber}</td>
                  <td className="px-4 py-3">{o.supplier?.name || "—"}</td>
                  <td className="px-4 py-3 text-sm">{o._count?.items || 0}</td>
                  <td className="px-4 py-3 font-bold">₹{(o.total as number).toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <Badge className={STATUS_COLORS[o.status] || "bg-gray-100"}>{o.status.replace(/_/g, " ")}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => viewOrder(o.id)}>View</Button>
                      {o.status === "DRAFT" && (
                        <Button size="sm" onClick={() => handleSubmitPO(o.id)}>Submit</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => { if (!open) setSelectedOrder(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.poNumber} — {selectedOrder?.supplier?.name}
            </DialogTitle>
            <DialogDescription>
              {selectedOrder?.status?.replace(/_/g, " ")}
            </DialogDescription>
          </DialogHeader>
          {detailLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : selectedOrder ? (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>{" "}
                  <Badge className={STATUS_COLORS[selectedOrder.status]}>{selectedOrder.status.replace(/_/g, " ")}</Badge>
                </div>
                <div>
                  <span className="text-gray-500">Total:</span>{" "}
                  <span className="font-bold">₹{selectedOrder.total.toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-gray-500">Expected:</span>{" "}
                  {selectedOrder.expectedDate ? new Date(selectedOrder.expectedDate).toLocaleDateString() : "—"}
                </div>
                <div>
                  <span className="text-gray-500">Received:</span>{" "}
                  {selectedOrder.receivedDate ? new Date(selectedOrder.receivedDate).toLocaleDateString() : "—"}
                </div>
                <div>
                  <span className="text-gray-500">Approved:</span>{" "}
                  {selectedOrder.approvedAt ? (
                    <span>{new Date(selectedOrder.approvedAt).toLocaleDateString()}</span>
                  ) : "—"}
                </div>
                <div>
                  <span className="text-gray-500">Sent:</span>{" "}
                  {selectedOrder.sentDate ? new Date(selectedOrder.sentDate).toLocaleDateString() : "—"}
                </div>
              </div>

              {selectedOrder.approvalNotes && (
                <p className="text-sm text-gray-500 mb-2 p-2 bg-gray-50 rounded">
                  <strong>Notes:</strong> {selectedOrder.approvalNotes}
                </p>
              )}

              <h4 className="font-bold mb-2">Items</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-right py-2">Ordered</th>
                    <th className="text-right py-2">Sent</th>
                    <th className="text-right py-2">Received</th>
                    <th className="text-right py-2">Returned</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.items.map((item: any) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.product?.name || item.productId}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">
                        <span className={item.sentQuantity > 0 ? "text-blue-600 font-bold" : ""}>
                          {item.sentQuantity || 0}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <span className={item.receivedQuantity >= item.quantity ? "text-green-600 font-bold" : "text-yellow-600"}>
                          {item.receivedQuantity}
                        </span>
                      </td>
                      <td className="py-2 text-right">
                        <span className={item.returnQuantity > 0 ? "text-red-600 font-bold" : ""}>
                          {item.returnQuantity || 0}
                        </span>
                      </td>
                      <td className="py-2 text-right">₹{item.unitPrice.toLocaleString()}</td>
                      <td className="py-2 text-right font-bold">₹{item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedOrder.notes && (
                <p className="text-sm text-gray-400 mt-4 italic">Notes: {selectedOrder.notes}</p>
              )}

              <div className="flex flex-wrap gap-2 mt-4 justify-end">
                {selectedOrder.status === "SUBMITTED" && (
                  <>
                    <Button onClick={() => handleApprove(selectedOrder.id)}>Approve</Button>
                    <Button variant="destructive" onClick={() => {
                      // Show reject dialog
                      const reason = prompt("Enter rejection reason:");
                      if (reason?.trim()) handleReject(selectedOrder.id);
                    }}>Reject</Button>
                  </>
                )}
                {selectedOrder.status === "APPROVED" && (
                  <Button onClick={() => openSentDialog(selectedOrder)}>Mark as Sent</Button>
                )}
                {selectedOrder.status === "SENT" && (
                  <Button onClick={() => setReceiveOpen(true)}>Receive Stock</Button>
                )}
                {(selectedOrder.status === "DRAFT" || selectedOrder.status === "SUBMITTED") && (
                  <Button variant="outline" onClick={() => handleCancelPO(selectedOrder.id)}>Cancel</Button>
                )}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedOrder(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Receive Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Receive Stock</DialogTitle>
            <DialogDescription>Enter quantities to receive for each item</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedOrder?.items.map((item: any) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.product?.name}</p>
                  <p className="text-gray-400">Ordered: {item.quantity}, Sent: {item.sentQuantity || 0}, Received: {item.receivedQuantity}</p>
                </div>
                <Input
                  type="number"
                  placeholder="Qty"
                  className="w-24"
                  value={receiveItems.find((r) => r.productId === item.productId)?.quantity || ""}
                  onChange={(e) => {
                    setReceiveItems((prev) => {
                      const existing = prev.findIndex((r) => r.productId === item.productId);
                      if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = { productId: item.productId, quantity: e.target.value };
                        return updated;
                      }
                      return [...prev, { productId: item.productId, quantity: e.target.value }];
                    });
                  }}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>Cancel</Button>
            <Button onClick={handleReceive}>Receive</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mark as Sent Dialog */}
      <Dialog open={sentOpen} onOpenChange={setSentOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Mark as Sent</DialogTitle>
            <DialogDescription>Adjust sent quantities per item (defaults to ordered quantity)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {selectedOrder?.items.map((item: any) => (
              <div key={item.productId} className="flex items-center gap-3">
                <div className="flex-1 text-sm">
                  <p className="font-medium">{item.product?.name}</p>
                  <p className="text-gray-400">Ordered: {item.quantity}</p>
                </div>
                <Input
                  type="number"
                  placeholder="Sent Qty"
                  className="w-24"
                  value={sentItems.find((s) => s.productId === item.productId)?.sentQuantity || ""}
                  onChange={(e) => {
                    setSentItems((prev) => {
                      const existing = prev.findIndex((s) => s.productId === item.productId);
                      if (existing >= 0) {
                        const updated = [...prev];
                        updated[existing] = { productId: item.productId, sentQuantity: e.target.value };
                        return updated;
                      }
                      return [...prev, { productId: item.productId, sentQuantity: e.target.value }];
                    });
                  }}
                />
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSentOpen(false)}>Cancel</Button>
            <Button onClick={() => handleMarkSent(selectedOrder?.id)}>Mark Sent</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create PO Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Order</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Supplier *</Label>
              <SupplierSelect value={createForm.supplierId} onChange={(v) => setCreateForm({ ...createForm, supplierId: v })} />
            </div>
            <div>
              <Label>Expected Date</Label>
              <Input type="date" value={createForm.expectedDate} onChange={(e) => setCreateForm({ ...createForm, expectedDate: e.target.value })} />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={createForm.notes} onChange={(e) => setCreateForm({ ...createForm, notes: e.target.value })} rows={2} />
            </div>

            <div>
              <Label className="mb-2 block">Items</Label>
              {createItems.map((item, idx) => (
                <div key={idx} className="flex gap-2 mb-2">
                  <ProductSelect
                    value={item.productId}
                    onChange={(v) => {
                      const updated = [...createItems];
                      updated[idx] = { ...updated[idx], productId: v };
                      setCreateItems(updated);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Qty"
                    className="w-20"
                    value={item.quantity}
                    onChange={(e) => {
                      const updated = [...createItems];
                      updated[idx] = { ...updated[idx], quantity: e.target.value };
                      setCreateItems(updated);
                    }}
                  />
                  <Input
                    type="number"
                    placeholder="Price"
                    className="w-28"
                    value={item.unitPrice}
                    onChange={(e) => {
                      const updated = [...createItems];
                      updated[idx] = { ...updated[idx], unitPrice: e.target.value };
                      setCreateItems(updated);
                    }}
                  />
                  {createItems.length > 1 && (
                    <Button variant="ghost" size="sm" onClick={() => setCreateItems(createItems.filter((_, i) => i !== idx))}>
                      ✕
                    </Button>
                  )}
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setCreateItems([...createItems, { productId: "", quantity: "1", unitPrice: "" }])}>
                + Add Item
              </Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Create PO</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ===================== INLINE DROPDOWN COMPONENTS =====================

function SupplierSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  useEffect(() => {
    getSuppliers({ limit: 100 }).then((d: any) => setSuppliers(d.suppliers));
  }, []);
  return (
    <Select value={value} onValueChange={(v: any) => { if (v) onChange(v); }}>
      <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
      <SelectContent>
        {suppliers.map((s) => (
          <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ProductSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [products, setProducts] = useState<any[]>([]);
  useEffect(() => {
    fetchAllProducts({ limit: 100 }).then((d: any) => setProducts(d.products));
  }, []);
  return (
    <Select value={value} onValueChange={(v: any) => { if (v) onChange(v); }}>
      <SelectTrigger className="flex-1"><SelectValue placeholder="Select product" /></SelectTrigger>
      <SelectContent>
        {products.map((p) => (
          <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

async function fetchAllProducts(args: { limit: number }) {
  return getProducts(args as any);
}
