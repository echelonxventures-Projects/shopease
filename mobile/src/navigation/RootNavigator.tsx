import { useEffect } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/hooks/useAuth";
import { TabNavigator } from "./TabNavigator";
import LoginScreen from "@/screens/LoginScreen";

const Stack = createNativeStackNavigator();

export function RootNavigator() {
  const { isAuthenticated, isLoading, hydrate } = useAuth();

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={TabNavigator} />
      ) : (
        <Stack.Screen
          name="Auth"
          component={LoginScreen}
          options={{ animationTypeForReplace: "pop" }}
        />
      )}
    </Stack.Navigator>
  );
}
