

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const navItems = [
    { label: "My Orders", href: "/account/orders" },
    { label: "My Wallet", href: "/account/wallet" },
    { label: "My Profile", href: "/account/profile" },
    { label: "Addresses", href: "/account/addresses" },
    { label: "My Reviews", href: "/account/reviews" },
    { label: "My Returns", href: "/account/returns" },
    { label: "Price Alerts", href: "/account/price-alerts" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Browsing History", href: "/account/browsing-history" },
    { label: "My Lists", href: "/account/lists" },
    { label: "Message Centre", href: "/account/messages" },
    { label: "Notifications", href: "/account/notifications" },
    { label: "Communication Preferences", href: "/account/communication-preferences" },
    { label: "Gift Card Orders", href: "/gift-cards/orders" },
    { label: "Redeem Gift Card", href: "/gift-cards/redeem" },
    { label: "Business Account", href: "/business/dashboard" },
    { label: "Seller Dashboard", href: "/seller/dashboard" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <aside>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a key={item.href} href={item.href} className="block px-4 py-2 rounded hover:bg-gray-100">
                {item.label}
              </a>
            ))}
          </nav>
        </aside>
        <main className="md:col-span-3">{children}</main>
      </div>
    </div>
  );
}
