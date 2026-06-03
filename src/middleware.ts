import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";
import { checkRateLimitDistributed, buildRateLimitKey, RATE_LIMITS } from "@/lib/rate-limit";
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

  // CSP — allow Razorpay checkout iframe.
  // In development, React/Next need 'unsafe-eval' for HMR, source maps, and
  // dev-only error reconstruction. In production we keep eval blocked.
  const isDev = process.env.NODE_ENV !== "production";
  const scriptSrc = isDev
    ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com"
    : "script-src 'self' 'unsafe-inline' https://checkout.razorpay.com";
  const connectSrc = isDev
    ? "connect-src 'self' ws: wss: http://localhost:* https://api.razorpay.com"
    : "connect-src 'self' https://api.razorpay.com";

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      scriptSrc,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      connectSrc,
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

async function applyRateLimit(req: NextRequest, response: NextResponse): Promise<boolean> {
  // Rate limiting is a production protection; skip it in development so local
  // end-to-end testing isn't throttled. RATE_LIMIT_DISABLED=true also bypasses it.
  if (process.env.NODE_ENV !== "production" || process.env.RATE_LIMIT_DISABLED === "true") return true;

  const pathname = req.nextUrl.pathname;

  // Exempt high-frequency, low-risk endpoints (PWA manifest, NextAuth read
  // endpoints polled on every page load, health checks). Throttling these
  // breaks normal browsing for a single user.
  if (
    pathname === "/api/manifest" ||
    pathname === "/api/auth/session" ||
    pathname === "/api/auth/_log" ||
    pathname === "/api/auth/csrf" ||
    pathname.startsWith("/api/auth/providers") ||
    pathname.startsWith("/api/health")
  ) {
    return true;
  }

  const ip = getRealIp(req);
  // Only brute-force-sensitive auth actions (sign-in / callback) get the strict
  // limit. NextAuth read endpoints (session, csrf, providers) are polled often
  // by the client and use the general limit instead.
  const isAuthRoute =
    pathname.startsWith("/api/auth/callback") ||
    pathname.startsWith("/api/auth/signin") ||
    pathname.startsWith("/api/auth/signout") ||
    pathname.startsWith("/auth/");
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

  const result = await checkRateLimitDistributed(key, limits.maxAttempts, limits.windowMs);

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
    const allowed = await applyRateLimit(req, response);

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
  const cachedPlatforms = req.cookies.get("site-platforms")?.value;

  // Always resolve if no platform cookie (ensures redirect works) or if hostname changed
  const needsResolve = !cachedPlatforms && !pathname.startsWith("/_next") && !pathname.startsWith("/uploads") && !pathname.startsWith("/api/");

  if (needsResolve) {
    try {
      const apiUrl = new URL(`/api/site/resolve?hostname=${encodeURIComponent(hostname)}`, req.url);
      const siteRes = await fetch(apiUrl.toString(), { signal: AbortSignal.timeout(2000) });
      if (siteRes.ok) {
        const siteData = await siteRes.json();
        if (siteData?.slug) {
          response.headers.set("x-site-id", siteData.id);
          response.headers.set("x-site-slug", siteData.slug);
          response.cookies.set("site", siteData.slug, {
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
          });
          response.cookies.set("site-platforms", (siteData.platformTypes || []).join(","), {
            maxAge: 60 * 60 * 24 * 365,
            path: "/",
          });

          // Redirect homepage to platform-specific page for non-ecommerce sites
          if (pathname === "/" && siteData.platformTypes?.length > 0) {
            const platforms: string[] = siteData.platformTypes;
            if (!platforms.includes("ecommerce")) {
              if (platforms.includes("streaming")) {
                return NextResponse.redirect(new URL("/streaming", req.url));
              }
              if (platforms.includes("trading")) {
                return NextResponse.redirect(new URL("/trading", req.url));
              }
              if (platforms.length === 1) {
                return NextResponse.redirect(new URL(`/${platforms[0]}`, req.url));
              }
            }
          }
        }
      }
    } catch {
      // Site resolution is non-blocking
    }
  } else if (cachedSiteSlug) {
    response.headers.set("x-site-slug", cachedSiteSlug);

    // Check cached platform types for homepage redirect
    if (pathname === "/" && cachedPlatforms) {
      const platforms = cachedPlatforms.split(",").filter(Boolean);
      if (platforms.length > 0 && !platforms.includes("ecommerce")) {
        if (platforms.includes("streaming")) {
          return NextResponse.redirect(new URL("/streaming", req.url));
        }
        if (platforms.includes("trading")) {
          return NextResponse.redirect(new URL("/trading", req.url));
        }
        if (platforms.length === 1) {
          return NextResponse.redirect(new URL(`/${platforms[0]}`, req.url));
        }
      }
    }
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
  const isAgentRoute = pathname.startsWith("/agent");
  const isAgentLogin = pathname === "/agent/login";

  // Protect-by-prefix: only these authenticated areas require a session. Every
  // other path (storefront pages AND genuinely unknown routes) falls through to
  // Next.js, so unknown routes render the 404 page instead of redirecting to login.
  const PROTECTED_PREFIXES = [
    "/account", "/orders", "/rewards", "/wishlist",
    "/admin", "/agent", "/picker",
    "/business", "/b2b", "/supplier", "/seller",
    "/refunds", "/tickets", "/returns",
    "/logs", "/configurations", "/health",
  ];
  const isProtectedRoute = PROTECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Platform routes require auth + platform tag (unless the site IS that platform)
  const isPlatformRoute = pathname.startsWith("/streaming") || pathname.startsWith("/trading");

  if (isPlatformRoute) {
    // If the site's primary platform matches the route, allow public access (it's their homepage)
    const sitePlatforms = req.cookies.get("site-platforms")?.value?.split(",").filter(Boolean) || [];
    const requiredPlatform = pathname.startsWith("/streaming") ? "streaming" : "trading";
    const isSitePlatform = sitePlatforms.includes(requiredPlatform);

    if (!isSitePlatform) {
      const token = await getToken({ req });
      if (!token) {
        const loginUrl = new URL("/auth/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const platforms = ((token as any).platforms as string[]) || [];
      const role = (token as any).role as string;
      const isAdmin = role === "ADMIN" || role === "SUPER_ADMIN";

      if (!isAdmin && !platforms.includes(requiredPlatform)) {
        return NextResponse.redirect(new URL("/unauthorized", req.url));
      }
    }
    return response;
  }

  if (isProtectedRoute && !isAgentLogin) {
    const token = await getToken({ req });

    if (!token) {
      // Agent routes redirect to agent login
      if (isAgentRoute) {
        const loginUrl = new URL("/agent/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
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

    // Dynamic role route check: use allowedRoutes from token if available
    const allowedRoutes = (token as any).allowedRoutes as string[] | undefined;
    if (allowedRoutes && allowedRoutes.length > 0) {
      // User has dynamic role — check if current path is in their allowed routes
      const protectedPrefixes = ["/admin", "/customer-care", "/support", "/agent", "/business", "/seller", "/supplier", "/affiliate"];
      const isProtected = protectedPrefixes.some((p) => pathname.startsWith(p));
      if (isProtected) {
        const hasAccess = allowedRoutes.some((r: string) => pathname.startsWith(r));
        // SUPER_ADMIN always has access
        if (!hasAccess && token.role !== "SUPER_ADMIN") {
          return NextResponse.redirect(new URL("/unauthorized", req.url));
        }
      }
    } else {
      // Fallback to static role-based routing for users without dynamic role
      for (const [role, routes] of Object.entries(roleRoutes)) {
        if (routes.some((r) => pathname.startsWith(r))) {
          if (role === "ADMIN" && (token.role === "ADMIN" || token.role === "SUPER_ADMIN")) continue;
          if (token.role !== role) {
            return NextResponse.redirect(new URL("/unauthorized", req.url));
          }
        }
      }
    }

    // Agent route group: require DELIVERY_AGENT role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- NextAuth token type augmentation needed outside scope
    if (isAgentRoute && (token as any).role !== "DELIVERY_AGENT") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
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
