"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { SessionProvider } from "next-auth/react";
import Link from "next/link";
import { LogOut } from "lucide-react";

function SupportContent({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="flex">
        <aside className="w-64 bg-slate-900 text-white min-h-screen p-4">
          <Link href="/logs" className="text-xl font-bold block mb-8">
            Support Portal
          </Link>
          <nav className="space-y-1">
            {[
              { label: "Logs", href: "/logs", icon: "📝" },
              { label: "Health", href: "/health", icon: "💚" },
              { label: "Configurations", href: "/configurations", icon: "⚙️" },
            ].map((item) => (
              <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-2.5 rounded hover:bg-gray-800">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
            <div className="border-t border-gray-700 my-4" />
            <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded hover:bg-gray-800">
              <span>🏠</span><span>Back to Store</span>
            </Link>
          </nav>
          <div className="absolute bottom-4 left-4 right-4">
            <div className="text-sm mb-2 truncate">{session?.user?.name || session?.user?.email}</div>
            <button
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="flex items-center gap-2 w-full px-4 py-2.5 rounded hover:bg-red-600 transition text-sm"
            >
              <LogOut className="w-4 h-4" /> Logout
            </button>
          </div>
        </aside>
        <div className="flex-1 p-6">{children}</div>
      </div>
    </div>
  );
}

export default function SupportLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <SupportContent>{children}</SupportContent>
    </SessionProvider>
  );
}
