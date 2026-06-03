"use client";

import { useEffect, useState } from "react";
import { getApprovalRules, createApprovalRule, updateApprovalRule } from "@/server/actions/business-team-actions";
import { getMyBusiness } from "@/server/actions/business-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Shield, Plus, Check, X } from "lucide-react";
import { toast } from "sonner";

const APPROVAL_TYPES = [
  { value: "ORDER_AMOUNT", label: "Order Amount" },
  { value: "DISCOUNT", label: "Discount Approval" },
  { value: "NEW_VENDOR", label: "New Vendor" },
  { value: "PURCHASE_ORDER", label: "Purchase Order" },
];

const APPROVER_ROLES = [
  { value: "OWNER", label: "Owner" },
  { value: "ADMIN", label: "Admin" },
  { value: "MANAGER", label: "Manager" },
];

export default function ApprovalRulesPage() {
  const [business, setBusiness] = useState<any>(null);
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ruleOpen, setRuleOpen] = useState(false);
  const [ruleForm, setRuleForm] = useState({
    type: "ORDER_AMOUNT",
    minOrderAmount: "",
    maxDiscount: "",
    approverRole: "ADMIN",
    requiresMultiApprover: false,
    minApprovers: 2,
  });

  useEffect(() => {
    getMyBusiness().then((b) => {
      setBusiness(b);
      if (b?.id) getApprovalRules(b.id).then(setRules).catch(() => {});
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function handleCreate() {
    if (!business?.id) return;
    const result = await createApprovalRule(business.id, {
      type: ruleForm.type,
      minOrderAmount: ruleForm.minOrderAmount ? Number(ruleForm.minOrderAmount) : undefined,
      maxDiscount: ruleForm.maxDiscount ? Number(ruleForm.maxDiscount) : undefined,
      approverRole: ruleForm.approverRole,
      requiresMultiApprover: ruleForm.requiresMultiApprover,
      minApprovers: ruleForm.minApprovers,
    });
    if ((result as any)?.error) {
      toast.error("Failed to create rule");
    } else {
      toast.success("Rule created");
      setRuleOpen(false);
      setRuleForm({ type: "ORDER_AMOUNT", minOrderAmount: "", maxDiscount: "", approverRole: "ADMIN", requiresMultiApprover: false, minApprovers: 2 });
      if (business.id) getApprovalRules(business.id).then(setRules).catch(() => {});
    }
  }

  async function handleToggle(ruleId: string, isActive: boolean) {
    await updateApprovalRule(ruleId, { isActive: !isActive });
    toast.success(isActive ? "Rule disabled" : "Rule enabled");
    if (business?.id) getApprovalRules(business.id).then(setRules).catch(() => {});
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!business) return <div className="text-center py-20">No business profile found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Approval Rules</h1>
          <p className="text-gray-500 mt-1">Configure purchase approval workflow</p>
        </div>
        <Dialog open={ruleOpen} onOpenChange={setRuleOpen}>
          <DialogTrigger>
            <Button><Plus className="w-4 h-4 mr-2" /> Add Rule</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New Approval Rule</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Rule Type</Label>
                <Select value={ruleForm.type} onValueChange={(v) => v && setRuleForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APPROVAL_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Minimum Order Amount ($)</Label>
                <Input type="number" value={ruleForm.minOrderAmount} onChange={(e) => setRuleForm((f) => ({ ...f, minOrderAmount: e.target.value }))} placeholder="1000" />
              </div>
              <div>
                <Label>Max Discount (%)</Label>
                <Input type="number" value={ruleForm.maxDiscount} onChange={(e) => setRuleForm((f) => ({ ...f, maxDiscount: e.target.value }))} placeholder="15" />
              </div>
              <div>
                <Label>Approver Role</Label>
                <Select value={ruleForm.approverRole} onValueChange={(v) => v && setRuleForm((f) => ({ ...f, approverRole: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {APPROVER_ROLES.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <Label>Requires Multiple Approvers</Label>
                <Switch checked={ruleForm.requiresMultiApprover} onCheckedChange={(v) => setRuleForm((f) => ({ ...f, requiresMultiApprover: v }))} />
              </div>
              {ruleForm.requiresMultiApprover && (
                <div>
                  <Label>Minimum Approvers</Label>
                  <Input type="number" value={ruleForm.minApprovers} onChange={(e) => setRuleForm((f) => ({ ...f, minApprovers: Number(e.target.value) }))} placeholder="2" />
                </div>
              )}
              <Button onClick={handleCreate}>Create Rule</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {rules.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-gray-400">
            <Shield className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-medium">No approval rules configured</p>
            <p className="text-sm mt-1">Add a rule to require approval for purchases above a certain amount.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Min Amount</TableHead>
                <TableHead>Max Discount</TableHead>
                <TableHead>Approver</TableHead>
                <TableHead>Multi-Approver</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell><Badge>{rule.type.replace("_", " ")}</Badge></TableCell>
                  <TableCell>{rule.minOrderAmount ? `$${Number(rule.minOrderAmount).toLocaleString("en-IN")}` : "—"}</TableCell>
                  <TableCell>{rule.maxDiscount ? `${Number(rule.maxDiscount)}%` : "—"}</TableCell>
                  <TableCell>{rule.approverRole}</TableCell>
                  <TableCell>
                    {rule.requiresMultiApprover ? `${rule.minApprovers} required` : "No"}
                  </TableCell>
                  <TableCell>
                    <Badge className={rule.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}>
                      {rule.isActive ? "Active" : "Disabled"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleToggle(rule.id, rule.isActive)}>
                      {rule.isActive ? <X className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-green-500" />}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
