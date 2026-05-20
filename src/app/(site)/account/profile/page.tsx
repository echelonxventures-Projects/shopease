"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getProfile, updateProfile, changePassword } from "@/server/actions/profile-actions";
import { exportUserData, deleteAccount, getConsents, recordConsent, withdrawConsent } from "@/server/actions/gdpr-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { User, Lock, Package, MapPin, Star, ArrowRight, Download, Shield, Trash2 } from "lucide-react";
import Link from "next/link";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  avatar: string | null;
  role: string;
  createdAt: Date;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleteTyping, setDeleteTyping] = useState("");
  const [consents, setConsents] = useState<any[]>([]);
  const [profileId, setProfileId] = useState("");

  useEffect(() => {
    getProfile()
      .then((data) => {
        if (!data) return router.push("/auth/login");
        setProfile(data);
        setName(data.name || "");
        setPhone(data.phone || "");
        setProfileId(data.id);
      })
      .catch(() => router.push("/auth/login"))
      .finally(() => setLoading(false));
  }, [router]);

  useEffect(() => {
    if (profileId) {
      getConsents(profileId).then(setConsents).catch(() => {});
    }
  }, [profileId]);

  const handleUpdateProfile = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    try {
      await updateProfile({ name, phone });
      toast.success("Profile updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile");
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error("All fields required"); return; }
    if (newPassword.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPassword !== confirmPassword) { toast.error("Passwords don't match"); return; }
    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Password changed");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.message || "Failed to change password");
    }
  };

  const handleExportData = async () => {
    try {
      const data = await exportUserData(profileId);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `shopease-data-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported successfully");
    } catch (err: any) {
      toast.error(err.message || "Failed to export data");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteTyping !== "DELETE MY ACCOUNT") {
      toast.error('Type "DELETE MY ACCOUNT" to confirm');
      return;
    }
    try {
      await deleteAccount(profileId);
      toast.success("Account deleted");
      window.location.href = "/auth/login";
    } catch (err: any) {
      toast.error(err.message || "Failed to delete account");
    }
  };

  const handleToggleMarketingConsent = async (type: string, active: boolean) => {
    try {
      if (active) {
        await recordConsent(profileId, type);
        toast.success("Marketing preferences updated");
      } else {
        await withdrawConsent(profileId, type);
        toast.success("Marketing consent withdrawn");
      }
      if (profileId) getConsents(profileId).then(setConsents).catch(() => {});
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-6"><p className="text-gray-500">Loading...</p></div>;

  return (
    <div className="p-6">
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">My Profile</span>
      </div>
      <h1 className="text-2xl font-bold mb-6">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{profile?.name || "No name"}</h2>
                <p className="text-gray-500">{profile?.email}</p>
                <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">{profile?.role}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="border rounded-lg p-3">
                <p className="text-2xl font-bold">--</p>
                <p className="text-sm text-gray-500">Orders</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-2xl font-bold">--</p>
                <p className="text-sm text-gray-500">Reviews</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile Info</TabsTrigger>
          <TabsTrigger value="password">Change Password</TabsTrigger>
          <TabsTrigger value="data-rights">Data Rights</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 max-w-md mt-4">
          <Card>
            <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="9876543210" type="tel" />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={profile?.email || ""} disabled className="bg-gray-50" />
                <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
              </div>
              <Button onClick={handleUpdateProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="password" className="space-y-4 max-w-md mt-4">
          <Card>
            <CardHeader><CardTitle>Change Password</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
              <Button onClick={handleChangePassword}>Change Password</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-rights" className="space-y-6 mt-4">
          {/* Data Export */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Download className="w-5 h-5" /> Download My Data</CardTitle>
              <CardDescription>Export all your personal data in JSON format (GDPR Article 20)</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleExportData} variant="outline">
                <Download className="w-4 h-4 mr-2" /> Export All Data
              </Button>
            </CardContent>
          </Card>

          {/* Consent Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Shield className="w-5 h-5" /> Consent Management</CardTitle>
              <CardDescription>Manage your consent preferences (GDPR Article 7)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {consents.length === 0 && (
                <p className="text-sm text-gray-400">No consent records found</p>
              )}
              {consents.map((c: any) => {
                if (c.type === "PRIVACY_POLICY" || c.type === "TERMS_OF_SERVICE") return null;
                const label = c.type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase());
                return (
                  <div key={c.type} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium text-sm">{label}</p>
                      <p className="text-xs text-gray-400">
                        {c.active ? "Active since " + new Date(c.consentedAt).toLocaleDateString() : "Withdrawn on " + new Date(c.withdrawnAt!).toLocaleDateString()}
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={c.active} onChange={() => handleToggleMarketingConsent(c.type, !c.active)} className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Delete Account */}
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600"><Trash2 className="w-5 h-5" /> Delete Account</CardTitle>
              <CardDescription>Permanently delete your account and personal data (GDPR Article 17)</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-3">
                This action is <strong>permanent and cannot be undone</strong>. Your addresses, cart, and wishlist will be deleted.
                Your order history will be preserved for accounting purposes but your personal data will be anonymized.
              </p>
              <Button variant="destructive" onClick={() => setDeleteConfirm(true)}>
                <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <Link href="/account/orders" className="border rounded-lg p-4 hover:bg-gray-50 flex items-center gap-3">
          <Package className="w-5 h-5" /><span className="font-medium">My Orders</span><ArrowRight className="w-4 h-4 ml-auto" />
        </Link>
        <Link href="/account/addresses" className="border rounded-lg p-4 hover:bg-gray-50 flex items-center gap-3">
          <MapPin className="w-5 h-5" /><span className="font-medium">Addresses</span><ArrowRight className="w-4 h-4 ml-auto" />
        </Link>
        <Link href="/account/reviews" className="border rounded-lg p-4 hover:bg-gray-50 flex items-center gap-3">
          <Star className="w-5 h-5" /><span className="font-medium">My Reviews</span><ArrowRight className="w-4 h-4 ml-auto" />
        </Link>
        <Link href="/account/returns" className="border rounded-lg p-4 hover:bg-gray-50 flex items-center gap-3">
          <Package className="w-5 h-5" /><span className="font-medium">Returns</span><ArrowRight className="w-4 h-4 ml-auto" />
        </Link>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <Dialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Delete Account</DialogTitle>
            <DialogDescription>
              This action is permanent. Type "DELETE MY ACCOUNT" to confirm.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Type to confirm</Label>
            <Input
              value={deleteTyping}
              onChange={(e) => setDeleteTyping(e.target.value)}
              placeholder='Type "DELETE MY ACCOUNT"'
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setDeleteConfirm(false); setDeleteTyping(""); }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={deleteTyping !== "DELETE MY ACCOUNT"}>
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
