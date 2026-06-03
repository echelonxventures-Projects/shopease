import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Text, View, StyleSheet } from "react-native";
import { useCart } from "@/hooks/useCart";
import HomeScreen from "@/screens/HomeScreen";
import CartScreen from "@/screens/CartScreen";
import OrderTrackingScreen from "@/screens/OrderTrackingScreen";
import ProfileScreen from "@/screens/ProfileScreen";

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused, color }: { name: string; focused: boolean; color: string }) {
  const icons: Record<string, string> = {
    Home: focused ? "🏠" : "🏡",
    Search: focused ? "🔍" : "🔎",
    Cart: focused ? "🛒" : "🛒",
    Orders: focused ? "📦" : "📦",
    Profile: focused ? "👤" : "👤",
  };

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { color }]}>{icons[name] || "•"}</Text>
    </View>
  );
}

function CartIconWithBadge({ color, focused }: { color: string; focused: boolean }) {
  const { itemCount } = useCart();

  return (
    <View style={styles.iconContainer}>
      <Text style={[styles.icon, { color }]}>
        {focused ? "🛒" : "🛒"}
      </Text>
      {itemCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {itemCount > 99 ? "99+" : itemCount}
          </Text>
        </View>
      )}
    </View>
  );
}

// Placeholder for Search screen (could be expanded later)
function SearchPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Search coming soon</Text>
    </View>
  );
}

// Placeholder for Orders list screen
function OrdersPlaceholder() {
  return (
    <View style={styles.placeholder}>
      <Text style={styles.placeholderText}>Your orders will appear here</Text>
    </View>
  );
}

export function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: "#fff" },
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#94a3b8",
        tabBarStyle: {
          borderTopColor: "#e2e8f0",
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="Home" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchPlaceholder}
        options={{
          title: "Search",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="Search" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Cart"
        component={CartScreen}
        options={{
          title: "Cart",
          tabBarIcon: ({ color, focused }) => (
            <CartIconWithBadge color={color} focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersPlaceholder}
        options={{
          title: "Orders",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="Orders" focused={focused} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profile",
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="Profile" focused={focused} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  iconContainer: { width: 24, height: 24, alignItems: "center", justifyContent: "center" },
  icon: { fontSize: 18 },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 9, fontWeight: "700" },
  placeholder: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc" },
  placeholderText: { fontSize: 15, color: "#94a3b8" },
});
