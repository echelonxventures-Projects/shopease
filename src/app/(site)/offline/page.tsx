import { WifiOff, Home, Search } from "lucide-react";
import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 text-center">
      <WifiOff className="w-16 h-16 text-gray-400 mb-4" />
      <h1 className="text-2xl font-bold mb-2">You&apos;re Offline</h1>
      <p className="text-gray-500 mb-6 max-w-sm">
        Check your internet connection and try again. You can still browse cached pages.
      </p>
      <div className="flex gap-3">
        <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Home className="w-4 h-4" /> Home
        </Link>
        <Link href="/search" className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
          <Search className="w-4 h-4" /> Search
        </Link>
      </div>
    </div>
  );
}
