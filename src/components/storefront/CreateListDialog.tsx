"use client";

import { useState } from "react";
import { createList } from "@/server/actions/list-actions";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";

export function CreateListDialog({ onCreated }: { onCreated: (name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const result = await createList({ name: name.trim(), description: description.trim() || undefined });
      if ("error" in result && result.error) { toast.error(result.error as string); return; }
      toast.success("List created");
      setName("");
      setDescription("");
      setOpen(false);
      onCreated(("name" in result ? result.name : name.trim()) as string);
    } catch { toast.error("Failed to create list"); }
    finally { setSaving(false); }
  };

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)}>
        <Plus className="w-4 h-4 mr-2" /> Create List
      </Button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">Create New List</h3>
          <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">List Name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Birthday Gifts"
              className="border rounded-md px-3 py-2 w-full"
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What is this list for?"
              className="border rounded-md px-3 py-2 w-full h-20 resize-none"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={saving || !name.trim()}>
              {saving ? "Creating..." : "Create List"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
