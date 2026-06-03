import { useEffect, useState } from "react";
import { StatusBar } from "react-native";
import { NavigationContainer, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useColorScheme } from "react-native";
import { RootNavigator } from "@/navigation/RootNavigator";
import { setupPushNotifications } from "@/utils/pushNotifications";

const ShopEaseLightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2563eb",
    background: "#f8fafc",
    card: "#ffffff",
    text: "#0f172a",
    border: "#e2e8f0",
    notification: "#ef4444",
  },
};

const ShopEaseDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: "#3b82f6",
    background: "#0f172a",
    card: "#1e293b",
    text: "#f1f5f9",
    border: "#334155",
    notification: "#ef4444",
  },
};

const linking = {
  prefixes: ["shopease://", "https://shopease.com"],
  config: {
    screens: {
      Main: {
        screens: {
          Home: "",
          Product: "product/:id",
          Cart: "cart",
          Orders: "orders",
          OrderTracking: "order/:id",
          Profile: "profile",
        },
      },
      Auth: {
        screens: {
          Login: "login",
        },
      },
    },
  },
};

export default function App() {
  const colorScheme = useColorScheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Load custom fonts here if needed
        // await Font.loadAsync({ ... });
        await setupPushNotifications();
      } catch (e) {
        console.warn("App preparation error:", e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer
        theme={colorScheme === "dark" ? ShopEaseDarkTheme : ShopEaseLightTheme}
        linking={linking}
      >
        <StatusBar barStyle={colorScheme === "dark" ? "light-content" : "dark-content"} />
        <RootNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
