"use client";

import { useEffect, useState } from "react";
import { listBusinesses, updateBusinessStatus } from "@/server/actions/business-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Check, Search, X } from "lucide-react";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-purple-100 text-purple-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-gray-100 text-gray-800",
};

export default function AdminBusinessPage() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ status: "", search: "" });
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    listBusinesses().then(setBusinesses).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = businesses.filter((b) => {
    if (filter.status && b.verificationStatus !== filter.status) return false;
    if (filter.search) {
      const s = filter.search.toLowerCase();
      return b.name.toLowerCase().includes(s) ||
        (b.gstNumber || "").toLowerCase().includes(s) ||
        (b.taxId || "").toLowerCase().includes(s);
    }
    return true;
  });

  async function handleAction(action: string) {
    if (!selected?.id) return;
    setActionLoading(true);
    try {
      await updateBusinessStatus(selected.id, action, adminNote);
      toast.success(`Business ${action}ed`);
      setSelected(null);
      setAdminNote("");
      listBusinesses().then(setBusinesses).catch(() => {});
    } catch {
      toast.error("Action failed");
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Business Directory</h1>

      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input value={filter.search} onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} placeholder="Search by name, GST, tax ID..." className="pl-10" />
        </div>
        <Select value={filter.status} onValueChange={(v) => setFilter((f) => ({ ...f, status: v || "" }))}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="SUBMITTED">Submitted</SelectItem>
            <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
            <SelectItem value="VERIFIED">Verified</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>GST/Tax ID</TableHead>
              <TableHead>Country</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((b) => (
              <TableRow key={b.id} onClick={() => setSelected(b)} className="cursor-pointer hover:bg-gray-50">
                <TableCell>
                  <div>
                    <p className="font-medium">{b.name}</p>
                    <p className="text-xs text-gray-500">{b.contactEmail}</p>
                  </div>
                </TableCell>
                <TableCell>{b.businessType}</TableCell>
                <TableCell className="font-mono text-sm">{b.gstNumber || b.taxId || "—"}</TableCell>
                <TableCell>{b.registeredCountry}</TableCell>
                <TableCell>
                  <Badge className={STATUS_COLORS[b.verificationStatus] || "bg-gray-100 text-gray-800"}>
                    {b.verificationStatus}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-gray-500">{new Date(b.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {b.verificationStatus !== "VERIFIED" && (
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAction("approve"); }}>
                        <Check className="w-4 h-4 text-green-600" />
                      </Button>
                    )}
                    {b.verificationStatus !== "REJECTED" && (
                      <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleAction("reject"); }}>
                        <X className="w-4 h-4 text-red-600" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Detail dialog */}
      <Dialog open={!!selected} onOpenChange={(v) => { if (!v) setSelected(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selected?.name}</DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Type:</span> {selected.businessType}</div>
                <div><span className="text-gray-500">Industry:</span> {selected.industry || "—"}</div>
                <div><span className="text-gray-500">Size:</span> {selected.companySize || "—"}</div>
                <div><span className="text-gray-500">Country:</span> {selected.registeredCountry}</div>
                <div><span className="text-gray-500">GST:</span> {selected.gstNumber || "—"}</div>
                <div><span className="text-gray-500">Tax ID:</span> {selected.taxId || "—"}</div>
                <div><span className="text-gray-500">City:</span> {selected.city}, {selected.state}</div>
                <div><span className="text-gray-500">Email:</span> {selected.contactEmail}</div>
              </div>
              <div>
                <label className="text-sm">Admin Note</label>
                <Input value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Reason for approval/rejection" />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={() => handleAction("approve")} disabled={actionLoading}>Approve</Button>
                <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={() => handleAction("reject")} disabled={actionLoading}>Reject</Button>
                <Button variant="outline" className="flex-1" onClick={() => handleAction("suspend")} disabled={actionLoading}>Suspend</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
