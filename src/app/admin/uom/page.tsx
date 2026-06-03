"use client";

import { useEffect, useState } from "react";
import { getAllUoms, getUomConversions } from "@/server/actions/product-catalog-actions";
import { Badge } from "@/components/ui/badge";


export default function UomPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [uoms, setUoms] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- server action return type
  const [conversions, setConversions] = useState<any[]>([]);

  useEffect(() => {
    Promise.all([getAllUoms(), getUomConversions()])
      .then(([u, c]) => { setUoms(u); setConversions(c); })
      .catch(() => {});
  }, []);

  const byCategory: Record<string, any[]> = {};
  for (const u of uoms) {
    if (!byCategory[u.category]) byCategory[u.category] = [];
    byCategory[u.category].push(u);
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Unit of Measure Management</h1>

      {/* UOM List by Category */}
      <div className="space-y-6">
        {Object.entries(byCategory).map(([cat, units]) => (
          <div key={cat} className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
              <Badge>{cat}</Badge>
              {units.length} unit{units.length > 1 ? "s" : ""}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {units.map((u) => (
                <div key={u.code} className="border rounded-lg p-3 flex justify-between items-center">
                  <div>
                    <div className="font-semibold">{u.name}</div>
                    <div className="text-xs text-gray-500">{u.code}</div>
                  </div>
                  <Badge variant="secondary">{u.symbol}</Badge>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Conversion Rules */}
      <div className="bg-white rounded-lg shadow p-6 mt-6">
        <h2 className="text-lg font-bold mb-3">Conversion Rules ({conversions.length})</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {conversions.map((c) => (
            <div key={`${c.fromUomId}-${c.toUomId}`} className="border rounded-lg p-3 text-sm">
              <span className="font-semibold">{c.fromUom?.name} ({c.fromUom?.code})</span>
              <span className="mx-2 text-gray-400">→</span>
              <span className="font-semibold">{c.toUom?.name} ({c.toUom?.code})</span>
              <div className="text-xs text-gray-500 mt-1">× {Number(c.factor)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
