"use client";



export function CategoryStripe({ categories, selectedCategoryId, onSelect }: {
  categories: { id: string; name: string; image?: string }[];
  selectedCategoryId?: string;
  onSelect?: (id: string) => void;
}) {
  if (categories.length === 0) return null;

  return (
    <div className="border-b bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
          <button
            onClick={() => onSelect?.("")}
            className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition ${
              !selectedCategoryId
                ? "bg-gray-900 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onSelect?.(cat.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition flex items-center gap-2 ${
                selectedCategoryId === cat.id
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {cat.image && (
                <img src={cat.image} alt={cat.name} className="w-5 h-5 object-contain" />
              )}
              {cat.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
