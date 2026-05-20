"use client";

import { useEffect, useState } from "react";
import { getRFQ, getRFQResponses, acceptRFQResponse } from "@/server/actions/rfq-actions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Check, Star } from "lucide-react";
import { toast } from "sonner";
import { useParams } from "next/navigation";

const STATUS_COLORS: Record<string, string> = {
  OPEN: "bg-green-100 text-green-800",
  IN_REVIEW: "bg-yellow-100 text-yellow-800",
  AWARDED: "bg-blue-100 text-blue-800",
  CLOSED: "bg-gray-100 text-gray-800",
  CANCELLED: "bg-red-100 text-gray-800",
};

export default function RFQDetailPage() {
  const params = useParams();
  const rfqId = params.id as string;
  const [rfq, setRfq] = useState<any>(null);
  const [responses, setResponses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getRFQ(rfqId), getRFQResponses(rfqId)])
      .then(([r, res]) => { setRfq(r); setResponses(res); setLoading(false); })
      .catch(() => setLoading(false));
  }, [rfqId]);

  async function handleAccept(responseId: string) {
    if (!confirm("Accept this vendor response? Other responses will be rejected.")) return;
    const result = await acceptRFQResponse(rfqId, responseId);
    if ((result as any)?.error) {
      toast.error("Failed to accept response");
    } else {
      toast.success("Response accepted!");
      getRFQ(rfqId).then(setRfq).catch(() => {});
      getRFQResponses(rfqId).then(setResponses).catch(() => {});
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!rfq) return <div className="text-center py-20">RFQ not found.</div>;

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">{rfq.title}</h1>
          <Badge className={STATUS_COLORS[rfq.status] || "bg-gray-100 text-gray-800"}>{rfq.status}</Badge>
          <Badge variant="outline">{rfq.category}</Badge>
          <Badge className="bg-blue-100 text-blue-800">{rfq.priority}</Badge>
        </div>
        {rfq.description && <p className="text-gray-500 mt-2">{rfq.description}</p>}
        <div className="flex gap-6 mt-4 text-sm text-gray-500">
          <span>Created: {new Date(rfq.createdAt).toLocaleDateString()}</span>
          {rfq.deadline && <span>Deadline: {new Date(rfq.deadline).toLocaleDateString()}</span>}
          <span>Currency: {rfq.currency}</span>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Items ({rfq.items?.length || 0})</TabsTrigger>
          <TabsTrigger value="responses">Responses ({responses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="items">
          <Card className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>#</TableHead>
                  <TableHead>Product</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Target Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rfq.items?.map((item: any, i: number) => (
                  <TableRow key={item.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell className="font-medium">{item.productName}</TableCell>
                    <TableCell>{item.quantity} {item.unitOfMeasure}</TableCell>
                    <TableCell>{item.unitOfMeasure}</TableCell>
                    <TableCell>{item.targetPrice ? `${rfq.currency} ${Number(item.targetPrice).toLocaleString()}` : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="responses">
          {responses.length === 0 ? (
            <Card className="mt-4 py-12 text-center text-gray-400">
              No vendor responses yet
            </Card>
          ) : (
            <div className="mt-4 space-y-4">
              {/* Comparison table */}
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Seller</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Delivery Days</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((resp) => (
                      <TableRow key={resp.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{resp.seller?.businessName}</p>
                            {resp.seller?.gstin && <p className="text-xs text-gray-500">GSTIN: {resp.seller.gstin}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span>{resp.seller?.rating || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-bold">{resp.currency} {Number(resp.totalAmount).toLocaleString()}</TableCell>
                        <TableCell>
                          {resp.items?.reduce((min: number, item: any) => Math.min(min, item.deliveryDays || 999), 999) === 999
                            ? "—"
                            : resp.items?.reduce((min: number, item: any) => Math.min(min, item.deliveryDays || 999), 999) + " days"}
                        </TableCell>
                        <TableCell>
                          <Badge>{resp.status}</Badge>
                        </TableCell>
                        <TableCell>
                          {resp.status === "SUBMITTED" && rfq.status === "OPEN" && (
                            <Button size="sm" onClick={() => handleAccept(resp.id)}>
                              <Check className="w-3 h-3 mr-1" /> Accept
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Line item details per response */}
              {responses.map((resp) => (
                <Card key={resp.id}>
                  <CardHeader>
                    <CardTitle className="text-base">{resp.seller?.businessName} — Line Items</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Product</TableHead>
                          <TableHead>Qty</TableHead>
                          <TableHead>Unit Price</TableHead>
                          <TableHead>Discount</TableHead>
                          <TableHead>Delivery</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {resp.items?.map((item: any) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell>{item.quantity}</TableCell>
                            <TableCell>{resp.currency} {Number(item.unitPrice).toLocaleString()}</TableCell>
                            <TableCell>{item.discount ? `${Number(item.discount)}%` : "—"}</TableCell>
                            <TableCell>{item.deliveryDays ? `${item.deliveryDays} days` : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
