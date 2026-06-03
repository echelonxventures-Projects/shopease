"use client";

import { useState, useEffect } from "react";
import { listFAQs, createFAQ, updateFAQ, deleteFAQ } from "@/server/actions/commerce-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const CATEGORIES = ["SHIPPING", "PAYMENT", "RETURNS", "PRODUCTS", "GENERAL"];

export default function AdminFAQPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [faqs, setFaqs] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ category: "GENERAL", question: "", answer: "" });
  const [loading, setLoading] = useState(false);

  useEffect(() => { listFAQs().then(setFaqs).catch(() => {}); }, []);

  const handleSubmit = async () => {
    if (!form.question.trim() || !form.answer.trim()) return;
    setLoading(true);
    try {
      if (editingId) {
        await updateFAQ(editingId, form);
        toast.success("FAQ updated");
      } else {
        await createFAQ(form);
        toast.success("FAQ created");
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ category: "GENERAL", question: "", answer: "" });
      load();
    } catch {
      toast.error("Failed to save");
    } finally {
      setLoading(false);
    }
  };

  const load = () => listFAQs().then(setFaqs).catch(() => {});

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this FAQ?")) return;
    await deleteFAQ(id);
    toast.success("Deleted");
    load();
  };

  const grouped = CATEGORIES.map((cat) => ({
    category: cat,
    items: faqs.filter((f) => f.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">FAQ Management</h1>
        <Button onClick={() => setShowForm(true)}>
          <Plus className="w-4 h-4 mr-2" /> Add FAQ
        </Button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg p-6 shadow mb-6 space-y-4">
          <h3 className="font-bold">{editingId ? "Edit FAQ" : "New FAQ"}</h3>
          <div>
            <label className="text-sm font-medium mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="border rounded-md p-2 w-full"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Question</label>
            <Input value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} placeholder="Frequently asked question" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Answer</label>
            <textarea value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} placeholder="Answer to the question" className="w-full border rounded-md p-2 text-sm min-h-[80px] resize-y" />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading}>{editingId ? "Update" : "Create"}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); setEditingId(null); }}>Cancel</Button>
          </div>
        </div>
      )}

      {grouped.map((group) => (
        <div key={group.category} className="mb-6">
          <h2 className="text-lg font-bold text-gray-700 mb-3">{group.category}</h2>
          <div className="space-y-2">
            {group.items.map((faq) => (
              <div key={faq.id} className="bg-white rounded-lg p-4 shadow flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-semibold">{faq.question}</p>
                  <p className="text-sm text-gray-600 mt-1">{faq.answer}</p>
                  <span className={`text-xs px-2 py-0.5 rounded ${faq.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {faq.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm" onClick={() => { setForm({ category: faq.category, question: faq.question, answer: faq.answer }); setEditingId(faq.id); setShowForm(true); }}>
                    <Pencil className="w-3 h-3" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDelete(faq.id)}>
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {faqs.length === 0 && (
        <div className="text-center py-12 text-gray-500">No FAQs yet. Add your first one!</div>
      )}
    </div>
  );
}
