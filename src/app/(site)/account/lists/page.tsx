"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { getLists, deleteList, shareList } from "@/server/actions/list-actions";

import { List, Trash2, Share2, Loader2 } from "lucide-react";
import { CreateListDialog } from "@/components/storefront/CreateListDialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetch = () => {
    getLists()
      .then(setLists)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetch(); }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this list and all its items?")) return;
    setDeleting(id);
    await deleteList(id);
    toast.success("List deleted");
    fetch();
    setDeleting(null);
  };

  const handleShare = async (id: string) => {
    try {
      const result = await shareList(id);
      const url = `${window.location.origin}${result.url}`;
      await navigator.clipboard.writeText(url);
      toast.success("Share link copied to clipboard");
    } catch { toast.error("Failed to share"); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">My Lists</span>
      </div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <List className="w-6 h-6" /> My Lists
        </h1>
        <CreateListDialog onCreated={() => fetch()} />
      </div>

      {lists.length === 0 ? (
        <div className="text-center py-16">
          <List className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg mb-4">You haven&apos;t created any lists yet</p>
          <CreateListDialog onCreated={() => fetch()} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <div key={list.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition">
              <Link href={`/account/lists/${list.id}`} className="block p-4">
                <h3 className="font-bold text-lg">{list.name}</h3>
                {list.description && <p className="text-sm text-gray-500 mt-1">{list.description}</p>}
                <p className="text-sm text-gray-400 mt-2">{list._count?.items ?? 0} items</p>
                {list.isPublic && <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded mt-2 inline-block">Shared</span>}
              </Link>
              <div className="flex border-t divide-x">
                <button onClick={() => handleShare(list.id)} className="flex-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-1">
                  <Share2 className="w-4 h-4" /> Share
                </button>
                <button
                  onClick={() => handleDelete(list.id)}
                  disabled={deleting === list.id}
                  className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-4 h-4" /> {deleting === list.id ? "..." : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
