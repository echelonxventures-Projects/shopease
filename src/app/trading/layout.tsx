"use client";

import Link from "next/link";
import { SessionProvider, useSession, signOut } from "next-auth/react";

function TradingNav() {
  const { data: session } = useSession();
  return (
    <header className="bg-white dark:bg-gray-950 border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/trading" className="text-xl font-bold text-emerald-600">Newtrade</Link>
          <nav className="hidden md:flex gap-4 text-sm text-muted-foreground">
            <Link href="/trading" className="hover:text-foreground">Dashboard</Link>
            <Link href="/trading/markets" className="hover:text-foreground">Markets</Link>
            <Link href="/trading/charts" className="hover:text-foreground">Charts</Link>
            <Link href="/trading/positions" className="hover:text-foreground">Positions</Link>
            <Link href="/trading/ipo" className="hover:text-foreground">IPO</Link>
            <Link href="/trading/mutual-funds" className="hover:text-foreground">Mutual Funds</Link>
            <Link href="/trading/analytics" className="hover:text-foreground">Analytics</Link>
            <Link href="/trading/account" className="hover:text-foreground">Account</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              <span className="text-muted-foreground">{session.user?.name || session.user?.email}</span>
              <button onClick={() => signOut()} className="text-muted-foreground hover:text-foreground">Sign Out</button>
            </>
          ) : (
            <Link href="/auth/login?callbackUrl=/trading" className="bg-emerald-600 text-white px-4 py-1.5 rounded">Sign In</Link>
          )}
          <Link href="/" className="text-muted-foreground hover:text-foreground text-xs">← Main Site</Link>
        </div>
      </div>
    </header>
  );
}

export default function TradingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-background">
        <TradingNav />
        {children}
      </div>
    </SessionProvider>
  );
}
