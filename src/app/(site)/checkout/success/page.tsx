import Link from "next/link";

export default function OrderSuccessPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-16 text-center">
      <div className="text-6xl text-green-500 mb-4">✓</div>
      <h1 className="text-3xl font-bold mb-4">Order Placed Successfully!</h1>
      <p className="text-gray-600 mb-8">Thank you for your order. We'll send you a confirmation email shortly.</p>
      <div className="flex gap-4 justify-center">
        <Link href="/account/orders" className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700">
          View Orders
        </Link>
        <Link href="/products" className="border px-6 py-3 rounded-lg font-semibold hover:bg-gray-50">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
