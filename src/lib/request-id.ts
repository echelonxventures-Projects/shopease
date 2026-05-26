/**
 * Generate a request ID compatible with both Node.js and Edge Runtime.
 * Uses global crypto.randomUUID() available in both environments.
 */
export function generateRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "").slice(0, 24)}`;
}

export function extractRequestId(headers: Headers): string | null {
  return headers.get("x-request-id");
}

export const REQUEST_ID_HEADER = "x-request-id";
