"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BarChart3, Calculator, TrendingUp, Search, Eye } from "lucide-react";

export default function DataAnalysisPage() {
  const [operation, setOperation] = useState("stats");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [input, setInput] = useState("");

  const operations = [
    { key: "stats", label: "Statistics", icon: Calculator },
    { key: "explore", label: "Data Explorer", icon: Search },
    { key: "regression", label: "Trend Analysis", icon: TrendingUp },
    { key: "distribution", label: "Distribution", icon: BarChart3 },
  ];

  const handleRun = async () => {
    setLoading(true);
    try {
      let body: any = { operation };

      switch (operation) {
        case "stats":
          body.values = input.split(",").map((s: string) => parseFloat(s.trim()));
          break;
        case "explore":
          body.table = input;
          body.limit = 100;
          break;
        case "regression":
          body.values = input.split(",").map((s: string) => parseFloat(s.trim()));
          break;
        case "distribution":
          body.values = input.split(",").map((s: string) => parseFloat(s.trim()));
          body.bins = 10;
          break;
        case "predictive":
          body.metric = input || "orders";
          body.days = 30;
          break;
      }

      const res = await fetch("/api/ai/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      setResult(data);
      toast.success("Analysis complete");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Data Analysis & Visualization</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Operations</h2>
          <div className="space-y-2 mb-4">
            {operations.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setOperation(key)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                  operation === key ? "bg-violet-100 text-violet-700" : "hover:bg-gray-100"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <Label>Input Data</Label>
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  operation === "explore" ? "Table name (e.g., Order)" :
                  "Comma-separated numbers (1,2,3,4,5)"
                }
                className="mt-1"
              />
            </div>
            <Button onClick={handleRun} disabled={loading} className="w-full">
              <Eye className="w-4 h-4 mr-2" />
              {loading ? "Analyzing..." : "Run Analysis"}
            </Button>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4">Results</h2>

          {!result && (
            <p className="text-gray-500 text-sm">Select an operation and enter data to begin analysis.</p>
          )}

          {result && (
            <div className="space-y-4">
              {operation === "stats" && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {Object.entries(result).map(([key, value]) => (
                    <div key={key} className="border rounded p-3">
                      <div className="text-xs text-gray-500 capitalize">{key}</div>
                      <div className="text-lg font-bold">{typeof value === "number" ? (value as number).toFixed(2) : String(value)}</div>
                    </div>
                  ))}
                </div>
              )}

              {operation === "regression" && (
                <div className="space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500">Direction</div>
                      <div className="text-lg font-bold">{result.direction}</div>
                    </div>
                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500">Slope</div>
                      <div className="text-lg font-bold">{result.slope}</div>
                    </div>
                    <div className="border rounded p-3">
                      <div className="text-xs text-gray-500">R²</div>
                      <div className="text-lg font-bold">{result.rSquared}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium mb-1">Forecast</div>
                    <div className="flex gap-2">
                      {(result.forecast || []).map((v: number, i: number) => (
                        <div key={i} className="bg-violet-50 border border-violet-200 rounded p-2 text-center flex-1">
                          <div className="text-xs text-gray-500">Day +{i + 1}</div>
                          <div className="font-bold">{v}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {operation === "explore" && (
                <div>
                  <div className="text-sm mb-2">Rows: {result.rowCount}</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          {result.columns?.map((col: any) => (
                            <th key={col.name} className="text-left p-2 font-medium">{col.name}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {result.sample?.map((row: any, i: number) => (
                          <tr key={i} className="border-b last:border-0">
                            {result.columns?.map((col: any) => (
                              <td key={col.name} className="p-2 truncate max-w-[200px]">
                                {typeof row[col.name] === "object" ? JSON.stringify(row[col.name]).slice(0, 50) : String(row[col.name] || "")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {operation === "predictive" && result.labels && (
                <div>
                  <div className="text-sm font-medium mb-2">Time Series ({result.labels.length} data points)</div>
                  {/* Simple bar visualization */}
                  <div className="flex items-end gap-1 h-32">
                    {result.data.map((v: number, i: number) => {
                      const max = Math.max(...result.data);
                      const height = max > 0 ? (v / max) * 100 : 0;
                      return (
                        <div key={i} className="flex-1 bg-violet-200 hover:bg-violet-400 transition-colors rounded-t" style={{ height: `${height}%` }} title={`${result.labels[i]}: ${v}`} />
                      );
                    })}
                  </div>
                  {result.trend && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="border rounded p-2">
                        <div className="text-xs text-gray-500">Trend</div>
                        <div className="font-bold">{result.trend.direction}</div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-gray-500">Slope</div>
                        <div className="font-bold">{result.trend.slope}</div>
                      </div>
                      <div className="border rounded p-2">
                        <div className="text-xs text-gray-500">Forecast</div>
                        <div className="font-bold">{(result.trend.forecast || []).join(", ")}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {operation === "distribution" && result.labels && (
                <div>
                  <div className="text-sm font-medium mb-2">Distribution Histogram</div>
                  <div className="space-y-1">
                    {result.labels.map((label: string, i: number) => {
                      const value = result.datasets?.[0]?.data?.[i] || 0;
                      const max = Math.max(...(result.datasets?.[0]?.data || [1]));
                      const width = max > 0 ? (value / max) * 100 : 0;
                      return (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className="w-24 truncate">{label}</span>
                          <div className="flex-1 bg-gray-200 rounded-full h-4">
                            <div className="bg-violet-500 h-4 rounded-full transition-all" style={{ width: `${width}%` }} />
                          </div>
                          <span className="w-8 text-right">{value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
