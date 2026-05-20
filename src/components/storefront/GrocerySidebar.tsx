"use client";

import Link from "next/link";

export function GrocerySidebar({ category, subcategories, selectedSubcategoryId, onSelect }: {
  category?: { id: string; name: string; slug: string };
  subcategories: any[];
  selectedSubcategoryId?: string;
  onSelect?: (id: string) => void;
}) {
  if (subcategories.length === 0 && !category) return null;

  return (
    <div className="w-56 shrink-0 bg-white border rounded-lg p-3">
      {category && (
        <div className="font-bold text-sm mb-3 pb-2 border-b">{category.name}</div>
      )}
      <nav className="space-y-0.5">
        {subcategories.map((sub) => (
          <button
            key={sub.id}
            onClick={() => onSelect?.(sub.id)}
            className={`block w-full text-left px-2 py-1.5 rounded text-sm transition ${
              selectedSubcategoryId === sub.id
                ? "bg-gray-900 text-white font-medium"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {sub.name}
            {sub._count?.products && (
              <span className="text-xs text-gray-400 ml-1">({sub._count.products})</span>
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
