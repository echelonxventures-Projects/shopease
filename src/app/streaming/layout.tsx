"use client";

import Link from "next/link";
import { SessionProvider, useSession, signOut } from "next-auth/react";

function StreamingNav() {
  const { data: session } = useSession();
  return (
    <header className="bg-black/95 border-b border-gray-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/streaming" className="text-xl font-bold text-red-600">Neoflix</Link>
          <nav className="hidden md:flex gap-4 text-sm text-gray-300">
            <Link href="/streaming" className="hover:text-white">Home</Link>
            <Link href="/streaming/browse" className="hover:text-white">Browse</Link>
            <Link href="/streaming?tab=movies" className="hover:text-white">Movies</Link>
            <Link href="/streaming?tab=series" className="hover:text-white">Series</Link>
            <Link href="/streaming?tab=watchlist" className="hover:text-white">My List</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          {session ? (
            <>
              <Link href="/streaming/profiles" className="text-gray-400 hover:text-white">Profiles</Link>
              <span className="text-gray-400">{session.user?.name || session.user?.email}</span>
              <button onClick={() => signOut()} className="text-gray-400 hover:text-white">Sign Out</button>
            </>
          ) : (
            <Link href="/auth/login?callbackUrl=/streaming" className="bg-red-600 text-white px-4 py-1.5 rounded">Sign In</Link>
          )}
          <Link href="/" className="text-gray-500 hover:text-gray-300 text-xs">← Main Site</Link>
        </div>
      </div>
    </header>
  );
}

export default function StreamingLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-black text-white">
        <StreamingNav />
        {children}
      </div>
    </SessionProvider>
  );
}
