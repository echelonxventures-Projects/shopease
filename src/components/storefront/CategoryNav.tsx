"use client";

import Link from "next/link";

export function CategoryNav({ categories }: { categories: { id: string; slug: string; name: string; image?: string | null }[] }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {categories
        .filter((cat, index, self) => index === self.findIndex((c) => c.id === cat.id))
        .map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.slug}`}
          className="shrink-0 text-center px-4 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 min-w-[100px]"
        >
          <div className="text-2xl mb-1">
            {cat.image ? <img src={cat.image} alt={cat.name} className="w-10 h-10 mx-auto" /> : "📁"}
          </div>
          <span className="text-sm font-medium">{cat.name}</span>
        </Link>
      ))}
    </div>
  );
}
