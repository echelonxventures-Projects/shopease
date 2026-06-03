/**
 * Deep Link Handler
 *
 * Parses incoming deep-link URLs and resolves them to app routes.
 * Supports web, iOS (Universal Links), and Android (App Links) formats.
 *
 * URL patterns:
 *   /dl/product/{slug}     → /products/{slug}
 *   /dl/order/{id}         → /orders/{id}
 *   /dl/promo/{code}       → /checkout?promo={code}
 *   /dl/category/{slug}    → /categories/{slug}
 *   /dl/brand/{slug}       → /brands/{slug}
 *   /dl/cart               → /checkout
 *   /dl/agent/{path}       → /agent/{path}
 *   /dl/share/{token}      → /share/{token}
 */

export interface DeepLinkResult {
  /** The resolved web app route */
  route: string;
  /** Original input URL */
  original: string;
  /** Parsed parameters from the deep link */
  params: Record<string, string>;
  /** Link format detected (web, ios, android, unknown) */
  format: "web" | "ios" | "android" | "unknown";
  /** Whether this is a valid known deep link */
  valid: boolean;
  /** Optional metadata (e.g., for OG tags or analytics) */
  meta?: Record<string, string>;
}

const SCHEME = "shopease://";
const UNIVERSAL_HOST = "shopease.com";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _DL_PREFIX = "/dl/";

const PATTERNS: {
  regex: RegExp;
  route: (matches: RegExpMatchArray) => string;
  meta?: (matches: RegExpMatchArray) => Record<string, string>;
}[] = [
  {
    regex: /^\/dl\/product\/([^/?#]+)/,
    route: (m) => `/products/${m[1]}`,
    meta: (m) => ({ entityType: "product", slug: m[1] }),
  },
  {
    regex: /^\/dl\/order\/([^/?#]+)/,
    route: (m) => `/orders/${m[1]}`,
    meta: (m) => ({ entityType: "order", id: m[1] }),
  },
  {
    regex: /^\/dl\/promo\/([^/?#]+)/,
    route: (m) => `/checkout?promo=${encodeURIComponent(m[1])}`,
    meta: (m) => ({ entityType: "promo", code: m[1] }),
  },
  {
    regex: /^\/dl\/category\/([^/?#]+)/,
    route: (m) => `/categories/${m[1]}`,
    meta: (m) => ({ entityType: "category", slug: m[1] }),
  },
  {
    regex: /^\/dl\/brand\/([^/?#]+)/,
    route: (m) => `/brands/${m[1]}`,
    meta: (m) => ({ entityType: "brand", slug: m[1] }),
  },
  {
    regex: /^\/dl\/cart\/?$/,
    route: () => "/checkout",
    meta: () => ({ entityType: "cart" }),
  },
  {
    regex: /^\/dl\/agent\/(.+)/,
    route: (m) => `/agent/${m[1]}`,
    meta: (m) => ({ entityType: "agent", path: m[1] }),
  },
  {
    regex: /^\/dl\/share\/([^/?#]+)/,
    route: (m) => `/share/${m[1]}`,
    meta: (m) => ({ entityType: "share", token: m[1] }),
  },
  {
    regex: /^\/dl\/search\/?(\?.*)?$/,
    route: (m) => `/search${m[1] || ""}`,
    meta: () => ({ entityType: "search" }),
  },
];

/**
 * Normalise an incoming URL to a pathname we can match.
 *
 * Accepts:
 *   - shopease://dl/product/abc
 *   - https://shopease.com/dl/product/abc
 *   - https://shopease.app.link/...
 *   - /dl/product/abc (plain pathname)
 */
function normalize(input: string): { pathname: string; format: DeepLinkResult["format"] } {
  const trimmed = input.trim();

  if (trimmed.startsWith(SCHEME)) {
    const path = "/" + trimmed.slice(SCHEME.length);
    return { pathname: path, format: "android" };
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    try {
      const url = new URL(trimmed);
      const format: DeepLinkResult["format"] = url.hostname.includes("apple")
        ? "ios"
        : url.hostname.includes("android") || url.hostname.includes("play.google")
          ? "android"
          : "web";
      return { pathname: url.pathname, format };
    } catch {
      return { pathname: trimmed, format: "unknown" };
    }
  }

  return { pathname: trimmed, format: "web" };
}

/**
 * Resolve a deep-link URL to an app route.
 */
export function resolveDeepLink(input: string): DeepLinkResult {
  const { pathname, format } = normalize(input);

  for (const pattern of PATTERNS) {
    const match = pathname.match(pattern.regex);
    if (match) {
      const route = pattern.route(match);
      const params: Record<string, string> = {};
      // Capture first group as "id" or "slug" based on route pattern
      if (match[1]) params.id = match[1];
      return {
        route,
        original: input,
        params,
        format,
        valid: true,
        meta: pattern.meta ? pattern.meta(match) : undefined,
      };
    }
  }

  // Fallback: unknown pattern — redirect to home
  return {
    route: "/",
    original: input,
    params: {},
    format,
    valid: false,
    meta: { reason: "no_matching_pattern" },
  };
}

/**
 * Build a deep-link URL from a route.
 * Useful for generating shareable links.
 */
export function buildDeepLink(
  type: "product" | "order" | "promo" | "category" | "brand" | "cart" | "agent" | "share",
  id?: string
): { web: string; scheme: string } {
  const path = id ? `/dl/${type}/${id}` : `/dl/${type}`;
  return {
    web: `https://${UNIVERSAL_HOST}${path}`,
    scheme: `${SCHEME}${path.replace(/^\//, "")}`,
  };
}

export const DEEP_LINK_HOST = UNIVERSAL_HOST;
export const DEEP_LINK_SCHEME = SCHEME;
