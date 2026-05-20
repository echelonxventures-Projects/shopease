"use client";

import { useEffect, useState } from "react";
import { getTaxCategoryRules, createOrUpdateTaxCategoryRule } from "@/server/actions/product-catalog-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const TAX_CATEGORIES = ["STANDARD", "FOOD", "BOOKS", "PHARMA", "CLOTHING", "LUXURY", "ALCOHOL", "TOBACCO"];
const REGIONS = [
  { code: "IN", name: "India" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "AE", name: "UAE" },
];

export default function TaxCategoriesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [newRule, setNewRule] = useState({ taxCategory: "STANDARD", regionCode: "IN", taxRate: "0.18" });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    getTaxCategoryRules().then(setRules).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    const region = REGIONS.find((r) => r.code === newRule.regionCode);
    if (!region) { toast.error("Invalid region"); return; }
    setSubmitting(true);
    try {
      await createOrUpdateTaxCategoryRule(newRule.taxCategory, newRule.regionCode, parseFloat(newRule.taxRate));
      toast.success("Tax rule saved");
      getTaxCategoryRules().then(setRules).catch(() => {});
    } catch (err: any) { toast.error(err.message); }
    finally { setSubmitting(false); }
  };

  const ruleMap: Record<string, Record<string, number>> = {};
  for (const r of rules) {
    const rc = (r.region as any)?.code || "UNKNOWN";
    if (!ruleMap[rc]) ruleMap[rc] = {};
    ruleMap[rc][r.taxCategory] = Number(r.taxRate) * 100;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Tax Category Rules</h1>

      {/* Matrix Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-100 border-b">
              <th className="text-left p-3 font-semibold">Tax Category</th>
              {REGIONS.map((r) => (
                <th key={r.code} className="text-center p-3 font-semibold">{r.name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TAX_CATEGORIES.map((tc) => (
              <tr key={tc} className="border-b hover:bg-gray-50">
                <td className="p-3 font-medium">{tc}</td>
                {REGIONS.map((r) => {
                  const rate = ruleMap[r.code]?.[tc];
                  return (
                    <td key={r.code} className="p-3 text-center">
                      {rate !== undefined ? (rate === 0 ? "Exempt" : `${rate.toFixed(0)}%`) : "—"}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Rule */}
      <div className="bg-white rounded-lg shadow p-6 mt-6 max-w-2xl space-y-4">
        <h2 className="text-lg font-bold">Add / Edit Rule</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label>Tax Category</Label>
            <Select value={newRule.taxCategory} onValueChange={(v) => setNewRule({ ...newRule, taxCategory: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {TAX_CATEGORIES.map((tc) => <SelectItem key={tc} value={tc}>{tc}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Region</Label>
            <Select value={newRule.regionCode} onValueChange={(v) => setNewRule({ ...newRule, regionCode: v as any })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => <SelectItem key={r.code} value={r.code}>{r.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Tax Rate (%)</Label>
            <Input type="number" value={newRule.taxRate} onChange={(e) => setNewRule({ ...newRule, taxRate: e.target.value })} placeholder="18" />
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={submitting}>Save Rule</Button>
      </div>
    </div>
  );
}
