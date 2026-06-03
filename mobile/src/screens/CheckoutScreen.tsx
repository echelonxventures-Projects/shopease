import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createOrder } from "@/api/endpoints";
import { useCart } from "@/hooks/useCart";

interface Address {
  id: string;
  label: string;
  line1: string;
  city: string;
  state: string;
  pincode: string;
}

type PaymentMethod = "cod" | "upi" | "card" | "netbanking";

const PAYMENT_OPTIONS: { id: PaymentMethod; label: string; icon: string }[] = [
  { id: "cod", label: "Cash on Delivery", icon: "💵" },
  { id: "upi", label: "UPI", icon: "📱" },
  { id: "card", label: "Credit / Debit Card", icon: "💳" },
  { id: "netbanking", label: "Net Banking", icon: "🏦" },
];

const MOCK_ADDRESSES: Address[] = [
  { id: "1", label: "Home", line1: "123, MG Road", city: "Bengaluru", state: "Karnataka", pincode: "560001" },
  { id: "2", label: "Office", line1: "456, Tech Park", city: "Bengaluru", state: "Karnataka", pincode: "560103" },
];

export default function CheckoutScreen() {
  const navigation = useNavigation<any>();
  const { items, total, clearCart } = useCart();

  const [addresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [selectedAddress, setSelectedAddress] = useState<string>(MOCK_ADDRESSES[0]?.id || "");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("upi");
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePlaceOrder() {
    if (!selectedAddress) {
      setError("Please select a delivery address.");
      return;
    }
    setPlacing(true);
    setError(null);
    try {
      const res = await createOrder({
        items: items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          price: i.price,
        })),
        addressId: selectedAddress,
        paymentMethod: selectedPayment,
      });
      if (res && !("error" in res)) {
        clearCart();
        navigation.navigate("OrderTracking", { id: (res as any).orderId });
      } else {
        setError((res as any)?.error || "Failed to place order.");
      }
    } catch (e) {
      setError("Something went wrong. Please try again.");
    } finally {
      setPlacing(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Address Selector */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Delivery Address</Text>
        {addresses.map((addr) => (
          <TouchableOpacity
            key={addr.id}
            style={[styles.addressCard, selectedAddress === addr.id && styles.addressCardSelected]}
            onPress={() => setSelectedAddress(addr.id)}
          >
            <View style={styles.addressHeader}>
              <Text style={styles.addressLabel}>{addr.label}</Text>
              {selectedAddress === addr.id && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </View>
            <Text style={styles.addressText}>{addr.line1}</Text>
            <Text style={styles.addressSubtext}>
              {addr.city}, {addr.state} - {addr.pincode}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment Method */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment Method</Text>
        {PAYMENT_OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.paymentCard, selectedPayment === opt.id && styles.paymentCardSelected]}
            onPress={() => setSelectedPayment(opt.id)}
          >
            <Text style={styles.paymentIcon}>{opt.icon}</Text>
            <Text style={[styles.paymentLabel, selectedPayment === opt.id && styles.paymentLabelSelected]}>
              {opt.label}
            </Text>
            <View
              style={[
                styles.radioOuter,
                selectedPayment === opt.id && styles.radioOuterSelected,
              ]}
            >
              {selectedPayment === opt.id && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Order Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Order Summary</Text>
        <View style={styles.summaryCard}>
          {items.map((item, i) => (
            <View key={i} style={styles.summaryItem}>
              <Text style={styles.summaryItemName} numberOfLines={1}>
                {item.name} × {item.quantity}
              </Text>
              <Text style={styles.summaryItemPrice}>
                {(item.price * item.quantity).toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </Text>
            </View>
          ))}
          <View style={styles.divider} />
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>
              {total.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
            </Text>
          </View>
        </View>
      </View>

      {error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Place Order */}
      <TouchableOpacity
        style={[styles.placeOrderBtn, placing && styles.placeOrderBtnDisabled]}
        onPress={handlePlaceOrder}
        disabled={placing}
      >
        {placing ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.placeOrderText}>Place Order</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  addressCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 },
  addressCardSelected: { borderColor: "#2563eb", borderWidth: 2 },
  addressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  addressLabel: { fontSize: 13, fontWeight: "700", color: "#2563eb" },
  checkmark: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  checkmarkText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  addressText: { fontSize: 14, marginTop: 4 },
  addressSubtext: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  paymentCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 8 },
  paymentCardSelected: { borderColor: "#2563eb", borderWidth: 2 },
  paymentIcon: { fontSize: 20, marginRight: 12 },
  paymentLabel: { flex: 1, fontSize: 14, fontWeight: "500" },
  paymentLabelSelected: { color: "#2563eb", fontWeight: "700" },
  radioOuter: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center" },
  radioOuterSelected: { borderColor: "#2563eb" },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#2563eb" },
  summaryCard: { backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  summaryItem: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  summaryItemName: { flex: 1, fontSize: 13, color: "#475569" },
  summaryItemPrice: { fontSize: 13, fontWeight: "600" },
  divider: { height: 1, backgroundColor: "#e2e8f0", marginVertical: 8 },
  totalRow: { flexDirection: "row", justifyContent: "space-between" },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 16, fontWeight: "700", color: "#2563eb" },
  errorBox: { backgroundColor: "#fef2f2", borderRadius: 8, padding: 12, marginBottom: 16 },
  errorText: { color: "#dc2626", fontSize: 13 },
  placeOrderBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  placeOrderBtnDisabled: { opacity: 0.6 },
  placeOrderText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
