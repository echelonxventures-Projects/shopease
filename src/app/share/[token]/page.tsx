import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function ShareOrderPage({ params }: { params: { token: string } }) {
  const order = await prisma.order.findUnique({
    where: { shareToken: params.token },
    select: {
      id: true,
      orderNumber: true,
      status: true,
      total: true,
      items: true,
      createdAt: true,
      updatedAt: true,
      shippingAddress: true,
    },
  });

  if (!order) return notFound();

  const items = order.items as any[];

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow p-8">
        <h1 className="text-2xl font-bold mb-2">Order {order.orderNumber}</h1>
        <p className="text-gray-500 text-sm mb-6">Shared on {new Date(order.createdAt).toLocaleDateString()}</p>

        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
            order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
            order.status === "SHIPPED" ? "bg-blue-100 text-blue-700" :
            order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
            "bg-yellow-100 text-yellow-700"
          }`}>
            {order.status}
          </span>
        </div>

        {/* Items */}
        <div className="space-y-3 mb-6">
          <h2 className="font-bold">Items</h2>
          {items.map((item: any, i: number) => (
            <div key={i} className="flex justify-between py-2 border-b">
              <div>
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
              </div>
              <p className="font-medium">₹{(item.price * item.quantity).toLocaleString()}</p>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className="flex justify-between font-bold text-lg border-t pt-4">
          <span>Total</span>
          <span>₹{Number(order.total).toLocaleString()}</span>
        </div>

        <p className="text-xs text-gray-400 mt-6 text-center">
          This order was shared by the owner. For help, contact ShopEase support.
        </p>
      </div>
    </div>
  );
}
