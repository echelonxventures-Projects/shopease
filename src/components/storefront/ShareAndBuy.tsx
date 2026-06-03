"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { recordShare } from "@/server/actions/commerce-actions";
import { addToCart } from "@/server/actions/cart-actions";
import { Button } from "@/components/ui/button";
import { Share2, Copy, MessageCircle, Mail, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

interface OneClickBuyProps {
  productId: string;
  productName: string;
  price: number;
}

export function OneClickBuy({ productId, productName, price }: OneClickBuyProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleBuy = async () => {
    setLoading(true);
    try {
      // Add single item to cart
      await addToCart(productId, 1, undefined);
      // Navigate to checkout
      router.push("/checkout");
    } catch {
      toast.error("Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button onClick={handleBuy} disabled={loading} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 mr-2" />}
      Buy Now — ₹{price.toLocaleString("en-IN")}
    </Button>
  );
}

interface SocialShareButtonsProps {
  productId: string;
  productName: string;
  url?: string;
}

export function SocialShareButtons({ productId, productName, url }: SocialShareButtonsProps) {
  const productUrl = url || `${typeof window !== "undefined" ? window.location.origin : ""}/products/${productId}`;
  const [sharing, setSharing] = useState<string | null>(null);

  const share = async (platform: string) => {
    setSharing(platform);
    try {
      await recordShare(productId, platform);

      if (platform === "copy") {
        navigator.clipboard?.writeText(productUrl);
        toast.success("Link copied to clipboard!");
      } else if (platform === "twitter") {
        window.open(`https://twitter.com/intent/tweet?text=Check out ${productName}&url=${encodeURIComponent(productUrl)}`);
      } else if (platform === "whatsapp") {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${productName} — ${productUrl}`)}`);
      } else if (platform === "email") {
        window.open(`mailto:?subject=Check out ${productName}&body=${productUrl}`);
      }
      toast.success("Share recorded!");
    } catch {
      toast.error("Failed to share");
    } finally {
      setSharing(null);
    }
  };

    const platforms = [
      { key: "twitter", icon: () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>, label: "Twitter" },
      { key: "whatsapp", icon: MessageCircle, label: "WhatsApp" },
      { key: "email", icon: Mail, label: "Email" },
      { key: "copy", icon: Copy, label: "Copy Link" },
    ];

  return (
    <div className="flex items-center gap-2">
      <Share2 className="w-4 h-4 text-gray-500" />
      {platforms.map((p) => {
        const IconComponent = typeof p.icon === "function" ? p.icon : p.icon;
        return (
          <Button key={p.key} variant="outline" size="sm" onClick={() => share(p.key)} disabled={sharing !== null}>
            {sharing === p.key ? <Loader2 className="w-3 h-3 animate-spin" /> : <IconComponent className="w-4 h-4" />}
          </Button>
        );
      })}
    </div>
  );
}
