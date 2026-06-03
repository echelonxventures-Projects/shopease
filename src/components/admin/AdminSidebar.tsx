"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { getActiveModules } from "@/server/actions/platform-module-actions";
import { getSites } from "@/server/actions/site-actions";

interface NavItem { label: string; href: string; icon: string }
interface NavGroup { label: string; icon: string; items: NavItem[]; subGroups?: NavGroup[] }
type NavEntry = NavItem | NavGroup;
function isGroup(e: NavEntry): e is NavGroup { return "items" in e; }

export function AdminSidebar() {
  const { data: session } = useSession();
  const role = (session?.user as { role?: string })?.role;
  const isSuperAdmin = role === "SUPER_ADMIN";
  const pathname = usePathname();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [platformModules, setPlatformModules] = useState<any[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    getActiveModules().then(setPlatformModules).catch(() => {});
    getSites().then((s) => setSites(s.map(({ id, name }) => ({ id, name })))).catch(() => {});
  }, []);

  const navEntries: NavEntry[] = [
    { label: "Dashboard", href: "/admin/dashboard", icon: "📊" },

    // ── Catalog & Products
    {
      label: "Catalog",
      icon: "📦",
      items: [
        { label: "Products", href: "/admin/products", icon: "📦" },
        { label: "Categories", href: "/admin/categories", icon: "📁" },
        { label: "Brands", href: "/admin/brands", icon: "🏷️" },
        { label: "Master Catalog", href: "/admin/catalog", icon: "📚" },
        { label: "Inventory", href: "/admin/inventory", icon: "📊" },
        { label: "UOM", href: "/admin/uom", icon: "📏" },
      ],
    },

    // ── Orders & Fulfillment
    {
      label: "Orders & Fulfillment",
      icon: "🛒",
      items: [
        { label: "Orders", href: "/admin/orders", icon: "🛒" },
        { label: "Returns", href: "/admin/returns", icon: "🔄" },
        { label: "Delivery Zones", href: "/admin/delivery-zones", icon: "🗺️" },
        { label: "Delivery Agents", href: "/admin/delivery-agents", icon: "🚴" },
        { label: "Dark Stores", href: "/admin/dark-stores", icon: "🏪" },
      ],
    },

    // ── Customers
    {
      label: "Customers",
      icon: "👥",
      items: [
        { label: "All Customers", href: "/admin/customers", icon: "👥" },
        { label: "Prime Memberships", href: "/admin/prime", icon: "👑" },
      ],
    },

    // ── Suppliers & Procurement
    {
      label: "Suppliers & Procurement",
      icon: "🏭",
      items: [
        { label: "Suppliers", href: "/admin/suppliers", icon: "🏭" },
        { label: "Supplier Catalog", href: "/admin/supplier-catalog", icon: "🛍️" },
        { label: "Supplier Listings", href: "/admin/supplier-listings", icon: "📋" },
        { label: "Purchase Orders", href: "/admin/purchase-orders", icon: "📋" },
        { label: "RFQ Management", href: "/admin/rfq", icon: "📝" },
      ],
    },

    // ── Sellers & Marketplace
    {
      label: "Marketplace",
      icon: "🏪",
      items: [
        { label: "Sellers", href: "/admin/sellers", icon: "🏪" },
        { label: "B2B Businesses", href: "/admin/business", icon: "🏢" },
      ],
    },

    // ── Promotions & Loyalty
    {
      label: "Promotions & Loyalty",
      icon: "🎉",
      items: [
        { label: "Promotions", href: "/admin/promos", icon: "🎉" },
        { label: "Stack Rules", href: "/admin/promotions/stack-rules", icon: "📚" },
        { label: "Lightning Deals", href: "/admin/promotions/lightning-deals", icon: "⚡" },
        { label: "Promo Analytics", href: "/admin/promotions/analytics", icon: "📊" },
        { label: "Gamified Promos", href: "/admin/promotions/gamified", icon: "🎡" },
        { label: "Loyalty Programs", href: "/admin/loyalty", icon: "⭐" },
        { label: "Referrals", href: "/admin/referrals", icon: "🎁" },
        { label: "Vouchers", href: "/admin/vouchers", icon: "🎫" },
        { label: "Voucher Tiers", href: "/admin/vouchers/tiers", icon: "🏷️" },
        { label: "Gift Card Promos", href: "/admin/promotions/gift-cards", icon: "🎁" },
      ],
    },

    // ── Payments & Finance
    {
      label: "Payments & Finance",
      icon: "💳",
      items: [
        { label: "Payment Gateways", href: "/admin/payments", icon: "💳" },
        { label: "Wallets", href: "/admin/wallets", icon: "👛" },
        { label: "Tax Categories", href: "/admin/tax-categories", icon: "📋" },
        { label: "Tax Rates", href: "/admin/tax-rates", icon: "💰" },
        { label: "Tax Rules", href: "/admin/tax-rules", icon: "📋" },
      ],
    },

    // ── Content & CMS
    {
      label: "Content & CMS",
      icon: "🖼️",
      items: [
        { label: "Banners", href: "/admin/banners", icon: "🖼️" },
        { label: "Page Content", href: "/admin/pages", icon: "📄" },
        { label: "FAQ", href: "/admin/faq", icon: "❓" },
        { label: "Translations", href: "/admin/translations", icon: "🌐" },
      ],
    },

    // ── Regions & Localization
    {
      label: "Regions",
      icon: "🌍",
      items: [
        { label: "Regions", href: "/admin/regions", icon: "🌍" },
        { label: "Locations", href: "/admin/locations", icon: "📍" },
      ],
    },

    // ── Sites (standalone with dynamic list)
    {
      label: "Sites",
      icon: "🌐",
      items: [
        { label: "Manage Sites", href: "/admin/sites", icon: "⚙️" },
      ],
      subGroups: sites.length > 0 ? [{
        label: "Site List",
        icon: "📋",
        items: sites.map((s) => ({
          label: s.name,
          href: `/admin/sites/${s.id}`,
          icon: "🏪",
        })),
      }] : [],
    },

    // ── Integrated Platforms
    {
      label: "Platforms",
      icon: "🧩",
      items: [
        { label: "Streaming Platform", href: "/admin/streaming", icon: "🎬" },
        { label: "Trading Platform", href: "/admin/trading", icon: "📈" },
        { label: "Global Exchanges", href: "/admin/exchanges", icon: "🌐" },
        ...platformModules
          .filter((m) => m.slug !== "streaming" && m.slug !== "trading")
          .map((m) => ({ label: m.name, href: m.adminRoute, icon: m.icon || "🧩" })),
      ],
    },
    { label: "Create New Platform", href: "/admin/platforms", icon: "➕" },

    // ── Reselling & Revenue
    {
      label: "Reselling & Revenue",
      icon: "💰",
      items: [
        { label: "Platform Resell", href: "/admin/platform-resell", icon: "🏪" },
        { label: "Revenue Share (MLM)", href: "/admin/revenue-share", icon: "💸" },
        { label: "Hierarchy Monitoring", href: "/admin/hierarchy-monitoring", icon: "🌳" },
      ],
    },

    // ── Analytics & Reports
    {
      label: "Analytics & Reports",
      icon: "📈",
      items: [
        { label: "Analytics", href: "/admin/analytics", icon: "📈" },
        { label: "A/B Testing", href: "/admin/promotions/ab-testing", icon: "🧪" },
        { label: "Reports", href: "/admin/reports", icon: "📄" },
      ],
    },

    // ── Settings & System
    {
      label: "Settings & System",
      icon: "⚙️",
      items: [
        { label: "Settings", href: "/admin/settings", icon: "⚙️" },
        { label: "Data Providers", href: "/admin/providers", icon: "🔌" },
        { label: "Roles", href: "/admin/roles", icon: "🔐" },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen p-4 overflow-y-auto">
      <Link href="/admin/dashboard" className="text-xl font-bold text-blue-400 block mb-2">
        ShopEase Admin
      </Link>
      {isSuperAdmin && (
        <span className="inline-block text-xs bg-yellow-500 text-black font-bold px-2 py-0.5 rounded mb-6">
          SUPER ADMIN
        </span>
      )}
      {!isSuperAdmin && <div className="mb-6" />}
      <nav className="space-y-0.5">
        {navEntries.map((entry, i) =>
          isGroup(entry) ? (
            <CollapsibleGroup key={i} group={entry} pathname={pathname} />
          ) : (
            <NavLink key={entry.href} item={entry} active={pathname === entry.href} />
          ),
        )}
        <div className="border-t border-gray-700 my-4" />
        <Link href="/" className="flex items-center gap-3 px-4 py-2.5 rounded hover:bg-gray-800 transition text-sm text-gray-300">
          <span>🏠</span><span>Back to Store</span>
        </Link>
      </nav>
    </aside>
  );
}

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 px-4 py-2 rounded text-sm transition ${active ? "bg-gray-700 text-white" : "hover:bg-gray-800 text-gray-300"}`}
    >
      <span>{item.icon}</span><span>{item.label}</span>
    </Link>
  );
}

function CollapsibleGroup({ group, pathname }: { group: NavGroup; pathname: string }) {
  const subItems = group.subGroups?.flatMap((sg) => sg.items) ?? [];
  const isChildActive = [...group.items, ...subItems].some((item) => pathname.startsWith(item.href));
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-4 py-2 rounded text-sm transition ${isChildActive ? "bg-gray-800 text-white" : "hover:bg-gray-800 text-gray-300"}`}
      >
        <span>{group.icon}</span>
        <span className="flex-1 text-left font-medium">{group.label}</span>
        <span className="text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="ml-4 border-l border-gray-700 pl-2 mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
          {group.subGroups?.map((sg, i) => (
            <CollapsibleSubGroup key={i} group={sg} pathname={pathname} />
          ))}
        </div>
      )}
    </div>
  );
}

function CollapsibleSubGroup({ group, pathname }: { group: NavGroup; pathname: string }) {
  const isChildActive = group.items.some((item) => pathname.startsWith(item.href));
  const [open, setOpen] = useState(isChildActive);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className={`w-full flex items-center gap-3 px-3 py-1.5 rounded text-sm transition ${isChildActive ? "bg-gray-700 text-white" : "hover:bg-gray-800 text-gray-400"}`}
      >
        <span>{group.icon}</span>
        <span className="flex-1 text-left">{group.label}</span>
        <span className="text-xs">{open ? "▾" : "▸"}</span>
      </button>
      {open && (
        <div className="ml-4 border-l border-gray-600 pl-2 mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavLink key={item.href} item={item} active={pathname === item.href} />
          ))}
        </div>
      )}
    </div>
  );
}
