"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export function BannerSlider({ banners }: { banners: { title: string; description?: string | null; link?: string | null }[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners.length]);

  if (banners.length === 0) return null;

  return (
    <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-16 md:py-24">
        <div className="text-center text-white">
          <h1 className="text-3xl md:text-5xl font-bold mb-4">{banners[current].title}</h1>
          {banners[current].description && (
            <p className="text-lg md:text-xl opacity-90 mb-6">{banners[current].description}</p>
          )}
          {banners[current].link && (
            <Link
              href={banners[current].link}
              className="inline-block bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100"
            >
              Shop Now
            </Link>
          )}
        </div>
      </div>
      {banners.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {banners.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-3 h-3 rounded-full ${i === current ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
