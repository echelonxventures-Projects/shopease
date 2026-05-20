"use client";

import { useEffect, useState } from "react";
import { getMyBusiness, getBusinessDashboardStats } from "@/server/actions/business-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, FileText, Package, TrendingUp, Shield, Settings } from "lucide-react";
import Link from "next/link";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  SUBMITTED: "bg-blue-100 text-blue-800",
  UNDER_REVIEW: "bg-purple-100 text-purple-800",
  VERIFIED: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  SUSPENDED: "bg-red-100 text-red-800",
};

export default function BusinessDashboardPage() {
  const [business, setBusiness] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getMyBusiness(), getBusinessDashboardStats()])
      .then(([b, s]) => { setBusiness(b); setStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-center py-20 text-gray-400">Loading dashboard...</div>;
  }

  if (!business) {
    return (
      <div className="text-center py-20">
        <Building2 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-700">No Business Account</h2>
        <p className="text-gray-500 mt-2">You haven't registered a business yet.</p>
        <Link href="/business/register">
          <Button className="mt-6">Register Your Business</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{business.name}</h1>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={STATUS_COLORS[business.verificationStatus] || "bg-gray-100 text-gray-800"}>
              {business.verificationStatus || "PENDING"}
            </Badge>
            <span className="text-sm text-gray-500">{business.businessType}</span>
            {business.verificationStatus === "VERIFIED" && (
              <Badge className="bg-blue-100 text-blue-800">Amazon Business</Badge>
            )}
          </div>
        </div>
        <Link href="/business/settings" className="inline-flex items-center gap-2 border rounded-lg px-4 py-2 text-sm hover:bg-gray-50">
          <Settings className="w-4 h-4" /> Settings
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.orderCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Open RFQs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.rfqCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.teamCount || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-500">Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-lg font-bold ${business.verificationStatus === "VERIFIED" ? "text-green-600" : "text-yellow-600"}`}>
              {business.verificationStatus === "VERIFIED" ? "Verified" : "Pending"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {[
          { icon: Users, label: "Manage Team", desc: "Invite & manage team members", href: "/business/team" },
          { icon: FileText, label: "Request for Quote", desc: "Create & manage RFQs", href: "/business/rfq" },
          { icon: Package, label: "B2B Orders", desc: "View order history", href: "/business/orders" },
          { icon: TrendingUp, label: "B2B Portal", desc: "Browse & order products", href: "/b2b" },
          { icon: Shield, label: "Tax Exemptions", desc: "Manage tax certificates", href: "/business/tax-exemptions" },
          { icon: Settings, label: "Approval Rules", desc: "Configure purchase approvals", href: "/business/approvals" },
        ].map((action) => (
          <Card key={action.href} className="hover:shadow-md transition cursor-pointer">
            <Link href={action.href}>
              <CardHeader className="pb-2">
                <action.icon className="w-8 h-8 text-blue-600 mb-2" />
                <CardTitle className="text-lg">{action.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500">{action.desc}</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>

      {/* Business Info */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-gray-500">Industry:</span> <p className="font-medium">{business.industry || "—"}</p></div>
            <div><span className="text-gray-500">Size:</span> <p className="font-medium">{business.companySize || "—"}</p></div>
            <div><span className="text-gray-500">Website:</span> <p className="font-medium">{business.website || "—"}</p></div>
            <div><span className="text-gray-500">GST Number:</span> <p className="font-medium">{business.gstNumber || "—"}</p></div>
            <div><span className="text-gray-500">Tax ID:</span> <p className="font-medium">{business.taxId || "—"}</p></div>
            <div><span className="text-gray-500">PAN:</span> <p className="font-medium">{business.panNumber || "—"}</p></div>
            <div><span className="text-gray-500">City:</span> <p className="font-medium">{business.city}, {business.state}</p></div>
            <div><span className="text-gray-500">Country:</span> <p className="font-medium">{business.registeredCountry}</p></div>
            <div><span className="text-gray-500">Email:</span> <p className="font-medium">{business.contactEmail}</p></div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
