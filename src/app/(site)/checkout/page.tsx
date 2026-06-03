"use client";

import { useState, useEffect, useCallback } from "react";
import { useCartStore } from "@/stores/useCartStore";
import { useRegionStore } from "@/stores/useRegionStore";
import { useRouter } from "next/navigation";
import {
  createRazorpayOrder,
  confirmPayment,
} from "@/server/actions/order-actions";
import {
  evaluateCartPromos,
  applyPromoCode,
} from "@/server/actions/promo-actions";
import {
  getWalletBalance,
  getTierBalances,
} from "@/server/actions/wallet-actions";
import {
  orchestrateCheckoutDiscount,
  placeOrderWithDiscounts,
} from "@/server/actions/discount-engine";
import {
  getMyMembership,
} from "@/server/actions/membership-actions";
import { calculateTax } from "@/server/actions/tax-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { LocationCascadingSelector } from "@/components/storefront/LocationSelector";
import { LocationPicker } from "@/components/storefront/LocationPicker";
import { DeliverySlotPicker } from "@/components/storefront/DeliverySlotPicker";
import { BNPLCheckout } from "@/components/storefront/BNPLCheckout";
import { EMICalculator } from "@/components/storefront/EMICalculator";
import { SplitPaymentPicker } from "@/components/storefront/SplitPaymentPicker";
import { Loader2, Gift, Wallet, Sparkles, X, Gem, Package, Zap, FileText, Crown, Shield } from "lucide-react";
import { toast } from "sonner";

declare global {
  interface Window {
    Razorpay: unknown;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart } = useCartStore();
  const { regionId, currency, currencySymbol } = useRegionStore();
  const [step, setStep] = useState(1);
  const [walletBalance, setWalletBalance] = useState(0);
  const [tierBalances, setTierBalances] = useState<any[]>([]);
  const [hasWallet, setHasWallet] = useState(false);

  const [address, setAddress] = useState({
    fullName: "", phone: "", street: "", city: "", state: "", zipCode: "", country: "India",
  });
  const [locationIds, setLocationIds] = useState({ countryId: "", stateId: "", districtId: "", villageId: "" });
  const [locErrors, setLocErrors] = useState<Record<string, string>>({});
  const [location, setLocation] = useState<any>(null);
  const [savedAddress, setSavedAddress] = useState<any>(null);

  const [paymentMethod, setPaymentMethod] = useState("");
  const [promoResults, setPromoResults] = useState<any>(null);
  const [promoCode, setPromoCode] = useState("");
  const [promoCodeResult, setPromoCodeResult] = useState<any>(null);
  const [walletToUse, setWalletToUse] = useState(0);
  const [tierAmounts, setTierAmounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);

  // Tax calculation
  const [taxAmount, setTaxAmount] = useState(0);
  const [taxLoading, setTaxLoading] = useState(false);
  const [taxJurisdiction, setTaxJurisdiction] = useState("");
  const [taxBreakdown, setTaxBreakdown] = useState<Array<{ type: string; rate: number; description: string }>>([]);

  // Guest checkout
  const [isGuest, setIsGuest] = useState(false);
  const [guestEmail, setGuestEmail] = useState("");

  // Gift wrapping
  const [isGift, setIsGift] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");
  const GIFT_WRAP_FEE = 49;

  // Order notes
  const [orderNotes, setOrderNotes] = useState("");

  // Express delivery
  const [isExpress, setIsExpress] = useState(false);
  const EXPRESS_FEE = 99;

  // Contactless delivery
  const [isContactless, setIsContactless] = useState(false);

  // Delivery slot
  const [deliverySlotId, setDeliverySlotId] = useState<string | undefined>(undefined);
  const [slotFee, setSlotFee] = useState(0);

  // COD fee
  const COD_FEE = 30;

  // Prime membership
  const [isPrimeMember, setIsPrimeMember] = useState(false);
  const [primeFreeDelivery, setPrimeFreeDelivery] = useState(false);

  // Split payment
  const [_splitAmounts, setSplitAmounts] = useState<{ walletAmount: number; cardAmount: number; upiAmount: number; codAmount: number }>({
    walletAmount: 0, cardAmount: 0, upiAmount: 0, codAmount: 0,
  });

  // Load wallet balance + tier balances + membership
  useEffect(() => {
    getWalletBalance()
      .then((data) => {
        if (data.balance !== null) {
          setWalletBalance(data.balance);
          setHasWallet(true);
        }
      })
      .catch(() => {});
    getTierBalances(regionId || undefined)
      .then(setTierBalances)
      .catch(() => {});
    getMyMembership()
      .then((membership) => {
        if (membership && membership.status === "ACTIVE") {
          setIsPrimeMember(true);
          setPrimeFreeDelivery(!!membership.freeDelivery);
        }
      })
      .catch(() => {});
  }, []);

  // Calculate tax based on shipping jurisdiction
  useEffect(() => {
    if (!address.country || !address.city || !address.state || items.length === 0) return;
    const taxItems = items.map((i: any) => ({
      productId: i.productId,
      quantity: i.quantity,
      price: i.price,
    }));
    setTaxLoading(true);
    calculateTax({
      items: taxItems,
      shippingCountry: address.country,
      shippingState: address.state,
      shippingZip: address.zipCode,
    })
      .then((result) => {
        setTaxAmount(result.totalTax);
        setTaxJurisdiction(result.jurisdiction);
        setTaxBreakdown(result.lineItems.flatMap((li: any) => li.breakdown || []).slice(0, 3));
      })
      .catch(() => {
        setTaxAmount(0);
        setTaxJurisdiction("");
        setTaxBreakdown([]);
      })
      .finally(() => setTaxLoading(false));
  }, [address.country, address.state, address.zipCode, items.length]);

  // Evaluate auto-promos
  const evaluatePromos = useCallback(() => {
    const cartItems = items.map((i: any) => ({
      productId: i.productId,
      quantity: i.quantity,
      price: i.price,
    }));
    evaluateCartPromos(
      { items: cartItems, subtotal, regionId: regionId || undefined },
      undefined
    ).then(setPromoResults).catch(() => {});
  }, [items, subtotal, regionId]);

  useEffect(() => {
    if (items.length > 0 && step >= 2) {
      evaluatePromos();
    }
  }, [evaluatePromos, items.length, step]);

  // Calculations
  const autoPromoDiscount = promoResults?.totalDiscount || 0;
  const codePromoDiscount = promoCodeResult?.valid ? (promoCodeResult.discount || 0) : 0;
  const totalPromoDiscount = autoPromoDiscount + codePromoDiscount;

  // Use calculated tax from calculateTax(); fallback to 18% if not yet loaded
  const tax = taxAmount;

  // Express fee: free for Prime members
  const effectiveExpressFee = primeFreeDelivery ? 0 : EXPRESS_FEE;
  // Shipping is free for Prime members
  const _effectiveShippingFee = 0; // Shipping already handled by discount engine

  // Preview tier deductions (client-side, actual deductions happen server-side)
  const previewTierDeductions = tierBalances.reduce((sum: number, tier: any) => {
    const requested = tierAmounts[tier.slug] || 0;
    const available = Number(tier.balance);
    return sum + Math.min(requested, available);
  }, 0);

  const totalAfterPromo = subtotal - totalPromoDiscount;
  const walletUsable = Math.min(walletToUse, walletBalance, Math.max(0, totalAfterPromo - previewTierDeductions));
  const finalTotal = Math.max(0, totalAfterPromo - previewTierDeductions - walletUsable
    + (isGift ? GIFT_WRAP_FEE : 0)
    + (isExpress ? effectiveExpressFee : 0)
    + slotFee
    + (paymentMethod === "cod" ? COD_FEE : 0));

  useEffect(() => {
    if (items.length === 0 && step > 1) {
      router.push("/cart");
    }
  }, [items.length, step, router]);

  // Load Razorpay script safely
  useEffect(() => {
    if (typeof window === "undefined" || window.Razorpay) return;

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    script.onerror = () => {
      toast.error("Payment gateway failed to load. Please refresh and try again.");
    };
    document.body.appendChild(script);
    return () => {
      try { document.body.removeChild(script); } catch {}
    };
  }, []);

  const handleApplyCode = async () => {
    if (!promoCode.trim()) return;
    try {
      const cartItems = items.map((i: any) => ({
        productId: i.productId, quantity: i.quantity, price: i.price,
      }));
      const result = await applyPromoCode(
        promoCode.trim(),
        { items: cartItems, subtotal, regionId: regionId || undefined },
        undefined
      );
      setPromoCodeResult(result);
      if (result.valid) {
        toast.success(`${result.title} applied!`);
      } else {
        toast.error(result.message);
      }
    } catch {
      toast.error("Failed to apply promo code");
    }
  };

  const handleRazorpayPayment = async (orderId: string) => {
    if (!window.Razorpay) return;
    const { razorpayOrderId } = await createRazorpayOrder(orderId);

    const rzp = new (window.Razorpay as any)({
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount: Math.round(Math.abs(finalTotal) * 100),
      currency: currency,
      order_id: razorpayOrderId,
      name: "ShopEase",
      description: `Order ${orderId}`,
      handler: async function (response: any) {
        await confirmPayment(orderId, response.razorpay_payment_id, response.razorpay_order_id, response.razorpay_signature);
        clearCart();
        router.push("/checkout/success");
      },
      modal: {
        ondismiss: function () {
          setLoading(false);
        },
      },
      prefill: {
        name: address.fullName,
        contact: address.phone,
      },
      theme: { color: "#2563eb" },
    });
    rzp.open();
    setLoading(false);
  };

  const handlePlaceOrder = async () => {
    if (finalTotal < 0) {
      toast.error("Invalid order total");
      return;
    }
    if (!address.fullName?.trim() || !address.phone?.trim() || !address.street?.trim() || !address.city?.trim() || !address.state?.trim() || !address.zipCode) {
      toast.error("Please fill in a complete shipping address");
      return;
    }
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }
    if (isGuest && !guestEmail.trim()) {
      toast.error("Please enter your email for guest checkout");
      return;
    }

    setLoading(true);
    try {
      const cartContext = {
        items: items.map((i: any) => ({
          productId: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
        subtotal,
        regionId: regionId || undefined,
      };

      const discountData = await orchestrateCheckoutDiscount(
        cartContext,
        promoCodeResult?.valid ? promoCode : null,
        walletToUse,
        tierAmounts,
        { isGuest: isGuest },
      );

      const order = await placeOrderWithDiscounts(
        discountData,
        {
          items: items.map((i: any) => ({
            productId: i.productId,
            name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
          tax,
          shippingCost: 0,
          shippingAddress: {
            ...address,
            ...locationIds,
            latitude: location?.lat,
            longitude: location?.lng,
            landmark: location?.landmark,
            addressLabel: location?.addressLabel,
            deliveryNote: location?.deliveryNote,
          },
          paymentMethod,
          couponCode: promoCodeResult?.valid ? promoCode : undefined,
          appliedPromos: promoResults?.appliedPromos || [],
          orderNotes: [orderNotes.trim(), isContactless ? "Contactless delivery requested" : null].filter(Boolean).join("\n") || undefined,
          isGift,
          giftMessage: isGift ? giftMessage.trim() || undefined : undefined,
          giftWrapFee: isGift ? GIFT_WRAP_FEE : 0,
          isExpress,
          expressFee: isExpress ? effectiveExpressFee : 0,
          codFee: paymentMethod === "cod" ? COD_FEE : 0,
          isGuestOrder: isGuest,
          guestEmail: isGuest ? guestEmail.trim() || undefined : undefined,
          deliverySlotId: deliverySlotId ?? undefined,
        },
      );

      if (discountData.finalTotal > 0 && paymentMethod === "razorpay") {
        handleRazorpayPayment(order.id);
      } else {
        clearCart();
        router.push("/checkout/success");
      }
    } catch (err: any) {
      toast.error(err.message || "Order failed");
      setLoading(false);
    }
  };

  if (items.length === 0 && step > 1) return null;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Progress Steps */}
      <div className="flex items-center gap-4 mb-8">
        {["Address", "Payment", "Review"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}>
              {step > i + 1 ? "✓" : i + 1}
            </div>
            <span className={`text-sm font-medium ${step >= i + 1 ? "" : "text-gray-400"}`}>{label}</span>
          </div>
        ))}
      </div>

      {/* Guest Checkout Toggle */}
      <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <input
          type="checkbox"
          id="guestCheckout"
          checked={isGuest}
          onChange={(e) => setIsGuest(e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded"
        />
        <label htmlFor="guestCheckout" className="text-sm font-medium text-blue-800 cursor-pointer">
          Checkout as guest (no account required)
        </label>
      </div>

      {isGuest && step >= 1 && (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <label className="text-sm font-medium text-amber-800 mb-1 block">Email for order updates</label>
          <Input
            type="email"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            placeholder="your@email.com"
            className="max-w-md"
          />
        </div>
      )}

      {isPrimeMember && (
        <div className="mb-6 p-4 bg-gradient-to-r from-yellow-50 to-amber-50 rounded-lg border border-yellow-200 flex items-center gap-3">
          <Crown className="w-5 h-5 text-yellow-600" />
          <span className="text-sm font-medium text-yellow-800">
            Prime Member — Free express delivery & exclusive benefits applied
          </span>
        </div>
      )}

      {/* Step 1: Address */}
      {step === 1 && (
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
          <div className="mb-4">
            <LocationCascadingSelector
              countryId={locationIds.countryId}
              stateId={locationIds.stateId}
              districtId={locationIds.districtId}
              villageId={locationIds.villageId}
              onChange={(vals) => {
                setLocationIds(vals);
                // Auto-fill address fields from cascading selector names
                setAddress({
                  ...address,
                  country: vals.countryName || address.country,
                  state: vals.stateName || address.state,
                  city: vals.villageName || vals.districtName || address.city,
                });
                // Clear errors when user makes selections
                setLocErrors({});
              }}
              showCountry
              showState
              showDistrict
              showVillage
              errors={locErrors}
            />
          </div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold mb-3">Delivery Location</h3>
            <LocationPicker
              value={location}
              onChange={setLocation}
              defaultCenter={[28.6139, 77.2090]}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input value={address.fullName} onChange={(e) => setAddress({...address, fullName: e.target.value})} placeholder="Full Name" />
            <Input value={address.phone} onChange={(e) => setAddress({...address, phone: e.target.value})} placeholder="Phone" />
            <Input value={address.street} onChange={(e) => setAddress({...address, street: e.target.value})} placeholder="Street Address" className="md:col-span-2" />
            <Input value={address.city} onChange={(e) => setAddress({...address, city: e.target.value})} placeholder="City" />
            <Input value={address.state} onChange={(e) => setAddress({...address, state: e.target.value})} placeholder="State" />
            <Input value={address.zipCode} onChange={(e) => setAddress({...address, zipCode: e.target.value})} placeholder="Zip Code" />
          </div>

          {/* Address Preview */}
          {address.fullName && address.street && (
            <div className="mt-4 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
              <p className="text-xs font-semibold text-blue-600 uppercase mb-2">📍 Delivery Address</p>
              <p className="font-medium text-sm">{address.fullName}</p>
              <p className="text-sm text-gray-600">{address.phone}</p>
              <p className="text-sm text-gray-600 mt-1">
                {[address.street, address.city, address.state, address.zipCode].filter(Boolean).join(", ")}
              </p>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <Button
              onClick={() => {
                const errors: Record<string, string> = {};
                if (!locationIds.stateId) errors.stateId = "Please select a state/province";
                if (!locationIds.districtId) errors.districtId = "Please select a district/city";
                if (!address.fullName?.trim()) errors.fullName = "Full name is required";
                if (!address.phone?.trim()) errors.phone = "Phone is required";
                if (!address.street?.trim()) errors.street = "Street address is required";
                if (!address.city?.trim()) errors.city = "City is required";
                if (!address.state?.trim()) errors.state_ = "State is required";
                if (!/^\d{6}$/.test(address.zipCode)) errors.zipCode = "Enter a valid 6-digit PIN code";
                if (Object.keys(errors).length > 0) {
                  setLocErrors(errors);
                  toast.error("Please fix the errors above");
                  return;
                }
                setLocErrors({});
                setSavedAddress({ ...address });
                setStep(2);
                toast.success("Address saved");
              }}
              className="flex-1 bg-amber-500 hover:bg-amber-600 text-black font-semibold"
            >
              Use This Address
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Payment */}
      {step === 2 && (
        <div className="bg-white rounded-lg p-6 shadow space-y-4">
          <h2 className="text-xl font-bold">Payment Method</h2>

          {/* Shipping Address Summary */}
          <div className="p-4 border rounded-lg bg-gray-50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-gray-500 uppercase">Deliver to</span>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-blue-600 h-auto p-1 text-xs">
                Change address
              </Button>
            </div>
            <p className="text-sm font-medium">{savedAddress?.fullName} · {savedAddress?.phone}</p>
            <p className="text-sm text-gray-600 mt-1">
              {[savedAddress?.street, savedAddress?.city, savedAddress?.state, savedAddress?.zipCode].filter(Boolean).join(", ")}
            </p>
          </div>

          {/* Wallet Payment */}
          {hasWallet && walletBalance > 0 && (
            <div className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="w-5 h-5 text-green-600" />
                <span className="font-bold">Wallet</span>
                <span className="text-sm text-gray-500">Balance: {currencySymbol}{walletBalance.toFixed(2)}</span>
              </div>
              {tierBalances.length > 0 && (
                <div className="mt-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
                  <p className="text-xs font-semibold text-blue-800 mb-2">Tier Balances</p>
                  {tierBalances.map((tier: any) => {
                    const bal = Number(tier.balance);
                    if (bal <= 0) return null;
                    return (
                      <div key={tier.slug} className="flex items-center gap-2 mb-2 last:mb-0">
                        <span className="text-xs w-24 truncate">{tier.name}</span>
                        <Input
                          type="number"
                          value={tierAmounts[tier.slug] || ""}
                          onChange={(e) => setTierAmounts({
                            ...tierAmounts,
                            [tier.slug]: parseFloat(e.target.value) || 0,
                          })}
                          placeholder="0.00"
                          className="h-7 flex-1 text-xs"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => setTierAmounts({
                            ...tierAmounts,
                            [tier.slug]: bal,
                          })}
                        >
                          Max
                        </Button>
                        <span className="text-xs text-gray-500">{currencySymbol}{bal.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="number"
                  value={walletToUse || ""}
                  onChange={(e) => setWalletToUse(parseFloat(e.target.value) || 0)}
                  placeholder="Amount from wallet"
                  max={walletBalance}
                />
                <Button variant="outline" onClick={() => setWalletToUse(Math.min(walletBalance, Math.max(0, totalAfterPromo - previewTierDeductions)))}>
                  Use Max
                </Button>
              </div>
              {walletToUse > 0 && (
                <p className="text-sm text-green-700 mt-2">
                  {currencySymbol}{Math.min(walletToUse, walletBalance, Math.max(0, totalAfterPromo - previewTierDeductions)).toFixed(2)} will be deducted from wallet
                </p>
              )}
            </div>
          )}

          {/* Razorpay */}
          <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <input type="radio" name="payment" value="razorpay" checked={paymentMethod === "razorpay"} onChange={(e) => setPaymentMethod(e.target.value)} />
            <span className="font-medium">Credit/Debit Card / UPI / NetBanking</span>
          </label>

          {/* COD */}
          <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={(e) => setPaymentMethod(e.target.value)} />
            <div className="flex-1">
              <span className="font-medium">Cash on Delivery</span>
              <span className="text-sm text-gray-500 ml-2">(+{currencySymbol}{COD_FEE} fee)</span>
            </div>
          </label>

          {/* BNPL */}
          <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <input type="radio" name="payment" value="bnpl" checked={paymentMethod === "bnpl"} onChange={(e) => setPaymentMethod(e.target.value)} />
            <div className="flex-1">
              <span className="font-medium">Buy Now, Pay Later</span>
              <span className="text-xs text-gray-400 ml-2">Simpl, Sahara, Zest</span>
            </div>
          </label>
          {paymentMethod === "bnpl" && (
            <div className="ml-8">
              <BNPLCheckout totalAmount={finalTotal} />
            </div>
          )}

          {/* EMI */}
          <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <input type="radio" name="payment" value="emi" checked={paymentMethod === "emi"} onChange={(e) => setPaymentMethod(e.target.value)} />
            <div className="flex-1">
              <span className="font-medium">No-Cost EMI</span>
              <span className="text-xs text-gray-400 ml-2">3-12 months</span>
            </div>
          </label>
          {paymentMethod === "emi" && (
            <div className="ml-8">
              <EMICalculator orderTotal={finalTotal} />
            </div>
          )}

          {/* Split Payment */}
          <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <input type="radio" name="payment" value="split" checked={paymentMethod === "split"} onChange={(e) => setPaymentMethod(e.target.value)} />
            <div className="flex-1">
              <span className="font-medium">Split Payment</span>
              <span className="text-xs text-gray-400 ml-2">Wallet + Card + UPI + COD</span>
            </div>
          </label>
          {paymentMethod === "split" && (
            <div className="ml-8">
              <SplitPaymentPicker
                totalAmount={finalTotal}
                onSplitChange={setSplitAmounts}
              />
            </div>
          )}

          {/* Express Delivery */}
          <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={isExpress} onChange={(e) => setIsExpress(e.target.checked)} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="font-medium">Express Delivery</span>
                {isPrimeMember && <Crown className="w-3 h-3 text-yellow-600" />}
              </div>
              <p className="text-sm text-gray-500">
                Get it tomorrow
                {effectiveExpressFee > 0 ? ` — +${currencySymbol}${EXPRESS_FEE}` : " — Free with Prime"}
              </p>
            </div>
          </label>

          {/* Contactless Delivery */}
          <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={isContactless} onChange={(e) => setIsContactless(e.target.checked)} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span className="font-medium">Contactless Delivery</span>
              </div>
              <p className="text-sm text-gray-500">Delivery person will leave package at your door without physical contact</p>
            </div>
          </label>

          {/* Delivery Slot */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-500" />
              <span className="font-medium">Preferred Delivery Slot</span>
            </div>
            <DeliverySlotPicker
              onSelect={(slotId, fee) => {
                setDeliverySlotId(slotId);
                setSlotFee(fee);
              }}
              selectedSlotId={deliverySlotId}
            />
          </div>

          {/* Gift Wrapping */}
          <label className="flex items-center gap-3 border rounded-lg p-4 cursor-pointer hover:bg-gray-50">
            <input type="checkbox" checked={isGift} onChange={(e) => setIsGift(e.target.checked)} />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-pink-500" />
                <span className="font-medium">This is a gift</span>
              </div>
              <p className="text-sm text-gray-500">Add gift wrap + message — +{currencySymbol}{GIFT_WRAP_FEE}</p>
            </div>
          </label>

          {isGift && (
            <div className="ml-8 space-y-2">
              <Input
                value={giftMessage}
                onChange={(e) => setGiftMessage(e.target.value)}
                placeholder="Gift message (optional)"
                maxLength={200}
              />
            </div>
          )}

          {/* Order Notes */}
          <div className="border rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Order Notes / Delivery Instructions</span>
            </div>
            <textarea
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              placeholder="e.g., Ring the bell twice, Leave at the door..."
              className="w-full border rounded-md p-2 text-sm min-h-[60px] resize-y"
              maxLength={500}
            />
          </div>

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
            <Button onClick={() => { if (!paymentMethod) { toast.error("Select a payment method"); return; } setStep(3); }} className="flex-1">
              Review Order
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div className="bg-white rounded-lg p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Order Review</h2>

          {/* Shipping Address */}
          <div className="mb-6 p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-500 uppercase">Deliver to</span>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-blue-600 h-auto p-1 text-xs">
                Change
              </Button>
            </div>
            <p className="font-medium">{savedAddress?.fullName}</p>
            <p className="text-sm text-gray-600">{savedAddress?.phone}</p>
            <p className="text-sm text-gray-600 mt-1">
              {[savedAddress?.street, savedAddress?.city, savedAddress?.state, savedAddress?.zipCode].filter(Boolean).join(", ")}
            </p>
            {location?.formattedAddress && (
              <p className="text-xs text-gray-400 mt-1">📍 {location.formattedAddress}</p>
            )}
            {location?.deliveryNote && (
              <p className="text-xs text-gray-400">📝 {location.deliveryNote}</p>
            )}
          </div>

          {/* Payment Method */}
          <div className="mb-6 p-4 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-gray-500 uppercase">Payment</span>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-blue-600 h-auto p-1 text-xs">
                Change
              </Button>
            </div>
            <p className="font-medium">
              {paymentMethod === "razorpay" && "Credit/Debit Card / UPI / NetBanking"}
              {paymentMethod === "cod" && `Cash on Delivery (+${currencySymbol}${COD_FEE} fee)`}
              {paymentMethod === "bnpl" && "Buy Now, Pay Later"}
              {paymentMethod === "emi" && "No-Cost EMI"}
              {paymentMethod === "split" && "Split Payment"}
            </p>
          </div>

          {/* Items */}
          <div className="space-y-2 mb-4">
            {items.map((item: any) => (
              <div key={item.productId} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span className="font-medium">{currencySymbol}{(item.price * item.quantity).toLocaleString("en-IN")}</span>
              </div>
            ))}
          </div>

          {/* Auto-applied Promos */}
          {promoResults && promoResults.appliedPromos.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-green-600" />
                <span className="font-semibold text-green-800 text-sm">Auto-applied Offers</span>
              </div>
              {promoResults.appliedPromos.map((p: any) => (
                <div key={p.promoId} className="flex justify-between text-sm text-green-700">
                  <span>{p.title}</span>
                  <span className="font-bold">-{currencySymbol}{p.discount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Promo Code */}
          <div className="mb-4">
            <div className="flex gap-2">
              <Input
                value={promoCode}
                onChange={(e) => { setPromoCode(e.target.value); setPromoCodeResult(null); }}
                placeholder="Enter promo code"
              />
              <Button variant="outline" onClick={handleApplyCode} disabled={!promoCode.trim()}>Apply</Button>
              {promoCodeResult?.valid && (
                <Button variant="outline" onClick={() => { setPromoCodeResult(null); setPromoCode(""); }}>
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            {promoCodeResult?.valid && (
              <p className="text-sm text-green-600 mt-1 font-medium">
                ✓ {promoCodeResult.title} — -{currencySymbol}{promoCodeResult.discount?.toFixed(2)}
              </p>
            )}
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between text-sm"><span>Subtotal</span><span>{currencySymbol}{subtotal.toLocaleString("en-IN")}</span></div>
            {totalPromoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600"><span>Promo Discount</span><span>-{currencySymbol}{totalPromoDiscount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-sm">
              <span>{taxJurisdiction ? `Tax (${taxJurisdiction})` : taxLoading ? "Calculating tax…" : "Tax"}</span>
              <span>{currencySymbol}{tax.toLocaleString("en-IN")}</span>
            </div>
            {taxBreakdown.length > 0 && (
              <div className="text-xs text-gray-500 -mt-1">
                {taxBreakdown.map((b) => (
                  <div key={b.type} className="flex justify-between">
                    <span>{b.type} ({(b.rate * 100).toFixed(1)}%)</span>
                    <span>{currencySymbol}{(tax * b.rate / (taxBreakdown.reduce((s, t) => s + t.rate, 0))).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
            {isGift && (
              <div className="flex justify-between text-sm text-pink-600">
                <span className="flex items-center gap-1"><Gift className="w-3 h-3" /> Gift Wrapping</span>
                <span>{currencySymbol}{GIFT_WRAP_FEE}</span>
              </div>
            )}
            {isExpress && effectiveExpressFee > 0 && (
              <div className="flex justify-between text-sm text-yellow-600">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Express Delivery</span>
                <span>{currencySymbol}{EXPRESS_FEE}</span>
              </div>
            )}
            {isExpress && effectiveExpressFee === 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> Express Delivery</span>
                <span className="flex items-center gap-1"><Crown className="w-3 h-3" /> Free (Prime)</span>
              </div>
            )}
            {slotFee > 0 && (
              <div className="flex justify-between text-sm text-blue-600">
                <span className="flex items-center gap-1"><Package className="w-3 h-3" /> Delivery Slot Fee</span>
                <span>{currencySymbol}{slotFee}</span>
              </div>
            )}
            {paymentMethod === "cod" && (
              <div className="flex justify-between text-sm text-gray-600">
                <span>COD Fee</span>
                <span>{currencySymbol}{COD_FEE}</span>
              </div>
            )}
            {previewTierDeductions > 0 && (
              tierBalances
                .filter((t: any) => (tierAmounts[t.slug] || 0) > 0)
                .map((tier: any) => (
                  <div key={tier.slug} className="flex justify-between text-sm text-blue-600">
                    <span className="flex items-center gap-1">
                      <Gem className="w-3 h-3" /> {tier.name}
                    </span>
                    <span>-{currencySymbol}{Math.min(tierAmounts[tier.slug] || 0, Number(tier.balance)).toFixed(2)}</span>
                  </div>
                ))
            )}
            {walletUsable > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span className="flex items-center gap-1"><Wallet className="w-3 h-3" /> Wallet</span>
                <span>-{currencySymbol}{walletUsable.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg border-t pt-2 mt-2">
              <span>Total</span>
              <span>{currencySymbol}{Math.abs(finalTotal).toLocaleString("en-IN")}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
            <Button
              onClick={handlePlaceOrder}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : `Pay ${currencySymbol}${Math.abs(finalTotal).toLocaleString("en-IN")}`}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
