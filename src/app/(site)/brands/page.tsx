import Link from "next/link";
import { getBrands } from "@/server/actions/product-actions";
import { getProducts } from "@/server/actions/product-actions";

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Shop by Brand</h1>
      <p className="text-gray-500 mb-8">Browse products from your favorite brands</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {brands.map((brand: any) => (
          <Link
            key={brand.id}
            href={`/brands/${brand.slug}`}
            className="group bg-white border rounded-xl p-6 flex flex-col items-center text-center hover:shadow-lg transition"
          >
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4 group-hover:bg-gray-200 transition">
              {brand.logo ? (
                <img src={brand.logo} alt={brand.name} className="w-16 h-16 rounded-full object-cover" />
              ) : (
                <span className="text-3xl font-bold text-gray-400">{brand.name[0]}</span>
              )}
            </div>
            <h3 className="font-semibold text-sm group-hover:text-blue-600">{brand.name}</h3>
          </Link>
        ))}
      </div>

      {brands.length === 0 && (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">No brands available yet</p>
        </div>
      )}
    </div>
  );
}
