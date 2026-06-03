"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  getAllSupplierReturns,
  getSupplierReturn,
  createSupplierReturn,
  submitSupplierReturn,
  approveSupplierReturn,
  rejectSupplierReturn,
  shipSupplierReturn,
  completeSupplierReturn,
  cancelSupplierReturn,
  getPurchaseOrder,
  getSuppliers,
} from "@/server/actions/inventory-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";


const RETURN_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-700",
  SUBMITTED: "bg-blue-100 text-blue-700",
  APPROVED: "bg-purple-100 text-purple-700",
  REJECTED: "bg-red-100 text-red-700",
  SHIPPED: "bg-yellow-100 text-yellow-700",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-500",
};

interface ReturnItem { id: string; productId: string; quantity: number; notes?: string; unitPrice?: number; subtotal?: number; product?: { name: string } | null }
interface SupplierReturn { id: string; returnNumber: string; status: string; reason?: string | null; notes?: string | null; supplierId: string; purchaseOrderId: string; approvedAt?: string | null; shippedDate?: string | null; receivedBySupplierDate?: string | null; approvalNotes?: string | null; supplier?: { name: string } | null; items: ReturnItem[]; createdAt: string | Date; _count?: { items: number } }
interface POData { id: string; poNumber: string; status: string; supplier?: { name: string } | null; items: Array<{ productId: string; quantity: number; receivedQuantity: number; returnQuantity: number; product?: { name: string } | null }> }

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<SupplierReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedReturn, setSelectedReturn] = useState<SupplierReturn | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create return dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createPoId, setCreatePoId] = useState("");
  const [createReason, setCreateReason] = useState("");
  const [createItems, setCreateItems] = useState<{ productId: string; quantity: string; notes?: string }[]>([]);
  const [poData, setPoData] = useState<POData | null>(null);

  // Reject dialog
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  const fetch = async () => {
    try {
      const data = await getAllSupplierReturns({
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      setReturns(data.returns as unknown as SupplierReturn[]);
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetch(); }, [statusFilter]);

  const viewReturn = async (id: string) => {
    setDetailLoading(true);
    try {
      const data = await getSupplierReturn(id);
      setSelectedReturn(data as unknown as SupplierReturn | null);
    } catch {
      toast.error("Failed to load return details");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCreateReturn = async () => {
    if (!createPoId) { toast.error("Select a purchase order"); return; }
    const validItems = createItems.filter((i) => i.productId && i.quantity && parseInt(i.quantity) > 0);
    if (validItems.length === 0) { toast.error("Add at least one item to return"); return; }

    try {
      const ret = await createSupplierReturn({
        purchaseOrderId: createPoId,
        reason: createReason || undefined,
        items: validItems.map((i) => ({
          productId: i.productId,
          quantity: parseInt(i.quantity),
          notes: i.notes,
        })),
      });
      toast.success(`Return ${ret.returnNumber} created`);
      setCreateOpen(false);
      setCreatePoId("");
      setCreateReason("");
      setCreateItems([]);
      setPoData(null);
      fetch();
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleLoadPO = async () => {
    if (!createPoId) return;
    try {
      const po = await getPurchaseOrder(createPoId) as unknown as POData | null;
      if (!po) { toast.error("PO not found"); return; }
      if (po.status !== "RECEIVED" && po.status !== "PARTIALLY_RECEIVED") {
        toast.error("Can only create returns from received or partially received orders");
        setCreatePoId("");
        return;
      }
      setPoData(po);
      setCreateItems(
        po.items
          .filter((item) => item.receivedQuantity > item.returnQuantity)
          .map((item) => ({
            productId: item.productId,
            quantity: (item.receivedQuantity - item.returnQuantity).toString(),
            notes: "",
          })),
      );
    } catch {
      toast.error("Failed to load PO");
    }
  };

  const handleSubmitReturn = async (id: string) => {
    try {
      await submitSupplierReturn(id);
      toast.success("Return submitted");
      fetch();
      viewReturn(id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleApproveReturn = async (id: string) => {
    try {
      await approveSupplierReturn(id);
      toast.success("Return approved");
      fetch();
      viewReturn(id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleRejectReturn = async () => {
    if (!rejectingId || !rejectReason.trim()) { toast.error("Provide a reason"); return; }
    try {
      await rejectSupplierReturn(rejectingId, rejectReason);
      toast.success("Return rejected");
      setRejectOpen(false);
      setRejectReason("");
      setRejectingId(null);
      fetch();
      if (selectedReturn?.id === rejectingId) viewReturn(rejectingId);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleShipReturn = async (id: string) => {
    try {
      await shipSupplierReturn(id);
      toast.success("Return shipped — inventory updated");
      fetch();
      viewReturn(id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleCompleteReturn = async (id: string) => {
    try {
      await completeSupplierReturn(id);
      toast.success("Return completed");
      fetch();
      viewReturn(id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  const handleCancelReturn = async (id: string) => {
    try {
      await cancelSupplierReturn(id);
      toast.success("Return cancelled");
      fetch();
      if (selectedReturn?.id === id) viewReturn(id);
    } catch (err) { toast.error(err instanceof Error ? err.message : "Operation failed"); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Supplier Returns</h1>
        <Button onClick={() => { setCreateOpen(true); setCreatePoId(""); setCreateReason(""); setCreateItems([]); setPoData(null); }}>
          + Create Return
        </Button>
      </div>

      <div className="mb-4">
        <Select value={statusFilter} onValueChange={(v) => { if (v) setStatusFilter(v); }}>
          <SelectTrigger className="max-w-xs">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Status</SelectItem>
            <SelectItem value="DRAFT">Draft</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SHIPPED">Shipped</SelectItem>
            <SelectItem value="COMPLETED">Completed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Return List */}
      <div className="grid gap-4">
        {returns.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">No returns found</div>
        ) : (
          returns.map((r) => (
            <div key={r.id} className="bg-white rounded-lg shadow p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-bold text-lg font-mono">{r.returnNumber}</h3>
                    <Badge className={RETURN_STATUS_COLORS[r.status]}>{r.status.replace(/_/g, " ")}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-x-8 gap-y-1 mt-3 text-sm text-gray-500">
                    <p>Supplier: {r.supplier?.name || "—"}</p>
                    <p>PO: {r.purchaseOrderId ? r.purchaseOrderId.slice(0, 8) + "..." : "—"}</p>
                    <p>Items: {r._count?.items || 0}</p>
                    <p>Created: {new Date(r.createdAt).toLocaleDateString("en-IN")}</p>
                    {r.reason && <p className="col-span-3">Reason: {r.reason}</p>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => viewReturn(r.id)}>View</Button>
                  {r.status === "DRAFT" && (
                    <Button size="sm" onClick={() => handleSubmitReturn(r.id)}>Submit</Button>
                  )}
                  {r.status === "SUBMITTED" && (
                    <>
                      <Button size="sm" onClick={() => handleApproveReturn(r.id)}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => { setRejectingId(r.id); setRejectOpen(true); }}>Reject</Button>
                    </>
                  )}
                  {r.status === "APPROVED" && (
                    <Button size="sm" onClick={() => handleShipReturn(r.id)}>Ship Back</Button>
                  )}
                  {r.status === "SHIPPED" && (
                    <Button size="sm" onClick={() => handleCompleteReturn(r.id)}>Complete</Button>
                  )}
                  {(r.status === "DRAFT" || r.status === "SUBMITTED") && (
                    <Button size="sm" variant="ghost" onClick={() => handleCancelReturn(r.id)}>Cancel</Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Return Detail Dialog */}
      <Dialog open={!!selectedReturn} onOpenChange={(open) => { if (!open) setSelectedReturn(null); }}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedReturn?.returnNumber} — {selectedReturn?.supplier?.name}
            </DialogTitle>
          </DialogHeader>
          {detailLoading ? (
            <p className="text-gray-500">Loading...</p>
          ) : selectedReturn ? (
            <div>
              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Status:</span>{" "}
                  <Badge className={RETURN_STATUS_COLORS[selectedReturn.status]}>{selectedReturn.status.replace(/_/g, " ")}</Badge>
                </div>
                <div>
                  <span className="text-gray-500">PO:</span>{" "}
                  <span className="font-mono">{selectedReturn.purchaseOrderId?.slice(0, 8)}...</span>
                </div>
                {selectedReturn.approvedAt && (
                  <div>
                    <span className="text-gray-500">Approved:</span>{" "}
                    {new Date(selectedReturn.approvedAt).toLocaleDateString("en-IN")}
                  </div>
                )}
                {selectedReturn.shippedDate && (
                  <div>
                    <span className="text-gray-500">Shipped:</span>{" "}
                    {new Date(selectedReturn.shippedDate).toLocaleDateString("en-IN")}
                  </div>
                )}
                {selectedReturn.receivedBySupplierDate && (
                  <div>
                    <span className="text-gray-500">Received by Supplier:</span>{" "}
                    {new Date(selectedReturn.receivedBySupplierDate).toLocaleDateString("en-IN")}
                  </div>
                )}
              </div>
              {selectedReturn.reason && (
                <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                  <strong>Reason:</strong> {selectedReturn.reason}
                </p>
              )}
              {selectedReturn.approvalNotes && (
                <p className="text-sm text-gray-500 p-2 bg-gray-50 rounded mt-2">
                  <strong>Approval Notes:</strong> {selectedReturn.approvalNotes}
                </p>
              )}

              <h4 className="font-bold mt-4 mb-2">Return Items</h4>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Product</th>
                    <th className="text-right py-2">Qty</th>
                    <th className="text-right py-2">Unit Price</th>
                    <th className="text-right py-2">Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedReturn.items.map((item) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-2">{item.product?.name || item.productId}</td>
                      <td className="py-2 text-right">{item.quantity}</td>
                      <td className="py-2 text-right">₹{(item.unitPrice ?? 0).toLocaleString("en-IN")}</td>
                      <td className="py-2 text-right font-bold">₹{(item.subtotal ?? 0).toLocaleString("en-IN")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedReturn.notes && (
                <p className="text-sm text-gray-400 mt-4 italic">Notes: {selectedReturn.notes}</p>
              )}
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedReturn(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject Return</DialogTitle>
            <DialogDescription>Provide a reason for rejecting this return</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection..."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleRejectReturn}>Reject</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Return Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Supplier Return</DialogTitle>
            <DialogDescription>Select a received purchase order to create a return</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Purchase Order *</Label>
              <Input
                value={createPoId}
                onChange={(e) => { setCreatePoId(e.target.value); setPoData(null); setCreateItems([]); }}
                placeholder="Enter PO ID"
              />
              <Button variant="outline" size="sm" className="mt-2" onClick={handleLoadPO}>Load PO</Button>
            </div>

            {poData && (
              <>
                <p className="text-sm text-gray-500">
                  PO: {poData.poNumber} — {poData.supplier?.name} ({poData.status})
                </p>

                <div>
                  <Label className="mb-2 block">Items to Return</Label>
                  {createItems.map((item, idx) => {
                    const poItem = poData.items.find((i) => i.productId === item.productId);
                    const available = poItem ? poItem.receivedQuantity - poItem.returnQuantity : 0;
                    return (
                      <div key={idx} className="flex gap-2 mb-2 items-center">
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{poItem?.product?.name || item.productId}</p>
                          <p className="text-gray-400">Available: {available}</p>
                        </div>
                        <Input
                          type="number"
                          placeholder="Qty"
                          className="w-24"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...createItems];
                            updated[idx] = { ...updated[idx], quantity: e.target.value };
                            setCreateItems(updated);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div>
                  <Label>Reason</Label>
                  <Textarea
                    value={createReason}
                    onChange={(e) => setCreateReason(e.target.value)}
                    placeholder="Reason for return..."
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateReturn}>Create Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
