"use client";

import { useState, useEffect, useRef } from "react";
import { getLists, addProductToList } from "@/server/actions/list-actions";
import { Button } from "@/components/ui/button";
import { List, Plus } from "lucide-react";
import { toast } from "sonner";

export function AddToListButton({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<{ id: string; name: string; _count?: { items: number } }[]>([]);
  const [_loading, _setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    getLists().then(setLists).catch(() => setLists([]));
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleAdd = async (listId: string) => {
    const result = await addProductToList(listId, productId);
    if ("error" in result && result.error) { toast.error(result.error as string); return; }
    toast.success("Added to list");
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <Button
        size="sm"
        variant="ghost"
        className="w-full flex items-center justify-center gap-1"
        onClick={() => setOpen(!open)}
      >
        <List className="w-4 h-4" /> Add to List
      </Button>
      {open && (
        <div className="absolute bottom-full left-0 w-full mb-1 bg-white border rounded-lg shadow-lg z-10 overflow-hidden">
          {lists.length === 0 ? (
            <p className="p-3 text-sm text-gray-500 text-center">No lists yet</p>
          ) : (
            lists.map((list) => (
              <button
                key={list.id}
                onClick={() => handleAdd(list.id)}
                className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center justify-between"
              >
                <span>{list.name}</span>
                <span className="text-xs text-gray-400">{list._count?.items ?? 0} items</span>
              </button>
            ))
          )}
          <div className="border-t">
            <button className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 text-blue-600 flex items-center gap-1">
              <Plus className="w-3 h-3" /> Create New List
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
