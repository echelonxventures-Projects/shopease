import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

// Locale → Region mapping (common locales to region codes)
const LOCALE_REGION_MAP: Record<string, string> = {
  "en-IN": "IN", hi: "IN", hi_IN: "IN", "en": "IN",
  "en-US": "US", "en-GB": "GB",
  "de-DE": "DE", de: "DE",
  "fr-FR": "FR", fr: "FR",
  "ja-JP": "JP", ja: "JP",
  "zh-CN": "CN", zh: "CN",
  "ar-SA": "SA", ar: "SA",
  "es-ES": "ES", es: "ES",
};

function resolveLocaleFromHeader(acceptLanguage: string | null): string {
  if (!acceptLanguage) return "en";
  // Parse "en-US,en;q=0.9,de;q=0.8" → take first locale
  const first = acceptLanguage.split(",")[0]?.trim().split(";")[0]?.trim();
  if (!first) return "en";
  // Normalize: "en-US" → "en-US"
  const normalized = first.replace(/-/g, "_");
  // Check direct match
  if (LOCALE_REGION_MAP[normalized] || LOCALE_REGION_MAP[first]) return first;
  // Check language-only match
  const lang = first.split(/[-_]/)[0];
  const langKey = Object.keys(LOCALE_REGION_MAP).find(
    (k) => k.split(/[-_]/)[0] === lang
  );
  return langKey ? langKey.split(/[-_]/)[0] : "en";
}

function resolveRegionFromLocale(locale: string): string {
  const normalized = locale.replace(/_/g, "-");
  // Direct match
  if (LOCALE_REGION_MAP[normalized]) return LOCALE_REGION_MAP[normalized];
  // Also try underscore version
  const underscored = locale.replace(/-/g, "_");
  if (LOCALE_REGION_MAP[underscored]) return LOCALE_REGION_MAP[underscored];
  // Language-only fallback
  const lang = locale.split(/[-_]/)[0];
  const match = Object.entries(LOCALE_REGION_MAP).find(
    ([k]) => k.split(/[-_]/)[0] === lang
  );
  return match?.[1] || "IN";
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const response = NextResponse.next();

  // --- Security headers ---
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  // --- Locale/Region detection (all routes) ---
  const acceptLang = req.headers.get("accept-language");
  const detectedLocale = resolveLocaleFromHeader(acceptLang);
  const detectedRegion = resolveRegionFromLocale(detectedLocale);

  // Read existing cookies (fallback to detected defaults)
  const existingLocale = req.cookies.get("locale")?.value;
  const existingRegion = req.cookies.get("region")?.value;

  if (!existingLocale) {
    response.cookies.set("locale", detectedLocale, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }
  if (!existingRegion) {
    response.cookies.set("region", detectedRegion, {
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  // --- Auth-based route protection ---
  const isPublicRoute =
    pathname === "/" ||
    pathname.startsWith("/unauthorized") ||
    pathname.startsWith("/products/") ||
    pathname === "/products" ||
    pathname.startsWith("/categories/") ||
    pathname.startsWith("/brands/") ||
    pathname.startsWith("/auth/") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".xml") ||
    pathname.endsWith(".txt") ||
    pathname === "/api/manifest" ||
    pathname.startsWith("/sw.js") ||
    // Landing / marketing pages
    pathname.startsWith("/sell") ||
    pathname === "/brand-registry" ||
    pathname === "/global-sell" ||
    pathname === "/supply" ||
    pathname === "/affiliate" ||
    pathname === "/fba" ||
    pathname === "/advertise" ||
    pathname.startsWith("/pay/") ||
    pathname.startsWith("/gift-cards") ||
    pathname === "/groceries" ||
    pathname === "/groceries/";

  if (!isPublicRoute) {
    const token = await getToken({ req });

    if (!token) {
      const loginUrl = new URL("/auth/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Role-based route protection
    const roleRoutes: Record<string, string[]> = {
      ADMIN: ["/admin"],
      CUSTOMER_CARE: ["/customer-care"],
      SUPPORT: ["/support"],
    };

    for (const [role, routes] of Object.entries(roleRoutes)) {
      if (routes.some((r) => pathname.startsWith(r)) && token.role !== role) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!.*\\.[\\w]+$|_next).*)",
    "/api/:path*",
    "/auth/:path*",
  ],
};
