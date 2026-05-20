"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, LogOut, Package, Heart, ShoppingBag } from "lucide-react";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);

  if (status === "loading") {
    return <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />;
  }

  if (!session) {
    return (
      <Link href="/auth/login" className="text-sm hover:text-blue-600 flex items-center gap-1">
        <User className="w-4 h-4" /> Login
      </Link>
    );
  }

  const userRole = (session.user as any)?.role;

  const adminLink =
    userRole === "ADMIN" ? "/admin/dashboard" :
    userRole === "CUSTOMER_CARE" ? "/tickets" :
    userRole === "SUPPORT" ? "/logs" :
    "/account";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm hover:text-blue-600"
      >
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
          {(session.user?.name || session.user?.email || "?")[0]}
        </div>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-10 w-56 bg-white rounded-lg shadow-lg border z-50 overflow-hidden">
            <div className="px-4 py-3 border-b">
              <p className="font-medium text-sm">{session.user?.name || session.user?.email}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole?.replace(/_/g, " ").toLowerCase()}</p>
            </div>
            <div className="py-1">
              <Link href={adminLink} className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>
                {userRole === "ADMIN" ? <><Package className="w-4 h-4" /> Dashboard</> :
                 userRole === "CUSTOMER_CARE" ? <><Package className="w-4 h-4" /> Tickets</> :
                 userRole === "SUPPORT" ? <><Package className="w-4 h-4" /> Logs</> :
                 <><User className="w-4 h-4" /> My Account</>}
              </Link>
              {userRole !== "ADMIN" && userRole !== "CUSTOMER_CARE" && userRole !== "SUPPORT" && (
                <>
                  <Link href="/account/orders" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>
                    <ShoppingBag className="w-4 h-4" /> Orders
                  </Link>
                  <Link href="/wishlist" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50" onClick={() => setOpen(false)}>
                    <Heart className="w-4 h-4" /> Wishlist
                  </Link>
                </>
              )}
            </div>
            <div className="border-t py-1">
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
