import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit, buildRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/request-id";

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
  const first = acceptLanguage.split(",")[0]?.trim().split(";")[0]?.trim();
  if (!first) return "en";
  const normalized = first.replace(/-/g, "_");
  if (LOCALE_REGION_MAP[normalized] || LOCALE_REGION_MAP[first]) return first;
  const lang = first.split(/[-_]/)[0];
  const langKey = Object.keys(LOCALE_REGION_MAP).find(
    (k) => k.split(/[-_]/)[0] === lang
  );
  return langKey ? langKey.split(/[-_]/)[0] : "en";
}

function resolveRegionFromLocale(locale: string): string {
  const normalized = locale.replace(/_/g, "-");
  if (LOCALE_REGION_MAP[normalized]) return LOCALE_REGION_MAP[normalized];
  const underscored = locale.replace(/-/g, "_");
  if (LOCALE_REGION_MAP[underscored]) return LOCALE_REGION_MAP[underscored];
  const lang = locale.split(/[-_]/)[0];
  const match = Object.entries(LOCALE_REGION_MAP).find(
    ([k]) => k.split(/[-_]/)[0] === lang
  );
  return match?.[1] || "IN";
}

function getRealIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}

function setSecurityHeaders(response: NextResponse, requestId: string): void {
  // Existing headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Request tracing
  response.headers.set(REQUEST_ID_HEADER, requestId);

  // CSP — allow Razorpay checkout iframe
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self' https://api.razorpay.com",
      "frame-ancestors 'none'",
      "form-action 'self' https://checkout.razorpay.com",
      "frame-src 'self' https://checkout.razorpay.com",
    ].join("; ")
  );

  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(self)"
  );
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
}

function applyRateLimit(req: NextRequest, response: NextResponse): boolean {
  const pathname = req.nextUrl.pathname;
  const ip = getRealIp(req);
  const isAuthRoute = pathname.startsWith("/api/auth");
  const isPaymentRoute = pathname.startsWith("/api/razorpay") || pathname.startsWith("/api/payment");
  const isUploadRoute = pathname.startsWith("/api/upload");

  let key: string;
  let limits: typeof RATE_LIMITS.auth | typeof RATE_LIMITS.payment | typeof RATE_LIMITS.upload | typeof RATE_LIMITS.general;

  if (isAuthRoute) {
    key = buildRateLimitKey("auth", ip);
    limits = RATE_LIMITS.auth;
  } else if (isPaymentRoute) {
    key = buildRateLimitKey("payment", ip);
    limits = RATE_LIMITS.payment;
  } else if (isUploadRoute) {
    key = buildRateLimitKey("upload", ip);
    limits = RATE_LIMITS.upload;
  } else {
    key = buildRateLimitKey("api", ip);
    limits = RATE_LIMITS.general;
  }

  const result = checkRateLimit(key, limits.maxAttempts, limits.windowMs);

  response.headers.set("X-RateLimit-Limit", String(result.limit));
  response.headers.set("X-RateLimit-Remaining", String(Math.max(0, result.remaining)));
  response.headers.set("X-RateLimit-Reset", String(result.resetAt));

  if (!result.allowed) {
    return false;
  }

  return true;
}

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const response = NextResponse.next();
  const requestId = generateRequestId();

  setSecurityHeaders(response, requestId);

  // Rate limiting for API and auth routes
  if (pathname.startsWith("/api/") || pathname.startsWith("/auth/")) {
    const startMs = Date.now();
    const allowed = applyRateLimit(req, response);

    response.headers.set(
      "x-middleware-duration",
      String(Date.now() - startMs)
    );

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            [REQUEST_ID_HEADER]: requestId,
          },
        }
      );
    }
  }

  // --- Site resolution from hostname ---
  const hostname = req.headers.get("host") || "";
  const cachedSiteSlug = req.cookies.get("site")?.value;

  if (!cachedSiteSlug && !pathname.startsWith("/_next") && !pathname.startsWith("/uploads")) {
    try {
      const apiUrl = new URL(`/api/site/resolve?hostname=${encodeURIComponent(hostname)}`, req.url);
      const siteRes = await fetch(apiUrl.toString());
      if (siteRes.ok) {
        const siteData = await siteRes.json();
        if (siteData?.slug) {
          response.headers.set("x-site-id", siteData.id);
          response.headers.set("x-site-slug", siteData.slug);
          response.cookies.set("site", siteData.slug, {
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
          });
        }
      }
    } catch {
      // Site resolution is non-blocking
    }
  } else if (cachedSiteSlug) {
    response.headers.set("x-site-slug", cachedSiteSlug);
  }

  // --- Locale/Region detection (all routes) ---
  const acceptLang = req.headers.get("accept-language");
  const detectedLocale = resolveLocaleFromHeader(acceptLang);
  const detectedRegion = resolveRegionFromLocale(detectedLocale);

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
    pathname.startsWith("/api/site/") ||
    pathname.startsWith("/share/") ||
    pathname.startsWith("/checkout") ||
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/uploads/") ||
    pathname === "/favicon.ico" ||
    pathname.endsWith(".xml") ||
    pathname.endsWith(".txt") ||
    pathname === "/api/manifest" ||
    pathname.startsWith("/sw.js") ||
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
