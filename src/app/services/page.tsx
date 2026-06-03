"use client";

import Link from "next/link";

const services = [
  { href: "/pay/bills", name: "Bill Payments", icon: "📄" },
  { href: "/pay/recharge", name: "Recharge", icon: "📱" },
  { href: "/services/insurance", name: "Insurance", icon: "🛡️" },
  { href: "/services/mutual-funds", name: "Mutual Funds", icon: "📈" },
  { href: "/services/gold", name: "Digital Gold", icon: "🥇" },
  { href: "/services/movies", name: "Movies", icon: "🎬" },
  { href: "/services/travel", name: "Travel", icon: "✈️" },
  { href: "/services/credit-score", name: "Credit Score", icon: "💳" },
];

export default function ServicesPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Services</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {services.map((s) => (
          <Link key={s.href} href={s.href} className="border rounded-lg p-4 text-center hover:bg-blue-50 transition">
            <span className="text-3xl">{s.icon}</span>
            <p className="text-sm mt-2 font-medium">{s.name}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
