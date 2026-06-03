"use client";

import { useEffect, useState } from "react";
import { fetchCreditScore } from "@/server/actions/credit-score-actions";

export default function CreditScorePage() {
  const [data, setData] = useState<{ score: number; rating: string; factors: { factor: string; impact: string }[] } | null>(null);

  useEffect(() => { fetchCreditScore().then(setData); }, []);

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Credit Score</h1>
      <div className="text-center border rounded-lg p-8 mb-6">
        <p className="text-5xl font-bold text-green-600">{data.score}</p>
        <p className="text-gray-500 mt-2">{data.rating} (out of 900)</p>
      </div>
      <h2 className="font-semibold mb-3">Factors</h2>
      <div className="space-y-2">
        {data.factors.map((f, i) => (
          <div key={i} className="flex justify-between border rounded p-3">
            <span>{f.factor}</span>
            <span className={f.impact === "POSITIVE" ? "text-green-600" : "text-yellow-600"}>{f.impact}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
