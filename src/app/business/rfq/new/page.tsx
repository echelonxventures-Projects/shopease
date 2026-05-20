"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRFQ } from "@/server/actions/rfq-actions";
import { getMyBusiness } from "@/server/actions/business-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = [
  "Electronics", "Industrial Supplies", "Office Products", "Raw Materials",
  "Machinery", "Packaging", "Chemicals", "Textiles", "Other",
];

const PRIORITIES = [
  { value: "LOW", label: "Low" },
  { value: "MEDIUM", label: "Medium" },
  { value: "HIGH", label: "High" },
  { value: "URGENT", label: "Urgent" },
];

const UNITS = ["PIECE", "KG", "LB", "BOX", "PACK", "LOT", "SET", "METER", "LITER", "TON"];

export default function NewRFQPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "MEDIUM",
    deadline: "",
    currency: "INR",
  });
  const [items, setItems] = useState<Array<{
    productName: string;
    description: string;
    quantity: string;
    unitOfMeasure: string;
    targetPrice: string;
    notes: string;
  }>>([{ productName: "", description: "", quantity: "", unitOfMeasure: "PIECE", targetPrice: "", notes: "" }]);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  function addItem() {
    setItems([...items, { productName: "", description: "", quantity: "", unitOfMeasure: "PIECE", targetPrice: "", notes: "" }]);
  }

  function removeItem(index: number) {
    setItems(items.filter((_, i) => i !== index));
  }

  function updateItem(index: number, key: string, value: string) {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [key]: value };
    setItems(newItems);
  }

  async function handleSubmit() {
    if (!form.title || items.some((i) => !i.productName || !i.quantity)) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);
    try {
      const business = await getMyBusiness();
      if (!business) { toast.error("No business profile"); return; }

      const result = await createRFQ({
        businessId: business.id,
        title: form.title,
        description: form.description,
        category: form.category,
        priority: form.priority,
        deadline: form.deadline ? new Date(form.deadline) : undefined,
        currency: form.currency,
        items: items.map((i) => ({
          productName: i.productName,
          description: i.description,
          quantity: Number(i.quantity),
          unitOfMeasure: i.unitOfMeasure,
          targetPrice: i.targetPrice ? Number(i.targetPrice) : undefined,
          notes: i.notes,
        })),
      });

      if ((result as any)?.error) {
        toast.error("Failed to create RFQ");
      } else {
        toast.success("RFQ created successfully");
        router.push("/business/rfq");
      }
    } catch {
      toast.error("Failed to create RFQ");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Create New RFQ</h1>

      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <Label>Title *</Label>
          <Input value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="e.g., Bulk Order - Office Supplies Q2" />
        </div>
        <div>
          <Label>Description</Label>
          <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Describe your requirements..." />
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => v && update("category", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={form.priority} onValueChange={(v) => v && update("priority", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Deadline</Label>
            <Input type="date" value={form.deadline} onChange={(e) => update("deadline", e.target.value)} />
          </div>
        </div>

        {/* Items table */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label className="text-base">Items</Label>
            <Button variant="outline" size="sm" onClick={addItem}><Plus className="w-3 h-3 mr-1" /> Add Item</Button>
          </div>
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Target Price</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Input value={item.productName} onChange={(e) => updateItem(i, "productName", e.target.value)} placeholder="Product name" className="w-48" />
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={item.quantity} onChange={(e) => updateItem(i, "quantity", e.target.value)} placeholder="0" className="w-20" />
                    </TableCell>
                    <TableCell>
                      <Select value={item.unitOfMeasure} onValueChange={(v) => v && updateItem(i, "unitOfMeasure", v)}>
                        <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {UNITS.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Input type="number" value={item.targetPrice} onChange={(e) => updateItem(i, "targetPrice", e.target.value)} placeholder="0.00" className="w-24" />
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removeItem(i)} disabled={items.length === 1}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creating..." : "Submit RFQ"}
          </Button>
        </div>
      </div>
    </div>
  );
}
