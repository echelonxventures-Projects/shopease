import Link from "next/link";

const sections = [
  { title: "My Orders", desc: "Track and manage your orders", href: "/account/orders", icon: "📦" },
  { title: "Returns & Refunds", desc: "Manage returns and refunds", href: "/account/returns", icon: "🔄" },
  { title: "My Profile", desc: "Manage your account details", href: "/account/profile", icon: "👤" },
  { title: "Addresses", desc: "Manage delivery addresses", href: "/account/addresses", icon: "📍" },
  { title: "My Wallet", desc: "View balance and transactions", href: "/account/wallet", icon: "💰" },
  { title: "Wishlist", desc: "Browse your saved items", href: "/wishlist", icon: "❤️" },
  { title: "My Lists", desc: "Create and manage custom lists", href: "/account/lists", icon: "📋" },
  { title: "Browsing History", desc: "View recently viewed items", href: "/account/browsing-history", icon: "🕐" },
  { title: "Price Alerts", desc: "Track price drops on items", href: "/account/price-alerts", icon: "🔔" },
  { title: "My Reviews", desc: "Manage your product reviews", href: "/account/reviews", icon: "⭐" },
  { title: "Message Centre", desc: "Notifications, tickets & chats", href: "/account/messages", icon: "💬" },
  { title: "Notifications", desc: "View and manage notifications", href: "/account/notifications", icon: "🔔" },
  { title: "Communication Preferences", desc: "Choose how we contact you", href: "/account/communication-preferences", icon: "⚙️" },
];

export default function AccountPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Your Account</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="border rounded-lg p-5 hover:bg-gray-50 hover:shadow-md transition group"
          >
            <div className="text-2xl mb-2">{section.icon}</div>
            <h3 className="font-bold text-sm group-hover:text-blue-600">{section.title}</h3>
            <p className="text-xs text-gray-500 mt-1">{section.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
