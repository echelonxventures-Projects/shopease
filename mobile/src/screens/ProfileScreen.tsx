import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@/hooks/useAuth";

interface MenuItem {
  label: string;
  icon: string;
  screen?: string;
  onPress?: () => void;
  danger?: boolean;
}

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { user, logout } = useAuth();

  const menuItems: MenuItem[] = [
    { label: "My Orders", icon: "📦", screen: "Orders" },
    { label: "Saved Addresses", icon: "📍", screen: "Addresses" },
    { label: "Payment Methods", icon: "💳", screen: "PaymentMethods" },
    { label: "Notifications", icon: "🔔", screen: "Notifications" },
    { label: "Help & Support", icon: "💬", screen: "Help" },
    { label: "Logout", icon: "🚪", onPress: handleLogout, danger: true },
  ];

  async function handleLogout() {
    await logout();
  }

  function handleMenuPress(item: MenuItem) {
    if (item.onPress) {
      item.onPress();
    } else if (item.screen) {
      navigation.navigate(item.screen);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* User Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.name || "Guest User"}</Text>
          <Text style={styles.userEmail}>{user?.email || "Not signed in"}</Text>
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        {menuItems.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.menuItem, index < menuItems.length - 1 && styles.menuItemBorder]}
            onPress={() => handleMenuPress(item)}
          >
            <Text style={styles.menuIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.menuLabel,
                item.danger && styles.menuLabelDanger,
              ]}
            >
              {item.label}
            </Text>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* App Version */}
      <Text style={styles.version}>ShopEase v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  userCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: 20, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 24 },
  avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 22, fontWeight: "700" },
  userInfo: { marginLeft: 16, flex: 1 },
  userName: { fontSize: 18, fontWeight: "700" },
  userEmail: { fontSize: 13, color: "#94a3b8", marginTop: 2 },
  menuSection: { backgroundColor: "#fff", borderRadius: 16, borderWidth: 1, borderColor: "#e2e8f0", overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14 },
  menuItemBorder: { borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  menuIcon: { fontSize: 20, marginRight: 12 },
  menuLabel: { flex: 1, fontSize: 15, fontWeight: "500" },
  menuLabelDanger: { color: "#ef4444" },
  menuArrow: { fontSize: 20, color: "#94a3b8" },
  version: { textAlign: "center", marginTop: 32, fontSize: 12, color: "#94a3b8" },
});
