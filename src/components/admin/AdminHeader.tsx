"use client";

import { signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AdminHeader() {
  const { data: session } = useSession();

  return (
    <header className="bg-white shadow-sm px-6 py-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Admin Dashboard</h2>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white text-sm font-bold">
              {(session?.user?.name || session?.user?.email || "A")[0]}
            </div>
            <span className="text-sm text-gray-700 font-medium">
              {session?.user?.name || session?.user?.email}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => signOut({ callbackUrl: "/auth/login" })}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
