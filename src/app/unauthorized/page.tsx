import Link from "next/link";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4 text-red-500">403</h1>
        <p className="text-xl text-gray-600 mb-8">You don't have permission to access this page</p>
        <Link href="/" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
          Go Home
        </Link>
      </div>
    </div>
  );
}
