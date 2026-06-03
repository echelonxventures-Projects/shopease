"use client";

import { useState } from "react";
import Link from "next/link";
import { useCartStore } from "@/stores/useCartStore";
import { SearchBar } from "./SearchBar";
import { CartDrawer } from "./CartDrawer";
import { UserMenu } from "./UserMenu";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { RegionSelector } from "./RegionSelector";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { ThemeToggle } from "./ThemeToggle";

export function Navbar({ _banners, _categories, banners, categories }: { _banners?: unknown; _categories?: unknown; banners?: unknown; categories?: unknown }) {
  const [cartOpen, setCartOpen] = useState(false);
  const totalItems = useCartStore((s) => s.totalItems);

  return (
    <header className="bg-background shadow-sm border-border border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-xl font-bold text-primary shrink-0">
            ShopEase
          </Link>

          <div className="flex-1 max-w-2xl">
            <SearchBar />
          </div>

          <nav className="flex items-center gap-3">
            <LocaleSwitcher />
            <RegionSelector />
            <CurrencySwitcher />
            <ThemeToggle />
            <Link href="/groceries" className="text-sm hover:text-primary transition-colors hidden md:block">
              Fresh
            </Link>
            <Link href="/streaming" className="text-sm hover:text-primary transition-colors hidden md:block">
              Streaming
            </Link>
            <Link href="/trading" className="text-sm hover:text-primary transition-colors hidden md:block">
              Trading
            </Link>
            <Link href="/brands" className="text-sm hover:text-primary transition-colors hidden md:block">
              Brands
            </Link>
            <Link href="/gift-cards" className="text-sm hover:text-primary transition-colors hidden md:block">
              Gift Cards
            </Link>
            <Link href="/wishlist" className="text-sm hover:text-primary transition-colors">
              Wishlist
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              className="relative text-sm hover:text-primary transition-colors"
              aria-label="Open cart"
            >
              Cart {totalItems > 0 && (
                <span className="absolute -top-2 -right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </button>
            <UserMenu />
          </nav>
        </div>
      </div>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </header>
  );
}
