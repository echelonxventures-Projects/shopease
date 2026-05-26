import Link from "next/link";

export function AdminSidebar() {
  const navItems = [
    { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },
    { label: "Products", href: "/admin/products", icon: "📦" },
    { label: "Orders", href: "/admin/orders", icon: "🛒" },
    { label: "Customers", href: "/admin/customers", icon: "👥" },
    { label: "Categories", href: "/admin/categories", icon: "📁" },
    { label: "Brands", href: "/admin/brands", icon: "🏷️" },
    { label: "Inventory", href: "/admin/inventory", icon: "📊" },
    { label: "Suppliers", href: "/admin/suppliers", icon: "🏭" },
    { label: "Master Catalog", href: "/admin/catalog", icon: "📚" },
    { label: "Supplier Catalog", href: "/admin/supplier-catalog", icon: "🛍️" },
    { label: "Supplier Listings", href: "/admin/supplier-listings", icon: "📋" },
    { label: "Purchase Orders", href: "/admin/purchase-orders", icon: "📋" },
    { label: "Returns", href: "/admin/returns", icon: "🔄" },
    { label: "Promotions", href: "/admin/promos", icon: "🎉" },
    { label: "Stack Rules", href: "/admin/promotions/stack-rules", icon: "📚" },
    { label: "Lightning Deals", href: "/admin/promotions/lightning-deals", icon: "⚡" },
    { label: "Promo Analytics", href: "/admin/promotions/analytics", icon: "📊" },
    { label: "A/B Testing", href: "/admin/promotions/ab-testing", icon: "🧪" },
    { label: "Gamified Promos", href: "/admin/promotions/gamified", icon: "🎡" },
    { label: "Loyalty Programs", href: "/admin/loyalty", icon: "⭐" },
    { label: "Referrals", href: "/admin/referrals", icon: "🎁" },
    { label: "Vouchers", href: "/admin/vouchers", icon: "🎁" },
    { label: "Voucher Tiers", href: "/admin/vouchers/tiers", icon: "🏷️" },
    { label: "Payment Gateways", href: "/admin/payments", icon: "💳" },
    { label: "Wallets", href: "/admin/wallets", icon: "👛" },
    { label: "Regions", href: "/admin/regions", icon: "🌍" },
    { label: "Sites", href: "/admin/sites", icon: "🌐" },
    { label: "Locations", href: "/admin/locations", icon: "📍" },
    { label: "Banners", href: "/admin/banners", icon: "🖼️" },
    { label: "Translations", href: "/admin/translations", icon: "🌐" },
    { label: "Analytics", href: "/admin/analytics", icon: "📈" },
    { label: "Delivery Zones", href: "/admin/delivery-zones", icon: "🗺️" },
    { label: "Dark Stores", href: "/admin/dark-stores", icon: "🏪" },
    { label: "Delivery Agents", href: "/admin/delivery-agents", icon: "🚴" },
    { label: "Tax Categories", href: "/admin/tax-categories", icon: "📋" },
    { label: "UOM", href: "/admin/uom", icon: "📏" },
    { label: "Settings", href: "/admin/settings", icon: "⚙️" },
    { label: "Sellers", href: "/admin/sellers", icon: "🏪" },
    { label: "FAQ", href: "/admin/faq", icon: "❓" },
    { label: "Reports", href: "/admin/reports", icon: "📄" },
    { label: "Tax Rates", href: "/admin/tax-rates", icon: "💰" },
    { label: "Prime Memberships", href: "/admin/prime", icon: "👑" },
    { label: "B2B Businesses", href: "/admin/business", icon: "🏢" },
    { label: "Tax Rules", href: "/admin/tax-rules", icon: "📋" },
    { label: "RFQ Management", href: "/admin/rfq", icon: "📝" },
    { label: "Gift Card Promos", href: "/admin/promotions/gift-cards", icon: "🎁" },
    { label: "Page Content", href: "/admin/pages", icon: "📄" },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4">
      <Link href="/admin/dashboard" className="text-xl font-bold text-blue-400 block mb-8">
        ShopEase Admin
      </Link>
      <nav className="space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-2.5 rounded hover:bg-gray-800 transition"
          >
            <span>{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        ))}
        <div className="border-t border-gray-700 my-4" />
        <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded hover:bg-gray-800 transition">
          <span>🏠</span>
          <span>Back to Store</span>
        </Link>
      </nav>
    </aside>
  );
}
