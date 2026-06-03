"use client";

import Link from "next/link";
import { SessionProvider } from "next-auth/react";

const navItems = [
  { label: "Dashboard", href: "/supplier/dashboard", icon: "📊" },
  { label: "My Listings", href: "/supplier/listings", icon: "📦" },
  { label: "Purchase Orders", href: "/supplier/purchase-orders", icon: "📋" },
  { label: "Returns", href: "/supplier/returns", icon: "🔄" },
  { label: "Payments", href: "/supplier/payments", icon: "💰" },
  { label: "Profile", href: "/supplier/profile", icon: "👤" },
];

export default function SupplierLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-100 flex">
        <aside className="w-56 bg-gray-900 text-white min-h-screen p-4">
          <Link href="/supplier/dashboard" className="text-lg font-bold text-green-400 block mb-6">Supplier Portal</Link>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 transition text-sm">
                <span>{item.icon}</span><span>{item.label}</span>
              </Link>
            ))}
            <div className="border-t border-gray-700 my-4" />
            <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-800 transition text-sm">
              <span>🏠</span><span>Back to Store</span>
            </Link>
          </nav>
        </aside>
        <main className="flex-1 p-6">{children}</main>
      </div>
    </SessionProvider>
  );
}
