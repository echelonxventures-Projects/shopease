"use client";

import { TrendingUp, TrendingDown, Minus, Package } from "lucide-react";

interface TopProduct {
  id: string;
  name: string;
  image?: string;
  unitsSold: number;
  revenue: number;
  trend?: "up" | "down" | "stable";
  trendPercent?: number;
}

interface TopProductsProps {
  products: TopProduct[];
}

function TrendArrow({
  trend,
  percent,
}: {
  trend?: string;
  percent?: number;
}) {
  if (!trend || trend === "stable") {
    return (
      <span className="flex items-center gap-0.5 text-xs text-gray-400">
        <Minus className="w-3 h-3" />
      </span>
    );
  }
  if (trend === "up") {
    return (
      <span className="flex items-center gap-0.5 text-xs text-green-600 font-medium">
        <TrendingUp className="w-3.5 h-3.5" />
        {percent != null && `+${percent}%`}
      </span>
    );
  }
  return (
    <span className="flex items-center gap-0.5 text-xs text-red-500 font-medium">
      <TrendingDown className="w-3.5 h-3.5" />
      {percent != null && `-${percent}%`}
    </span>
  );
}

export function TopProducts({ products }: TopProductsProps) {
  if (!products.length) {
    return (
      <div className="bg-white rounded-xl border p-6">
        <h3 className="text-lg font-semibold mb-4">Top Products</h3>
        <div className="flex items-center justify-center h-48 text-gray-400">
          No sales data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Top Products</h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-3 font-medium w-10">#</th>
              <th className="pb-3 font-medium">Product</th>
              <th className="pb-3 font-medium text-right">Units Sold</th>
              <th className="pb-3 font-medium text-right">Revenue</th>
              <th className="pb-3 font-medium text-right">Trend</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product, index) => (
              <tr
                key={product.id}
                className="border-b last:border-0 hover:bg-gray-50 transition-colors"
              >
                <td className="py-3">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      index === 0
                        ? "bg-yellow-100 text-yellow-700"
                        : index === 1
                          ? "bg-gray-100 text-gray-600"
                          : index === 2
                            ? "bg-amber-100 text-amber-700"
                            : "bg-gray-50 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="py-3">
                  <div className="flex items-center gap-3">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center">
                        <Package className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                    <span className="font-medium text-gray-900 truncate max-w-[200px]">
                      {product.name}
                    </span>
                  </div>
                </td>
                <td className="py-3 text-right font-medium">
                  {product.unitsSold.toLocaleString("en-IN")}
                </td>
                <td className="py-3 text-right font-medium text-green-600">
                  &#8377;{product.revenue.toLocaleString("en-IN")}
                </td>
                <td className="py-3 text-right">
                  <TrendArrow
                    trend={product.trend}
                    percent={product.trendPercent}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
