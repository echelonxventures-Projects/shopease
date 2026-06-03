import { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useCart } from "@/hooks/useCart";

export default function CartScreen() {
  const navigation = useNavigation<any>();
  const { items, updateQuantity, removeItem, total } = useCart();
  const [promoCode, setPromoCode] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);

  function handleApplyPromo() {
    if (promoCode.trim().length > 2) {
      setPromoApplied(true);
    }
  }

  function renderItem({ item }: { item: any }) {
    return (
      <View style={styles.cartItem}>
        <Image source={{ uri: item.image }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <Text style={styles.itemName} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={styles.itemPrice}>
            {item.price.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
          </Text>
          <View style={styles.quantityRow}>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => {
                if (item.quantity <= 1) {
                  removeItem(item.productId, item.variantId);
                } else {
                  updateQuantity(item.productId, item.variantId, item.quantity - 1);
                }
              }}
            >
              <Text style={styles.qtyBtnText}>-</Text>
            </TouchableOpacity>
            <Text style={styles.qtyText}>{item.quantity}</Text>
            <TouchableOpacity
              style={styles.qtyBtn}
              onPress={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
            >
              <Text style={styles.qtyBtnText}>+</Text>
            </TouchableOpacity>
          </View>
        </View>
        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeItem(item.productId, item.variantId)}
        >
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {items.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Your cart is empty</Text>
          <Text style={styles.emptySubtitle}>Add items to get started.</Text>
          <TouchableOpacity
            style={styles.shopBtn}
            onPress={() => navigation.navigate("Home")}
          >
            <Text style={styles.shopBtnText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={items}
            keyExtractor={(item) => `${item.productId}-${item.variantId || ""}`}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
          />

          {/* Promo Code */}
          <View style={styles.promoSection}>
            <TextInput
              style={styles.promoInput}
              value={promoCode}
              onChangeText={setPromoCode}
              placeholder="Enter promo code"
              placeholderTextColor="#94a3b8"
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[styles.promoBtn, promoApplied && styles.promoBtnApplied]}
              onPress={handleApplyPromo}
            >
              <Text style={[styles.promoBtnText, promoApplied && styles.promoBtnTextApplied]}>
                {promoApplied ? "Applied" : "Apply"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Subtotal</Text>
              <Text style={styles.summaryValue}>
                {total.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
              </Text>
            </View>
            {promoApplied && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Discount</Text>
                <Text style={[styles.summaryValue, { color: "#059669" }]}>
                  - {(total * 0.1).toLocaleString("en-IN", { style: "currency", currency: "INR" })}
                </Text>
              </View>
            )}
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                {(promoApplied ? total * 0.9 : total).toLocaleString("en-IN", {
                  style: "currency",
                  currency: "INR",
                })}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutBtn}
              onPress={() => navigation.navigate("Checkout")}
            >
              <Text style={styles.checkoutBtnText}>Proceed to Checkout</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  emptySubtitle: { fontSize: 14, color: "#94a3b8", marginBottom: 20 },
  shopBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  shopBtnText: { color: "#fff", fontWeight: "700" },
  list: { padding: 16 },
  cartItem: { flexDirection: "row", backgroundColor: "#fff", borderRadius: 12, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: "#e2e8f0" },
  itemImage: { width: 80, height: 80, borderRadius: 8, backgroundColor: "#f1f5f9" },
  itemDetails: { flex: 1, marginLeft: 12 },
  itemName: { fontSize: 14, fontWeight: "600" },
  itemPrice: { fontSize: 14, fontWeight: "700", color: "#2563eb", marginTop: 4 },
  quantityRow: { flexDirection: "row", alignItems: "center", marginTop: 8, gap: 12 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center", justifyContent: "center" },
  qtyBtnText: { fontSize: 16, fontWeight: "600" },
  qtyText: { fontSize: 14, fontWeight: "600" },
  removeBtn: { alignSelf: "flex-start", marginTop: 8 },
  removeText: { fontSize: 12, color: "#ef4444" },
  promoSection: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 12, gap: 8 },
  promoInput: { flex: 1, borderWidth: 1, borderColor: "#e2e8f0", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, backgroundColor: "#fff" },
  promoBtn: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 16, justifyContent: "center" },
  promoBtnApplied: { backgroundColor: "#059669" },
  promoBtnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
  promoBtnTextApplied: { color: "#fff" },
  summary: { backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e2e8f0", padding: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  summaryLabel: { fontSize: 14, color: "#64748b" },
  summaryValue: { fontSize: 14, fontWeight: "600" },
  totalRow: { borderTopWidth: 1, borderTopColor: "#e2e8f0", marginTop: 8, paddingTop: 12 },
  totalLabel: { fontSize: 16, fontWeight: "700" },
  totalValue: { fontSize: 18, fontWeight: "700", color: "#2563eb" },
  checkoutBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 16 },
  checkoutBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
