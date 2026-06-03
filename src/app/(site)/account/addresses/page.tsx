"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  getAddresses,
  deleteAddress,
} from "@/server/actions/address-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { MapPin, Plus, Home, Briefcase, Building2 } from "lucide-react";

type Address = {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
  type: string;
  landmark?: string | null;
  addressLabel?: string | null;
  deliveryNote?: string | null;
  countryLoc?: { name: string } | null;
  stateLoc?: { name: string } | null;
  districtLoc?: { name: string } | null;
  villageLoc?: { name: string } | null;
};

function TypeIcon({ type, className }: { type: string; className?: string }) {
  const iconMap: Record<string, { icon: any; color: string }> = {
    HOME: { icon: Home, color: "text-green-600" },
    WORK: { icon: Briefcase, color: "text-blue-600" },
    OTHER: { icon: Building2, color: "text-orange-600" },
  };
  const { icon: Icon, color } = iconMap[type] || iconMap.OTHER;
  return <Icon className={`w-4 h-4 ${className || color}`} />;
}

export default function AddressesPage() {
  const router = useRouter();
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAddresses = async () => {
    try {
      const data = await getAddresses();
      setAddresses(data);
    } catch {
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this address?")) return;
    try {
      await deleteAddress(id);
      toast.success("Address deleted");
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete address");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const addr = addresses.find((a) => a.id === id);
      if (!addr) return;
      const { updateAddress } = await import("@/server/actions/address-actions");
      await updateAddress(id, { isDefault: true });
      toast.success("Default address updated");
      fetchAddresses();
    } catch (err: any) {
      toast.error(err.message || "Failed to set default address");
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">My Addresses</h1>
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="text-sm text-gray-500 mb-4">
        <Link href="/account" className="hover:text-blue-600">Your Account</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900 font-medium">Your Addresses</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Your Addresses</h1>
        <Link href="/account/addresses/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add a new address
          </Button>
        </Link>
      </div>

      {/* Empty state */}
      {addresses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg">
          <MapPin className="w-16 h-16 text-gray-300 mb-4" />
          <h2 className="text-lg font-semibold text-gray-700 mb-2">You don&apos;t have any addresses yet</h2>
          <p className="text-gray-500 mb-6">Add an address to make your checkout easier</p>
          <Link href="/account/addresses/new">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add a new address
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {addresses.map((addr) => (
            <Card key={addr.id} className={`${addr.isDefault ? "ring-2 ring-amber-500" : "ring-1 ring-gray-200"} hover:shadow-md transition`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Type badge + name + phone */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <TypeIcon type={addr.type} />
                        <span className="font-semibold text-base">{addr.fullName}</span>
                      </div>
                      <span className="text-sm text-gray-500">{addr.phone}</span>
                    </div>

                    {/* Address lines */}
                    <p className="text-sm text-gray-700 mb-2 leading-relaxed">
                      {addr.street}
                    </p>
                    <p className="text-sm text-gray-600 mb-1">
                      {addr.city}{addr.districtLoc?.name ? `, ${addr.districtLoc.name}` : ""}
                      {addr.stateLoc?.name ? `, ${addr.stateLoc.name}` : addr.state ? `, ${addr.state}` : ""}
                      {" - "}{addr.zipCode}
                    </p>
                    {addr.countryLoc?.name && (
                      <p className="text-sm text-gray-600">{addr.countryLoc.name}</p>
                    )}
                    {addr.landmark && (
                      <p className="text-sm text-gray-500 mt-1">Landmark: {addr.landmark}</p>
                    )}
                    {addr.deliveryNote && (
                      <p className="text-sm text-gray-500 mt-1">Delivery: {addr.deliveryNote}</p>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center gap-3 mt-4">
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        onClick={() => router.push(`/account/addresses/edit/${addr.id}`)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="link"
                        size="sm"
                        className="h-auto p-0 text-red-600 hover:text-red-700 text-sm font-medium"
                        onClick={() => handleDelete(addr.id)}
                      >
                        Remove
                      </Button>
                      {!addr.isDefault && (
                        <Button
                          variant="link"
                          size="sm"
                          className="h-auto p-0 text-blue-600 hover:text-blue-700 text-sm font-medium"
                          onClick={() => handleSetDefault(addr.id)}
                        >
                          Set as default
                        </Button>
                      )}
                      {addr.isDefault && (
                        <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-xs font-medium">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
