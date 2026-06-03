import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { getOrders } from "@/api/endpoints";

interface TrackingStep {
  status: string;
  label: string;
  timestamp?: string;
  completed: boolean;
}

interface AgentInfo {
  name: string;
  phone: string;
  photo?: string;
}

interface OrderTrackingData {
  orderId: string;
  orderNumber: string;
  address: string;
  eta: string;
  agent?: AgentInfo;
  steps: TrackingStep[];
}

const DEFAULT_STEPS: TrackingStep[] = [
  { status: "CONFIRMED", label: "Order Confirmed", completed: true },
  { status: "PROCESSING", label: "Processing", completed: true },
  { status: "READY_TO_SHIP", label: "Ready to Ship", completed: false },
  { status: "PICKED_UP", label: "Picked Up", completed: false },
  { status: "IN_TRANSIT", label: "In Transit", completed: false },
  { status: "DELIVERED", label: "Delivered", completed: false },
];

export default function OrderTrackingScreen() {
  const route = useRoute<any>();
  const orderId = route.params?.id;

  const [data, setData] = useState<OrderTrackingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getOrders();
        if (res && !("error" in res)) {
          const orders = Array.isArray(res) ? res : (res as any).items || [];
          const order = orders.find((o: any) => o.id === orderId);
          if (order) {
            const steps = DEFAULT_STEPS.map((s) => ({
              ...s,
              completed: DEFAULT_STEPS.findIndex((x) => x.status === order.status) >=
                DEFAULT_STEPS.findIndex((x) => x.status === s.status),
            }));
            setData({
              orderId: order.id,
              orderNumber: order.orderNumber || order.id.slice(0, 8),
              address: order.address || "Delivery address",
              eta: order.estimatedDelivery || "30-45 min",
              agent: order.agent || undefined,
              steps,
            });
          }
        }
      } catch (e) {
        console.warn("Tracking load error:", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [orderId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Unable to load order tracking.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.orderNumber}>Order #{data.orderNumber}</Text>
        <Text style={styles.eta}>ETA: {data.eta}</Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles.mapPlaceholder}>
        <Text style={styles.mapText}>📍 {data.address}</Text>
        <Text style={styles.mapSubtext}>Live map view coming soon</Text>
      </View>

      {/* Agent Info */}
      {data.agent && (
        <View style={styles.agentCard}>
          <View style={styles.agentAvatar}>
            <Text style={styles.agentAvatarText}>
              {data.agent.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.agentInfo}>
            <Text style={styles.agentName}>{data.agent.name}</Text>
            <Text style={styles.agentRole}>Delivery Partner</Text>
          </View>
          <TouchableOpacity style={styles.callBtn}>
            <Text style={styles.callBtnText}>Call</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Status Timeline */}
      <View style={styles.timeline}>
        <Text style={styles.timelineTitle}>Delivery Status</Text>
        {data.steps.map((step, index) => (
          <View key={step.status} style={styles.step}>
            <View style={styles.stepIndicator}>
              <View
                style={[
                  styles.stepDot,
                  step.completed && styles.stepDotCompleted,
                ]}
              >
                {step.completed && <Text style={styles.stepCheck}>✓</Text>}
              </View>
              {index < data.steps.length - 1 && (
                <View
                  style={[
                    styles.stepLine,
                    step.completed && styles.stepLineCompleted,
                  ]}
                />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text
                style={[
                  styles.stepLabel,
                  step.completed && styles.stepLabelCompleted,
                ]}
              >
                {step.label}
              </Text>
              {step.timestamp && (
                <Text style={styles.stepTime}>{step.timestamp}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 16, color: "#ef4444" },
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  orderNumber: { fontSize: 18, fontWeight: "700" },
  eta: { fontSize: 14, fontWeight: "600", color: "#059669" },
  mapPlaceholder: { backgroundColor: "#e2e8f0", borderRadius: 12, height: 180, alignItems: "center", justifyContent: "center", marginBottom: 20 },
  mapText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  mapSubtext: { fontSize: 12, color: "#94a3b8", marginTop: 4 },
  agentCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: "#e2e8f0", marginBottom: 20 },
  agentAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  agentAvatarText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  agentInfo: { flex: 1, marginLeft: 12 },
  agentName: { fontSize: 15, fontWeight: "700" },
  agentRole: { fontSize: 12, color: "#94a3b8" },
  callBtn: { backgroundColor: "#059669", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8 },
  callBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  timeline: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  timelineTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  step: { flexDirection: "row", minHeight: 48 },
  stepIndicator: { width: 24, alignItems: "center" },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: "#cbd5e1", alignItems: "center", justifyContent: "center" },
  stepDotCompleted: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  stepCheck: { color: "#fff", fontSize: 12, fontWeight: "700" },
  stepLine: { width: 2, flex: 1, backgroundColor: "#e2e8f0", marginVertical: 2 },
  stepLineCompleted: { backgroundColor: "#2563eb" },
  stepContent: { marginLeft: 12, paddingBottom: 16 },
  stepLabel: { fontSize: 14, color: "#94a3b8" },
  stepLabelCompleted: { color: "#0f172a", fontWeight: "600" },
  stepTime: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
});
