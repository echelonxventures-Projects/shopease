import Razorpay from "razorpay";
import crypto from "crypto";

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

function isTestKey(key?: string): boolean {
  if (!key) return true;
  return key.startsWith("rzp_test_") || key.startsWith("dummy");
}

let instance: Razorpay | null = null;

if (keyId && keySecret && !isTestKey(keyId) && !isTestKey(keySecret)) {
  instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
} else if (keyId && keySecret) {
  // Test keys — use in development only
  instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  if (process.env.NODE_ENV === "production") {
    console.warn("[RAZORPAY] Test keys detected in production — payments will use Razorpay test mode");
  }
}

export const razorpay = instance;

export function isRazorpayConfigured(): boolean {
  return instance !== null && keyId !== undefined && keySecret !== undefined;
}

/**
 * Verify a Razorpay checkout payment signature.
 * Signature = HMAC_SHA256(`${razorpayOrderId}|${razorpayPaymentId}`, KEY_SECRET).
 * Returns false (never throws) so callers can treat any failure as "unverified".
 */
export function verifyRazorpayPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  signature: string,
): boolean {
  if (!keySecret || !razorpayOrderId || !razorpayPaymentId || !signature) return false;
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest("hex");
  const expectedBuf = Buffer.from(expected, "utf8");
  const signatureBuf = Buffer.from(signature, "utf8");
  return expectedBuf.length === signatureBuf.length && crypto.timingSafeEqual(expectedBuf, signatureBuf);
}
