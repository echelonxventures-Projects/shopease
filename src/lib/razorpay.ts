import Razorpay from "razorpay";

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
