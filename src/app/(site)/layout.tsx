"use client";

import { SessionProvider } from "next-auth/react";
import { Navbar } from "@/components/storefront/Navbar";
import { Footer } from "@/components/storefront/Footer";
import { PromoBanner } from "@/components/storefront/PromoBanner";
import { CookieConsentBanner } from "@/components/storefront/CookieConsentBanner";

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <div className="min-h-screen flex flex-col">
        <Navbar banners={[]} categories={[]} />
        <PromoBanner />
        <main className="flex-1">{children}</main>
        <Footer />
      </div>
      <CookieConsentBanner />
    </SessionProvider>
  );
}
