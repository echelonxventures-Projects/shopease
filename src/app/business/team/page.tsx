"use client";

import { useEffect, useState } from "react";
import { getTeam, inviteMember, removeMember, changeMemberRole } from "@/server/actions/business-team-actions";
import { getMyBusiness } from "@/server/actions/business-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const ROLES = [
  { value: "OWNER", label: "Owner", color: "bg-red-100 text-red-800" },
  { value: "ADMIN", label: "Admin", color: "bg-orange-100 text-orange-800" },
  { value: "MANAGER", label: "Manager", color: "bg-blue-100 text-blue-800" },
  { value: "BUYER", label: "Buyer", color: "bg-green-100 text-green-800" },
];

export default function BusinessTeamPage() {
  const [business, setBusiness] = useState<any>(null);
  const [team, setTeam] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("BUYER");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    Promise.all([getMyBusiness(), getTeam("temp-id")])
      .then(([b, t]) => {
        setBusiness(b);
        setTeam(t);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Re-fetch team with actual businessId once we have the business
  useEffect(() => {
    if (business?.id) {
      getTeam(business.id).then(setTeam).catch(() => {});
    }
  }, [business?.id]);

  async function handleInvite() {
    if (!business?.id || !inviteEmail) return;
    setInviting(true);
    try {
      const result = await inviteMember(business.id, inviteEmail, inviteRole);
      if ((result as any)?.error) {
        toast.error("Failed to invite");
      } else {
        toast.success(`Invite sent to ${inviteEmail}`);
        setInviteEmail("");
        setInviteRole("BUYER");
        setInviteOpen(false);
        if (business.id) getTeam(business.id).then(setTeam).catch(() => {});
      }
    } catch {
      toast.error("Failed to invite");
    } finally {
      setInviting(false);
    }
  }

  async function handleRemove(userId: string) {
    if (!business?.id) return;
    const result = await removeMember(business.id, userId);
    if ((result as any)?.error) {
      toast.error("Cannot remove member");
    } else {
      toast.success("Member removed");
      if (business.id) getTeam(business.id).then(setTeam).catch(() => {});
    }
  }

  async function handleRoleChange(userId: string, newRole: string) {
    if (!business?.id) return;
    const result = await changeMemberRole(business.id, userId, newRole);
    if ((result as any)?.error) {
      toast.error("Cannot change role");
    } else {
      toast.success("Role updated");
      if (business.id) getTeam(business.id).then(setTeam).catch(() => {});
    }
  }

  if (loading) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!business) return <div className="text-center py-20">No business profile found.</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Team Members</h1>
          <p className="text-gray-500 mt-1">Manage who has access to your business account</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger>
            <Button><UserPlus className="w-4 h-4 mr-2" /> Invite Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Email</Label>
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="colleague@company.com" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={inviteRole} onValueChange={(v) => v && setInviteRole(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.filter((r) => r.value !== "OWNER").map((r) => (
                      <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleInvite} disabled={!inviteEmail || inviting}>
                {inviting ? "Sending..." : "Send Invite"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {team.map((member) => {
              const roleConfig = ROLES.find((r) => r.value === member.role);
              return (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback>{(member.user?.name || "?")[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.user?.name || "Pending"}</p>
                        <p className="text-xs text-gray-500">{member.email || member.user?.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={member.role} onValueChange={(v) => handleRoleChange(member.userId, v)}>
                      <SelectTrigger className="w-32">
                        <Badge className={roleConfig?.color || "bg-gray-100 text-gray-800"}>{roleConfig?.label}</Badge>
                      </SelectTrigger>
                      <SelectContent>
                        {ROLES.filter((r) => r.value !== "OWNER").map((r) => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Badge className={member.isActive ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                      {member.isActive ? "Active" : "Pending"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(member.createdAt).toLocaleDateString("en-IN")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => handleRemove(member.userId)}>
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
