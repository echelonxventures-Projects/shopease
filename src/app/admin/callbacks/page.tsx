"use client";

import { useState, useEffect } from "react";
import { listCallbackRequests, updateCallbackRequest } from "@/server/actions/commerce-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Phone, CheckCircle, XCircle, Loader2, Clock, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function CallbacksPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [filter, setFilter] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const load = () => listCallbackRequests(filter || undefined).then(setRequests).catch(() => {});
  useEffect(() => { load(); }, [filter]);

  const handleUpdate = async (id: string, status: string) => {
    setActionLoading(id);
    try {
      await updateCallbackRequest(id, { status, notes: notes[id] || undefined });
      toast.success(`Request ${status.toLowerCase()}`);
      load();
    } catch {
      toast.error("Failed to update");
    } finally {
      setActionLoading(null);
    }
  };

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    ASSIGNED: "bg-blue-100 text-blue-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  const statusIcon: Record<string, any> = {
    PENDING: Clock,
    ASSIGNED: Phone,
    COMPLETED: CheckCircle,
    CANCELLED: XCircle,
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Callback Requests</h1>

      <div className="flex gap-2 mb-4">
        {[
          { key: "", label: "All" },
          { key: "PENDING", label: "Pending" },
          { key: "ASSIGNED", label: "Assigned" },
          { key: "COMPLETED", label: "Completed" },
        ].map((f) => (
          <Button
            key={f.key}
            variant={filter === f.key ? "default" : "outline"}
            size="sm"
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <div className="space-y-3">
        {requests.map((r: any) => {
          const Icon = statusIcon[r.status] || Clock;
          return (
            <div key={r.id} className="bg-white rounded-lg shadow border p-4">
              <div className="flex items-start gap-3">
                <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                  r.status === "COMPLETED" ? "bg-green-100 text-green-600"
                  : r.status === "PENDING" ? "bg-yellow-100 text-yellow-600"
                  : "bg-blue-100 text-blue-600"
                }`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{r.userName}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[r.status]}`}>
                      {r.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />
                    {r.userPhone}
                    {r.preferredTime && (
                      <span className="ml-3">
                        <Clock className="w-3.5 h-3.5 inline mr-1" />
                        {new Date(r.preferredTime).toLocaleString()}
                      </span>
                    )}
                  </p>
                  {r.reason && <p className="text-sm text-gray-600 mt-1">{r.reason}</p>}
                  {r.notes && (
                    <div className="flex items-start gap-1 mt-2 text-sm text-gray-500">
                      <MessageSquare className="w-3.5 h-3.5 mt-0.5" />
                      <span>{r.notes}</span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 flex gap-1">
                  {r.status === "PENDING" && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => handleUpdate(r.id, "ASSIGNED")}
                        disabled={actionLoading === r.id}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {actionLoading === r.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Phone className="w-3 h-3" />}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleUpdate(r.id, "COMPLETED")}
                        disabled={actionLoading === r.id}
                      >
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="mt-3">
                <Input
                  value={notes[r.id] || ""}
                  onChange={(e) => setNotes({ ...notes, [r.id]: e.target.value })}
                  placeholder="Add notes..."
                  className="h-8 text-sm"
                />
              </div>
            </div>
          );
        })}
      </div>

      {requests.length === 0 && (
        <div className="text-center py-12 text-gray-500">No callback requests</div>
      )}
    </div>
  );
}
