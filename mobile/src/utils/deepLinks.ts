import * as Linking from "expo-linking";

export interface DeepLinkRoute {
  screen: string;
  params?: Record<string, string>;
}

/**
 * Parse a deep link URL and return the target screen and params.
 * Supported schemes: shopease://, https://shopease.com
 *
 * Supported paths:
 *   shopease://product/:id        → Product screen
 *   shopease://order/:id          → OrderTracking screen
 *   shopease://cart               → Cart screen
 *   shopease://category/:slug     → Home screen with category filter
 *   https://shopease.com/dl/product/:id
 *   https://shopease.com/dl/order/:id
 */
export function parseDeepLink(url: string): DeepLinkRoute | null {
  const parsed = Linking.parse(url);
  if (!parsed) return null;

  const pathSegments = (parsed.path || "").split("/").filter(Boolean);

  // Handle /dl/ prefix for universal links
  if (pathSegments[0] === "dl") {
    pathSegments.shift();
  }

  if (pathSegments.length === 0) return null;

  const [resource, id] = pathSegments;

  switch (resource) {
    case "product":
    case "products":
      if (id) {
        return { screen: "Product", params: { id } };
      }
      return { screen: "Home" };

    case "order":
    case "orders":
      if (id) {
        return { screen: "OrderTracking", params: { id } };
      }
      return { screen: "Orders" };

    case "cart":
      return { screen: "Cart" };

    case "category":
    case "categories":
      if (id) {
        return { screen: "Home", params: { categoryId: id } };
      }
      return { screen: "Home" };

    case "profile":
      return { screen: "Profile" };

    case "checkout":
      return { screen: "Checkout" };

    default:
      return null;
  }
}

/**
 * Navigate to a screen based on a deep link URL.
 * Call this from a navigation ref or pass the navigation object.
 */
export function navigateFromDeepLink(
  url: string,
  navigation: { navigate: (screen: string, params?: any) => void }
): boolean {
  const route = parseDeepLink(url);
  if (!route) return false;

  navigation.navigate(route.screen, route.params);
  return true;
}

/**
 * Build a deep link URL for sharing.
 */
export function buildShareLink(type: "product" | "order", id: string): string {
  return `https://shopease.com/dl/${type}/${id}`;
}

/**
 * Build an app-scheme link.
 */
export function buildAppLink(type: "product" | "order", id: string): string {
  return `shopease://${type}/${id}`;
}
