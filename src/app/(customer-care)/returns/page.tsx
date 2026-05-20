"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getRefunds } from "@/server/actions/ticket-actions";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ArrowLeftRight } from "lucide-react";

export default function ReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRefunds()
      .then(setReturns)
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Return Requests</h1>

      {returns.length === 0 ? (
        <div className="text-center py-16">
          <ArrowLeftRight className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No return requests</p>
        </div>
      ) : (
        <div className="space-y-4">
          {returns.map((r: any) => (
            <Card key={r.id} className="p-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <p className="font-bold">{r.order?.orderNumber}</p>
                  <p className="text-sm text-gray-500 mt-1">{r.reason}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(r.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-bold">₹{r.amount?.toLocaleString?.() ?? r.amount}</span>
                  <Badge className={
                    r.status === "APPROVED" ? "bg-green-100 text-green-800" :
                    r.status === "REJECTED" ? "bg-red-100 text-red-800" :
                    r.status === "PROCESSED" ? "bg-blue-100 text-blue-800" :
                    "bg-yellow-100 text-yellow-800"
                  }>{r.status}</Badge>
                </div>
              </div>
              {r.adminNote && (
                <p className="text-sm text-gray-500 mt-2 border-t pt-2">Note: {r.adminNote}</p>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
