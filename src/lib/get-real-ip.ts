/**
 * Extract real client IP from request headers.
 */
export function getRealIp(req: { headers: Headers | { get: (name: string) => string | null } }): string {
  const getHeader = (name: string): string | null => {
    if (typeof req.headers.get === "function") {
      return req.headers.get(name);
    }
    if (req.headers instanceof Headers) {
      return (req.headers as Headers).get(name);
    }
    return null;
  };

  const forwarded = getHeader("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return getHeader("x-real-ip") || "unknown";
}
