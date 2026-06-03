"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getTickets, createTicket } from "@/server/actions/ticket-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import Link from "next/link";

const categoryLabels: Record<string, string> = {
  ORDER_ISSUE: "Order Issue", PRODUCT_QUESTION: "Product Question",
  PAYMENT_PROBLEM: "Payment Problem", DELIVERY_ISSUE: "Delivery Issue",
  ACCOUNT_ISSUE: "Account Issue", TECHNICAL: "Technical", OTHER: "Other",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800", MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800", URGENT: "bg-red-100 text-red-800",
};

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800", IN_PROGRESS: "bg-blue-100 text-blue-800",
  WAITING_CUSTOMER: "bg-yellow-100 text-yellow-800", WAITING_MERCHANT: "bg-orange-100 text-orange-800",
  RESOLVED: "bg-gray-100 text-gray-800", CLOSED: "bg-red-100 text-red-800",
};

export default function TicketsPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ subject: "", category: "ORDER_ISSUE", description: "", priority: "MEDIUM" });

  const fetch = () => {
    getTickets()
      .then(setTickets)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.description.trim()) { toast.error("Subject and description required"); return; }
    try {
      await createTicket(form);
      toast.success("Ticket created");
      setOpen(false); setForm({ subject: "", category: "ORDER_ISSUE", description: "", priority: "MEDIUM" });
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading tickets...</p></div>;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Support Tickets</h1>
        <Button onClick={() => setOpen(true)}><Plus className="w-4 h-4 mr-2" /> New Ticket</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-medium">Ticket #</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Subject</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Category</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Priority</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Status</th>
              <th className="text-left px-4 py-3 text-sm font-medium">Updated</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">No tickets yet</td></tr>
            ) : (
              tickets.map((t: any) => (
                <tr key={t.id} className="border-t hover:bg-gray-50 cursor-pointer">
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${t.id}`} className="font-mono font-bold text-blue-600 hover:underline">{t.ticketNumber}</Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/tickets/${t.id}`} className="font-medium hover:underline">{t.subject}</Link>
                  </td>
                  <td className="px-4 py-3 text-sm">{categoryLabels[t.category] || t.category}</td>
                  <td className="px-4 py-3"><Badge className={priorityColors[t.priority]}>{t.priority}</Badge></td>
                  <td className="px-4 py-3"><Badge className={statusColors[t.status]}>{t.status.replace(/_/g, " ")}</Badge></td>
                  <td className="px-4 py-3 text-sm text-gray-500">{new Date(t.updatedAt).toLocaleDateString("en-IN")}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Ticket</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Subject</Label><Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief description of your issue" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => v && setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([k, v]) => (<SelectItem key={k} value={k}>{v}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Priority</Label>
                <Select value={form.priority} onValueChange={(v) => v && setForm({ ...form, priority: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LOW">Low</SelectItem>
                    <SelectItem value="MEDIUM">Medium</SelectItem>
                    <SelectItem value="HIGH">High</SelectItem>
                    <SelectItem value="URGENT">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Describe your issue in detail" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleSubmit}>Submit Ticket</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={`block text-sm font-medium mb-1 ${className || ""}`}>{children}</label>;
}
