import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getProduct } from "@/api/endpoints";
import { useCart } from "@/hooks/useCart";

interface Variant {
  id: string;
  name: string;
  price?: number;
}

interface Review {
  id: string;
  user: string;
  rating: number;
  comment: string;
  date: string;
}

interface ProductDetail {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  rating: number;
  reviewCount: number;
  variants: Variant[];
  reviews: Review[];
  stock: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function ProductScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const productId = route.params?.id;
  const { addItem } = useCart();

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      if (!productId) return;
      try {
        const res = await getProduct(productId);
        if (res && !("error" in res)) {
          setProduct(res as ProductDetail);
          if ((res as ProductDetail).variants?.length > 0) {
            setSelectedVariant((res as ProductDetail).variants[0].id);
          }
        }
      } catch (e) {
        console.warn("Product load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

  function handleAddToCart() {
    if (!product) return;
    addItem({
      id: `${product.id}-${selectedVariant || ""}`,
      productId: product.id,
      variantId: selectedVariant || undefined,
      name: product.name,
      price: product.price,
      image: product.images[0],
      quantity: 1,
      stock: product.stock,
    });
    navigation.navigate("Cart" as never);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Product not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Image Gallery */}
      <FlatList
        data={product.images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => String(i)}
        renderItem={({ item }) => (
          <Image source={{ uri: item }} style={styles.image} resizeMode="cover" />
        )}
      />

      {/* Details */}
      <View style={styles.details}>
        <Text style={styles.title}>{product.name}</Text>
        <View style={styles.priceRow}>
          <Text style={styles.price}>
            {product.price.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
          </Text>
          <View style={styles.ratingBadge}>
            <Text style={styles.ratingText}>
              {product.rating.toFixed(1)} ★
            </Text>
            <Text style={styles.reviewCount}>({product.reviewCount})</Text>
          </View>
        </View>

        {/* Variants */}
        {product.variants.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Options</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.variantRow}>
              {product.variants.map((v) => (
                <TouchableOpacity
                  key={v.id}
                  style={[
                    styles.variantChip,
                    selectedVariant === v.id && styles.variantChipSelected,
                  ]}
                  onPress={() => setSelectedVariant(v.id)}
                >
                  <Text
                    style={[
                      styles.variantText,
                      selectedVariant === v.id && styles.variantTextSelected,
                    ]}
                  >
                    {v.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{product.description}</Text>
        </View>

        {/* Reviews */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews</Text>
          {product.reviews.length === 0 ? (
            <Text style={styles.noReviews}>No reviews yet.</Text>
          ) : (
            product.reviews.slice(0, 5).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <Text style={styles.reviewUser}>{review.user}</Text>
                  <Text style={styles.reviewRating}>{"★".repeat(review.rating)}</Text>
                </View>
                <Text style={styles.reviewComment}>{review.comment}</Text>
                <Text style={styles.reviewDate}>{review.date}</Text>
              </View>
            ))
          )}
        </View>
      </View>

      {/* Add to Cart */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, color: "#ef4444" },
  container: { flex: 1 },
  content: { paddingBottom: 100 },
  image: { width: SCREEN_WIDTH, height: SCREEN_WIDTH * 0.8, backgroundColor: "#f1f5f9" },
  details: { padding: 16 },
  title: { fontSize: 22, fontWeight: "700" },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
  price: { fontSize: 20, fontWeight: "700", color: "#2563eb" },
  ratingBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  ratingText: { fontSize: 14, fontWeight: "600", color: "#f59e0b" },
  reviewCount: { fontSize: 12, color: "#94a3b8" },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  variantRow: { gap: 8 },
  variantChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: "#e2e8f0" },
  variantChipSelected: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  variantText: { fontSize: 13, color: "#475569" },
  variantTextSelected: { color: "#fff", fontWeight: "600" },
  description: { fontSize: 14, lineHeight: 22, color: "#64748b" },
  noReviews: { fontSize: 14, color: "#94a3b8" },
  reviewCard: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  reviewHeader: { flexDirection: "row", justifyContent: "space-between" },
  reviewUser: { fontSize: 13, fontWeight: "600" },
  reviewRating: { fontSize: 12, color: "#f59e0b" },
  reviewComment: { fontSize: 13, color: "#64748b", marginTop: 4 },
  reviewDate: { fontSize: 11, color: "#94a3b8", marginTop: 4 },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: 16, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e2e8f0" },
  addToCartBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  addToCartText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
