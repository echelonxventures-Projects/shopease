import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ShopEase Agent — Delivery Partner App",
  description: "Delivery agent portal for ShopEase — manage deliveries, earnings, and routes.",
  manifest: "/api/manifest?app=agent",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ShopEase Agent",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1e40af" },
    { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} h-full`} suppressHydrationWarning>
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/agent-icon-192.png" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function() {
              try {
                var theme = localStorage.getItem('agent-theme');
                if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                }
              } catch(e) {}
            })();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <nav className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
            <Link href="/agent/dashboard" className="text-lg font-bold tracking-tight">
              ShopEase <span className="text-blue-600 dark:text-blue-400">Agent</span>
            </Link>
            <div className="flex items-center gap-3 text-sm">
              <Link href="/agent/dashboard" className="hover:text-blue-600 dark:hover:text-blue-400">
                Dashboard
              </Link>
              <Link href="/agent/earnings" className="hover:text-blue-600 dark:hover:text-blue-400">
                Earnings
              </Link>
            </div>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500 dark:border-slate-800">
          &copy; {new Date().getFullYear()} ShopEase Delivery Partner
        </footer>
      </body>
    </html>
  );
}
