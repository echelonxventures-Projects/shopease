"use client";

import { useEffect, useState } from "react";
import { getMyRFQs } from "@/server/actions/rfq-actions";
import { getMyBusiness } from "@/server/actions/business-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Plus } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  AWARDED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-red-800",
};

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "bg-gray-100 text-gray-600",
  MEDIUM: "bg-blue-100 text-blue-600",
  HIGH: "bg-orange-100 text-orange-600",
  URGENT: "bg-red-100 text-red-600",
};

export default function RFQListPage() {
  const [business, setBusiness] = useState<any>(null);
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMyBusiness().then((b) => {
      setBusiness(b);
      if (b?.id) getMyRFQs(b.id).then(setRfqs).catch(() => {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!business) return <div className="text-center py-20">No business profile found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Requests for Quote</h1>
          <p className="text-gray-500 mt-1">Create and manage RFQs for suppliers</p>
        </div>
        <Link href="/business/rfq/new"><Button><Plus className="w-4 h-4 mr-2" /> New RFQ</Button></Link>
      </div>

      {rfqs.length === 0 ? (
        <Card>
          <div className="py-12 text-center text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No RFQs yet</p>
            <p className="text-sm mt-1">Create your first RFQ to start getting quotes from suppliers.</p>
            <Link href="/business/rfq/new"><Button className="mt-4">Create RFQ</Button></Link>
          </div>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Responses</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Deadline</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rfqs.map((rfq) => (
                <TableRow key={rfq.id} className="cursor-pointer hover:bg-gray-50">
                  <Link href={`/business/rfq/${rfq.id}`} className="contents">
                    <TableCell className="font-medium">{rfq.title}</TableCell>
                    <TableCell>{rfq.category || "—"}</TableCell>
                    <TableCell>
                      <Badge className={PRIORITY_COLORS[rfq.priority] || "bg-gray-100 text-gray-600"}>
                        {rfq.priority}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={STATUS_COLORS[rfq.status] || "bg-gray-100 text-gray-800"}>
                        {rfq.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{rfq._count?.items || 0}</TableCell>
                    <TableCell>{rfq._count?.responses || 0}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {new Date(rfq.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : "—"}
                    </TableCell>
                  </Link>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
