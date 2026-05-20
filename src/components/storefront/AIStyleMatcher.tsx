"use client";

import { useState } from "react";
import { Camera, Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AIStyleMatcherProps {
  productId?: string;
}

export function AIStyleMatcher({ productId }: AIStyleMatcherProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleImageUpload = async (file: File) => {
    setAnalyzing(true);
    setError(null);
    setResults([]);

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // Extract just the base64 data
      const data = base64.split(",")[1] || base64;

      const res = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "image", data }),
      });

      const result = await res.json();

      if (result.tags?.length > 0) {
        // Fetch products matching the detected tags
        const searchRes = await fetch(`/api/v1/products?q=${encodeURIComponent(result.tags[0])}`);
        const products = await searchRes.json();
        setResults(Array.isArray(products) ? products.slice(0, 4) : []);
      }
    } catch (err: any) {
      setError(err.message || "Analysis failed");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="border rounded-lg p-4" role="region" aria-label="Style matcher">
      <h3 className="font-medium text-sm mb-3 flex items-center gap-2">
        <Camera className="w-4 h-4 text-violet-600" />
        AI Style Matcher
      </h3>
      <p className="text-xs text-gray-500 mb-3">Upload a photo to find visually similar products</p>

      <div className="flex gap-2 mb-3">
        <label className="flex-1 border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:bg-gray-50 cursor-pointer transition-colors">
          <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
          <p className="text-xs text-gray-500">Upload photo</p>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
            aria-label="Upload image for style matching"
          />
        </label>
      </div>

      {analyzing && (
        <div className="flex items-center gap-2 text-sm text-gray-500" role="status">
          <Loader2 className="w-4 h-4 animate-spin" />
          Analyzing style...
        </div>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {results.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mt-3" role="list" aria-label="Similar products">
          {results.map((p: any) => (
            <div key={p.id} className="border rounded p-2 text-sm" role="listitem">
              <p className="truncate">{p.name}</p>
              <p className="font-bold text-violet-600">₹{Number(p.price).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
