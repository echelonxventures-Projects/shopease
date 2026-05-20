// Auto-register all payment providers
import "./providers/stripe";
import "./providers/razorpay";
import "./providers/paypal";

export * from "./gateway-registry";
