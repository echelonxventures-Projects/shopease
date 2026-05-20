"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getTicket, addTicketMessage, updateTicketStatus } from "@/server/actions/ticket-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Send, User, MessageSquare } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800", IN_PROGRESS: "bg-blue-100 text-blue-800",
  WAITING_CUSTOMER: "bg-yellow-100 text-yellow-800", WAITING_MERCHANT: "bg-orange-100 text-orange-800",
  RESOLVED: "bg-gray-100 text-gray-800", CLOSED: "bg-red-100 text-red-800",
};

const priorityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800", MEDIUM: "bg-blue-100 text-blue-800",
  HIGH: "bg-orange-100 text-orange-800", URGENT: "bg-red-100 text-red-800",
};

export default function TicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [ticket, setTicket] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetch = () => {
    if (!params?.id) return;
    getTicket(params.id as string)
      .then(setTicket)
      .catch(() => router.push("/tickets"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, [params?.id]);

  const handleSend = async () => {
    if (!message.trim()) { toast.error("Message cannot be empty"); return; }
    setSending(true);
    try {
      await addTicketMessage(params.id as string, message, isInternal);
      setMessage("");
      toast.success("Message sent");
      fetch();
    } catch (err: any) { toast.error(err.message); }
    finally { setSending(false); }
  };

  const handleStatusChange = async (status: string) => {
    try {
      await updateTicketStatus(params.id as string, status);
      toast.success("Status updated");
      fetch();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;
  if (!ticket) return <div className="p-6"><p className="text-red-500">Ticket not found</p></div>;

  return (
    <div className="p-6">
      <Button variant="ghost" className="mb-4" onClick={() => router.push("/tickets")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Tickets
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge className={statusColors[ticket.status]}>{ticket.status.replace(/_/g, " ")}</Badge>
              <Badge className={priorityColors[ticket.priority]}>{ticket.priority}</Badge>
            </div>
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <p className="text-sm text-gray-500 mt-1">{ticket.ticketNumber}</p>
            <p className="text-gray-600 mt-4">{ticket.description}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Messages</h2>
            <div className="space-y-4 mb-6 max-h-96 overflow-y-auto">
              {ticket.messages?.map((m: any) => (
                <div key={m.id} className={`flex gap-3 ${m.sender?.role === "CUSTOMER_CARE" || m.sender?.role === "ADMIN" ? "" : "flex-row-reverse"}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    m.sender?.role === "CUSTOMER_CARE" || m.sender?.role === "ADMIN" ? "bg-indigo-100 text-indigo-600" : "bg-blue-100 text-blue-600"
                  }`}>
                    <User className="w-4 h-4" />
                  </div>
                  <div className={`max-w-md rounded-lg p-3 ${
                    m.isInternal ? "bg-yellow-50 border border-yellow-200" :
                    m.sender?.role === "CUSTOMER_CARE" || m.sender?.role === "ADMIN" ? "bg-gray-100" : "bg-blue-50"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm">{m.sender?.name || "Unknown"}</span>
                      {m.isInternal && <Badge variant="outline" className="text-xs">Internal</Badge>}
                      <span className="text-xs text-gray-400">{new Date(m.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm">{m.message}</p>
                  </div>
                </div>
              ))}
              {(!ticket.messages || ticket.messages.length === 0) && (
                <p className="text-center text-gray-400 py-8">No messages yet</p>
              )}
            </div>

            <div className="space-y-3">
              <Textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Type your message..." rows={3} />
              <div className="flex items-center gap-2">
                <input type="checkbox" id="internal" checked={isInternal} onChange={(e) => setIsInternal(e.target.checked)} className="rounded" />
                <label htmlFor="internal" className="text-sm text-gray-600">Internal note</label>
                <Button onClick={handleSend} disabled={sending} className="ml-auto">
                  <Send className="w-4 h-4 mr-2" /> Send
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Status</h2>
            <Select onValueChange={handleStatusChange} defaultValue={ticket.status}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="WAITING_CUSTOMER">Waiting Customer</SelectItem>
                <SelectItem value="WAITING_MERCHANT">Waiting Merchant</SelectItem>
                <SelectItem value="RESOLVED">Resolved</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-4">Details</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Category</span><span>{ticket.category?.replace(/_/g, " ")}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Customer</span><span>{ticket.customer?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Created</span><span>{new Date(ticket.createdAt).toLocaleDateString()}</span></div>
              {ticket.assignedTo && <div className="flex justify-between"><span className="text-gray-500">Assigned to</span><span>{ticket.assignedTo.name}</span></div>}
              {ticket.resolvedAt && <div className="flex justify-between"><span className="text-gray-500">Resolved</span><span>{new Date(ticket.resolvedAt).toLocaleDateString()}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
