"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllCustomers, toggleBlockCustomer } from "@/server/actions/admin-actions";
import { adminExportUserData, adminDeleteUser } from "@/server/actions/gdpr-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Download, Trash2, Shield } from "lucide-react";

export default function CustomersPage() {
  const router = useRouter();
  const [data, setData] = useState<{ customers: any[]; total: number; totalPages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [deletingName, setDeletingName] = useState("");

  const fetch = () => {
    getAllCustomers({ page, limit: 20 })
      .then(setData)
      .catch((e) => { if (e.message === "Unauthorized") router.push("/auth/login"); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [page]);

  const handleToggleBlock = async (userId: string) => {
    try {
      await toggleBlockCustomer(userId);
      toast.success("Customer status updated");
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  const handleExport = async (userId: string) => {
    try {
      const exportData = await adminExportUserData(userId);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `user-data-${userId}-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported");
    } catch (err: any) { toast.error(err.message); }
  };

  const handleDelete = async () => {
    try {
      await adminDeleteUser(deletingId);
      toast.success("User deleted and data anonymized");
      setDeleteOpen(false);
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Customers ({data?.total || 0})</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Name</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Email</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Phone</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Orders</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Joined</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {data?.customers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">No customers found</td></tr>
            ) : (
              data?.customers.map((c: any) => (
                <tr key={c.id} className="border-t">
                  <td className="px-4 py-3 font-medium">{c.name || "N/A"}</td>
                  <td className="px-4 py-3 text-sm">{c.email}</td>
                  <td className="px-4 py-3 text-sm">{c.phone || "-"}</td>
                  <td className="px-4 py-3 text-sm">{c.orders?.length || 0}</td>
                  <td className="px-4 py-3 text-sm">{new Date(c.createdAt).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <Badge className={c.isBlocked ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                      {c.isBlocked ? "Blocked" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExport(c.id)}
                        title="Export Data"
                      >
                        <Download className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleBlock(c.id)}
                        className={c.isBlocked ? "" : "text-red-600 hover:text-red-700"}
                        title={c.isBlocked ? "Activate" : "Block"}
                      >
                        <Shield className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => { setDeletingId(c.id); setDeletingName(c.name || c.email); setDeleteOpen(true); }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Delete User"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex gap-2 mt-4">
          <Button variant="outline" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
          <span className="px-3 py-2">Page {page} of {data.totalPages}</span>
          <Button variant="outline" disabled={page === data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
        </div>
      )}

      {/* Delete User Confirmation Dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete User</DialogTitle>
            <DialogDescription>
              This will anonymize all personal data for <strong>{deletingName}</strong>.
              Order records will be preserved for accounting purposes. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete & Anonymize</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
