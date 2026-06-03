import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  RefreshControl,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { getProducts, getCategories } from "@/api/endpoints";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  slug: string;
  rating?: number;
}

interface Category {
  id: string;
  name: string;
  image: string;
  slug: string;
}

type NavProp = NativeStackNavigationProp<any>;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const BANNER_WIDTH = SCREEN_WIDTH - 32;

const BANNERS = [
  { id: "1", image: "https://via.placeholder.com/600x200/2563eb/ffffff?text=Sale+50%25+Off", title: "Mega Sale" },
  { id: "2", image: "https://via.placeholder.com/600x200/7c3aed/ffffff?text=New+Arrivals", title: "New Arrivals" },
  { id: "3", image: "https://via.placeholder.com/600x200/059669/ffffff?text=Free+Delivery", title: "Free Delivery" },
];

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [deals, setDeals] = useState<Product[]>([]);
  const [recommended, setRecommended] = useState<Product[]>([]);

  const loadData = useCallback(async () => {
    try {
      const [catRes, prodRes] = await Promise.all([
        getCategories(),
        getProducts({ limit: 20 }),
      ]);
      if (catRes && !("error" in catRes)) setCategories(catRes as Category[]);
      if (prodRes && !("error" in prodRes)) {
        const items = (prodRes as any).items || (prodRes as Product[]);
        setDeals(items.slice(0, 8));
        setRecommended(items.slice(8, 16));
      }
    } catch (e) {
      console.warn("Home load error:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <ScrollView
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.container}
    >
      {/* Banner Carousel */}
      <FlatList
        data={BANNERS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        style={styles.bannerList}
        renderItem={({ item }) => (
          <Image
            source={{ uri: item.image }}
            style={styles.banner}
            resizeMode="cover"
          />
        )}
      />

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.categoryItem}
              onPress={() => navigation.navigate("Product", { categoryId: cat.id })}
            >
              <Image source={{ uri: cat.image }} style={styles.categoryImage} />
              <Text style={styles.categoryName} numberOfLines={1}>
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Deals */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Today's Deals</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.productRow}>
          {deals.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.productCard}
              onPress={() => navigation.navigate("Product", { id: product.id })}
            >
              <Image source={{ uri: product.image }} style={styles.productImage} />
              <Text style={styles.productName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.productPrice}>
                {product.price.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Recommended */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recommended for You</Text>
        <View style={styles.grid}>
          {recommended.map((product) => (
            <TouchableOpacity
              key={product.id}
              style={styles.gridItem}
              onPress={() => navigation.navigate("Product", { id: product.id })}
            >
              <Image source={{ uri: product.image }} style={styles.gridImage} />
              <Text style={styles.gridName} numberOfLines={2}>
                {product.name}
              </Text>
              <Text style={styles.gridPrice}>
                {product.price.toLocaleString("en-IN", { style: "currency", currency: "INR" })}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  container: { paddingBottom: 24 },
  bannerList: { paddingHorizontal: 16, paddingTop: 12 },
  banner: { width: BANNER_WIDTH, height: 160, borderRadius: 12, marginRight: 0 },
  section: { marginTop: 24, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  categoryRow: { gap: 12 },
  categoryItem: { alignItems: "center", width: 72 },
  categoryImage: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#e2e8f0" },
  categoryName: { marginTop: 4, fontSize: 11, textAlign: "center" },
  productRow: { gap: 12 },
  productCard: { width: 150, borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden" },
  productImage: { width: 150, height: 150, backgroundColor: "#f1f5f9" },
  productName: { fontSize: 13, paddingHorizontal: 8, paddingTop: 8 },
  productPrice: { fontSize: 14, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 8, color: "#2563eb" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridItem: { flex: 1, minWidth: "45%", borderRadius: 12, backgroundColor: "#fff", borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden" },
  gridImage: { width: "100%", height: 140, backgroundColor: "#f1f5f9" },
  gridName: { fontSize: 13, paddingHorizontal: 8, paddingTop: 8 },
  gridPrice: { fontSize: 14, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 8, color: "#2563eb" },
});
