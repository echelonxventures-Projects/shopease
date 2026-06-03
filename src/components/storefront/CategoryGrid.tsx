"use client";

import Link from "next/link";
import { Package } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
  image?: string;
  itemCount?: number;
}

interface CategoryGridProps {
  categories: Category[];
  columns?: number;
}

export function CategoryGrid({ categories, columns = 6 }: CategoryGridProps) {
  if (!categories.length) return null;

  const gridCols: Record<number, string> = {
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    6: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6",
    8: "grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8",
  };

  return (
    <div className={`grid ${gridCols[columns] || gridCols[6]} gap-4`}>
      {categories.map((category) => (
        <Link
          key={category.id}
          href={`/category/${category.slug}`}
          className="group flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-gray-50 transition-colors"
        >
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gray-100 ring-2 ring-transparent group-hover:ring-blue-200 transition-all relative">
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-300">
                <Package className="w-8 h-8" />
              </div>
            )}
            {category.itemCount != null && category.itemCount > 0 && (
              <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {category.itemCount > 999
                  ? `${Math.round(category.itemCount / 1000)}k`
                  : category.itemCount}
              </span>
            )}
          </div>
          <div className="text-center">
            <span className="text-xs md:text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors line-clamp-2">
              {category.name}
            </span>
            {category.itemCount != null && (
              <p className="text-[10px] text-gray-400 mt-0.5">
                {category.itemCount} {category.itemCount === 1 ? "item" : "items"}
              </p>
            )}
          </div>
        </Link>
      ))}
    </div>
  );
}
