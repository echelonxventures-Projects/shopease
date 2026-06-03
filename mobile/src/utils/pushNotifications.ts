import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { apiClient } from "@/api/client";

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request push notification permissions and get the FCM/APNs token.
 * Returns the token string or null if permissions denied.
 */
export async function getPushToken(): Promise<string | null> {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
          allowAnnouncements: false,
        },
      });
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Push notification permission denied.");
      return null;
    }

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "Default",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#2563eb",
        sound: "default",
      });
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
    });

    return tokenData.data;
  } catch (error) {
    console.warn("Failed to get push token:", error);
    return null;
  }
}

/**
 * Full setup: get token, register with backend.
 */
export async function setupPushNotifications(): Promise<void> {
  const token = await getPushToken();
  if (token) {
    await registerTokenWithBackend(token);
  }
}

/**
 * Register the push token with the ShopEase backend.
 */
async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await apiClient.post("/api/notifications/register", {
      token,
      platform: Platform.OS,
      deviceId: undefined, // Could use expo-device for a unique device ID
    });
  } catch (error) {
    console.warn("Failed to register push token with backend:", error);
  }
}

/**
 * Add a listener for notification taps (foreground + background).
 * Returns a subscription that should be cleaned up on unmount.
 */
export function addNotificationTapListener(
  callback: (data: Record<string, any>) => void
): () => void {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const data = response.notification.request.content.data;
      if (data && typeof data === "object") {
        callback(data as Record<string, any>);
      }
    }
  );

  return () => {
    subscription.remove();
  };
}

/**
 * Schedule a local notification (for reminders, etc.).
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  triggerSeconds?: number
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: "default",
    },
    trigger: triggerSeconds
      ? { seconds: triggerSeconds }
      : null, // null = immediate
  });
}

/**
 * Cancel all scheduled notifications.
 */
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
