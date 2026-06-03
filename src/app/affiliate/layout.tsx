"use client";

import Link from "next/link";
import { SessionProvider } from "next-auth/react";

const navItems = [
  { label: "Dashboard", href: "/affiliate/dashboard", icon: "📊" },
  { label: "My Links", href: "/affiliate/links", icon: "🔗" },
  { label: "Commissions", href: "/affiliate/commissions", icon: "💰" },
  { label: "Payouts", href: "/affiliate/payouts", icon: "🏦" },
  { label: "Creatives", href: "/affiliate/creatives", icon: "🎨" },
  { label: "Profile", href: "/affiliate/profile", icon: "👤" },
];

export default function AffiliateLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-100 flex">
        <aside className="w-56 bg-gray-900 text-white min-h-screen p-4">
          <Link href="/affiliate/dashboard" className="text-lg font-bold text-purple-400 block mb-6">Affiliate Portal</Link>
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
