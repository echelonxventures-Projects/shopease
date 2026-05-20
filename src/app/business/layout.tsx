import Link from "next/link";

export default function BusinessLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/business/dashboard" className="text-xl font-bold text-blue-700">
            ShopEase Business
          </Link>
          <nav className="flex gap-6 text-sm">
            <Link href="/business/dashboard" className="text-gray-600 hover:text-blue-600">Dashboard</Link>
            <Link href="/business/team" className="text-gray-600 hover:text-blue-600">My Team</Link>
            <Link href="/business/rfq" className="text-gray-600 hover:text-blue-600">RFQs</Link>
            <Link href="/business/orders" className="text-gray-600 hover:text-blue-600">Orders</Link>
            <Link href="/b2b" className="text-gray-600 hover:text-blue-600">B2B Portal</Link>
          </nav>
        </div>
      </div>
      <main className="max-w-7xl mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
