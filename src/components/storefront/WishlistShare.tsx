"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { shareWishlist, revokeWishlistShare } from "@/server/actions/wishlist-actions";
import { Share2, Copy, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface WishlistShareProps {
  className?: string;
}

export function WishlistShare({ className }: WishlistShareProps) {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if user already has a share token stored client-side
    const stored = localStorage.getItem("wishlist-share-token");
    if (stored) setToken(stored);
  }, []);

  const handleShare = async () => {
    setLoading(true);
    try {
      const data = await shareWishlist();
      setToken(data.token);
      localStorage.setItem("wishlist-share-token", data.token);
      toast.success("Wishlist share link generated!");
    } catch {
      toast.error("Failed to generate share link");
    } finally {
      setLoading(false);
    }
  };

  const handleRevoke = async () => {
    setLoading(true);
    try {
      await revokeWishlistShare();
      setToken(null);
      localStorage.removeItem("wishlist-share-token");
      toast.success("Wishlist sharing revoked");
    } catch {
      toast.error("Failed to revoke sharing");
    } finally {
      setLoading(false);
    }
  };

  const shareUrl = token ? `${typeof window !== "undefined" ? window.location.origin : ""}/wishlist/share/${token}` : "";

  return (
    <div className={className}>
      {token ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 border rounded-md px-3 py-2 text-sm bg-gray-50"
              aria-label="Wishlist share URL"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied to clipboard");
              }}
              aria-label="Copy share link"
            >
              <Copy className="w-4 h-4" />
            </Button>
          </div>
          <Button size="sm" variant="destructive" onClick={handleRevoke} disabled={loading}>
            <Ban className="w-4 h-4 mr-1" /> Revoke Access
          </Button>
        </div>
      ) : (
        <Button size="sm" onClick={handleShare} disabled={loading}>
          <Share2 className="w-4 h-4 mr-1" /> Share My Wishlist
        </Button>
      )}
    </div>
  );
}
